import express from "express";
import Feedback from "../models/Feedback.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Create feedback
router.post("/", protect, async (req, res) => {
    try {
        const { content, rating, category } = req.body;

        const feedback = await Feedback.create({
            user: req.user._id,
            content,
            rating,
            category
        });

        res.status(201).json({ success: true, feedback, message: "Feedback submitted successfully" });
    } catch (error) {
        console.error("Create feedback error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Admin: Get all feedback
router.get("/", protect, authorize("admin"), async (req, res) => {
    try {
        const feedback = await Feedback.find({})
            .populate("user", "name email")
            .sort("-createdAt");

        res.json({ success: true, feedback });
    } catch (error) {
        console.error("Get feedback error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

export default router;
