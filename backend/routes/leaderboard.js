// routes/leaderboard.js
import express from "express";
import TaskSubmission from "../models/TaskSubmission.js";
import Community from "../models/Community.js";
import Membership from "../models/Membership.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Middleware to check if user is a member of the community
const checkMemberAccess = async (req, res, next) => {
    try {
        const { communityId } = req.params;
        const community = await Community.findById(communityId);

        if (!community) {
            return res.status(404).json({ success: false, error: "Community not found" });
        }

        // Check if mentor
        const mentorId = community.mentor._id || community.mentor;
        if (mentorId.toString() === req.user._id.toString()) {
            return next();
        }

        // Check if approved member
        const membership = await Membership.findOne({
            community: communityId,
            student: req.user._id,
            status: "approved",
        });

        if (!membership) {
            return res.status(403).json({ success: false, error: "You are not a member of this community" });
        }

        next();
    } catch (error) {
        console.error("Check member access error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
};

// @route   GET /api/leaderboard/:communityId
// @desc    Get leaderboard for a community
// @access  Private (Members)
router.get("/:communityId", protect, checkMemberAccess, async (req, res) => {
    try {
        // Aggregate submissions to calculate total marks per student
        const leaderboard = await TaskSubmission.aggregate([
            {
                $lookup: {
                    from: "tasks",
                    localField: "task",
                    foreignField: "_id",
                    as: "taskInfo",
                },
            },
            {
                $unwind: "$taskInfo",
            },
            {
                $match: {
                    "taskInfo.community": req.params.communityId,
                    status: "graded",
                },
            },
            {
                $group: {
                    _id: "$student",
                    totalMarks: { $sum: "$marksObtained" },
                    tasksCompleted: { $sum: 1 },
                    averageMarks: { $avg: "$marksObtained" },
                },
            },
            {
                $sort: { totalMarks: -1 },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "studentInfo",
                },
            },
            {
                $unwind: "$studentInfo",
            },
            {
                $project: {
                    student: {
                        _id: "$studentInfo._id",
                        name: "$studentInfo.name",
                        email: "$studentInfo.email",
                        avatar: "$studentInfo.profile.avatar",
                    },
                    totalMarks: 1,
                    tasksCompleted: 1,
                    averageMarks: { $round: ["$averageMarks", 2] },
                },
            },
        ]);

        // Add rank and badge
        const rankedLeaderboard = leaderboard.map((entry, index) => {
            let badge = null;
            if (index === 0) badge = "gold";
            else if (index === 1) badge = "silver";
            else if (index === 2) badge = "bronze";

            return {
                ...entry,
                rank: index + 1,
                badge,
            };
        });

        res.json({ success: true, leaderboard: rankedLeaderboard });
    } catch (error) {
        console.error("Get leaderboard error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

export default router;
