import request from 'supertest';

import app from '../../app';

describe('Payment API', () => {
  describe('POST /payments', () => {
    it('should create payment successfully', async () => {
      const response = await request(app)
        .post('/payments')
        .set('Idempotency-Key', 'test-key-1')
        .send({
          amount: 100,
          currency: 'INR',
        });

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty('id');
    });

    it('should return validation error', async () => {
      const response = await request(app)
        .post('/payments')
        .send({
          amount: -100,
          currency: 'INVALID',
        });

      expect(response.status).toBe(400);
    });

    it('should handle idempotent requests', async () => {
      const payload = {
        amount: 200,
        currency: 'USD',
      };

      const firstResponse = await request(app)
        .post('/payments')
        .set('Idempotency-Key', 'duplicate-key')
        .send(payload);

      const secondResponse = await request(app)
        .post('/payments')
        .set('Idempotency-Key', 'duplicate-key')
        .send(payload);

      expect(
        firstResponse.body.data.id,
      ).toBe(secondResponse.body.data.id);
    });
  });
});