// models/Membership.js
import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "left", "removed", "refund_pending", "refunded"],
      default: "pending",
      required: true,
      index: true,
    },
    joinedAt: {
      type: Date,
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
    creditsPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "verified", "failed", "free", "refund_pending", "refunded"],
      default: "free",
    },
    role: {
      type: String,
      enum: ["member", "moderator"],
      default: "member",
    },
    statistics: {
      postsCreated: {
        type: Number,
        default: 0,
        min: 0,
      },
      commentsCreated: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastActive: {
        type: Date,
        default: Date.now,
      },
    },
    // Track history of interactions (rejections, leaves, etc.)
    history: [{
      status: {
        type: String,
        required: true,
        enum: ["pending", "approved", "rejected", "left", "removed", "refund_pending", "refunded"]
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      rejectionReason: String,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    }],
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate memberships
membershipSchema.index({ student: 1, community: 1 }, { unique: true });

// Indexes for common queries
membershipSchema.index({ community: 1, status: 1 });
membershipSchema.index({ student: 1, status: 1 });

// Update joinedAt when approved
membershipSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "approved" && !this.joinedAt) {
    this.joinedAt = Date.now();
  }
  next();
});

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;