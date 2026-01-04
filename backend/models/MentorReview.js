import mongoose from "mongoose";

const mentorReviewSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxlength: 1000
    },
    isPublic: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Prevent multiple reviews from same student to same mentor
mentorReviewSchema.index({ student: 1, mentor: 1 }, { unique: true });

const MentorReview = mongoose.model("MentorReview", mentorReviewSchema);

export default MentorReview;
