// routes/posts.js
import express from "express";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get all posts (with filters)
router.get("/", async (req, res) => {
  try {
    const { status, subject, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const posts = await Post.find(query)
      .populate("author", "name profile.avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Add lean() for better performance

    // Add commentCount to each post
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        return { ...post, commentCount };
      })
    );

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts: postsWithComments,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch posts" });
  }
});

// Get single post with comments
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate("author", "name profile.avatar profile.expertise");

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const comments = await Comment.find({ post: post._id })
      .populate("author", "name profile.avatar")
      .sort({ isSolution: -1, createdAt: 1 });

    res.json({ success: true, post, comments });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch post" });
  }
});

// Create new post
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, images, subject, tags } = req.body;

    if (!title || !description || !subject) {
      return res.status(400).json({
        success: false,
        error: "Title, description, and subject are required",
      });
    }

    if (images && images.length > 5) {
      return res.status(400).json({
        success: false,
        error: "Maximum 5 images allowed",
      });
    }

    console.log("Creating post with author:", req.user.id); // Debug
    console.log("req.user:", req.user); // Debug

    const post = await Post.create({
      author: req.user.id,
      title,
      description,
      images: images || [],
      subject,
      tags: tags || [],
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "statistics.totalPosts": 1 },
    });

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "name profile.avatar"
    );

    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ success: false, error: "Failed to create post" });
  }
});

// Mark post as solved
router.patch("/:id/mark-solved", protect, async (req, res) => {
  try {
    const { commentId } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Check if user is post author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Only post author can mark as solved",
      });
    }

    if (post.status !== "open") {
      return res.status(400).json({
        success: false,
        error: "Post is not open",
      });
    }

    // Verify comment exists
    const comment = await Comment.findById(commentId);
    if (!comment || comment.post.toString() !== post._id.toString()) {
      return res.status(400).json({
        success: false,
        error: "Invalid comment",
      });
    }

    // Update post
    post.status = "solved";
    post.solutionComment = commentId;
    post.markedAsSolvedAt = Date.now();
    await post.save();

    // Update comment
    comment.isSolution = true;
    await comment.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "statistics.solvedPosts": 1 },
    });

    res.json({ success: true, post });
  } catch (error) {
    console.error("Mark solved error:", error);
    res.status(500).json({ success: false, error: "Failed to mark as solved" });
  }
});

// Get user's post history
router.get("/user/:userId", async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    console.log("Fetching posts for userId:", req.params.userId); // Debug log

    const query = { author: req.params.userId };
    if (status && status !== "all") query.status = status;

    const posts = await Post.find(query)
      .populate("author", "name profile.avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    console.log("Found posts:", posts.length); // Debug log

    // Add commentCount
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        return { ...post, commentCount };
      })
    );

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts: postsWithComments,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch posts" });
  }
});

// Delete post (author only)
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Check if user is post author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this post",
      });
    }

    // Delete all comments for this post
    await Comment.deleteMany({ post: post._id });

    // Delete post
    await post.deleteOne();

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "statistics.totalPosts": -1 },
    });

    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ success: false, error: "Failed to delete post" });
  }
});

export default router;
