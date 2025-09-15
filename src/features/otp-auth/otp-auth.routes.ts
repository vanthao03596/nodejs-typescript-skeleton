import { Router } from 'express';
import { OtpAuthController } from './otp-auth.controller';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import { createRateLimiter } from '../../middleware/rateLimiter.middleware';
import { otpRequestSchema, otpVerifySchema, otpStatusSchema } from './otp-auth.validation';

const router = Router();
const otpAuthController = new OtpAuthController();

// Create email-based rate limiter for OTP requests (3 per 15 minutes)
const otpRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3,
  keyGenerator: (req) => `otp:${req.body?.email || req.query?.email || req.ip}`,
  message: 'Too many OTP requests. Please try again later.',
});

// POST /api/v1/auth/otp/request - Request OTP
router.post(
  '/request',
  otpRateLimit,
  validateBody(otpRequestSchema),
  otpAuthController.requestOtp
);

// POST /api/v1/auth/otp/verify - Verify OTP
router.post(
  '/verify',
  validateBody(otpVerifySchema),
  otpAuthController.verifyOtp
);

// GET /api/v1/auth/otp/status - Get OTP status
router.get(
  '/status',
  validateQuery(otpStatusSchema),
  otpAuthController.getOtpStatus
);

export { router as otpAuthRoutes };