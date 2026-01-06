// routes/profiles.js
import express from "express";
import User from "../models/User.js";
import Community from "../models/Community.js";
import Membership from "../models/Membership.js";
import MentorReview from "../models/MentorReview.js";
import mongoose from "mongoose";
import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// ========== USER LISTS FOR SEARCH ==========

// Get mentors list (for search/discovery) -> MERGED WITH BROWSE MENTORS BELOW

// Get students list (for search/discovery)
router.get("/students", async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;

    const query = { role: "student" };

    // Add search filter if provided
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const students = await User.find(query)
      .select("name email profile role")
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, students });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ========== PUBLIC PROFILE VIEWS ==========

// ... (existing code remains until Browse Mentors section)

// ========== BROWSE MENTORS ==========

// Get all approved mentors (for students to browse)
router.get("/mentors", async (req, res) => {
  try {
    const { search, expertise, page = 1, limit = 12 } = req.query;

    const query = {
      role: "mentor",
      approvalStatus: "approved",
      isActive: true,
      // Subscription Check: Must be active and not expired
      "mentorSubscription.isActive": true,
      // Optional: strict expiry check if isActive isn't auto-updated cron-job style
      "mentorSubscription.expiry": { $gt: new Date() }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "profile.bio": { $regex: search, $options: "i" } },
        { "profile.expertise": { $regex: search, $options: "i" } } // Added expertise to search
      ];
    }

    if (expertise) {
      query["profile.expertise"] = { $in: [expertise] };
    }

    const mentors = await User.find(query)
      .select("name profile.avatar profile.bio profile.expertise profile.hourlyRate statistics mentorSubscription")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort("-statistics.communitiesOwned");

    // Get community counts for each mentor
    const mentorsWithCommunities = await Promise.all(
      mentors.map(async (mentor) => {
        const communityCount = await Community.countDocuments({
          mentor: mentor._id,
          isActive: true,
        });
        return {
          ...mentor.toObject(),
          communityCount,
        };
      })
    );

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      mentors: mentorsWithCommunities,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
    });
  } catch (error) {
    console.error("Browse mentors error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ========== APPLY TO BECOME MENTOR ==========

// Student applies to become mentor
router.post("/apply-mentor", protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(400).json({
        success: false,
        error: "Only students can apply to become mentors",
      });
    }

    const { expertise, experience, credentials, bio } = req.body;

    if (!expertise || expertise.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please provide at least one area of expertise",
      });
    }

    if (!experience) {
      return res.status(400).json({
        success: false,
        error: "Please provide your experience",
      });
    }

    // Update user to mentor role with pending status
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        role: "mentor",
        approvalStatus: "pending",
        "profile.expertise": expertise,
        "profile.experience": experience,
        "profile.credentials": credentials || "",
        "profile.bio": bio || req.user.profile.bio,
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      user,
      message: "Mentor application submitted. Awaiting admin approval.",
    });
  } catch (error) {
    console.error("Apply mentor error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;