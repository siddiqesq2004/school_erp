// ═══════════════════════════════════════════════════════════
// k6 Smoke Test — School ERP Backend (Phase 12 load testing)
// Run: k6 run loadtest/k6-smoke.js
// ═══════════════════════════════════════════════════════════

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:5000';
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // ramp-up to 20 users
    { duration: '1m',  target: 50 },  // ramp to 50
    { duration: '2m',  target: 100 }, // stress: 100 concurrent
    { duration: '1m',  target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests under 500ms
    http_req_failed:   ['rate<0.01'],    // <1% failure rate
    errors:            ['rate<0.05'],
  },
};

export default function () {
  // 1. Health check
  const health = http.get(`${BASE}/health`);
  check(health, {
    'health: status 200': (r) => r.status === 200,
    'health: success true': (r) => r.json('success') === true,
  }) || errorRate.add(1);

  // 2. Public API index
  const api = http.get(`${BASE}/api`);
  check(api, { 'api: status 200': (r) => r.status === 200 }) || errorRate.add(1);

  sleep(1);

  // 3. Login (auth flow)
  const loginPayload = JSON.stringify({
    username: 'admin',
    password: 'admin123',
  });
  const loginRes = http.post(`${BASE}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  const loginOk = check(loginRes, {
    'login: status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  if (!loginOk) errorRate.add(1);

  // 4. Authenticated analytics endpoint (use a dummy token; backend will reject, but we measure throughput)
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer dummy-token',
  };
  const a = http.get(`${BASE}/api/phase11/analytics/advanced`, { headers });
  check(a, { 'analytics: status 401 (expected)': (r) => r.status === 401 || r.status === 200 }) || errorRate.add(1);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'loadtest/summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  // simple textual summary
  const p = data.metrics;
  return `
========== k6 SMOKE TEST SUMMARY ==========
Total requests : ${p.http_reqs?.values?.count || 0}
Failure rate   : ${((p.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%
Avg latency    : ${(p.http_req_duration?.values?.avg || 0).toFixed(0)}ms
P95 latency    : ${(p.http_req_duration?.values['p(95)'] || 0).toFixed(0)}ms
P99 latency    : ${(p.http_req_duration?.values['p(99)'] || 0).toFixed(0)}ms
===========================================
`;
}
