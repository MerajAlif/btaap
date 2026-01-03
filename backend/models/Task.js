// models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        community: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Community",
            required: true,
            index: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
        },
        type: {
            type: String,
            enum: ["assignment", "classwork", "test"],
            required: true,
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        instructionFiles: [
            {
                fileName: String,
                fileUrl: String,
                fileSize: Number,
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
        dueDate: {
            type: Date,
            required: true,
        },
        totalMarks: {
            type: Number,
            required: true,
            min: 0,
            default: 100,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
taskSchema.index({ community: 1, createdAt: -1 });
taskSchema.index({ community: 1, type: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;
