import { PaymentStatus } from '@prisma/client';

const allowedTransitions: Record<
  PaymentStatus,
  PaymentStatus[]
> = {
  PENDING: [
    PaymentStatus.PROCESSING,
    PaymentStatus.SUCCESS,
    PaymentStatus.FAILED,
  ],

  PROCESSING: [
    PaymentStatus.SUCCESS,
    PaymentStatus.FAILED,
  ],

  FAILED: [
    PaymentStatus.PROCESSING,
    PaymentStatus.SUCCESS,
  ],

  SUCCESS: [],
};

export function isValidStateTransition(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
): boolean {
  return allowedTransitions[
    currentStatus
  ].includes(nextStatus);
}