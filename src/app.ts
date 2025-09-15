import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { authRoutes } from './features/auth/auth.routes';
import { otpAuthRoutes } from './features/otp-auth/otp-auth.routes';
import { healthRoutes } from './features/health/health.routes';
import { globalRateLimit } from './middleware/rateLimiter.middleware';
import { errorHandler, notFound } from './middleware/error.middleware';
import { env } from './config/env';
import { successResponse } from './utils/response.utils';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGINS || (env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001']),
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(globalRateLimit);

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/otp', otpAuthRoutes);

app.get('/', (_req, res) => {
  successResponse(res, {
    version: '1.0.0',
    environment: env.NODE_ENV,
  }, 'Node.js API Server');
});

app.use(notFound);
app.use(errorHandler);

export { app };