// services/credits.js
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

export async function deductCredits(user, cost, description = "Usage") {
  ensureActiveCredits(user, cost);
  user.credits -= cost;
  user.creditHistory.push({
    amount: -cost,
    type: "usage",
    description,
    createdAt: new Date(),
  });
  await user.save();
  return user.credits;
}

// helper for payments approval (extend by months; fallback to “now” if expired)
export function extendExpiryByMonths(current, months) {
  const now = new Date();
  const base = current && new Date(current) > now ? new Date(current) : now;
  base.setMonth(base.getMonth() + months);
  return base;
}
