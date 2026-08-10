import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    // Level 1 — Smoke: 3 VUs for 30s
    { duration: '30s', target: 3 },
    // Level 2 — Normal: ramp to 20 VUs over 1m
    { duration: '1m', target: 20 },
    { duration: '1m', target: 20 },
    // Ramp down
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // Less than 1% of requests should fail
    errors: ['rate<0.01'],
    // 95th percentile response time under 5000ms (realistic for Supabase-backed SPA)
    http_req_duration: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.E2E_BASE_URL || 'https://interview-hubb.vercel.app';

export default function () {
  // 1. Public landing page
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'home status 200': (r) => r.status === 200,
    'home has content': (r) => r.body.length > 100,
  }) || errorRate.add(1);

  sleep(1);

  // 2. Questions page (SPA — returns index.html for all routes)
  const questionsRes = http.get(`${BASE_URL}/questions`);
  check(questionsRes, {
    'questions status 200': (r) => r.status === 200,
    'questions returns HTML': (r) => (r.headers['Content-Type'] || '').includes('text/html'),
  }) || errorRate.add(1);

  sleep(1);

  // 3. Daily challenge page
  const dailyRes = http.get(`${BASE_URL}/daily-challenge`);
  check(dailyRes, {
    'daily-challenge status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // 4. Login page
  const loginRes = http.get(`${BASE_URL}/login`);
  check(loginRes, {
    'login status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(Math.random() * 2 + 1);
}
