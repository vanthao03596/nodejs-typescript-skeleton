import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { healthRoutes } from '../src/features/health/health.routes';
import { authRoutes } from '../src/features/auth/auth.routes';
import { otpAuthRoutes } from '../src/features/otp-auth/otp-auth.routes';
import { errorHandler, notFound } from '../src/middleware/error.middleware';
import { env } from '../src/config/env';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/otp', otpAuthRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Node.js API Server',
    version: '1.0.0',
    environment: env.NODE_ENV,
  });
});

app.use(notFound);
app.use(errorHandler);

export { app };