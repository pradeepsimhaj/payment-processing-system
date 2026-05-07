import request from 'supertest';

import app from '../../../app';

describe('Infrastructure Readiness', () => {
  it('should handle multiple health checks concurrently', async () => {
    const requests = [];

    for (let i = 0; i < 10; i++) {
      requests.push(
        request(app).get('/health'),
      );
    }

    const responses =
      await Promise.all(requests);

    responses.forEach((response) => {
      expect(response.status).toBe(200);

      expect(
        response.body.success,
      ).toBe(true);
    });
  });

  it('should expose infrastructure metadata', async () => {
    const response =
      await request(app).get('/health');

    expect(
      response.body.services,
    ).toHaveProperty('database');

    expect(
      response.body.services,
    ).toHaveProperty('redis');
  });
});