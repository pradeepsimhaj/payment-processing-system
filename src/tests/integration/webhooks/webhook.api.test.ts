import request from 'supertest';

import app from '../../../app';

describe('Webhook API', () => {
  it('should process SUCCESS webhook', async () => {
    const paymentResponse = await request(app)
      .post('/payments')
      .set(
        'Idempotency-Key',
        `webhook-test-${Date.now()}`,
      )
      .send({
        amount: 100,
        currency: 'INR',
      });

    const paymentId =
      paymentResponse.body.data.id;

    const webhookResponse = await request(app)
      .post('/webhooks/payment')
      .send({
        gatewayEventId:
          `event-${Date.now()}`,

        paymentId,

        status: 'SUCCESS',

        gatewayReference: 'txn-123',
      });

    expect(webhookResponse.status).toBe(200);

    expect(
      webhookResponse.body.success,
    ).toBe(true);
  });

  it('should ignore duplicate webhook', async () => {
    const eventId =
      `duplicate-${Date.now()}`;

    const paymentResponse = await request(app)
      .post('/payments')
      .set(
        'Idempotency-Key',
        `dup-${Date.now()}`,
      )
      .send({
        amount: 200,
        currency: 'USD',
      });

    const paymentId =
      paymentResponse.body.data.id;

    await request(app)
      .post('/webhooks/payment')
      .send({
        gatewayEventId: eventId,
        paymentId,
        status: 'SUCCESS',
      });

    const duplicateResponse = await request(app)
      .post('/webhooks/payment')
      .send({
        gatewayEventId: eventId,
        paymentId,
        status: 'SUCCESS',
      });

    expect(
      duplicateResponse.status,
    ).toBe(200);
  });
});