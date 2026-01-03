import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect, authorize } from "../middleware/auth.js";
import Resource from "../models/Resource.js";
import Community from "../models/Community.js";
import Membership from "../models/Membership.js";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "resources");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Accept images, pdfs, docs
        const allowedTypes = [
            "image/jpeg", "image/png", "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only images, PDFs, and documents are allowed."));
        }
    }
});

// Middleware to check if user is a member of the community
const checkMembership = async (req, res, next) => {
    try {
        const { communityId } = req.params;
        const community = await Community.findById(communityId);

        if (!community) {
            return res.status(404).json({ success: false, error: "Community not found" });
        }

        // Owner always has access
        const mentorId = community.mentor._id || community.mentor;
        if (mentorId.toString() === req.user._id.toString()) {
            return next();
        }

        // Check membership
        console.log("Checking membership for:", {
            student: req.user._id,
            community: communityId,
            status: "approved"
        });

        const membership = await Membership.findOne({
            student: req.user._id,
            community: communityId,
            status: "approved"
        });

        console.log("Membership found:", membership);

        if (!membership) {
            return res.status(403).json({ success: false, error: "Not a member of this community" });
        }

        next();
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error checking membership" });
    }
};

// @route   POST /api/resources/:communityId
// @desc    Upload a resource to a community
// @access  Private (Members only)
router.post("/:communityId", protect, checkMembership, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }

        const { title, description } = req.body;
        const { communityId } = req.params;

        const resource = await Resource.create({
            community: communityId,
            uploadedBy: req.user._id,
            title: title || req.file.originalname,
            description,
            fileUrl: `/uploads/resources/${req.file.filename}`,
            fileType: req.file.mimetype,
            fileSize: req.file.size
        });

        await resource.populate("uploadedBy", "name profile.avatar");

        res.status(201).json({ success: true, resource });
    } catch (error) {
        console.error("Resource upload error:", error);
        console.error("Request body:", req.body);
        console.error("Request file:", req.file);
        res.status(500).json({ success: false, error: "Upload failed: " + error.message });
    }
});

// @route   GET /api/resources/:communityId
// @desc    Get all resources for a community
// @access  Private (Members only)
router.get("/:communityId", protect, checkMembership, async (req, res) => {
    try {
        const { communityId } = req.params;
        const resources = await Resource.find({ community: communityId })
            .sort({ createdAt: -1 })
            .populate("uploadedBy", "name profile.avatar");

        res.json({ success: true, resources });
    } catch (error) {
        console.error("Fetch resources error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch resources" });
    }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a resource
// @access  Private (Owner or Uploader)
router.delete("/:id", protect, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ success: false, error: "Resource not found" });
        }

        const community = await Community.findById(resource.community);

        // Allow deletion if user is the uploader OR the community owner
        if (
            resource.uploadedBy.toString() !== req.user._id.toString() &&
            community.mentor.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ success: false, error: "Not authorized to delete this resource" });
        }

        // Delete file from filesystem
        const filePath = path.join(process.cwd(), resource.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await resource.deleteOne();

        res.json({ success: true, message: "Resource deleted" });
    } catch (error) {
        console.error("Delete resource error:", error);
        res.status(500).json({ success: false, error: "Failed to delete resource" });
    }
});

export default router;
