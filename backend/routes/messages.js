import express from "express";
import DirectMessage from "../models/DirectMessage.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get("/conversations", protect, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
            .populate("participants", "name profile.avatar role")
            .sort({ updatedAt: -1 });

        res.json({ success: true, conversations });
    } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   GET /api/messages/conversation/:userId
// @desc    Get or create conversation with specific user
// @access  Private
router.get("/conversation/:userId", protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        // Check if users are connected
        const currentUser = await User.findById(currentUserId);
        const isConnected = currentUser.connections.includes(userId);

        if (!isConnected) {
            return res.status(403).json({
                success: false,
                error: "You must be connected to message this user"
            });
        }

        // Find existing conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, userId] }
        }).populate("participants", "name profile.avatar role");

        // Create new conversation if doesn't exist
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [currentUserId, userId]
            });
            conversation = await conversation.populate("participants", "name profile.avatar role");
        }

        res.json({ success: true, conversation });
    } catch (error) {
        console.error("Get conversation error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages for a conversation
// @access  Private
router.get("/:conversationId", protect, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;

        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, error: "Conversation not found" });
        }

        if (!conversation.isParticipant(req.user.id)) {
            return res.status(403).json({ success: false, error: "Access denied" });
        }

        const messages = await DirectMessage.find({ conversation: conversationId })
            .populate("sender", "name profile.avatar")
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(skip);

        // Reverse to show oldest first
        messages.reverse();

        res.json({ success: true, messages });
    } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   POST /api/messages
// @desc    Send a direct message
// @access  Private
router.post("/", protect, async (req, res) => {
    try {
        const { recipientId, content, conversationId } = req.body;
        const senderId = req.user.id;

        // Validate input
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, error: "Message content is required" });
        }

        // Check if users are connected
        const sender = await User.findById(senderId);
        const isConnected = sender.connections.includes(recipientId);

        if (!isConnected) {
            return res.status(403).json({
                success: false,
                error: "You must be connected to send messages"
            });
        }

        // Get or create conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else {
            conversation = await Conversation.findOne({
                participants: { $all: [senderId, recipientId] }
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [senderId, recipientId]
                });
            }
        }

        // Create message
        const message = await DirectMessage.create({
            conversation: conversation._id,
            sender: senderId,
            recipient: recipientId,
            content: content.trim(),
            timestamp: new Date()
        });

        // Update conversation's last message
        conversation.lastMessage = {
            content: content.trim(),
            timestamp: message.timestamp,
            sender: senderId
        };
        await conversation.save();

        // Populate sender info
        await message.populate("sender", "name profile.avatar");

        res.json({ success: true, message, conversationId: conversation._id });
    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put("/:messageId/read", protect, async (req, res) => {
    try {
        const message = await DirectMessage.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ success: false, error: "Message not found" });
        }

        // Only recipient can mark as read
        if (message.recipient.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: "Access denied" });
        }

        message.read = true;
        await message.save();

        res.json({ success: true, message });
    } catch (error) {
        console.error("Mark read error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

export default router;
