import express from "express";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Create comment
router.post("/", protect, async (req, res) => {
  try {
    const { postId, text, images } = req.body;

    if (!postId || !text) {
      return res.status(400).json({
        success: false,
        error: "Post ID and text are required"
      });
    }

    if (images && images.length > 5) {
      return res.status(400).json({
        success: false,
        error: "Maximum 5 images allowed"
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const comment = await Comment.create({
      author: req.user.id,
      post: postId,
      text,
      images: images || []
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "statistics.totalComments": 1 }
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "name profile.avatar");

    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ success: false, error: "Failed to create comment" });
  }
});

// Delete comment
router.delete("/:id", protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ success: false, error: "Comment not found" });
    }

    // Check if user is comment author
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this comment"
      });
    }

    await comment.deleteOne();
    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ success: false, error: "Failed to delete comment" });
  }
});

export default router;