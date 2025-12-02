import express from "express";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const skip = parseInt(req.query.skip) || 0;

        const notifications = await Notification.find({ user: req.user.id })
            .populate("community", "name")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const unreadCount = await Notification.countDocuments({
            user: req.user.id,
            isRead: false
        });

        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get("/unread-count", protect, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user.id,
            isRead: false
        });

        res.json({ success: true, count });
    } catch (error) {
        console.error("Get unread count error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put("/:id/read", protect, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, error: "Notification not found" });
        }

        if (notification.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: "Access denied" });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ success: true, notification });
    } catch (error) {
        console.error("Mark read error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put("/read-all", protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all read error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete("/:id", protect, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, error: "Notification not found" });
        }

        if (notification.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: "Access denied" });
        }

        await notification.deleteOne();

        res.json({ success: true, message: "Notification deleted" });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

export default router;
