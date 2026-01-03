import express from "express";
import ClassSchedule from "../models/ClassSchedule.js";
import Notification from "../models/Notification.js";
import Community from "../models/Community.js";
import Membership from "../models/Membership.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Helper function to notify members about new class
async function notifyMembersAboutClass(communityId, classSchedule, excludeUserId = null) {
    try {
        const community = await Community.findById(communityId);
        const memberships = await Membership.find({
            community: communityId,
            status: "approved"
        }).select("student");

        const userIds = [community.mentor, ...memberships.map(m => m.student)]
            .filter(id => id.toString() !== excludeUserId?.toString());

        const notifications = userIds.map(userId => ({
            user: userId,
            community: communityId,
            type: 'class_scheduled',
            title: 'New Class Scheduled',
            message: `Class ${classSchedule.classNumber}: ${classSchedule.title}`,
            link: `/communities/${communityId}`,
            relatedId: classSchedule._id
        }));

        await Notification.insertMany(notifications);
        return userIds;
    } catch (error) {
        console.error("Error creating class notifications:", error);
        return [];
    }
}

// @route   POST /api/schedules
// @desc    Create class schedule (mentor only)
// @access  Private
router.post("/", protect, async (req, res) => {
    try {
        const { communityId, classNumber, title, description, scheduledDate, duration, meetingLink } = req.body;

        // Verify user is the mentor
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ success: false, error: "Community not found" });
        }

        if (community.mentor.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: "Only mentors can schedule classes" });
        }

        const classSchedule = await ClassSchedule.create({
            community: communityId,
            createdBy: req.user.id,
            classNumber,
            title,
            description,
            scheduledDate,
            duration: duration || 60,
            meetingLink
        });

        // Notify all community members
        const notifiedUsers = await notifyMembersAboutClass(communityId, classSchedule, req.user.id);

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            notifiedUsers.forEach(userId => {
                io.to(`user_${userId}`).emit('new_notification', {
                    type: 'class_scheduled',
                    title: 'New Class Scheduled',
                    message: `Class ${classNumber}: ${title}`,
                    link: `/communities/${communityId}`
                });
            });
        }

        res.json({ success: true, classSchedule });
    } catch (error) {
        console.error("Create class schedule error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   GET /api/schedules/:communityId
// @desc    Get all class schedules for a community
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

        const schedules = await ClassSchedule.find({ community: communityId })
            .populate("createdBy", "name profile.avatar")
            .sort({ scheduledDate: 1 });

        res.json({ success: true, schedules });
    } catch (error) {
        console.error("Get schedules error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   PUT /api/schedules/:id
// @desc    Update class schedule
// @access  Private (mentor only)
router.put("/:id", protect, async (req, res) => {
    try {
        const schedule = await ClassSchedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ success: false, error: "Schedule not found" });
        }

        if (schedule.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: "Access denied" });
        }

        const { classNumber, title, description, scheduledDate, duration, meetingLink, isCompleted } = req.body;

        if (classNumber) schedule.classNumber = classNumber;
        if (title) schedule.title = title;
        if (description !== undefined) schedule.description = description;
        if (scheduledDate) schedule.scheduledDate = scheduledDate;
        if (duration) schedule.duration = duration;
        if (meetingLink !== undefined) schedule.meetingLink = meetingLink;
        if (isCompleted !== undefined) schedule.isCompleted = isCompleted;

        await schedule.save();

        res.json({ success: true, schedule });
    } catch (error) {
        console.error("Update schedule error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete class schedule
// @access  Private (mentor only)
router.delete("/:id", protect, async (req, res) => {
    try {
        const schedule = await ClassSchedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ success: false, error: "Schedule not found" });
        }

        if (schedule.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: "Access denied" });
        }

        await schedule.deleteOne();
        await Notification.deleteMany({ relatedId: req.params.id });

        res.json({ success: true, message: "Schedule deleted" });
    } catch (error) {
        console.error("Delete schedule error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

export default router;
