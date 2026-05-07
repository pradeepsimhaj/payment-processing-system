import { PaymentStatus } from '@prisma/client';

import { PaymentRepository }
  from '../../../repositories/payment.repository';

describe('Optimistic Locking', () => {
  const repository =
    new PaymentRepository();

  it('should prevent stale updates', async () => {
    /**
     * Create payment
     */
    const payment =
      await repository.create({
        amount: 100,

        currency: 'INR',

        idempotencyKey:
          `optimistic-${Date.now()}`,
      });

    /**
     * First update succeeds
     */
    const firstUpdate =
      await repository.updateStatusWithVersion(
        payment.id,

        payment.version,

        PaymentStatus.PROCESSING,
      );

    expect(firstUpdate).toBe(true);

    /**
     * Second stale update fails
     */
    const staleUpdate =
      await repository.updateStatusWithVersion(
        payment.id,

        payment.version,

        PaymentStatus.SUCCESS,
      );

    expect(staleUpdate).toBe(false);
  });
});