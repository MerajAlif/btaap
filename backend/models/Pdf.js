// models/Pdf.js
import mongoose from "mongoose";

const PdfSchema = new mongoose.Schema(
  {
    filename: String,
    title: String,
    path: String,
    coverImage: String,
    description: String,
    rating: { type: Number, min: 0, max: 5, default: 0 },
    tags: [String],
    size: Number,
    downloads: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

PdfSchema.index({ title: "text", filename: "text", tags: "text" });

export default mongoose.model("Pdf", PdfSchema);
