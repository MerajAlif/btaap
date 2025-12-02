import mongoose from "mongoose";

const communityMessageSchema = new mongoose.Schema({
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for efficient community message queries
communityMessageSchema.index({ community: 1, timestamp: -1 });

const CommunityMessage = mongoose.model("CommunityMessage", communityMessageSchema);

export default CommunityMessage;
