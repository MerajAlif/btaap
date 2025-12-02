import express from "express";
import Exam from "../models/Exam.js";
import Submission from "../models/Submission.js";
import Community from "../models/Community.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/exams
// @desc    Create a new exam
// @access  Private (Mentor only)
router.post("/", protect, authorize("mentor"), async (req, res) => {
    try {
        const { title, description, communityId, questionPdf, deadline, totalPoints } = req.body;

        // Verify community ownership
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        if (community.mentor.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to create exams in this community" });
        }

        const exam = await Exam.create({
            title,
            description,
            community: communityId,
            creator: req.user.id,
            questionPdf,
            deadline,
            totalPoints,
        });

        res.status(201).json(exam);
    } catch (error) {
        console.error("Create exam error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/exams/community/:communityId
// @desc    Get all exams for a community
// @access  Private
router.get("/community/:communityId", protect, async (req, res) => {
    try {
        const exams = await Exam.find({ community: req.params.communityId })
            .sort({ createdAt: -1 });
        res.json(exams);
    } catch (error) {
        console.error("Get exams error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/exams/:id
// @desc    Get exam details
// @access  Private
router.get("/:id", protect, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id).populate("creator", "name");
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        // Check if student has already submitted
        let submission = null;
        if (req.user.role === "student") {
            submission = await Submission.findOne({ exam: exam._id, student: req.user.id });
        }

        res.json({ ...exam.toObject(), submission });
    } catch (error) {
        console.error("Get exam error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/exams/:id/submit
// @desc    Submit an exam answer
// @access  Private (Student only)
router.post("/:id/submit", protect, authorize("student"), async (req, res) => {
    try {
        const { answerPdf } = req.body;
        const examId = req.params.id;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        // Check deadline
        if (exam.deadline && new Date() > new Date(exam.deadline)) {
            return res.status(400).json({ message: "Submission deadline has passed" });
        }

        // Check existing submission
        const existingSubmission = await Submission.findOne({
            exam: examId,
            student: req.user.id,
        });

        if (existingSubmission) {
            return res.status(400).json({ message: "You have already submitted for this exam" });
        }

        const submission = await Submission.create({
            exam: examId,
            student: req.user.id,
            answerPdf,
        });

        res.status(201).json(submission);
    } catch (error) {
        console.error("Submit exam error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/exams/:id/submissions
// @desc    Get all submissions for an exam
// @access  Private (Mentor only)
router.get("/:id/submissions", protect, authorize("mentor"), async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        if (exam.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const submissions = await Submission.find({ exam: req.params.id })
            .populate("student", "name email profile.avatar")
            .sort({ submittedAt: -1 });

        res.json(submissions);
    } catch (error) {
        console.error("Get submissions error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/exams/submissions/:id/grade
// @desc    Grade a submission
// @access  Private (Mentor only)
router.post("/submissions/:id/grade", protect, authorize("mentor"), async (req, res) => {
    try {
        const { obtainedPoints, feedback } = req.body;

        const submission = await Submission.findById(req.params.id).populate("exam");
        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        if (submission.exam.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (obtainedPoints > submission.exam.totalPoints) {
            return res.status(400).json({ message: "Points cannot exceed total points" });
        }

        submission.obtainedPoints = obtainedPoints;
        submission.feedback = feedback;
        submission.status = "graded";

        await submission.save();

        res.json(submission);
    } catch (error) {
        console.error("Grade submission error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
