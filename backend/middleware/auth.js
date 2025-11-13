// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes - require valid JWT
export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded token:", decoded); // Debug

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // Add .id property for consistency with frontend usage
    req.user.id = req.user._id.toString();
    console.log("req.user set to:", req.user.id); // Debug

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account is deactivated",
      });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      error: "Not authorized, token failed",
    });
  }
};

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// ✅ NEW: Check if mentor is approved
export const requireMentorApproval = (req, res, next) => {
  if (req.user.role === "mentor" && req.user.approvalStatus !== "approved") {
    return res.status(403).json({
      success: false,
      error: "Your mentor account is pending approval",
      approvalStatus: req.user.approvalStatus,
      message:
        req.user.approvalStatus === "rejected"
          ? "Your application was rejected. Please contact support."
          : "Your application is under review. You will be notified once approved.",
    });
  }
  next();
};

// Optional auth - sets req.user if token exists, but doesn't block request
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (req.user) {
        req.user.id = req.user._id.toString();
      }
    } catch (error) {
      console.log("Optional auth: Invalid token, continuing without user");
    }
  }

  next();
};
