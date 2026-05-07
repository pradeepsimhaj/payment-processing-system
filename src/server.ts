import app from './app';

import prisma from './config/prisma';

import redis from './config/redis';

import logger from './config/logger';

const PORT =
  process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info({
    message:
      `Server running on port ${PORT}`,
  });
});

/**
 * Graceful shutdown
 */
async function shutdown() {
  logger.info({
    message:
      'Gracefully shutting down...',
  });

  server.close(async () => {
    await prisma.$disconnect();

    await redis.quit();

    logger.info({
      message:
        'Shutdown complete',
    });

    process.exit(0);
  });
}

process.on('SIGINT', shutdown);

process.on('SIGTERM', shutdown);