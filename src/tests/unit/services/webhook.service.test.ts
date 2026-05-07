import { PaymentStatus } from '@prisma/client';

import { WebhookService }
  from '../../../services/webhook.service';

import { PaymentRepository }
  from '../../../repositories/payment.repository';

jest.mock('../../../repositories/payment.repository');

describe('WebhookService', () => {
  let webhookService: WebhookService;

  let repository: jest.Mocked<PaymentRepository>;

  beforeEach(() => {
    repository =
      new PaymentRepository() as jest.Mocked<PaymentRepository>;

    repository.updatePaymentWithEvent =
      jest.fn().mockResolvedValue(true);

    webhookService = new WebhookService();

    (webhookService as any).paymentRepository =
      repository;
  });

  it('should ignore duplicate webhook', async () => {
    repository.findWebhookEvent.mockResolvedValue({
      id: 'existing-webhook',
    } as any);

    const result =
      await webhookService.processWebhook({
        gatewayEventId: 'event-1',

        paymentId: 'payment-1',

        status: 'SUCCESS',
      });

    expect(result).toBeUndefined();
  });

  it('should ignore unknown payment', async () => {
    repository.findWebhookEvent.mockResolvedValue(
      null,
    );

    repository.createWebhookEvent.mockResolvedValue(
      {} as any,
    );

    repository.findById.mockResolvedValue(
      null,
    );

    const result =
      await webhookService.processWebhook({
        gatewayEventId: 'event-2',

        paymentId: 'unknown-payment',

        status: 'SUCCESS',
      });

    expect(result).toBeUndefined();
  });

  it('should ignore conflicting FAILED webhook after SUCCESS', async () => {
    repository.findWebhookEvent.mockResolvedValue(
      null,
    );

    repository.createWebhookEvent.mockResolvedValue(
      {} as any,
    );

    repository.findById.mockResolvedValue({
      id: 'payment-1',

      status: PaymentStatus.SUCCESS,

      version: 1,
    } as any);

    const result =
      await webhookService.processWebhook({
        gatewayEventId: 'event-3',

        paymentId: 'payment-1',

        status: 'FAILED',
      });

    expect(result).toBeUndefined();
  });
});