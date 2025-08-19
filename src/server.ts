import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();

    const server = app.listen(env.PORT, () => {
      console.log(`
🚀 Server is running on port ${env.PORT}
🌍 Environment: ${env.NODE_ENV}
📖 API Documentation: http://localhost:${env.PORT}/
🔍 Health Check: http://localhost:${env.PORT}/api/v1/health
      `);
    });

    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await disconnectDatabase();
          await disconnectRedis();
          console.log('Database and Redis connections closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.log('Forceful shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();