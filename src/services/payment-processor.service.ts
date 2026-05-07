// import { PaymentStatus } from '@prisma/client';

// import logger from '../config/logger';

// import { PaymentRepository } from '../repositories/payment.repository';

// import { processFakePayment } from '../gateway/fake-gateway';

// import {
//   acquirePaymentLock,
//   releasePaymentLock,
// } from '../locks/payment.lock';

// import { isValidStateTransition } from '../utils/payment-state-machine';

// export class PaymentProcessorService {
//   private paymentRepository: PaymentRepository;

//   constructor() {
//     this.paymentRepository = new PaymentRepository();
//   }

//   async processPayment(paymentId: string) {
//     const lockAcquired =
//       await acquirePaymentLock(paymentId);

//     if (!lockAcquired) {
//       logger.warn({
//         message: 'Payment already being processed',
//         paymentId,
//       });

//       return;
//     }

//     try {
//       const payment =
//         await this.paymentRepository.findById(
//           paymentId,
//         );

//       if (!payment) {
//         throw new Error('Payment not found');
//       }

//       if (
//         !isValidStateTransition(
//           payment.status,
//           PaymentStatus.PROCESSING,
//         )
//       ) {
//         logger.warn({
//           message: 'Invalid state transition',
//           paymentId,
//           currentStatus: payment.status,
//         });

//         return;
//       }

//       await this.paymentRepository.updateStatusWithVersion(
//         paymentId,
//         payment.version,
//     PaymentStatus.PROCESSING,
//       );

//       await this.paymentRepository.createEvent({
//         paymentId,
//         previousState: payment.status,
//         currentState: PaymentStatus.PROCESSING,
//       });

//       const gatewayResponse =
//         await processFakePayment();

//       if (gatewayResponse.success) {
//         await this.paymentRepository.updateStatusWithVersion(
//           paymentId,
//           payment.version,
//     PaymentStatus.PROCESSING,
//           {
//             gatewayReference:
//               gatewayResponse.transactionId,
//           },
//         );

//         await this.paymentRepository.createEvent({
//           paymentId,
//           previousState: PaymentStatus.PROCESSING,
//           currentState: PaymentStatus.SUCCESS,
//         });

//         logger.info({
//           message: 'Payment processed successfully',
//           paymentId,
//         });

//         return;
//       }

//       const retryCount = payment.retryCount + 1;

//       if (retryCount >= payment.maxRetries) {
//         await this.paymentRepository.updateStatusWithVersion(
//           paymentId,
//           payment.version,
//     PaymentStatus.PROCESSING,
//           {
//             retryCount,
//             failureReason:
//               gatewayResponse.failureReason,
//           },
//         );

//         await this.paymentRepository.createEvent({
//           paymentId,
//           previousState: PaymentStatus.PROCESSING,
//           currentState: PaymentStatus.FAILED,
//           reason: gatewayResponse.failureReason,
//         });

//         logger.error({
//           message: 'Payment failed permanently',
//           paymentId,
//         });

//         return;
//       }

//       await this.paymentRepository.updateStatusWithVersion(
//   paymentId,
//   payment.version,
//     PaymentStatus.PROCESSING,
//   {
//     retryCount,
//     failureReason: gatewayResponse.failureReason,
//   },
// );

// await this.paymentRepository.createEvent({
//   paymentId,
//   previousState: PaymentStatus.PROCESSING,
//   currentState: PaymentStatus.FAILED,
//   reason: gatewayResponse.failureReason,
// });

//       throw new Error(
//         gatewayResponse.failureReason ||
//           'Temporary gateway failure',
//       );
//     } finally {
//       await releasePaymentLock(paymentId);
//     }
//   }
// }













































import { PaymentStatus } from '@prisma/client';

import logger from '../config/logger';

import { PaymentRepository }
  from '../repositories/payment.repository';

import { processFakePayment }
  from '../gateway/fake-gateway';

