// import prisma from '../config/prisma';
// import { PaymentStatus } from '@prisma/client';

// export class PaymentRepository {
//   async create(data: {
//     amount: number;
//     currency: string;
//     idempotencyKey: string;
//   }) {
//     return prisma.payment.create({
//       data: {
//         amount: data.amount,
//         currency: data.currency,
//         idempotencyKey: data.idempotencyKey,
//         status: PaymentStatus.PENDING,
//       },
//     });
//   }

//   async updateStatus(
//   id: string,
//   status: PaymentStatus,
//   data?: {
//     gatewayReference?: string;
//     failureReason?: string;
//     retryCount?: number;
//   },
// ) {
//   return prisma.payment.update({
//     where: { id },

//     data: {
//       status,

//       gatewayReference: data?.gatewayReference,

//       failureReason: data?.failureReason,

//       retryCount: data?.retryCount,
//     },
//   });
// }

// async createEvent(data: {
//   paymentId: string;
//   previousState?: PaymentStatus;
//   currentState: PaymentStatus;
//   reason?: string;
// }) {
//   return prisma.paymentEvent.create({
//     data,
//   });
// }

//   async findById(id: string) {
//     return prisma.payment.findUnique({
//       where: { id },
//       include: {
//         events: true,
//       },
//     });
//   }

//   async findByIdempotencyKey(key: string) {
//     return prisma.payment.findUnique({
//       where: {
//         idempotencyKey: key,
//       },
//     });
//   }

//   async findWebhookEvent(gatewayEventId: string) {
//   return prisma.webhookEvent.findUnique({
//     where: {
//       gatewayEventId,
//     },
//   });
// }

// async createWebhookEvent(data: {
//   gatewayEventId: string;
//   paymentId: string;
//   payload: any;
// }) {
//   return prisma.webhookEvent.create({
//     data,
//   });
// }


// async updateStatusWithVersion(
//   paymentId: string,

//   currentVersion: number,

//   status: PaymentStatus,

//   data?: {
//     retryCount?: number;
//     gatewayReference?: string;
//     failureReason?: string;
//   },
// ) {
//   const result = await prisma.payment.updateMany({
//     where: {
//       id: paymentId,
//       version: currentVersion,
//     },

//     data: {
//       status,

//       retryCount: data?.retryCount,

//       gatewayReference:
//         data?.gatewayReference,

//       failureReason:
//         data?.failureReason,

//       version: {
//         increment: 1,
//       },
//     },
//   });

//   return result.count > 0;
// }

// }




















import prisma from '../config/prisma';

import { PaymentStatus } from '@prisma/client';

export class PaymentRepository {
  async create(data: {
    amount: number;
    currency: string;
    idempotencyKey: string;
  }) {
    return prisma.payment.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        idempotencyKey: data.idempotencyKey,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },

      include: {
        events: true,
      },
    });
  }

  async findByIdempotencyKey(key: string) {
    return prisma.payment.findUnique({
      where: {
        idempotencyKey: key,
      },
    });
  }

  async createEvent(data: {
    paymentId: string;
    previousState?: PaymentStatus;
    currentState: PaymentStatus;
    reason?: string;
  }) {
    return prisma.paymentEvent.create({
      data,
    });
  }

  async findWebhookEvent(
    gatewayEventId: string,
  ) {
    return prisma.webhookEvent.findUnique({
      where: {
        gatewayEventId,
      },
    });
  }

  async createWebhookEvent(data: {
    gatewayEventId: string;
    paymentId: string;
    payload: any;
  }) {
    return prisma.webhookEvent.create({
      data,
    });
  }

  /**
   * Optimistic concurrency control
   */
  async updateStatusWithVersion(
    paymentId: string,

    currentVersion: number,

    status: PaymentStatus,

    data?: {
      retryCount?: number;
      gatewayReference?: string;
      failureReason?: string;
    },
  ) {
    const result =
      await prisma.payment.updateMany({
        where: {
          id: paymentId,

          version: currentVersion,
        },

        data: {
          status,

          retryCount: data?.retryCount,

          gatewayReference:
            data?.gatewayReference,

          failureReason:
            data?.failureReason,

          version: {
            increment: 1,
          },
        },
      });

    return result.count > 0;
  }

  /**
   * Atomic status + event transaction
   */
  async updatePaymentWithEvent(params: {
    paymentId: string;

    currentVersion: number;

    newStatus: PaymentStatus;

    previousStatus: PaymentStatus;

    reason?: string;

    gatewayReference?: string;

    failureReason?: string;

    retryCount?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated =
        await tx.payment.updateMany({
          where: {
            id: params.paymentId,

            version:
              params.currentVersion,
          },

          data: {
            status: params.newStatus,

            gatewayReference:
              params.gatewayReference,

            failureReason:
              params.failureReason,

            retryCount:
              params.retryCount,

            version: {
              increment: 1,
            },
          },
        });

      if (updated.count === 0) {
        return false;
      }

      await tx.paymentEvent.create({
        data: {
          paymentId: params.paymentId,

          previousState:
            params.previousStatus,

          currentState:
            params.newStatus,

          reason: params.reason,
        },
      });

      return true;
    });
  }
}