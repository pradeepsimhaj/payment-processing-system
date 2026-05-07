import request from 'supertest';

import app from '../../../app';

describe('Health Endpoint', () => {
  it('should return healthy status', async () => {
    const response =
      await request(app).get('/health');

    expect(response.status).toBe(200);

    expect(
      response.body.success,
    ).toBe(true);

    expect(
      response.body.services,
    ).toBeDefined();

    expect(
      response.body.services.database,
    ).toBe('healthy');

    expect(
      response.body.services.redis,
    ).toBe('healthy');

    expect(
      response.body.uptime,
    ).toBeDefined();

    expect(
      response.body.timestamp,
    ).toBeDefined();
  });
});