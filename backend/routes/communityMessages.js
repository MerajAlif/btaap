import express from "express";
import CommunityMessage from "../models/CommunityMessage.js";
import Community from "../models/Community.js";
import Membership from "../models/Membership.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/community-messages/:communityId
// @desc    Get messages for a community
// @access  Private (must be approved member or owner)
router.get("/:communityId", protect, async (req, res) => {
    try {
        const { communityId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;

        // Check if user is community owner
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ success: false, error: "Community not found" });
        }

        const isOwner = community.mentor.toString() === req.user.id;

        // Check if user is approved member
        if (!isOwner) {
            const membership = await Membership.findOne({
                student: req.user.id,
                community: communityId,
                status: "approved"
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    error: "You must be an approved member to view messages"
                });
            }
        }

        // Get messages
        const messages = await CommunityMessage.find({ community: communityId })
            .populate("sender", "name profile.avatar role")
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(skip);

        // Reverse to show oldest first
        messages.reverse();

        res.json({ success: true, messages });
    } catch (error) {
        console.error("Get community messages error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   POST /api/community-messages/:communityId
// @desc    Send a message to community
// @access  Private (must be approved member or owner)
router.post("/:communityId", protect, async (req, res) => {
    try {
        const { communityId } = req.params;
        const { content } = req.body;

        // Validate input
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, error: "Message content is required" });
        }

        // Check if user is community owner
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ success: false, error: "Community not found" });
        }

        const isOwner = community.mentor.toString() === req.user.id;

        // Check if user is approved member
        if (!isOwner) {
            const membership = await Membership.findOne({
                student: req.user.id,
                community: communityId,
                status: "approved"
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    error: "You must be an approved member to send messages"
                });
            }
        }

        // Create message
        const message = await CommunityMessage.create({
            community: communityId,
            sender: req.user.id,
            content: content.trim(),
            timestamp: new Date()
        });

        // Populate sender info
        await message.populate("sender", "name profile.avatar role");

        res.json({ success: true, message });
    } catch (error) {
        console.error("Send community message error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

export default router;
