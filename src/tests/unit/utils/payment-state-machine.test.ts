import { PaymentStatus } from '@prisma/client';

import {
  isValidStateTransition,
} from '../../../utils/payment-state-machine';

describe('Payment State Machine', () => {
  it('should allow PENDING -> PROCESSING', () => {
    expect(
      isValidStateTransition(
        PaymentStatus.PENDING,
        PaymentStatus.PROCESSING,
      ),
    ).toBe(true);
  });

  it('should allow PROCESSING -> SUCCESS', () => {
    expect(
      isValidStateTransition(
        PaymentStatus.PROCESSING,
        PaymentStatus.SUCCESS,
      ),
    ).toBe(true);
  });

  it('should reject SUCCESS -> FAILED', () => {
    expect(
      isValidStateTransition(
        PaymentStatus.SUCCESS,
        PaymentStatus.FAILED,
      ),
    ).toBe(false);
  });

  it('should reject SUCCESS -> PROCESSING', () => {
    expect(
      isValidStateTransition(
        PaymentStatus.SUCCESS,
        PaymentStatus.PROCESSING,
      ),
    ).toBe(false);
  });
});