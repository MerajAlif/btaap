// models/User.js (Updated with virtual relationships)
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const creditHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ["purchase", "usage", "refund", "community_join"], required: true },
  description: { type: String, default: "" },
  relatedCommunity: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
  createdAt: { type: Date, default: Date.now },
});

const downloadedPdfSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  pdfUrl: { type: String, trim: true },
  fileName: { type: String, trim: true },
  coverImage: { type: String, trim: true },
  downloadedAt: { type: Date, default: Date.now },
});

const statisticsSchema = new mongoose.Schema(
  {
    totalPosts: { type: Number, default: 0, min: 0 },
    solvedPosts: { type: Number, default: 0, min: 0 },
    totalComments: { type: Number, default: 0, min: 0 },
    communitiesJoined: { type: Number, default: 0, min: 0 },
    communitiesOwned: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "mentor", "admin"],
      default: "student",
      required: true,
    },

    // Mentor approval (only for mentors)
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: function () {
        return this.role === "mentor" ? "pending" : "approved";
      },
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },

    profile: {
      phone: { type: String, trim: true },
      bio: { type: String, maxlength: [500, "Bio cannot exceed 500 characters"] },
      avatar: { type: String, default: "" },
      education: { type: String, trim: true },
      interests: [{ type: String, trim: true }],
      expertise: [{ type: String, trim: true }],
      experience: { type: String, trim: true },
      hourlyRate: { type: Number, min: 0 },
      availability: { type: String, trim: true },
      credentials: { type: String, trim: true },
      linkedIn: { type: String, trim: true },
      portfolio: { type: String, trim: true },
    },

    credits: { type: Number, default: 0, min: 0 },
    creditExpiry: { type: Date, default: null },
    creditHistory: { type: [creditHistorySchema], default: [] },

    mentorSubscription: {
      planName: { type: String, default: null },
      expiry: { type: Date, default: null },
      maxCommunities: { type: Number, default: 1 }, // Default for non-subscribed
      maxLiveClasses: { type: Number, default: 0 },
      features: [{ type: String }],
      isActive: { type: Boolean, default: false }
    },

    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pdf" }],
    statistics: { type: statisticsSchema, default: () => ({}) },
    downloadedPDFs: { type: [downloadedPdfSchema], default: [] },
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    // Connections System
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    connectionRequests: [
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ approvalStatus: 1 });

// Virtual for communities owned by mentor
userSchema.virtual("ownedCommunities", {
  ref: "Community",
  localField: "_id",
  foreignField: "mentor",
});

// Virtual for memberships
userSchema.virtual("memberships", {
  ref: "Membership",
  localField: "_id",
  foreignField: "student",
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Method to check if mentor is approved
userSchema.methods.isMentorApproved = function () {
  if (this.role !== "mentor") return true;
  return this.approvalStatus === "approved";
};

// Method to get public profile
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;