/**
 * Simple in-memory rate limiter for serverless environments.
 * Uses a sliding window approach. Note: this is per-instance, so on serverless
 * platforms with multiple instances, the actual rate may be higher than the limit.
 * For a single-mentor app with low traffic, this provides good protection against
 * brute-force attacks while being simple and dependency-free.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return; // Clean up at most once per minute
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

type RateLimitConfig = {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowSeconds * 1000 };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/** Rate limit configs for different endpoints */
export const RATE_LIMITS = {
  /** Coupon redemption — strictest to prevent brute-force */
  redeem: { limit: 5, windowSeconds: 60 },
  /** Booking — moderate */
  book: { limit: 10, windowSeconds: 60 },
  /** Subscription creation */
  subscribe: { limit: 5, windowSeconds: 60 },
  /** General API — loose */
  api: { limit: 30, windowSeconds: 60 },
} as const;
