import { paymentQueue }
  from '../../../queues/payment.queue';

import { JOB_NAMES }
  from '../../../constants/queue';

describe('Payment Queue', () => {
  it('should add payment job to queue', async () => {
    const job = await paymentQueue.add(
      JOB_NAMES.PROCESS_PAYMENT,

      {
        paymentId: 'test-payment-id',
      },
    );

    expect(job.id).toBeDefined();

    expect(job.name).toBe(
      JOB_NAMES.PROCESS_PAYMENT,
    );
  });
});