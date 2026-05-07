import { Queue } from 'bullmq';

import redis from '../config/redis';

import { QUEUE_NAMES } from '../constants/queue';

export const paymentQueue = new Queue(
  QUEUE_NAMES.PAYMENT_PROCESSING,
  {
    connection: redis,
  },
);