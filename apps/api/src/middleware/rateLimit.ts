import rateLimit from "express-rate-limit";

/**
 * Rate Limiting Middleware
 *
 * Prevents API abuse with tiered rate limits.
 */

// General API rate limit: 100 requests per minute
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints: 10 requests per minute (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many auth attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Write endpoints: 30 requests per minute
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: "Rate limit exceeded for write operations" },
  standardHeaders: true,
  legacyHeaders: false,
});
