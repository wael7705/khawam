import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Orders API', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/orders without auth returns 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/orders/' });
    expect(res.statusCode).toBe(401);
  });
});
