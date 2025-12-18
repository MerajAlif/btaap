// routes/communities.js - FIXED VERSION
import express from "express";
import Community from "../models/Community.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import SystemSetting from "../models/SystemSetting.js";
import {
  protect,
  authorize,
  requireMentorApproval,
  optionalAuth
} from "../middleware/auth.js";
import { deductCredits } from "../services/credits.js";

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const {
      category,
      search,
      sort = "-createdAt",
      page = 1,
      limit = 12,
      creatorRole,
    } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;

    // Handle creatorRole filtering
    if (creatorRole) {
      // Handle old communities without creatorRole (treat as mentor communities)
      if (creatorRole === "mentor") {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { creatorRole: "mentor" },
            { creatorRole: { $exists: false } },
            { creatorRole: null }
          ]
        });
      } else {
        query.creatorRole = creatorRole;
      }
    }

    // Handle search
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ]
      });
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

// ========== ADMIN ROUTES (must be before other routes) ==========

// Get all join requests across all communities (admin only)
router.get(
  "/admin/all-requests",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { status, search } = req.query;

      // Build query
      const query = {};
      if (status && status !== "all") {
        query.status = status;
      }

      // Fetch all membership requests
      let requests = await Membership.find(query)
        .populate("student", "name email profile.avatar")
        .populate({
          path: "community",
          select: "name mentor creatorRole mentorSettings",
          populate: { path: "mentor", select: "name email" }
        })
        .populate("approvedBy", "name")
        .sort("-createdAt");

      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        requests = requests.filter(req =>
          req.student?.name.toLowerCase().includes(searchLower) ||
          req.student?.email.toLowerCase().includes(searchLower) ||
          req.community?.name.toLowerCase().includes(searchLower) ||
          req.transactionId?.toLowerCase().includes(searchLower)
        );
      }

      res.json({ success: true, requests, total: requests.length });
    } catch (error) {
      console.error("Get all requests error:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// ADMIN: Verify payment for a membership
router.patch(
  "/admin/memberships/:id/verify-payment",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const membership = await Membership.findById(req.params.id);

      if (!membership) {
        return res
          .status(404)
          .json({ success: false, error: "Membership request not found" });
      }

      membership.paymentStatus = "verified";
      await membership.save();

      res.json({
        success: true,
        message: "Payment verified successfully",
        membership,
      });
    } catch (error) {
      console.error("Verify payment error:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

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
  authorize("student", "mentor"),
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

// Get community members
router.get("/:id/members", protect, async (req, res) => {
  try {
    const memberships = await Membership.find({
      community: req.params.id,
      status: "approved",
    }).populate("student", "name profile.avatar");

    res.json({ success: true, members: memberships.map(m => m.student) });
  } catch (error) {
    console.error("Get members error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Get single community details
router.get("/:id", optionalAuth, async (req, res) => {
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

    let membershipStatus = "none";
    let membershipDetails = null;
    if (req.user) {
      const membership = await Membership.findOne({
        student: req.user._id,
        community: req.params.id,
      });
      console.log("CommunityDetail Membership Check:", {
        student: req.user._id,
        community: req.params.id,
        membership: membership
      });
      if (membership) {
        membershipStatus = membership.status;
        // Include full details for frontend display (validity, payment, history)
        membershipDetails = {
          status: membership.status,
          rejectionReason: membership.rejectionReason,
          createdAt: membership.createdAt,
          joinedAt: membership.joinedAt,
          paymentStatus: membership.paymentStatus,
          creditsPaid: membership.creditsPaid,
          transactionId: membership.transactionId,
          history: membership.history
        };
      }
    }

    res.json({ success: true, community, membershipStatus, membershipDetails });
  } catch (error) {
    console.error("Get community error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ========== CREATE COMMUNITY (WITH CREDIT DEDUCTION) ==========

// Create community (Mentors and Students) - WITH CREDIT DEDUCTION
router.post(
  "/",
  protect,
  // Removed authorize("mentor") to allow students
  async (req, res) => {
    try {
      // If mentor, check approval
      if (req.user.role === "mentor" && req.user.approvalStatus !== "approved") {
        return res.status(403).json({
          success: false,
          error: "Your mentor account is pending approval",
        });
      }

      const {
        name,
        description,
        category,
        tags,
        maxMembers,
        coverImage,
        settings,
        mentorSettings,
      } = req.body;

      if (!name || !description || !category) {
        return res.status(400).json({
          success: false,
          error: "Name, description, and category are required",
        });
      }

      // ✅ Check and deduct credits
      // Fetch cost from global settings (default to 5 if not set)
      let mentorCreationCost = 5;
      try {
        const costSetting = await SystemSetting.findOne({ key: 'mentorCommunityCreationCost' });
        if (costSetting) mentorCreationCost = Number(costSetting.value);
      } catch (err) {
        console.error("Failed to fetch system setting:", err);
      }

      const COMMUNITY_CREATION_COST = req.user.role === "student" ? 0 : mentorCreationCost;
      const user = await User.findById(req.user._id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // Check if user has enough credits
      if (user.credits < COMMUNITY_CREATION_COST) {
        return res.status(403).json({
          success: false,
          error: `Insufficient credits. You need ${COMMUNITY_CREATION_COST} credits to create a community. You have ${user.credits} credits.`,
          code: "INSUFFICIENT_CREDITS",
        });
      }

      // Check credit expiry
      if (user.creditExpiry && new Date() > new Date(user.creditExpiry)) {
        user.credits = 0;
        user.creditExpiry = null;
        await user.save();
        return res.status(403).json({
          success: false,
          error: "Your credits have expired. Please purchase more credits.",
          code: "CREDITS_EXPIRED",
        });
      }

      // Determine features based on role
      const features = {
        chat: true,
        resources: true,
        classes: req.user.role === "mentor", // Only mentors can have classes
        announcements: true, // Enabled for all communities
      };

      // Create the community
      const community = await Community.create({
        name,
        description,
        category,
        tags: tags || [],
        joinCost: req.user.role === "student" ? 0 : 0, // FIXED JOIN COST REMOVED (Set to 0, or controlled by mentorSettings)
        maxMembers,
        coverImage: coverImage || "",
        settings: settings || {},
        mentorSettings: mentorSettings || {},
        mentor: req.user._id,
        creatorRole: req.user.role,
        features,
      });

      // ✅ Deduct credits and add to history
      if (COMMUNITY_CREATION_COST > 0) {
        user.credits -= COMMUNITY_CREATION_COST;
        user.creditHistory.push({
          amount: -COMMUNITY_CREATION_COST,
          type: "usage",
          description: `Created community: ${name}`,
          relatedCommunity: community._id,
          createdAt: new Date(),
        });
        await user.save();
      }

      // Auto-join the creator as a member
      if (req.user.role === "student") {
        await Membership.create({
          student: req.user._id,
          community: community._id,
          status: "approved",
          creditsPaid: 0,
          joinedAt: new Date(),
          approvedBy: req.user._id,
          approvedAt: new Date()
        });

        // Update user statistics
        await User.findByIdAndUpdate(req.user._id, {
          $inc: {
            "statistics.communitiesOwned": 1,
            "statistics.communitiesJoined": 1
          },
        });
      } else {
        // Update user statistics for mentor
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { "statistics.communitiesOwned": 1 },
        });
      }

      res.status(201).json({
        success: true,
        community,
        remainingCredits: user.credits,
        message: `Community created successfully! ${COMMUNITY_CREATION_COST} credits deducted. Remaining: ${user.credits} credits`,
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
        "mentorSettings",
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

      if (community.mentor.toString() !== req.user._id.toString() && !community.moderators?.includes(req.user._id)) {
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

    if (community.mentor.toString() !== req.user._id.toString() && !community.moderators?.includes(req.user._id)) {
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
    const { transactionId } = req.body;
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

    // Check for ANY existing membership to prevent duplicate key errors
    const existingMembership = await Membership.findOne({
      student: req.user._id,
      community: req.params.id,
    });

    if (existingMembership) {
      if (existingMembership.status === "approved") {
        return res.status(400).json({ success: false, error: "Already a member" });
      }
      if (existingMembership.status === "pending") {
        return res.status(400).json({ success: false, error: "Join request already pending" });
      }

      // If status is rejected, left, or removed, we update the existing record
      // instead of creating a new one (which would cause duplicate key error)
    }

    if (
      community.maxMembers &&
      community.statistics.totalMembers >= community.maxMembers
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Community is full" });
    }

    let remainingCredits = req.user.credits;

    // Check if it's a mentor community with manual payment
    const isMentorCommunity = community.creatorRole === "mentor";
    const requiresManualPayment = isMentorCommunity && community.mentorSettings?.monthlyFee > 0;

    if (requiresManualPayment) {
      if (!transactionId) {
        return res.status(400).json({ success: false, error: "Transaction ID is required for this community" });
      }
    } else if (community.joinCost > 0) {
      remainingCredits = await deductCredits(
        req.user,
        community.joinCost,
        `Join community: ${community.name}`
      );
    }

    let membership;
    const newStatus = community.settings.autoApprove ? "approved" : "pending";
    const newCreditsPaid = requiresManualPayment ? 0 : community.joinCost;
    const newTransactionId = requiresManualPayment ? transactionId : undefined;
    const newPaymentStatus = requiresManualPayment ? "pending" : "free";

    if (existingMembership) {
      // Archive current state to history
      if (!existingMembership.history) {
        existingMembership.history = [];
      }

      existingMembership.history.push({
        status: existingMembership.status,
        updatedAt: existingMembership.updatedAt || new Date(),
        rejectionReason: existingMembership.rejectionReason,
        approvedBy: existingMembership.approvedBy
      });

      // Update existing membership
      existingMembership.status = newStatus;
      existingMembership.creditsPaid = newCreditsPaid;
      existingMembership.transactionId = newTransactionId;
      existingMembership.paymentStatus = newPaymentStatus;
      existingMembership.rejectionReason = undefined; // Clear previous rejection reason
      existingMembership.approvedBy = undefined; // Clear previous approver
      existingMembership.joinedAt = new Date(); // Reset join date
      // We explicitly update createdAt to bring it to top of lists sorted by creation

      await existingMembership.save();
      membership = existingMembership;
    } else {
      // Create new membership
      membership = await Membership.create({
        student: req.user._id,
        community: req.params.id,
        status: newStatus,
        creditsPaid: newCreditsPaid,
        transactionId: newTransactionId,
        paymentStatus: newPaymentStatus,
      });
    }

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

// Remove member (mentor only)
router.delete(
  "/:id/members/:studentId",
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

      if (community.mentor.toString() !== req.user._id.toString() && !community.moderators?.includes(req.user._id)) {
        return res
          .status(403)
          .json({ success: false, error: "Not authorized" });
      }

      const membership = await Membership.findOne({
        community: req.params.id,
        student: req.params.studentId,
        status: "approved",
      });

      if (!membership) {
        return res
          .status(404)
          .json({ success: false, error: "Member not found" });
      }

      membership.status = "removed";
      await membership.save();

      await Community.findByIdAndUpdate(req.params.id, {
        $inc: { "statistics.totalMembers": -1 },
      });

      await User.findByIdAndUpdate(req.params.studentId, {
        $inc: { "statistics.communitiesJoined": -1 },
      });

      res.json({ success: true, message: "Member removed successfully" });
    } catch (error) {
      console.error("Remove member error:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Add moderator (Creator only)
router.post(
  "/:id/moderators",
  protect,
  async (req, res) => {
    try {
      const { studentId } = req.body;
      const community = await Community.findById(req.params.id);

      if (!community) {
        return res.status(404).json({ success: false, error: "Community not found" });
      }

      if (community.mentor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }

      if (community.moderators.includes(studentId)) {
        return res.status(400).json({ success: false, error: "User is already a moderator" });
      }

      community.moderators.push(studentId);
      await community.save();

      res.json({ success: true, message: "Moderator added successfully", moderators: community.moderators });
    } catch (error) {
      console.error("Add moderator error:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Confirm Refund Received (Student only)
router.post(
  "/requests/:id/confirm-refund",
  protect,
  authorize("student"),
  async (req, res) => {
    try {
      const membership = await Membership.findById(req.params.id);

      if (!membership) {
        return res.status(404).json({ success: false, error: "Request not found" });
      }

      if (membership.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }

      if (membership.status !== "refund_pending") {
        return res.status(400).json({ success: false, error: "This request is not pending refund" });
      }

      membership.status = "refunded";
      membership.paymentStatus = "refunded";
      await membership.save();

      res.json({ success: true, message: "Refund confirmed. Request closed." });
    } catch (error) {
      console.error("Confirm refund error:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Remove moderator (Creator only)
router.delete(
  "/:id/moderators/:studentId",
  protect,
  async (req, res) => {
    try {
      const community = await Community.findById(req.params.id);

      if (!community) {
        return res.status(404).json({ success: false, error: "Community not found" });
      }

      if (community.mentor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }

      community.moderators = community.moderators.filter(
        (modId) => modId.toString() !== req.params.studentId
      );
      await community.save();

      res.json({ success: true, message: "Moderator removed successfully" });
    } catch (error) {
      console.error("Remove moderator error:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

export default router;
