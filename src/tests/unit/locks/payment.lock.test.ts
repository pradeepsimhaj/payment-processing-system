import redis from '../../../config/redis';

import {
  acquirePaymentLock,
  releasePaymentLock,
} from '../../../locks/payment.lock';

describe('Payment Lock', () => {
  const paymentId = 'payment-lock-test';

  afterEach(async () => {
    await releasePaymentLock(paymentId);
  });

  it('should acquire lock successfully', async () => {
    const acquired =
      await acquirePaymentLock(paymentId);

    expect(acquired).toBe(true);
  });

  it('should prevent duplicate lock acquisition', async () => {
    const first =
      await acquirePaymentLock(paymentId);

    const second =
      await acquirePaymentLock(paymentId);

    expect(first).toBe(true);

    expect(second).toBe(false);
  });

  it('should release lock successfully', async () => {
    await acquirePaymentLock(paymentId);

    await releasePaymentLock(paymentId);

    const reacquired =
      await acquirePaymentLock(paymentId);

    expect(reacquired).toBe(true);
  });
});