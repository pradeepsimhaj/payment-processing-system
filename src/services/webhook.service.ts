// import { PaymentStatus } from '@prisma/client';

// import logger from '../config/logger';

// import { PaymentRepository }
//   from '../repositories/payment.repository';

// import { PaymentWebhookPayload }
//   from '../types/webhook.types';

// import {
//   isValidStateTransition,
// } from '../utils/payment-state-machine';

// export class WebhookService {
//   private paymentRepository: PaymentRepository;

//   constructor() {
//     this.paymentRepository =
//       new PaymentRepository();
//   }

//   async processWebhook(
//     payload: PaymentWebhookPayload,
//   ) {
//     logger.info({
//       message: 'Processing webhook',
//       gatewayEventId: payload.gatewayEventId,
//     });

//     /**
//      * Deduplicate webhook
//      */
//     const existingWebhook =
//       await this.paymentRepository.findWebhookEvent(
//         payload.gatewayEventId,
//       );

//     if (existingWebhook) {
//       logger.warn({
//         message: 'Duplicate webhook ignored',
//         gatewayEventId: payload.gatewayEventId,
//       });

//       return;
//     }

//     /**
//      * Store webhook event
//      */
//     await this.paymentRepository.createWebhookEvent({
//       gatewayEventId: payload.gatewayEventId,
//       paymentId: payload.paymentId,
//       payload,
//     });

//     /**
//      * Find payment
//      */
//     const payment =
//       await this.paymentRepository.findById(
//         payload.paymentId,
//       );

//     if (!payment) {
//       logger.error({
//         message: 'Webhook payment not found',
//         paymentId: payload.paymentId,
//       });

//       return;
//     }

//     /**
//      * Ignore already successful payments
//      */
//     if (payment.status === PaymentStatus.SUCCESS) {
//       logger.warn({
//         message:
//           'Ignoring conflicting webhook for successful payment',
//         paymentId: payment.id,
//       });

//       return;
//     }

//     /**
//      * Handle SUCCESS webhook
//      */
//     if (payload.status === 'SUCCESS') {
//       if (
//         !isValidStateTransition(
//           payment.status,
//           PaymentStatus.SUCCESS,
//         )
//       ) {
//         logger.warn({
//           message:
//             'Invalid SUCCESS webhook transition',
//           paymentId: payment.id,
//         });

//         return;
//       }

//       await this.paymentRepository.updateStatus(
//         payment.id,
//         PaymentStatus.SUCCESS,
//         {
//           gatewayReference:
//             payload.gatewayReference,
//         },
//       );

//       await this.paymentRepository.createEvent({
//         paymentId: payment.id,
//         previousState: payment.status,
//         currentState: PaymentStatus.SUCCESS,
//         reason: 'Webhook confirmation',
//       });

//       logger.info({
//         message:
//           'Payment marked SUCCESS via webhook',
//         paymentId: payment.id,
//       });

//       return;
//     }

//     /**
//      * Handle FAILED webhook
//      */
//     if (payload.status === 'FAILED') {
//       await this.paymentRepository.updateStatus(
//         payment.id,
//         PaymentStatus.FAILED,
//         {
//           failureReason:
//             payload.failureReason,
//         },
//       );

//       await this.paymentRepository.createEvent({
//         paymentId: payment.id,
//         previousState: payment.status,
//         currentState: PaymentStatus.FAILED,
//         reason: payload.failureReason,
//       });

//       logger.info({
//         message:
//           'Payment marked FAILED via webhook',
//         paymentId: payment.id,
//       });
//     }
//   }
// }









































import { PaymentStatus } from '@prisma/client';

import logger from '../config/logger';

import { PaymentRepository }
  from '../repositories/payment.repository';

import { PaymentWebhookPayload }
  from '../types/webhook.types';

import {
  isValidStateTransition,
} from '../utils/payment-state-machine';

export class WebhookService {
  private paymentRepository: PaymentRepository;

  constructor() {
    this.paymentRepository =
      new PaymentRepository();
  }

  async processWebhook(
    payload: PaymentWebhookPayload,
  ) {
    logger.info({
      message: 'Processing webhook',

      gatewayEventId:
        payload.gatewayEventId,
    });

    /**
     * Deduplicate webhook
     */
    const existingWebhook =
      await this.paymentRepository
        .findWebhookEvent(
          payload.gatewayEventId,
        );

    if (existingWebhook) {
      logger.warn({
        message:
          'Duplicate webhook ignored',

        gatewayEventId:
          payload.gatewayEventId,
      });

      return;
    }

    /**
     * Store webhook event
     */
    await this.paymentRepository
      .createWebhookEvent({
        gatewayEventId:
          payload.gatewayEventId,

        paymentId:
          payload.paymentId,

        payload,
      });

    /**
     * Find payment
     */
    const payment =
      await this.paymentRepository.findById(
        payload.paymentId,
      );

    if (!payment) {
      logger.error({
        message:
          'Webhook payment not found',

        paymentId:
          payload.paymentId,
      });

      return;
    }

    /**
     * Ignore conflicting updates
     */
    if (
      payment.status ===
      PaymentStatus.SUCCESS
    ) {
      logger.warn({
        message:
          'Ignoring conflicting webhook for successful payment',

        paymentId: payment.id,
      });

      return;
    }

    /**
     * SUCCESS WEBHOOK
     */
    if (payload.status === 'SUCCESS') {
      if (
        !isValidStateTransition(
          payment.status,
          PaymentStatus.SUCCESS,
        )
      ) {
        logger.warn({
          message:
            'Invalid SUCCESS webhook transition',

          paymentId: payment.id,
        });

        return;
      }

      const updated =
        await this.paymentRepository
          .updatePaymentWithEvent({
            paymentId: payment.id,

            currentVersion:
              payment.version,

            previousStatus:
              payment.status,

            newStatus:
              PaymentStatus.SUCCESS,

            gatewayReference:
              payload.gatewayReference,

            reason:
              'Webhook confirmation',
          });

      if (!updated) {
        logger.warn({
          message:
            'Webhook stale SUCCESS prevented',

          paymentId: payment.id,
        });

        return;
      }

      logger.info({
        message:
          'Payment marked SUCCESS via webhook',

        paymentId: payment.id,
      });

      return;
    }

    /**
     * FAILED WEBHOOK
     */
    if (payload.status === 'FAILED') {
  /**
   * Prevent FAILED from overriding SUCCESS
   */
  const latestPayment =
    await this.paymentRepository.findById(
      payment.id,
    );

  if (
    latestPayment?.status ===
    PaymentStatus.SUCCESS
  ) {
    logger.warn({
      message:
        'Ignoring FAILED webhook after SUCCESS',

      paymentId: payment.id,
    });

    return;
  }

  const updated =
    await this.paymentRepository
      .updateStatusWithVersion(
        payment.id,

        payment.version,

        PaymentStatus.FAILED,

        {
          failureReason:
            payload.failureReason,
        },
      );

  if (!updated) {
    logger.warn({
      message:
        'Webhook stale FAILED prevented',

      paymentId: payment.id,
    });

    return;
  }

  await this.paymentRepository.createEvent({
    paymentId: payment.id,

    previousState:
      payment.status,

    currentState:
      PaymentStatus.FAILED,

    reason:
      payload.failureReason,
  });

  logger.info({
    message:
      'Payment marked FAILED via webhook',

    paymentId: payment.id,
  });
}
  }
}