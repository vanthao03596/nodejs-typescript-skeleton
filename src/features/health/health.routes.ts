import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
  }

  try {
    await redis.ping();
    health.services.redis = 'connected';
  } catch (error) {
    health.services.redis = 'disconnected';
  }

  const isHealthy = 
    health.services.database === 'connected' && 
    health.services.redis === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: health,
  });
});

export { router as healthRoutes };