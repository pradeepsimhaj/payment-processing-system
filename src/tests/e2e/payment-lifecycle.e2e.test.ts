import request from 'supertest';

import app from '../../app';

jest.setTimeout(30000);

describe('Payment Lifecycle E2E', () => {
  it('should create and process payment', async () => {
    const createResponse = await request(app)
      .post('/payments')
      .set(
        'Idempotency-Key',
        `e2e-${Date.now()}`,
      )
      .send({
        amount: 500,
        currency: 'INR',
      });

    expect(createResponse.status).toBe(201);

    const paymentId =
      createResponse.body.data.id;

    expect(paymentId).toBeDefined();

    /**
     * Wait for worker processing
     */
    await new Promise((resolve) =>
      setTimeout(resolve, 8000),
    );

    const paymentResponse = await request(app)
      .get(`/payments/${paymentId}`);

    expect(paymentResponse.status).toBe(200);

    expect(
      ['SUCCESS', 'FAILED'],
    ).toContain(
      paymentResponse.body.data.status,
    );
  });
});