// routes/payments.js
import express from "express";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { extendExpiryByMonths } from "../services/credits.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Submit payment (any logged-in user)
router.post("/submit", protect, async (req, res) => {
  try {
    const {
      mobileNumber,
      transactionId,
      amount,
      planName,
      credits,
      reference,
    } = req.body;

    // Validation
    if (
      !mobileNumber ||
      !transactionId ||
      !amount ||
      !planName ||
      !credits ||
      !reference
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if transaction ID already exists
    const existingPayment = await Payment.findOne({ transactionId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID already submitted",
      });
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.user.id,
      mobileNumber,
      transactionId,
      amount,
      planName,
      credits,
      reference,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Payment submitted successfully. Awaiting admin approval.",
      data: payment,
    });
  } catch (error) {
    console.error("Payment submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit payment",
    });
  }
});

// Get all payments (admin only)
router.get("/all", protect, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const payments = await Payment.find(query)
      .populate("userId", "name email")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
});

// Get pending payments (admin only)
router.get("/pending", protect, authorize("admin"), async (req, res) => {
  try {
    const payments = await Payment.find({ status: "pending" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Get pending payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending payments",
    });
  }
});

// Get user's payment history
router.get("/my-payments", protect, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Get user payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
    });
  }
});

// Update payment status (admin only)
router.patch("/:id/status", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be approved or rejected",
      });
    }

    const payment = await Payment.findById(req.params.id).populate("userId");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Payment has already been processed",
      });
    }

    payment.status = status;
    payment.approvedBy = req.user.id;
    payment.approvedAt = Date.now();

    if (status === "rejected") {
      payment.rejectionReason = rejectionReason || "Payment rejected by admin";
    } else if (status === "approved") {
      // Add credits to user account and set/extend expiry by 1 month
      const user = await User.findById(payment.userId);
      if (user) {
        // 1) add credits
        user.credits += payment.credits;

        // 2) compute new expiry
        const now = new Date();
        // base is existing expiry if still in future; otherwise now
        const base =
          user.creditExpiry && new Date(user.creditExpiry) > now
            ? new Date(user.creditExpiry)
            : now;

        // extend by 1 month
        base.setMonth(base.getMonth() + 1);
        user.creditExpiry = base;

        // 3) (optional but recommended) log credit history
        user.creditHistory.push({
          amount: payment.credits,
          type: "purchase",
          description: `${payment.planName} plan approved (TxID: ${payment.transactionId})`,
          createdAt: new Date(),
        });

        await user.save();
      }
    }

    await payment.save();

    res.status(200).json({
      success: true,
      message: `Payment ${status} successfully`,
      data: payment,
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
});

export default router;
