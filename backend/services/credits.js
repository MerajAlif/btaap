// services/credits.js
import User from "../models/User.js";

/* ------------------------------
   BASIC HELPERS (kept from old)
--------------------------------*/
export function hasActiveCredits(user) {
  const now = new Date();
  return Boolean(user.creditExpiry && new Date(user.creditExpiry) > now && user.credits > 0);
}

export function ensureActiveCredits(user, cost = 1) {
  const now = new Date();

  if (!user.creditExpiry || new Date(user.creditExpiry) <= now) {
    const err = new Error("Your credits have expired. Please purchase a plan.");
    err.statusCode = 402;
    err.code = "CREDIT_EXPIRED";
    throw err;
  }

  if ((user.credits || 0) < cost) {
    const err = new Error("Not enough credits. Please buy more to continue.");
    err.statusCode = 402;
    err.code = "INSUFFICIENT_CREDITS";
    throw err;
  }
}

// Extend credit expiry by X months (used after payments)
export function extendExpiryByMonths(current, months) {
  const now = new Date();
  const base = current && new Date(current) > now ? new Date(current) : now;
  base.setMonth(base.getMonth() + months);
  return base;
}

/* ------------------------------
   ADVANCED CREDIT OPERATIONS
   (Community Join / Refund / Tracking)
--------------------------------*/

// Deduct credits with community reference
export const deductCredits = async (
  user,
  amount,
  description = "Usage",
  relatedCommunity = null
) => {
  try {
    if (amount <= 0) {
      throw Object.assign(new Error("Invalid credit amount"), {
        statusCode: 400,
        code: "INVALID_AMOUNT",
      });
    }

    // Always fetch fresh user
    const currentUser = await User.findById(user._id || user.id);

    if (!currentUser) {
      throw Object.assign(new Error("User not found"), {
        statusCode: 404,
        code: "USER_NOT_FOUND",
      });
    }

    // Check expiry
    const now = new Date();
    if (currentUser.creditExpiry && now > new Date(currentUser.creditExpiry)) {
      currentUser.credits = 0;
      currentUser.creditExpiry = null;
      await currentUser.save();
      throw Object.assign(new Error("Credits have expired"), {
        statusCode: 403,
        code: "CREDITS_EXPIRED",
      });
    }

    // Check sufficient balance
    if (currentUser.credits < amount) {
      throw Object.assign(
        new Error(
          `Insufficient credits. You have ${currentUser.credits} credits but need ${amount}`
        ),
        { statusCode: 403, code: "INSUFFICIENT_CREDITS" }
      );
    }

    // Deduct
    currentUser.credits -= amount;

    // Log in credit history with community reference
    currentUser.creditHistory.push({
      amount: -amount,
      type: relatedCommunity ? "community_join" : "usage",
      description,
      relatedCommunity,
      createdAt: new Date(),
    });

    await currentUser.save();
    return currentUser.credits;
  } catch (error) {
    console.error("Deduct credits error:", error);
    throw error;
  }
};

// Add credits (purchase or refund)
export const addCredits = async (
  userId,
  amount,
  description = "Purchase",
  type = "purchase"
) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw Object.assign(new Error("User not found"), {
        statusCode: 404,
        code: "USER_NOT_FOUND",
      });
    }

    user.credits += amount;

    user.creditHistory.push({
      amount,
      type,
      description,
      createdAt: new Date(),
    });

    // Extend expiry by 12 months
    user.creditExpiry = extendExpiryByMonths(user.creditExpiry, 12);

    await user.save();
    return user.credits;
  } catch (error) {
    console.error("Add credits error:", error);
    throw error;
  }
};

// Refund credits (used when community rejects member)
export const refundCredits = async (
  userId,
  amount,
  description = "Refund"
) => {
  return await addCredits(userId, amount, description, "refund");
};
