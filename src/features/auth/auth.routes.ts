import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { authenticateToken } from '../../middleware/auth.middleware';
import { authRateLimit } from '../../middleware/rateLimiter.middleware';
import { registerSchema, loginSchema } from './auth.validation';

const router = Router();
const authController = new AuthController();

router.post(
  '/register',
  authRateLimit,
  validateRequest(registerSchema),
  authController.register
);

router.post(
  '/login',
  authRateLimit,
  validateRequest(loginSchema),
  authController.login
);

router.get(
  '/profile',
  authenticateToken,
  authController.getProfile
);

export { router as authRoutes };