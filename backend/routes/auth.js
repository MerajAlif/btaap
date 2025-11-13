// routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, profile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide name, email, and password",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    const validRoles = ["student", "mentor"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role. Must be student or mentor",
      });
    }

    // ✅ Mentor registration validation
    if (role === "mentor") {
      if (!profile?.expertise || profile.expertise.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Mentors must provide at least one area of expertise",
        });
      }
      if (!profile?.experience) {
        return res.status(400).json({
          success: false,
          error: "Mentors must provide their experience",
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
      profile: profile || {},
    });

    const token = generateToken(user._id);

    // ✅ Different response for mentor (pending approval)
    if (user.role === "mentor") {
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          approvalStatus: user.approvalStatus,
          profile: user.profile,
          credits: user.credits,
          creditExpiry: user.creditExpiry,
          lastLogin: user.lastLogin,
        },
        message:
          "Registration successful! Your mentor application is pending admin approval.",
      });
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        credits: user.credits,
        creditExpiry: user.creditExpiry,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error during registration",
    });
  }
});

// ========== LOGIN ==========
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account is deactivated. Please contact support.",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    // ✅ Include approval status in response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        profile: user.profile,
        credits: user.credits,
        creditExpiry: user.creditExpiry,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
});

// ========== GET CURRENT USER ==========
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching user data",
    });
  }
});

// ========== UPDATE PROFILE ==========
router.put("/updateprofile", protect, async (req, res) => {
  try {
    const { name, profile } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (profile) fieldsToUpdate.profile = { ...req.user.profile, ...profile };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error updating profile",
    });
  }
});

// ========== UPDATE PASSWORD ==========
router.put("/updatepassword", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Please provide current and new password",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error updating password",
    });
  }
});

// ========== ADMIN: GET ALL USERS ==========
router.get("/users", protect, authorize("admin"), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching users",
    });
  }
});

router.get(
  "/mentors/pending",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const query = {
        role: "mentor",
        approvalStatus: "pending",
      };

      const mentors = await User.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const count = await User.countDocuments(query);

      res.status(200).json({
        success: true,
        mentors,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count,
      });
    } catch (error) {
      console.error("Get pending mentors error:", error);
      res.status(500).json({
        success: false,
        error: "Server error fetching pending mentors",
      });
    }
  }
);

router.put(
  "/mentors/:id/approve",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const mentor = await User.findById(req.params.id);

      if (!mentor) {
        return res.status(404).json({
          success: false,
          error: "Mentor not found",
        });
      }

      if (mentor.role !== "mentor") {
        return res.status(400).json({
          success: false,
          error: "User is not a mentor",
        });
      }

      if (mentor.approvalStatus === "approved") {
        return res.status(400).json({
          success: false,
          error: "Mentor already approved",
        });
      }

      mentor.approvalStatus = "approved";
      mentor.approvedBy = req.user.id;
      mentor.approvedAt = Date.now();
      mentor.rejectionReason = undefined;

      await mentor.save();

      res.status(200).json({
        success: true,
        message: "Mentor approved successfully",
        mentor,
      });
    } catch (error) {
      console.error("Approve mentor error:", error);
      res.status(500).json({
        success: false,
        error: "Server error approving mentor",
      });
    }
  }
);

router.put(
  "/mentors/:id/reject",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Please provide a rejection reason",
        });
      }

      const mentor = await User.findById(req.params.id);

      if (!mentor) {
        return res.status(404).json({
          success: false,
          error: "Mentor not found",
        });
      }

      if (mentor.role !== "mentor") {
        return res.status(400).json({
          success: false,
          error: "User is not a mentor",
        });
      }

      mentor.approvalStatus = "rejected";
      mentor.rejectionReason = reason;
      mentor.approvedBy = req.user.id;
      mentor.approvedAt = Date.now();

      await mentor.save();

      res.status(200).json({
        success: true,
        message: "Mentor application rejected",
        mentor,
      });
    } catch (error) {
      console.error("Reject mentor error:", error);
      res.status(500).json({
        success: false,
        error: "Server error rejecting mentor",
      });
    }
  }
);

router.get("/approval-status", protect, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(400).json({
        success: false,
        error: "Only mentors can check approval status",
      });
    }

    res.status(200).json({
      success: true,
      approvalStatus: req.user.approvalStatus,
      rejectionReason: req.user.rejectionReason,
      approvedAt: req.user.approvedAt,
    });
  } catch (error) {
    console.error("Get approval status error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching approval status",
    });
  }
});

export default router;
