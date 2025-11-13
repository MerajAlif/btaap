import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Create uploads directory
const uploadDir = path.join(process.cwd(), "uploads", "posts");
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  }
});

// Upload multiple images (max 5)
router.post("/images", protect, upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: "No images uploaded" });
    }

    const imageUrls = req.files.map(file => ({
      url: `/uploads/posts/${file.filename}`,
      publicId: file.filename
    }));

    res.json({ success: true, images: imageUrls });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ success: false, error: "Upload failed" });
  }
});

export default router;