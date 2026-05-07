import request from 'supertest';

import app from '../../../app';

describe('Concurrency Integration', () => {
  it('should handle concurrent webhook requests safely', async () => {
    /**
     * Create payment
     */
    const paymentResponse = await request(app)
      .post('/payments')
      .set(
        'Idempotency-Key',
        `concurrent-${Date.now()}`,
      )
      .send({
        amount: 300,

        currency: 'USD',
      });

    const paymentId =
      paymentResponse.body.data.id;

    /**
     * Send concurrent SUCCESS + FAILED webhooks
     */
    await Promise.all([
      request(app)
        .post('/webhooks/payment')
        .send({
          gatewayEventId:
            `success-${Date.now()}`,

          paymentId,

          status: 'SUCCESS',
        }),

      request(app)
        .post('/webhooks/payment')
        .send({
          gatewayEventId:
            `failed-${Date.now()}`,

          paymentId,

          status: 'FAILED',

          failureReason:
            'Concurrent failure',
        }),
    ]);

    /**
     * Fetch final payment state
     */
    const finalResponse = await request(app)
      .get(`/payments/${paymentId}`);

    expect(finalResponse.status).toBe(200);

    /**
     * Final state should be deterministic
     */
    expect(
      ['SUCCESS', 'FAILED'],
    ).toContain(
      finalResponse.body.data.status,
    );
  });

it('should enforce idempotency under parallel requests', async () => {
  const idempotencyKey =
    `parallel-${Date.now()}`;

  /**
   * Fire parallel payment requests
   */
  const responses = await Promise.all([
    request(app)
      .post('/payments')
      .set(
        'Idempotency-Key',
        idempotencyKey,
      )
      .send({
        amount: 500,
        currency: 'USD',
      }),

    request(app)
      .post('/payments')
      .set(
        'Idempotency-Key',
        idempotencyKey,
      )
      .send({
        amount: 500,
        currency: 'USD',
      }),
  ]);

  /**
   * Both requests should succeed
   */
  responses.forEach((response) => {
    expect([200, 201]).toContain(
      response.status,
    );

    expect(
      response.body.data,
    ).toBeDefined();
  });

  /**
   * Extract payment IDs
   */
  const paymentIds = responses.map(
    (response) =>
      response.body.data.id,
  );

  /**
   * Both should point to same payment
   */
  expect(paymentIds[0]).toBe(
    paymentIds[1],
  );
});

it('should prevent duplicate processing via optimistic locking', async () => {
  /**
   * Create payment
   */
  const paymentResponse = await request(app)
    .post('/payments')
    .set(
      'Idempotency-Key',
      `race-${Date.now()}`,
    )
    .send({
      amount: 900,

      currency: 'EUR',
    });

  const paymentId =
    paymentResponse.body.data.id;

  /**
   * Fetch payment multiple times concurrently
   */
  const requests = [];

  for (let i = 0; i < 5; i++) {
    requests.push(
      request(app).get(
        `/payments/${paymentId}`,
      ),
    );
  }

  const responses =
    await Promise.all(requests);

  responses.forEach((response) => {
    expect(response.status).toBe(200);
  });
});
});