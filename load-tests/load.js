/**
 * Load tests for Khawam API (k6).
 * Run: k6 run load-tests/load.js
 * With custom base URL: k6 run -e BASE_URL=http://localhost:8000 load-tests/load.js
 * Ramp-up example: k6 run --vus 50 --duration 60s load-tests/load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 80 },
    { duration: '1m', target: 80 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(50)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export function setup() {
  const res = http.get(`${BASE_URL}/api/services`);
  if (res.status !== 200) {
    console.warn('Services endpoint not ready - ensure backend is running');
  }
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const baseUrl = data.baseUrl;

  // GET /api/services - list services (no auth)
  const servicesRes = http.get(`${baseUrl}/api/services`);
  check(servicesRes, {
    'services status 200': (r) => r.status === 200,
  });
  sleep(0.3);

  // POST /api/orders - create order (minimal payload, optional auth)
  const orderPayload = JSON.stringify({
    items: [{ quantity: 1, specifications: {} }],
    total_amount: 0,
    final_amount: 0,
  });
  const orderRes = http.post(`${baseUrl}/api/orders`, orderPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(orderRes, {
    'order create 200 or 201': (r) => r.status === 200 || r.status === 201,
  });
  sleep(0.5);
}

export function teardown() {
  // Optional: log summary
}
