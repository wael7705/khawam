import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Services API', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/services returns 200 and array', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/services' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /api/workflows/service-by-slug/:slug returns 404 for unknown slug', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workflows/service-by-slug/non-existent-slug-xyz',
    });
    expect(res.statusCode).toBe(404);
  });
});
