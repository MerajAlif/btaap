import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    lastMessage: {
        content: String,
        timestamp: Date,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }
}, {
    timestamps: true
});

// Ensure exactly 2 participants
conversationSchema.pre("save", function (next) {
    if (this.participants.length !== 2) {
        next(new Error("Conversation must have exactly 2 participants"));
    } else {
        next();
    }
});

// Index for finding conversations by participants
conversationSchema.index({ participants: 1 });

// Method to check if user is participant
conversationSchema.methods.isParticipant = function (userId) {
    return this.participants.some(p => p.toString() === userId.toString());
};

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
