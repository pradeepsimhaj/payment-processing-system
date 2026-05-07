import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import prisma from './config/prisma';
import redis from './config/redis';

import paymentRoutes from './routes/payment.routes';

import { errorMiddleware } from './middleware/error.middleware';

import webhookRoutes from './routes/webhook.routes';

import correlationMiddleware
  from './middleware/correlation.middleware';

const app = express();

app.use(cors());

app.use(helmet());

app.use(express.json());

app.use(morgan('dev'));

app.use(correlationMiddleware);


app.get('/health', async (_req, res) => {
  try {
    /**
     * Database health
     */
    await prisma.$queryRaw`SELECT 1`;

    /**
     * Redis health
     */
    await redis.ping();

    return res.status(200).json({
      success: true,

      services: {
        database: 'healthy',

        redis: 'healthy',

        queue: 'running',
      },

      uptime: process.uptime(),

      timestamp:
        new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      services: {
        database: 'unhealthy',

        redis: 'unhealthy',

        queue: 'unhealthy',
      },

      error:
        error instanceof Error
          ? error.message
          : 'Unknown error',
    });
  }
});


app.use('/payments', paymentRoutes);

app.use('/webhooks', webhookRoutes);

app.use(errorMiddleware);

export default app;