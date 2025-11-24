// routes/communities.js - FIXED VERSION
import express from "express";
import Community from "../models/Community.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import {
  protect,
  authorize,
  requireMentorApproval,
} from "../middleware/auth.js";
import { deductCredits } from "../services/credits.js";

const router = express.Router();

// ========== PUBLIC ROUTES ==========

// Get all active communities (with filters) - MUST BE BEFORE /:id
router.get("/", async (req, res) => {
  try {
    const {
      category,
      search,
      sort = "-createdAt",
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const communities = await Community.find(query)
      .populate("mentor", "name profile.avatar profile.expertise profile.bio")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const count = await Community.countDocuments(query);

    res.json({
      success: true,
      communities,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
    });
  } catch (error) {
    console.error("Get communities error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ========== MENTOR ROUTES (must be before /:id routes) ==========

// Get mentor's own communities
router.get(
  "/mentor/my-communities",
  protect,
  authorize("mentor"),
  async (req, res) => {
    try {
      const communities = await Community.find({ mentor: req.user._id }).sort(
        "-createdAt"
      );

      res.json({ success: true, communities });
    } catch (error) {
      console.error("Get mentor communities error:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// ========== STUDENT ROUTES (must be before /:id routes) ==========

// Get student's communities
router.get(
  "/student/my-communities",
  protect,
  authorize("student"),
  async (req, res) => {
    try {
      const memberships = await Membership.find({
        student: req.user._id,
        status: "approved",
      })
        .populate({
          path: "community",
          populate: { path: "mentor", select: "name profile.avatar" },
        })
        .sort("-joinedAt");

      res.json({ success: true, memberships });
    } catch (error) {
      console.error("Get student communities error:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// ========== SINGLE COMMUNITY ROUTE ==========

// Get single community details
router.get("/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id).populate(
      "mentor",
      "name email profile"
    );

    if (!community) {
      return res
        .status(404)
        .json({ success: false, error: "Community not found" });
    }

    res.json({ success: true, community });
  } catch (error) {
    console.error("Get community error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ========== CREATE COMMUNITY (WITH CREDIT DEDUCTION) ==========

// Create community (approved mentors only) - WITH CREDIT DEDUCTION
router.post(
  "/",
  protect,
  authorize("mentor"),
  requireMentorApproval,
  async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        tags,
        joinCost,
        maxMembers,
        coverImage,
        settings,
      } = req.body;

      if (!name || !description || !category) {
        return res.status(400).json({
          success: false,
          error: "Name, description, and category are required",
        });
      }

      // ✅ Check and deduct credits
      const COMMUNITY_CREATION_COST = 25;
      const mentor = await User.findById(req.user._id);

      if (!mentor) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // Check if mentor has enough credits
      if (mentor.credits < COMMUNITY_CREATION_COST) {
        return res.status(403).json({
          success: false,
          error: `Insufficient credits. You need ${COMMUNITY_CREATION_COST} credits to create a community. You have ${mentor.credits} credits.`,
          code: "INSUFFICIENT_CREDITS",
        });
      }

      // Check credit expiry
      if (mentor.creditExpiry && new Date() > new Date(mentor.creditExpiry)) {
        mentor.credits = 0;
        mentor.creditExpiry = null;
        await mentor.save();
        return res.status(403).json({
          success: false,
          error: "Your credits have expired. Please purchase more credits.",
          code: "CREDITS_EXPIRED",
        });
      }

      // Create the community
      const community = await Community.create({
        name,
        description,
        category,
        tags: tags || [],
        joinCost: joinCost || 0,
        maxMembers,
        coverImage: coverImage || "",
        settings: settings || {},
        mentor: req.user._id,
      });

      // ✅ Deduct credits and add to history
      mentor.credits -= COMMUNITY_CREATION_COST;
      mentor.creditHistory.push({
        amount: -COMMUNITY_CREATION_COST,
        type: "usage",
        description: `Created community: ${name}`,
        relatedCommunity: community._id,
        createdAt: new Date(),
      });
      await mentor.save();

      // Update mentor statistics
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { "statistics.communitiesOwned": 1 },
      });

      res.status(201).json({
        success: true,
        community,
        remainingCredits: mentor.credits,
        message: `Community created successfully! ${COMMUNITY_CREATION_COST} credits deducted. Remaining: ${mentor.credits} credits`,
      });
    } catch (error) {
      console.error("Create community error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Update own community
router.put(
  "/:id",
  protect,
  authorize("mentor"),
  requireMentorApproval,
  async (req, res) => {
    try {
      const community = await Community.findById(req.params.id);

      if (!community) {
        return res
          .status(404)
          .json({ success: false, error: "Community not found" });
      }

      if (community.mentor.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ success: false, error: "Not authorized" });
      }

      const updates = {};
      const allowedFields = [
        "name",
        "description",
        "category",
        "tags",
        "joinCost",
        "maxMembers",
        "coverImage",
        "settings",
        "isActive",
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const updatedCommunity = await Community.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );

      res.json({ success: true, community: updatedCommunity });
    } catch (error) {
      console.error("Update community error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get pending join requests for mentor's community
router.get(
  "/:id/pending-requests",
  protect,
  authorize("mentor"),
  async (req, res) => {
    try {
      const community = await Community.findById(req.params.id);

      if (!community) {
        return res
          .status(404)
          .json({ success: false, error: "Community not found" });
      }

      if (community.mentor.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ success: false, error: "Not authorized" });
      }

      const requests = await Membership.find({
        community: req.params.id,
        status: "pending",
      })
        .populate("student", "name email profile.avatar profile.bio")
        .sort("-createdAt");

      res.json({ success: true, requests });
    } catch (error) {
      console.error("Get pending requests error:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Approve/Reject join request
router.put(
  "/:communityId/requests/:requestId",
  protect,
  authorize("mentor"),
  async (req, res) => {
    try {
      const { action, rejectionReason } = req.body;

      if (!["approve", "reject"].includes(action)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid action" });
      }

      const community = await Community.findById(req.params.communityId);
      if (!community) {
        return res
          .status(404)
          .json({ success: false, error: "Community not found" });
      }

      if (community.mentor.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ success: false, error: "Not authorized" });
      }

      const membership = await Membership.findById(req.params.requestId);
      if (!membership) {
        return res
          .status(404)
          .json({ success: false, error: "Request not found" });
      }

      if (membership.status !== "pending") {
        return res
          .status(400)
          .json({ success: false, error: "Request already processed" });
      }

      if (action === "approve") {
        if (
          community.maxMembers &&
          community.statistics.totalMembers >= community.maxMembers
        ) {
          return res
            .status(400)
            .json({ success: false, error: "Community is full" });
        }

        membership.status = "approved";
        membership.approvedBy = req.user._id;
        membership.approvedAt = Date.now();
        await membership.save();

        await Community.findByIdAndUpdate(req.params.communityId, {
          $inc: {
            "statistics.totalMembers": 1,
            "statistics.pendingRequests": -1,
          },
        });

        await User.findByIdAndUpdate(membership.student, {
          $inc: { "statistics.communitiesJoined": 1 },
        });

        res.json({ success: true, message: "Member approved", membership });
      } else {
        membership.status = "rejected";
        membership.rejectionReason = rejectionReason || "Not specified";
        membership.approvedBy = req.user._id;
        await membership.save();

        await User.findByIdAndUpdate(membership.student, {
          $inc: { credits: membership.creditsPaid },
          $push: {
            creditHistory: {
              amount: membership.creditsPaid,
              type: "refund",
              description: `Refund for rejected community join: ${community.name}`,
              relatedCommunity: community._id,
            },
          },
        });

        await Community.findByIdAndUpdate(req.params.communityId, {
          $inc: { "statistics.pendingRequests": -1 },
        });

        res.json({
          success: true,
          message: "Request rejected and credits refunded",
        });
      }
    } catch (error) {
      console.error("Process request error:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Get community members (mentor only)
router.get("/:id/members", protect, authorize("mentor"), async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res
        .status(404)
        .json({ success: false, error: "Community not found" });
    }

    if (community.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const members = await Membership.find({
      community: req.params.id,
      status: "approved",
    })
      .populate("student", "name email profile.avatar profile.bio statistics")
      .sort("-joinedAt");

    res.json({ success: true, members });
  } catch (error) {
    console.error("Get members error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Request to join community
router.post("/:id/join", protect, authorize("student"), async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res
        .status(404)
        .json({ success: false, error: "Community not found" });
    }

    if (!community.isActive) {
      return res
        .status(400)
        .json({ success: false, error: "Community is not active" });
    }

    const existingMembership = await Membership.findOne({
      student: req.user._id,
      community: req.params.id,
      status: { $in: ["pending", "approved"] },
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        error:
          existingMembership.status === "approved"
            ? "Already a member"
            : "Join request already pending",
      });
    }

    if (
      community.maxMembers &&
      community.statistics.totalMembers >= community.maxMembers
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Community is full" });
    }

    const remainingCredits = await deductCredits(
      req.user,
      community.joinCost,
      `Join community: ${community.name}`
    );

    const membership = await Membership.create({
      student: req.user._id,
      community: req.params.id,
      status: community.settings.autoApprove ? "approved" : "pending",
      creditsPaid: community.joinCost,
    });

    if (community.settings.autoApprove) {
      await Community.findByIdAndUpdate(req.params.id, {
        $inc: {
          "statistics.totalMembers": 1,
          "statistics.totalRevenue": community.joinCost,
        },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { "statistics.communitiesJoined": 1 },
      });
    } else {
      await Community.findByIdAndUpdate(req.params.id, {
        $inc: {
          "statistics.pendingRequests": 1,
          "statistics.totalRevenue": community.joinCost,
        },
      });
    }

    res.status(201).json({
      success: true,
      membership,
      remainingCredits,
      message: community.settings.autoApprove
        ? "Successfully joined community"
        : "Join request sent. Awaiting mentor approval",
    });
  } catch (error) {
    console.error("Join community error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// Leave community
router.delete("/:id/leave", protect, authorize("student"), async (req, res) => {
  try {
    const membership = await Membership.findOne({
      student: req.user._id,
      community: req.params.id,
      status: "approved",
    });

    if (!membership) {
      return res
        .status(404)
        .json({ success: false, error: "Not a member of this community" });
    }

    membership.status = "left";
    await membership.save();

    await Community.findByIdAndUpdate(req.params.id, {
      $inc: { "statistics.totalMembers": -1 },
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "statistics.communitiesJoined": -1 },
    });

    res.json({ success: true, message: "Successfully left community" });
  } catch (error) {
    console.error("Leave community error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
