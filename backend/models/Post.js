import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    url: String,
    publicId: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  subject: {
    type: String,
    required: true
  },
  tags: [String],
  status: {
    type: String,
    enum: ["open", "solved", "closed"],
    default: "open"
  },
  solutionComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  },
  markedAsSolvedAt: Date,
  viewCount: { type: Number, default: 0 },
  upvotes: { type: Number, default: 0 }
}, { timestamps: true });

postSchema.index({ author: 1, status: 1 });
postSchema.index({ subject: 1 });
postSchema.index({ createdAt: -1 });

export default mongoose.model("Post", postSchema);