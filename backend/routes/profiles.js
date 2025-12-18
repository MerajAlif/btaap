// routes/profiles.js
import express from "express";
import User from "../models/User.js";
import Community from "../models/Community.js";
import Membership from "../models/Membership.js";
import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// ========== PUBLIC PROFILE VIEWS ==========

// Get mentor public profile
router.get("/mentor/:id", optionalAuth, async (req, res) => {
  try {
    const mentor = await User.findById(req.params.id)
      .select("-password -resetPasswordToken -resetPasswordExpire -creditHistory");

    if (!mentor || mentor.role !== "mentor") {
      return res.status(404).json({ success: false, error: "Mentor not found" });
    }

    if (mentor.approvalStatus !== "approved") {
      return res.status(403).json({ success: false, error: "Mentor not approved yet" });
    }

    // Get mentor's owned communities
    const ownedCommunities = await Community.find({
      mentor: req.params.id,
      isActive: true,
    }).select("name description category coverImage joinCost statistics mentorSettings");

    // Get communities where mentor is a member
    const memberCommunities = await Membership.find({
      student: req.params.id,
      status: "approved",
    })
      .populate({
        path: "community",
        select: "name description category coverImage joinCost statistics",
      })
      .select("community");

    const joinedCommunities = memberCommunities.map((m) => m.community);

    // Mutual communities (if user is logged in)
    let mutualCommunities = [];
    if (req.user) {
      // Get viewer's communities
      const viewerMemberships = await Membership.find({
        student: req.user.id,
        status: "approved",
      }).select("community");

      const viewerCommunityIds = viewerMemberships.map((m) =>
        m.community.toString()
      );

      // Find intersection with mentor's joined communities
      mutualCommunities = joinedCommunities.filter((c) =>
        viewerCommunityIds.includes(c._id.toString())
      );
    }

    // Public profile data
    const profile = {
      id: mentor._id,
      name: mentor.name,
      email: mentor.email,
      role: mentor.role,
      profile: {
        avatar: mentor.profile.avatar,
        bio: mentor.profile.bio,
        expertise: mentor.profile.expertise,
        experience: mentor.profile.experience,
        education: mentor.profile.education,
        hourlyRate: mentor.profile.hourlyRate,
        linkedIn: mentor.profile.linkedIn,
        portfolio: mentor.profile.portfolio,
        credentials: mentor.profile.credentials,
      },
      statistics: mentor.statistics,
      communities: ownedCommunities, // Owned
      joinedCommunities, // Member of
      mutualCommunities, // Mutual
      joinedAt: mentor.createdAt,
    };

    res.json({ success: true, mentor: profile });
  } catch (error) {
    console.error("Get mentor profile error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Get student public profile (limited info)
router.get("/student/:id", optionalAuth, async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select("name role profile.avatar profile.bio profile.interests statistics createdAt");

    if (!student || student.role !== "student") {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    const profile = {
      id: student._id,
      name: student.name,
      avatar: student.profile.avatar,
      bio: student.profile.bio,
      interests: student.profile.interests,
      statistics: {
        totalPosts: student.statistics.totalPosts,
        totalComments: student.statistics.totalComments,
        communitiesJoined: student.statistics.communitiesJoined,
      },
      joinedAt: student.createdAt,
    };

    res.json({ success: true, student: profile });
  } catch (error) {
    console.error("Get student profile error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ========== AUTHENTICATED USER - OWN PROFILE ==========

// Get own detailed profile (student)
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -resetPasswordToken -resetPasswordExpire");

    if (user.role === "student") {
      // Get joined communities
      const memberships = await Membership.find({
        student: req.user._id,
        status: "approved",
      })
        .populate({
          path: "community",
          select: "name coverImage category",
          populate: { path: "mentor", select: "name profile.avatar" },
        })
        .select("community joinedAt statistics");

      // Get pending requests
      const pendingRequests = await Membership.find({
        student: req.user._id,
        status: "pending",
      })
        .populate("community", "name coverImage")
        .select("community createdAt");

      return res.json({
        success: true,
        user,
        memberships,
        pendingRequests,
      });
    }

    if (user.role === "mentor") {
      // Get owned communities
      const communities = await Community.find({ mentor: req.user._id });

      // Get total members across all communities
      const totalMembers = await Membership.countDocuments({
        community: { $in: communities.map(c => c._id) },
        status: "approved",
      });

      // Get pending requests count
      const pendingRequestsCount = await Membership.countDocuments({
        community: { $in: communities.map(c => c._id) },
        status: "pending",
      });

      return res.json({
        success: true,
        user,
        communities,
        totalMembers,
        pendingRequestsCount,
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Get own profile error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ========== BROWSE MENTORS ==========

// Get all approved mentors (for students to browse)
router.get("/mentors", async (req, res) => {
  try {
    const { search, expertise, page = 1, limit = 12 } = req.query;

    const query = {
      role: "mentor",
      approvalStatus: "approved",
      isActive: true,
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "profile.bio": { $regex: search, $options: "i" } },
      ];
    }

    if (expertise) {
      query["profile.expertise"] = { $in: [expertise] };
    }

    const mentors = await User.find(query)
      .select("name profile.avatar profile.bio profile.expertise profile.hourlyRate statistics")
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