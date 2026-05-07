import prisma from '../../config/prisma';

import redis from '../../config/redis';

import {
  paymentQueue,
} from '../../queues/payment.queue';

import {
  paymentWorker,
} from '../../workers/payment.worker';

afterAll(async () => {
  /**
   * Stop BullMQ worker
   */
  await paymentWorker.close();

  /**
   * Stop queue
   */
  await paymentQueue.close();

  /**
   * Disconnect Prisma
   */
  await prisma.$disconnect();

  /**
   * Disconnect Redis
   */
  await redis.quit();
});