// ═══════════════════════════════════════════════════════════
// Rate Limit Middleware (system hardening — Phase 11/12)
// ═══════════════════════════════════════════════════════════
import rateLimit from 'express-rate-limit';

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                // 1000 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});

export const authRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,                  // 20 login attempts per window
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
});

export const apiKeyRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5000,                // 5000 requests per hour for API gateway
  standardHeaders: true,
  legacyHeaders: false,
});
