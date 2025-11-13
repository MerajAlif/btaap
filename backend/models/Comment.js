import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  text: {
    type: String,
    required: true
  },
  images: [{
    url: String,
    publicId: String
  }],
  isSolution: {
    type: Boolean,
    default: false
  },
  upvotes: { type: Number, default: 0 }
}, { timestamps: true });

commentSchema.index({ post: 1, createdAt: 1 });

export default mongoose.model("Comment", commentSchema);