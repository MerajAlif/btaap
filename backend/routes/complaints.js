import express from "express";
import Complaint from "../models/Complaint.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Create a complaint
router.post("/", protect, async (req, res) => {
    try {
        const {
            reportedUser,
            community,
            type,
            reason,
            description
        } = req.body;

        const complaint = await Complaint.create({
            complainant: req.user._id,
            reportedUser,
            community,
            type,
            reason,
            description,
            status: "pending"
        });

        res.status(201).json({ success: true, complaint, message: "Complaint submitted successfully" });
    } catch (error) {
        console.error("Create complaint error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Admin: Get all complaints
router.get("/", protect, authorize("admin"), async (req, res) => {
    try {
        const { status, type } = req.query;
        const query = {};
        if (status) query.status = status;
        if (type) query.type = type;

        const complaints = await Complaint.find(query)
            .populate("complainant", "name email")
            .populate("reportedUser", "name email")
            .populate("community", "name")
            .sort("-createdAt");

        res.json({ success: true, complaints });
    } catch (error) {
        console.error("Get complaints error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Admin: Resolve/Update complaint
router.put("/:id", protect, authorize("admin"), async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ success: false, error: "Complaint not found" });
        }

        if (status) complaint.status = status;
        if (adminNotes) complaint.adminNotes = adminNotes;

        complaint.resolvedBy = req.user._id;
        await complaint.save();

        res.json({ success: true, complaint });
    } catch (error) {
        console.error("Update complaint error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

export default router;
