import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
        required: true,
        index: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true // e.g., 'application/pdf', 'image/png'
    },
    fileSize: {
        type: Number, // in bytes
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;
