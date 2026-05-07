import { PaymentService } from '../../../services/payment.service';

import { PaymentRepository } from '../../../repositories/payment.repository';

jest.mock('../../../repositories/payment.repository');

const MockedPaymentRepository =
  PaymentRepository as jest.MockedClass<typeof PaymentRepository>;

describe('PaymentService', () => {
  let paymentService: PaymentService;

  let paymentRepository: jest.Mocked<PaymentRepository>;

  beforeEach(() => {
    MockedPaymentRepository.mockClear();

    paymentRepository =
      new MockedPaymentRepository() as jest.Mocked<PaymentRepository>;

    paymentService = new PaymentService();

    (paymentService as any).paymentRepository =
      paymentRepository;
  });

  describe('createPayment', () => {
    it('should create a new payment successfully', async () => {
      paymentRepository.findByIdempotencyKey.mockResolvedValue(null);

      paymentRepository.create.mockResolvedValue({
        id: 'payment-1',
        amount: 100,
        currency: 'INR',
        status: 'PENDING',
      } as any);

      const result = await paymentService.createPayment(
        {
          amount: 100,
          currency: 'INR',
        },
        'idem-key-1',
      );

      expect(result.id).toBe('payment-1');

      expect(
        paymentRepository.create,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return existing payment for duplicate idempotency key', async () => {
      paymentRepository.findByIdempotencyKey.mockResolvedValue({
        id: 'existing-payment',
        amount: 100,
        currency: 'INR',
        status: 'PENDING',
      } as any);

      const result = await paymentService.createPayment(
        {
          amount: 100,
          currency: 'INR',
        },
        'same-key',
      );

      expect(result.id).toBe('existing-payment');

      expect(
        paymentRepository.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentById', () => {
    it('should return payment if found', async () => {
      paymentRepository.findById.mockResolvedValue({
        id: 'payment-1',
      } as any);

      const result = await paymentService.getPaymentById(
        'payment-1',
      );

      expect(result.id).toBe('payment-1');
    });

    it('should throw error if payment not found', async () => {
      paymentRepository.findById.mockResolvedValue(null);

      await expect(
        paymentService.getPaymentById('invalid-id'),
      ).rejects.toThrow('Payment not found');
    });
  });
});