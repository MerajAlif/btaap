import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
    {
        complainant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        community: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Community",
        },
        type: {
            type: String,
            enum: ["student_vs_mentor", "mentor_vs_student", "content_issue", "spam", "other"],
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            maxlength: 2000,
        },
        status: {
            type: String,
            enum: ["pending", "investigating", "resolved", "dismissed"],
            default: "pending",
        },
        adminNotes: {
            type: String,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
