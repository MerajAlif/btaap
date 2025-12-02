// models/TaskSubmission.js
import mongoose from "mongoose";

const taskSubmissionSchema = new mongoose.Schema(
    {
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
            index: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        submittedFiles: [
            {
                fileName: String,
                fileUrl: String,
                fileSize: Number,
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        marksObtained: {
            type: Number,
            min: 0,
            default: null,
        },
        feedback: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "graded"],
            default: "pending",
        },
        gradedAt: {
            type: Date,
        },
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure one submission per student per task
taskSubmissionSchema.index({ task: 1, student: 1 }, { unique: true });

// Index for leaderboard queries
taskSubmissionSchema.index({ student: 1, status: 1 });

const TaskSubmission = mongoose.model("TaskSubmission", taskSubmissionSchema);

export default TaskSubmission;
