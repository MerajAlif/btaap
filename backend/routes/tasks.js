// routes/tasks.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Task from "../models/Task.js";
import TaskSubmission from "../models/TaskSubmission.js";
import Community from "../models/Community.js";
import Membership from "../models/Membership.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "uploads/tasks";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png/;
        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Only documents and images are allowed"));
        }
    },
});

// Middleware to check if user is mentor of the community
const checkMentorAccess = async (req, res, next) => {
    try {
        const { communityId } = req.params;
        const community = await Community.findById(communityId);

        if (!community) {
            return res.status(404).json({ success: false, error: "Community not found" });
        }

        const mentorId = community.mentor._id || community.mentor;
        if (mentorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: "Only mentor can perform this action" });
        }

        req.community = community;
        next();
    } catch (error) {
        console.error("Check mentor access error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
};

// Middleware to check if user is a member of the community
const checkMemberAccess = async (req, res, next) => {
    try {
        const { communityId } = req.params;
        const community = await Community.findById(communityId);

        if (!community) {
            return res.status(404).json({ success: false, error: "Community not found" });
        }

        // Check if mentor
        const mentorId = community.mentor._id || community.mentor;
        if (mentorId.toString() === req.user._id.toString()) {
            req.community = community;
            req.isMentor = true;
            return next();
        }

        // Check if approved member
        const membership = await Membership.findOne({
            community: communityId,
            student: req.user._id,
            status: "approved",
        });

        if (!membership) {
            return res.status(403).json({ success: false, error: "You are not a member of this community" });
        }

        req.community = community;
        req.isMentor = false;
        next();
    } catch (error) {
        console.error("Check member access error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
};

// @route   POST /api/tasks/:communityId
// @desc    Create a new task (mentor only)
// @access  Private (Mentor)
router.post(
    "/:communityId",
    protect,
    upload.array("instructionFiles", 5),
    checkMentorAccess,
    async (req, res) => {
        try {
            const { title, description, type, tags, dueDate, totalMarks } = req.body;

            if (!title || !description || !type || !dueDate) {
                return res.status(400).json({
                    success: false,
                    error: "Title, description, type, and due date are required",
                });
            }

            const instructionFiles = req.files?.map((file) => ({
                fileName: file.originalname,
                fileUrl: `/uploads/tasks/${file.filename}`,
                fileSize: file.size,
            })) || [];

            const task = await Task.create({
                community: req.params.communityId,
                createdBy: req.user._id,
                title,
                description,
                type,
                tags: tags ? JSON.parse(tags) : [],
                instructionFiles,
                dueDate: new Date(dueDate),
                totalMarks: totalMarks || 100,
            });

            const populatedTask = await Task.findById(task._id).populate(
                "createdBy",
                "name profile.avatar"
            );

            res.status(201).json({ success: true, task: populatedTask });
        } catch (error) {
            console.error("Create task error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

// @route   GET /api/tasks/:communityId
// @desc    Get all tasks for a community
// @access  Private (Members)
router.get("/:communityId", protect, checkMemberAccess, async (req, res) => {
    try {
        const { type } = req.query;
        const query = { community: req.params.communityId, isActive: true };

        if (type) {
            query.type = type;
        }

        const tasks = await Task.find(query)
            .populate("createdBy", "name profile.avatar")
            .sort({ createdAt: -1 });

        // If student, include their submission status
        if (!req.isMentor) {
            const tasksWithStatus = await Promise.all(
                tasks.map(async (task) => {
                    const submission = await TaskSubmission.findOne({
                        task: task._id,
                        student: req.user._id,
                    });

                    return {
                        ...task.toObject(),
                        submissionStatus: submission ? submission.status : "not_submitted",
                        marksObtained: submission?.marksObtained || null,
                    };
                })
            );

            return res.json({ success: true, tasks: tasksWithStatus });
        }

        res.json({ success: true, tasks });
    } catch (error) {
        console.error("Get tasks error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   GET /api/tasks/:communityId/:taskId
// @desc    Get single task details
// @access  Private (Members)
router.get("/:communityId/:taskId", protect, checkMemberAccess, async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId).populate(
            "createdBy",
            "name profile.avatar"
        );

        if (!task) {
            return res.status(404).json({ success: false, error: "Task not found" });
        }

        if (task.community.toString() !== req.params.communityId) {
            return res.status(403).json({ success: false, error: "Access denied" });
        }

        // If student, include their submission
        if (!req.isMentor) {
            const submission = await TaskSubmission.findOne({
                task: task._id,
                student: req.user._id,
            });

            return res.json({
                success: true,
                task: {
                    ...task.toObject(),
                    mySubmission: submission || null,
                },
            });
        }

        res.json({ success: true, task });
    } catch (error) {
        console.error("Get task error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   POST /api/tasks/:communityId/:taskId/submit
// @desc    Submit a task (student only)
// @access  Private (Student)
router.post(
    "/:communityId/:taskId/submit",
    protect,
    upload.array("submittedFiles", 5),
    checkMemberAccess,
    async (req, res) => {
        try {
            if (req.isMentor) {
                return res.status(403).json({ success: false, error: "Mentors cannot submit tasks" });
            }

            const task = await Task.findById(req.params.taskId);

            if (!task) {
                return res.status(404).json({ success: false, error: "Task not found" });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, error: "Please upload at least one file" });
            }

            const submittedFiles = req.files.map((file) => ({
                fileName: file.originalname,
                fileUrl: `/uploads/tasks/${file.filename}`,
                fileSize: file.size,
            }));

            // Check if already submitted
            const existingSubmission = await TaskSubmission.findOne({
                task: req.params.taskId,
                student: req.user._id,
            });

            if (existingSubmission) {
                // Update existing submission
                existingSubmission.submittedFiles = submittedFiles;
                existingSubmission.submittedAt = new Date();
                existingSubmission.status = "pending";
                await existingSubmission.save();

                return res.json({ success: true, submission: existingSubmission });
            }

            // Create new submission
            const submission = await TaskSubmission.create({
                task: req.params.taskId,
                student: req.user._id,
                submittedFiles,
            });

            res.status(201).json({ success: true, submission });
        } catch (error) {
            console.error("Submit task error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

// @route   GET /api/tasks/:communityId/:taskId/submissions
// @desc    Get all submissions for a task (mentor only)
// @access  Private (Mentor)
router.get(
    "/:communityId/:taskId/submissions",
    protect,
    checkMentorAccess,
    async (req, res) => {
        try {
            const submissions = await TaskSubmission.find({ task: req.params.taskId })
                .populate("student", "name email profile.avatar")
                .sort({ submittedAt: -1 });

            res.json({ success: true, submissions });
        } catch (error) {
            console.error("Get submissions error:", error);
            res.status(500).json({ success: false, error: "Server error" });
        }
    }
);

// @route   PUT /api/tasks/:communityId/:taskId/submissions/:submissionId/grade
// @desc    Grade a submission (mentor only)
// @access  Private (Mentor)
router.put(
    "/:communityId/:taskId/submissions/:submissionId/grade",
    protect,
    checkMentorAccess,
    async (req, res) => {
        try {
            const { marksObtained, feedback } = req.body;

            if (marksObtained === undefined) {
                return res.status(400).json({ success: false, error: "Marks are required" });
            }

            const submission = await TaskSubmission.findById(req.params.submissionId);

            if (!submission) {
                return res.status(404).json({ success: false, error: "Submission not found" });
            }

            const task = await Task.findById(submission.task);

            if (marksObtained < 0 || marksObtained > task.totalMarks) {
                return res.status(400).json({
                    success: false,
                    error: `Marks must be between 0 and ${task.totalMarks}`,
                });
            }

            submission.marksObtained = marksObtained;
            submission.feedback = feedback || "";
            submission.status = "graded";
            submission.gradedAt = new Date();
            submission.gradedBy = req.user._id;

            await submission.save();

            const populatedSubmission = await TaskSubmission.findById(submission._id)
                .populate("student", "name email profile.avatar")
                .populate("gradedBy", "name");

            res.json({ success: true, submission: populatedSubmission });
        } catch (error) {
            console.error("Grade submission error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

export default router;
