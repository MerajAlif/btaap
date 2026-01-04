import express from "express";
import MentorReview from "../models/MentorReview.js";
import Membership from "../models/Membership.js";
import Community from "../models/Community.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/reviews
// @desc    Add a review for a mentor
// @access  Private (Student only)
router.post("/", protect, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ success: false, error: "Only students can write reviews" });
        }

        const { mentorId, rating, comment } = req.body;

        if (!mentorId || !rating || !comment) {
            return res.status(400).json({ success: false, error: "Please provide all fields" });
        }

        // Verify student is actually a member of one of the mentor's communities
        // 1. Get all communities owned by mentor
        const mentorCommunities = await Community.find({ mentor: mentorId }).select('_id');
        const communityIds = mentorCommunities.map(c => c._id);

        // 2. Check if student has an APPROVED membership in any of these
        const isMember = await Membership.exists({
            student: req.user._id,
            community: { $in: communityIds },
            status: "approved"
        });

        // Also allow if they have a direct connection (optional, as per requirement "or user connect ache")
        // For now, let's stick to community/connection check. connection logic is in Connections.js
        // If you want to check connection, you'd need the Connection model.
        // Let's assume Community Membership is the primary validator for now as it's safer.

        if (!isMember) {
            return res.status(403).json({
                success: false,
                error: "You must be a member of this mentor's community to leave a review."
            });
        }

        // Check if already reviewed
        const existingReview = await MentorReview.findOne({
            student: req.user._id,
            mentor: mentorId
        });

        if (existingReview) {
            return res.status(400).json({ success: false, error: "You have already reviewed this mentor" });
        }

        const review = await MentorReview.create({
            student: req.user._id,
            mentor: mentorId,
            rating,
            comment
        });

        // Populate student info for immediate display
        await review.populate("student", "name profile.avatar");

        res.status(201).json({ success: true, review });
    } catch (error) {
        console.error("Add review error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   GET /api/reviews/mentor/:mentorId
// @desc    Get all reviews for a mentor
// @access  Public
router.get("/mentor/:mentorId", async (req, res) => {
    try {
        const reviews = await MentorReview.find({ mentor: req.params.mentorId })
            .populate("student", "name profile.avatar")
            .sort({ createdAt: -1 });

        // Calculate Average
        const stats = await MentorReview.aggregate([
            { $match: { mentor: new mongoose.Types.ObjectId(req.params.mentorId) } },
            { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);

        const average = stats[0]?.avgRating || 0;
        const count = stats[0]?.count || 0;

        res.json({
            success: true,
            reviews,
            stats: { average, count }
        });
    } catch (error) {
        console.error("Get reviews error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

import mongoose from "mongoose";

export default router;
