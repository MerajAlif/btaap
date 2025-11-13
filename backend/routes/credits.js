import express from "express";
import { protect } from "../middleware/auth.js";
import { deductCredits } from "../services/credits.js";

const router = express.Router();

router.post("/use", protect, async (req, res) => {
  try {
    const cost = Number(req.body.cost || 0);
    const reason = req.body.reason || "Usage";
    if (cost <= 0) return res.status(400).json({ success: false, error: "Invalid cost" });

    const remaining = await deductCredits(req.user, cost, reason);
    res.json({ success: true, remainingCredits: remaining });
  } catch (err) {
    console.error("Use credits error:", err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message, code: err.code });
  }
});

export default router;
