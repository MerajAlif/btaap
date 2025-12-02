import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
    {
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        answerPdf: { type: String, required: true }, // URL to the answer script PDF
        obtainedPoints: { type: Number },
        feedback: { type: String },
        status: {
            type: String,
            enum: ["submitted", "graded"],
            default: "submitted",
        },
        submittedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Prevent multiple submissions for the same exam by the same student
submissionSchema.index({ exam: 1, student: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
