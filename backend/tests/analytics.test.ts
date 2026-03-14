import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Analytics API', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/analytics without auth returns 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/analytics/stats' });
    expect(res.statusCode).toBe(401);
  });
});
