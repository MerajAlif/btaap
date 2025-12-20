import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// Route imports
import authRoutes from "./routes/auth.js";
import pdfRoutes from "./routes/pdfs.js";
import paymentRoutes from "./routes/payments.js";
import creditRoutes from "./routes/credits.js";
import postRoutes from "./routes/posts.js";
import commentRoutes from "./routes/comments.js";
import uploadRoutes from "./routes/upload.js";
import communityRoutes from "./routes/communities.js";
import profileRoutes from "./routes/profiles.js";
import resourceRoutes from "./routes/resources.js";
import connectionRoutes from "./routes/connections.js";
import examRoutes from "./routes/exams.js";
import messageRoutes from "./routes/messages.js";
import communityMessageRoutes from "./routes/communityMessages.js";
import announcementRoutes from "./routes/announcements.js";
import scheduleRoutes from "./routes/schedules.js";
import notificationRoutes from "./routes/notifications.js";
import taskRoutes from "./routes/tasks.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import complaintRoutes from "./routes/complaints.js";
import feedbackRoutes from "./routes/feedbacks.js";

// Model imports for Socket.IO
import DirectMessage from "./models/DirectMessage.js";
import Conversation from "./models/Conversation.js";
import CommunityMessage from "./models/CommunityMessage.js";
import User from "./models/User.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://btaap-psi.vercel.app",
  process.env.FRONTEND_URL // Allow custom frontend URL from env
].filter(Boolean); // Remove undefined values

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;
const uploadRoot = path.join(__dirname, "uploads");

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Range"],
    exposedHeaders: ["Content-Range", "Accept-Ranges"],
  })
);
app.use("/uploads", express.static(uploadRoot));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Socket.io Logic
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // User online/offline tracking
  socket.on("user_online", (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} is online`);
  });

  socket.on("user_offline", (userId) => {
    socket.leave(`user_${userId}`);
    console.log(`User ${userId} is offline`);
  });

  // Community chat
  socket.on("join_community", (communityId) => {
    socket.join(communityId);
    console.log(`User ${socket.id} joined community: ${communityId}`);
  });

  socket.on("leave_community", (communityId) => {
    socket.leave(communityId);
    console.log(`User ${socket.id} left community: ${communityId}`);
  });

  socket.on("send_message", async (data) => {
    // data: { communityId, sender: { name, avatar, id }, content, timestamp }
    try {
      // Save to database
      const message = await CommunityMessage.create({
        community: data.communityId,
        sender: data.sender.id,
        content: data.content,
        timestamp: data.timestamp
      });
      console.log("Community message saved:", message._id);
    } catch (error) {
      console.error("Error saving community message:", error);
    }

    // Emit to all community members
    io.to(data.communityId).emit("receive_message", data);
  });

  // Direct messaging
  socket.on("send_direct_message", async (data) => {
    // data: { to, from, sender: { name, avatar, id }, content, timestamp, conversationId }
    try {
      // Verify users are connected
      const sender = await User.findById(data.from);
      const isConnected = sender.connections.includes(data.to);

      if (!isConnected) {
        socket.emit("message_error", { error: "Users are not connected" });
        return;
      }

      // Get or create conversation
      let conversation;
      if (data.conversationId) {
        conversation = await Conversation.findById(data.conversationId);
      } else {
        conversation = await Conversation.findOne({
          participants: { $all: [data.from, data.to] }
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [data.from, data.to]
          });
        }
      }

      // Save message to database
      const message = await DirectMessage.create({
        conversation: conversation._id,
        sender: data.from,
        recipient: data.to,
        content: data.content,
        timestamp: data.timestamp
      });

      // Update conversation's last message
      conversation.lastMessage = {
        content: data.content,
        timestamp: data.timestamp,
        sender: data.from
      };
      await conversation.save();

      console.log(`Direct message saved: ${message._id}`);

      // Emit to recipient
      io.to(`user_${data.to}`).emit("receive_direct_message", {
        ...data,
        conversationId: conversation._id,
        messageId: message._id
      });
    } catch (error) {
      console.error("Error saving direct message:", error);
      socket.emit("message_error", { error: "Failed to send message" });
    }
  });

  // Connection removed event
  socket.on("connection_removed", (data) => {
    // data: { userId, removedUserId }
    io.to(`user_${data.removedUserId}`).emit("connection_removed", {
      userId: data.userId
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/community-messages", communityMessageRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/feedbacks", feedbackRoutes);

// Root route for health check
app.get("/", (req, res) => {
  res.json({
    message: "PDF MERN Backend with Communities Running!",
    endpoints: {
      auth: "/api/auth",
      pdfs: "/api/pdfs",
      payments: "/api/payments",
      credits: "/api/credits",
      posts: "/api/posts",
      comments: "/api/comments",
      communities: "/api/communities",
      profiles: "/api/profiles",
      resources: "/api/resources",
      messages: "/api/messages",
      communityMessages: "/api/community-messages",
      announcements: "/api/announcements",
      schedules: "/api/schedules",
      notifications: "/api/notifications",
      tasks: "/api/tasks",
      tasks: "/api/tasks",
      leaderboard: "/api/leaderboard",
      complaints: "/api/complaints",
      feedbacks: "/api/feedbacks"
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

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   - PDFs: http://localhost:${PORT}/api/pdfs`);
  console.log(`   - Payments: http://localhost:${PORT}/api/payments`);
  console.log(`   - Credits: http://localhost:${PORT}/api/credits`);
  console.log(`   - Posts: http://localhost:${PORT}/api/posts`);
  console.log(`   - Comments: http://localhost:${PORT}/api/comments`);
  console.log(`   - Communities: http://localhost:${PORT}/api/communities`);
  console.log(`   - Profiles: http://localhost:${PORT}/api/profiles`);
  console.log(`   - Resources: http://localhost:${PORT}/api/resources`);
  console.log(`   - Messages: http://localhost:${PORT}/api/messages`);
  console.log(`   - Community Messages: http://localhost:${PORT}/api/community-messages`);
  console.log(`   - Announcements: http://localhost:${PORT}/api/announcements`);
  console.log(`   - Schedules: http://localhost:${PORT}/api/schedules`);
  console.log(`   - Notifications: http://localhost:${PORT}/api/notifications`);
  console.log(`   - Tasks: http://localhost:${PORT}/api/tasks`);
  console.log(`   - Leaderboard: http://localhost:${PORT}/api/leaderboard`);
});