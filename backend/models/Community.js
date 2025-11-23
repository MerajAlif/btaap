// models/Community.js
import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Community name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    joinCost: {
      type: Number,
      required: true,
      min: [0, "Join cost cannot be negative"],
      default: 0,
    },
    maxMembers: {
      type: Number,
      default: null, // null = unlimited
      min: [1, "Must allow at least 1 member"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    settings: {
      autoApprove: {
        type: Boolean,
        default: false,
      },
      isPrivate: {
        type: Boolean,
        default: false,
      },
      allowPosts: {
        type: Boolean,
        default: true,
      },
    },
    statistics: {
      totalMembers: {
        type: Number,
        default: 0,
        min: 0,
      },
      pendingRequests: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalPosts: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
communitySchema.index({ mentor: 1, isActive: 1 });
communitySchema.index({ category: 1, isActive: 1 });
communitySchema.index({ "statistics.totalMembers": -1 });

// Prevent mentor from having too many communities (optional)
communitySchema.pre("save", async function (next) {
  if (this.isNew) {
    const mentorCommunities = await this.constructor.countDocuments({
      mentor: this.mentor,
      isActive: true,
    });
    
    if (mentorCommunities >= 10) {
      throw new Error("Maximum 10 active communities per mentor");
    }
  }
  next();
});

const Community = mongoose.model("Community", communitySchema);

export default Community;