import {
  acquirePaymentLock,
  releasePaymentLock,
} from '../locks/payment.lock';

import {
  isValidStateTransition,
} from '../utils/payment-state-machine';

export class PaymentProcessorService {
  private paymentRepository: PaymentRepository;

  constructor() {
    this.paymentRepository =
      new PaymentRepository();
  }

  async processPayment(paymentId: string) {
    const lockAcquired =
      await acquirePaymentLock(paymentId);

    if (!lockAcquired) {
      logger.warn({
        message:
          'Payment already being processed',

        paymentId,
      });

      return;
    }

    try {
      const payment =
        await this.paymentRepository.findById(
          paymentId,
        );

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (
        !isValidStateTransition(
          payment.status,
          PaymentStatus.PROCESSING,
        )
      ) {
        logger.warn({
          message:
            'Invalid state transition',

          paymentId,

          currentStatus:
            payment.status,
        });

        return;
      }

      const movedToProcessing =
        await this.paymentRepository
          .updatePaymentWithEvent({
            paymentId,

            currentVersion:
              payment.version,

            previousStatus:
              payment.status,

            newStatus:
              PaymentStatus.PROCESSING,
          });

      if (!movedToProcessing) {
        logger.warn({
          message:
            'Stale processing update prevented',

          paymentId,
        });

        return;
      }

      /**
       * Refresh payment
       */
      const latestPayment =
        await this.paymentRepository.findById(
          paymentId,
        );

      if (!latestPayment) {
        throw new Error(
          'Payment disappeared',
        );
      }

      const gatewayResponse =
        await processFakePayment();

      /**
       * SUCCESS FLOW
       */
      if (gatewayResponse.success) {
        const updated =
          await this.paymentRepository
            .updatePaymentWithEvent({
              paymentId,

              currentVersion:
                latestPayment.version,

              previousStatus:
                PaymentStatus.PROCESSING,

              newStatus:
                PaymentStatus.SUCCESS,

              gatewayReference:
                gatewayResponse.transactionId,
            });

        if (!updated) {
          logger.warn({
            message:
              'Stale SUCCESS update prevented',

            paymentId,
          });

          return;
        }

        logger.info({
          message:
            'Payment processed successfully',

          paymentId,
        });

        return;
      }

      /**
       * FAILURE FLOW
       */
      const retryCount =
        latestPayment.retryCount + 1;

      /**
       * Permanent failure
       */
      if (
        retryCount >=
        latestPayment.maxRetries
      ) {
        const updated =
          await this.paymentRepository
            .updatePaymentWithEvent({
              paymentId,

              currentVersion:
                latestPayment.version,

              previousStatus:
                PaymentStatus.PROCESSING,

              newStatus:
                PaymentStatus.FAILED,

              retryCount,

              failureReason:
                gatewayResponse.failureReason,

              reason:
                gatewayResponse.failureReason,
            });

        if (!updated) {
          logger.warn({
            message:
              'Stale FAILED update prevented',

            paymentId,
          });

          return;
        }

        logger.error({
          message:
            'Payment failed permanently',

          paymentId,
        });

        return;
      }

      /**
       * Temporary failure
       */
      const updated =
        await this.paymentRepository
          .updatePaymentWithEvent({
            paymentId,

            currentVersion:
              latestPayment.version,

            previousStatus:
              PaymentStatus.PROCESSING,

            newStatus:
              PaymentStatus.FAILED,

            retryCount,

            failureReason:
              gatewayResponse.failureReason,

            reason:
              gatewayResponse.failureReason,
          });

      if (!updated) {
        logger.warn({
          message:
            'Stale retry update prevented',

          paymentId,
        });

        return;
      }

      throw new Error(
        gatewayResponse.failureReason ||
          'Temporary gateway failure',
      );
    } finally {
      await releasePaymentLock(paymentId);
    }
  }
}