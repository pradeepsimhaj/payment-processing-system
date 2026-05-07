import { Worker, Job } from 'bullmq';

import redis from '../config/redis';

import logger from '../config/logger';

import { QUEUE_NAMES } from '../constants/queue';

import { PaymentProcessorService } from '../services/payment-processor.service';

const paymentProcessor =
  new PaymentProcessorService();

export const paymentWorker = new Worker(
  QUEUE_NAMES.PAYMENT_PROCESSING,

  async (job: Job) => {
    logger.info({
      message: 'Processing payment job',
      jobId: job.id,
    });

    await paymentProcessor.processPayment(
      job.data.paymentId,
    );
  },

  {
    connection: redis,
  },
);

paymentWorker.on('completed', (job) => {
  logger.info({
    message: 'Payment job completed',
    jobId: job.id,
  });
});

paymentWorker.on('failed', (job, err) => {
  logger.error({
    message: 'Payment job failed',
    jobId: job?.id,
    error: err.message,
  });
});