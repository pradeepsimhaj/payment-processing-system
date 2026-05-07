import { v4 as uuidv4 } from 'uuid';

import logger from '../config/logger';

import { PaymentRepository }
  from '../repositories/payment.repository';

import {
  CreatePaymentDTO,
} from '../types/payment.types';

import {
  paymentQueue,
} from '../queues/payment.queue';

import {
  JOB_NAMES,
} from '../constants/queue';

export class PaymentService {
  private paymentRepository:
    PaymentRepository;

  constructor() {
    this.paymentRepository =
      new PaymentRepository();
  }

  async createPayment(
    payload: CreatePaymentDTO,
    idempotencyKey?: string,
  ) {
    const finalKey =
      idempotencyKey || uuidv4();

    logger.info({
      message: 'Creating payment',

      idempotencyKey: finalKey,
    });

    /**
     * Check existing payment
     */
    const existingPayment =
      await this.paymentRepository
        .findByIdempotencyKey(
          finalKey,
        );

    if (existingPayment) {
      logger.info({
        message:
          'Returning existing payment due to idempotency',

        paymentId:
          existingPayment.id,
      });

      return existingPayment;
    }

    let payment;

    /**
     * Create payment safely
     * Handles concurrency race conditions
     */
    try {
      payment =
        await this.paymentRepository.create({
          amount: payload.amount,

          currency:
            payload.currency,

          idempotencyKey:
            finalKey,
        });
    } catch (error: any) {
      /**
       * Handle unique constraint race
       */
      if (error.code === 'P2002') {
        logger.warn({
          message:
            'Recovered from idempotency race condition',

          idempotencyKey:
            finalKey,
        });

        const recoveredPayment =
          await this.paymentRepository
            .findByIdempotencyKey(
              finalKey,
            );

        if (recoveredPayment) {
          return recoveredPayment;
        }
      }

      logger.error({
        message:
          'Payment creation failed',

        error:
          error.message ||
          'Unknown error',
      });

      throw error;
    }

    logger.info({
      message:
        'Payment created successfully',

      paymentId: payment.id,
    });

    /**
     * Add payment to queue
     */
    await paymentQueue.add(
      JOB_NAMES.PROCESS_PAYMENT,

      {
        paymentId: payment.id,
      },

      {
        attempts: 3,

        backoff: {
          type: 'exponential',

          delay: 2000,
        },

        removeOnComplete: 100,

        removeOnFail: 100,
      },
    );

    logger.info({
      message:
        'Payment added to processing queue',

      paymentId: payment.id,
    });

    return payment;
  }

  async getPaymentById(
    id: string,
  ) {
    const payment =
      await this.paymentRepository
        .findById(id);

    if (!payment) {
      throw new Error(
        'Payment not found',
      );
    }

    return payment;
  }
}