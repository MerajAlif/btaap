import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: 2000,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        category: {
            type: String,
            enum: ["general", "bug", "feature_request", "ui_ux"],
            default: "general",
        },
        isReviewed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
