import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';

/**
 * اختبارات دخان للنشر: تُشغّل بعد db seed في الحاوية للتحقق من:
 * - تحميل workflow الخدمات بالـ slug
 * - إنشاء طلب وحفظه في القاعدة
 * - ظهور الطلب في إدارة الطلبات
 * - تحديث حالة الطلب وتسجيلها في القاعدة
 */
describe('Deploy smoke', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let workflowServiceId: string;
  let createdOrderId: string;
  let createdOrderNumber: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/workflows/service-by-slug/:slug returns serviceId and steps', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workflows/service-by-slug/lecture-printing',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { serviceId: string; steps: unknown[] };
    expect(body).toHaveProperty('serviceId');
    expect(typeof body.serviceId).toBe('string');
    expect(body.serviceId.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('steps');
    expect(Array.isArray(body.steps)).toBe(true);
    expect(body.steps.length).toBeGreaterThan(0);
    workflowServiceId = body.serviceId;
  });

  it('GET /api/workflows/service-by-slug/dtf-printing returns steps including digital flow', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workflows/service-by-slug/dtf-printing',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { serviceId: string; steps: Array<{ stepType?: string }> };
    expect(body.serviceId).toBeDefined();
    expect(Array.isArray(body.steps)).toBe(true);
    const types = body.steps.map((s) => s.stepType);
    expect(types).toContain('digital_dimensions');
    expect(types).toContain('digital_print_color');
  });

  it('POST /api/orders creates order and returns id and order_number', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders/',
      payload: {
        service_id: workflowServiceId,
        customer_name: 'Deploy smoke customer',
        customer_whatsapp: '0999999999',
        items: [
          {
            product_name: 'Deploy smoke test',
            quantity: 1,
            unit_price: 0,
            specifications: {},
            design_files: [],
          },
        ],
        total_amount: 0,
        final_amount: 0,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { id: string; order_number: string };
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('order_number');
    createdOrderId = body.id;
    createdOrderNumber = body.order_number;
  });

  it('admin login returns token', async () => {
    const username = process.env.TEST_LOGIN_USERNAME ?? 'waeln4457@gmail.com';
    const password = process.env.TEST_LOGIN_PASSWORD ?? 'w0966320114/s';
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { access_token?: string };
    expect(body.access_token).toBeDefined();
    adminToken = body.access_token as string;
  });

  it('GET /api/admin/orders/all shows the created order', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/orders/all',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data?: Array<{ id: string; order_number?: string }> };
    expect(Array.isArray(body.data)).toBe(true);
    const found = (body.data ?? []).find(
      (o) => o.id === createdOrderId || o.order_number === createdOrderNumber,
    );
    expect(found).toBeDefined();
  });

  it('PUT /api/admin/orders/:orderId/status updates status and persists', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/admin/orders/${createdOrderId}/status`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'confirmed', notes: 'Deploy smoke test' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/admin/orders/:orderId returns order with updated status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/admin/orders/${createdOrderId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status?: string };
    expect(body.status).toBe('confirmed');
  });

  it('GET /api/orders/:orderId/status-history returns history with new status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/orders/${createdOrderId}/status-history`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { history?: Array<{ status: string }> };
    expect(Array.isArray(body.history)).toBe(true);
    const hasConfirmed = (body.history ?? []).some((h) => h.status === 'confirmed');
    expect(hasConfirmed).toBe(true);
  });
});
