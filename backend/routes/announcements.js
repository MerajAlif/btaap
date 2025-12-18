import express from "express";
import Announcement from "../models/Announcement.js";
import Notification from "../models/Notification.js";
import Community from "../models/Community.js";
import Membership from "../models/Membership.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Helper function to create notifications for all community members
async function notifyMembers(communityId, announcement, excludeUserId = null) {
    try {
        // Get community owner
        const community = await Community.findById(communityId);

        // Get all approved members
        const memberships = await Membership.find({
            community: communityId,
            status: "approved"
        }).select("student");

        // Collect all user IDs (members + owner, exclude creator)
        const userIds = [community.mentor, ...memberships.map(m => m.student)]
            .filter(id => id.toString() !== excludeUserId?.toString());

        // Create notifications for all users
        const notifications = userIds.map(userId => ({
            user: userId,
            community: communityId,
            type: 'announcement',
            title: 'New Announcement',
            message: announcement.title,
            link: `/communities/${communityId}`,
            relatedId: announcement._id
        }));

        await Notification.insertMany(notifications);

        return userIds;
    } catch (error) {
        console.error("Error creating notifications:", error);
        return [];
    }
}

// @route   POST /api/announcements
// @desc    Create announcement (mentor only)
// @access  Private
router.post("/", protect, async (req, res) => {
    try {
        const { communityId, title, content, priority, isPinned } = req.body;

        // Verify user is the mentor
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ success: false, error: "Community not found" });
        }

        if (community.mentor.toString() !== req.user.id && !community.moderators?.includes(req.user.id)) {
            return res.status(403).json({ success: false, error: "Only mentors and moderators can create announcements" });
        }

        const announcement = await Announcement.create({
            community: communityId,
            createdBy: req.user.id,
            title,
            content,
            priority: priority || 'medium',
            isPinned: isPinned || false
        });

        // Notify all community members
        const notifiedUsers = await notifyMembers(communityId, announcement, req.user.id);

        // Emit socket event to all notified users
        const io = req.app.get('io');
        if (io) {
            notifiedUsers.forEach(userId => {
                io.to(`user_${userId}`).emit('new_notification', {
                    type: 'announcement',
                    title: 'New Announcement',
                    message: title,
                    link: `/communities/${communityId}`
                });
            });
        }

        res.json({ success: true, announcement });
    } catch (error) {
        console.error("Create announcement error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   GET /api/announcements/:communityId
// @desc    Get all announcements for a community
// @access  Private (members only)
router.get("/:communityId", protect, async (req, res) => {
    try {
        const { communityId } = req.params;

        // Verify user is member or owner
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ success: false, error: "Community not found" });
        }

        const isOwner = community.mentor.toString() === req.user.id;
        if (!isOwner) {
            const membership = await Membership.findOne({
                student: req.user.id,
                community: communityId,
                status: "approved"
            });

            if (!membership) {
                return res.status(403).json({ success: false, error: "Access denied" });
            }
        }

        const announcements = await Announcement.find({ community: communityId })
            .populate("createdBy", "name profile.avatar")
            .sort({ isPinned: -1, createdAt: -1 });

        res.json({ success: true, announcements });
    } catch (error) {
        console.error("Get announcements error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   PUT /api/announcements/:id
// @desc    Update announcement
// @access  Private (mentor only)
router.put("/:id", protect, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ success: false, error: "Announcement not found" });
        }

        // Verify user is the creator
        if (announcement.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: "Access denied" });
        }

        const { title, content, priority, isPinned } = req.body;

        if (title) announcement.title = title;
        if (content) announcement.content = content;
        if (priority) announcement.priority = priority;
        if (isPinned !== undefined) announcement.isPinned = isPinned;

        await announcement.save();

        res.json({ success: true, announcement });
    } catch (error) {
        console.error("Update announcement error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement
// @access  Private (mentor only)
router.delete("/:id", protect, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ success: false, error: "Announcement not found" });
        }

        // Verify user is the creator
        if (announcement.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: "Access denied" });
        }

        await announcement.deleteOne();

        // Delete related notifications
        await Notification.deleteMany({ relatedId: req.params.id });

        res.json({ success: true, message: "Announcement deleted" });
    } catch (error) {
        console.error("Delete announcement error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

export default router;
