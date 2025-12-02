import mongoose from "mongoose";

const classScheduleSchema = new mongoose.Schema({
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
        required: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    classNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    scheduledDate: {
        type: Date,
        required: true,
        index: true
    },
    duration: {
        type: Number,  // Duration in minutes
        default: 60
    },
    meetingLink: {
        type: String,
        trim: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
classScheduleSchema.index({ community: 1, scheduledDate: 1 });
classScheduleSchema.index({ community: 1, classNumber: 1 });

const ClassSchedule = mongoose.model("ClassSchedule", classScheduleSchema);

export default ClassSchedule;
