import request from 'supertest';

import app from '../../app';

describe('Webhook Lifecycle E2E', () => {
  it('should process payment webhook end-to-end', async () => {
  /**
   * Create payment
   */
  const createResponse = await request(app)
    .post('/payments')
    .set(
      'Idempotency-Key',
      `webhook-e2e-${Date.now()}`,
    )
    .send({
      amount: 750,
      currency: 'INR',
    });

  expect(createResponse.status).toBe(201);

  const paymentId =
    createResponse.body.data.id;

  expect(paymentId).toBeDefined();

  /**
   * Send webhook callback
   */
  const webhookResponse = await request(app)
    .post('/webhooks/payment')
    .send({
      gatewayEventId:
        `gateway-event-${Date.now()}`,

      paymentId,

      status: 'SUCCESS',

      gatewayReference:
        'txn-webhook-123',
    });

  expect(webhookResponse.status).toBe(200);

  /**
   * WAIT for async processing
   */
  await new Promise((resolve) =>
    setTimeout(resolve, 1000),
  );

  /**
   * Fetch updated payment
   */
  const paymentResponse =
    await request(app)
      .get(`/payments/${paymentId}`);

  expect(paymentResponse.status).toBe(200);

  expect(
    paymentResponse.body.data.status,
  ).toBe('SUCCESS');
});

  it('should ignore conflicting FAILED webhook after SUCCESS', async () => {
    /**
     * Create payment
     */
    const createResponse = await request(app)
      .post('/payments')
      .set(
        'Idempotency-Key',
        `conflict-${Date.now()}`,
      )
      .send({
        amount: 900,
        currency: 'USD',
      });

    expect(createResponse.status).toBe(201);

    const paymentId =
      createResponse.body.data.id;

    /**
     * Send SUCCESS webhook
     */
    await request(app)
      .post('/webhooks/payment')
      .send({
        gatewayEventId:
          `success-${Date.now()}`,

        paymentId,

        status: 'SUCCESS',
      });

    /**
     * Send conflicting FAILED webhook
     */
    await request(app)
      .post('/webhooks/payment')
      .send({
        gatewayEventId:
          `failed-${Date.now()}`,

        paymentId,

        status: 'FAILED',

        failureReason:
          'Gateway conflict simulation',
      });

    /**
     * Verify payment still SUCCESS
     */
    const paymentResponse = await request(app)
      .get(`/payments/${paymentId}`);

    expect(paymentResponse.status).toBe(200);

    expect(
      paymentResponse.body.data.status,
    ).toBe('SUCCESS');
  });
});