import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String }], // Optional for MCQs
    correctAnswer: { type: String }, // Optional
    points: { type: Number, default: 1 },
});

const examSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        community: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Community",
            required: true,
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        questionPdf: { type: String, required: true }, // URL to the PDF containing questions
        deadline: { type: Date },
        durationMinutes: { type: Number },
        totalPoints: { type: Number, default: 100 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Exam = mongoose.model("Exam", examSchema);
export default Exam;
