import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/connections/request/:userId
// @desc    Send a connection request
// @access  Private
router.post("/request/:userId", protect, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const requesterId = req.user.id;

        if (targetUserId === requesterId) {
            return res.status(400).json({ message: "You cannot connect with yourself" });
        }

        const targetUser = await User.findById(targetUserId);
        const requester = await User.findById(requesterId);

        if (!targetUser || !requester) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already connected
        if (requester.connections.includes(targetUserId)) {
            return res.status(400).json({ message: "You are already connected" });
        }

        // Check if request already exists
        const existingRequest = targetUser.connectionRequests.find(
            (req) => req.from.toString() === requesterId && req.status === "pending"
        );

        if (existingRequest) {
            return res.status(400).json({ message: "Connection request already sent" });
        }

        // Add request to target user
        targetUser.connectionRequests.push({
            from: requesterId,
            status: "pending",
        });

        await targetUser.save();

        res.status(200).json({ message: "Connection request sent successfully" });
    } catch (error) {
        console.error("Send request error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/connections/accept/:userId
// @desc    Accept a connection request
// @access  Private
router.post("/accept/:userId", protect, async (req, res) => {
    try {
        const requesterId = req.params.userId;
        const userId = req.user.id;

        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!user || !requester) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the request
        const requestIndex = user.connectionRequests.findIndex(
            (req) => req.from.toString() === requesterId && req.status === "pending"
        );

        if (requestIndex === -1) {
            return res.status(404).json({ message: "Connection request not found" });
        }

        // Add to connections for both users
        user.connections.push(requesterId);
        requester.connections.push(userId);

        // Update request status (or remove it)
        user.connectionRequests[requestIndex].status = "accepted";
        // Optional: Remove the request after acceptance to keep array clean
        // user.connectionRequests.splice(requestIndex, 1);

        await user.save();
        await requester.save();

        res.status(200).json({ message: "Connection accepted" });
    } catch (error) {
        console.error("Accept request error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/connections/reject/:userId
// @desc    Reject a connection request
// @access  Private
router.post("/reject/:userId", protect, async (req, res) => {
    try {
        const requesterId = req.params.userId;
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the request
        const requestIndex = user.connectionRequests.findIndex(
            (req) => req.from.toString() === requesterId && req.status === "pending"
        );

        if (requestIndex === -1) {
            return res.status(404).json({ message: "Connection request not found" });
        }

        // Update status to rejected
        user.connectionRequests[requestIndex].status = "rejected";
        // Or just remove it
        user.connectionRequests.splice(requestIndex, 1);

        await user.save();

        res.status(200).json({ message: "Connection request rejected" });
    } catch (error) {
        console.error("Reject request error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   DELETE /api/connections/:userId
// @desc    Remove a connection
// @access  Private
router.delete("/:userId", protect, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const userId = req.user.id;

        const user = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if (!user || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove from both users' connections array
        user.connections = user.connections.filter(
            (id) => id.toString() !== targetUserId
        );
        targetUser.connections = targetUser.connections.filter(
            (id) => id.toString() !== userId
        );

        await user.save();
        await targetUser.save();

        res.status(200).json({ message: "Connection removed" });
    } catch (error) {
        console.error("Remove connection error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/connections/requests
// @desc    Get pending connection requests
// @access  Private
router.get("/requests", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate(
            "connectionRequests.from",
            "name profile.avatar role"
        );

        const pendingRequests = user.connectionRequests.filter(
            (req) => req.status === "pending"
        );

        res.status(200).json(pendingRequests);
    } catch (error) {
        console.error("Get requests error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/connections
// @desc    Get all connections
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate(
            "connections",
            "name profile.avatar role profile.expertise"
        );

        res.status(200).json(user.connections);
    } catch (error) {
        console.error("Get connections error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/connections/status/:userId
// @desc    Check connection status with another user
// @access  Private
router.get("/status/:userId", protect, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const requesterId = req.user.id;

        const targetUser = await User.findById(targetUserId);
        const requester = await User.findById(requesterId);

        if (!targetUser || !requester) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if connected
        if (requester.connections.includes(targetUserId)) {
            return res.json({ status: "connected" });
        }

        // Check if request sent by requester
        const sentRequest = targetUser.connectionRequests.find(
            (req) => req.from.toString() === requesterId && req.status === "pending"
        );
        if (sentRequest) {
            return res.json({ status: "pending_sent" });
        }

        // Check if request received by requester
        const receivedRequest = requester.connectionRequests.find(
            (req) => req.from.toString() === targetUserId && req.status === "pending"
        );
        if (receivedRequest) {
            return res.json({ status: "pending_received" });
        }

        res.json({ status: "none" });
    } catch (error) {
        console.error("Check status error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
