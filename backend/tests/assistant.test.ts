import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Assistant API', () => {
  it('GET /api/assistant/status returns enabled flag', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/assistant/status' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { enabled: boolean; endpoint: string; provider: string | null };
    expect(body.endpoint).toBe('/api/assistant/chat');
    expect(typeof body.enabled).toBe('boolean');
    expect('provider' in body).toBe(true);
    await app.close();
  });

  it('POST /api/assistant/chat rejects invalid body', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/assistant/chat',
      payload: { messages: [] },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
