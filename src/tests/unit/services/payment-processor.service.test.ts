import { PaymentStatus } from '@prisma/client';

import { PaymentProcessorService }
  from '../../../services/payment-processor.service';

import { PaymentRepository }
  from '../../../repositories/payment.repository';

jest.mock('../../../repositories/payment.repository');

describe('PaymentProcessorService', () => {
  let processor: PaymentProcessorService;

  let repository: jest.Mocked<PaymentRepository>;

  beforeEach(() => {
    repository =
      new PaymentRepository() as jest.Mocked<PaymentRepository>;

    repository.updatePaymentWithEvent =
      jest.fn().mockResolvedValue(true);

    processor = new PaymentProcessorService();

    (processor as any).paymentRepository =
      repository;
  });

  it('should throw if payment not found', async () => {
    repository.findById.mockResolvedValue(
      null,
    );

    await expect(
      processor.processPayment(
        'invalid-id',
      ),
    ).rejects.toThrow(
      'Payment not found',
    );
  });

  it('should reject invalid state transition', async () => {
    repository.findById.mockResolvedValue({
      id: 'payment-1',

      status: PaymentStatus.SUCCESS,

      version: 1,
    } as any);

    const result =
      await processor.processPayment(
        'payment-1',
      );

    expect(result).toBeUndefined();
  });
});