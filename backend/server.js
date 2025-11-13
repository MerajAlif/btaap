// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import pdfRoutes from "./routes/pdfs.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";
import creditRoutes from "./routes/credits.js";
import postRoutes from "./routes/posts.js";
import commentRoutes from "./routes/comments.js";
import uploadRoutes from "./routes/upload.js";
import path from "path";
import fs from "fs";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const uploadRoot = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Range"],
    exposedHeaders: ["Content-Range", "Accept-Ranges"],
  })
);
app.use("/uploads", express.static(uploadRoot));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/upload", uploadRoutes);

// Root route for health check
app.get("/", (req, res) => {
  res.json({
    message: "PDF MERN Backend Running!",
    endpoints: {
      auth: "/api/auth",
      pdfs: "/api/pdfs",
      payments: "/api/payments",
    },
  });
});

// Log detection endpoint
app.post("/api/log-detection", express.json(), (req, res) => {
  console.log("Screenshot attempt logged:", req.body);
  res.status(200).send("Logged");
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB disconnected on exit");
  process.exit(0);
});

app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   - PDFs: http://localhost:${PORT}/api/pdfs`);
  console.log(`   - Payments: http://localhost:${PORT}/api/payments`);
  console.log(`   - Credits: http://localhost:${PORT}/api/credits`);
  console.log(`   - Posts: http://localhost:${PORT}/api/posts`);
  console.log(`   - Comments: http://localhost:${PORT}/api/comments`);
  console.log(`   - Upload: http://localhost:${PORT}/api/upload`);
});
