export interface PaymentWebhookPayload {
  gatewayEventId: string;

  paymentId: string;

  status: 'SUCCESS' | 'FAILED';

  gatewayReference?: string;

  failureReason?: string;
}