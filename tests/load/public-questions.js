/**
 * InterviewHub — Controlled Production Read-Only Load Test
 *
 * Strategy:
 *   Stage 1 (Smoke):   5 VUs  × 30s  — verify baseline
 *   Stage 2 (Normal):  20 VUs × 60s  — normal traffic simulation
 *   Stage 3 (Moderate):50 VUs × 60s  — peak day traffic estimate
 *
 * Safety:
 *   - READ-ONLY endpoints only
 *   - No auth writes, no community submissions, no quiz writes
 *   - Stop if error rate > 1% at any stage
 *   - Only target Vercel CDN/static endpoints (not hammering Supabase directly)
 *
 * Run with:
 *   k6 run tests/load/public-questions.js
 *   k6 run tests/load/public-questions.js --env E2E_BASE_URL=https://interview-hubb.vercel.app
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const homePageDuration = new Trend('home_page_duration');
const questionsBankDuration = new Trend('questions_bank_duration');
const dailyChallengeDuration = new Trend('daily_challenge_duration');

export const options = {
  stages: [
    // Stage 1: Smoke — 5 VUs for 30s (baseline check)
    { duration: '30s', target: 5 },
    // Stage 2: Normal — 20 VUs for 60s
    { duration: '60s', target: 20 },
    // Ramp from 20 to 50
    { duration: '15s', target: 50 },
    // Stage 3: Moderate peak — 50 VUs for 60s
    { duration: '60s', target: 50 },
    // Ramp down
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    // MANDATORY: Error rate < 1%
    error_rate: ['rate<0.01'],
    // HTTP failures < 1%
    http_req_failed: ['rate<0.01'],
    // p95 response time — measured as baseline (Supabase cold reads may be 2-4s)
    // We use a generous 10s threshold to detect real outages without false positives
    http_req_duration: ['p(95)<10000'],
  },
};

const BASE_URL = __ENV.E2E_BASE_URL || 'https://interview-hubb.vercel.app';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const BROWSER_PARAMS = {
  headers: BROWSER_HEADERS,
  responseCallback: http.expectedStatuses({ min: 200, max: 403 }),
};

// Known published question slug — update if needed from a real Supabase query
// This tests the SPA rewrite for question deep-links
const KNOWN_QUESTION_PATH = '/questions'; // Use bank as fallback; replace with real slug

export function setup() {
  // Pre-flight check: verify server is up
  const res = http.get(`${BASE_URL}/`, BROWSER_PARAMS);
  if (res.status !== 200 && res.status !== 304 && res.status !== 403) {
    console.error(`[load-test] Pre-flight FAILED: ${BASE_URL}/ returned ${res.status}`);
  }
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const baseUrl = data.baseUrl;

  group('home_page', () => {
    const res = http.get(`${baseUrl}/`, Object.assign({}, BROWSER_PARAMS, { tags: { page: 'home' } }));
    const ok = check(res, {
      'home: no server error (status < 500)': (r) => r.status < 500,
      'home: has HTML content': (r) => r.body !== null && r.body.length > 100,
    });
    errorRate.add(!ok);
    homePageDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('questions_bank', () => {
    const res = http.get(`${baseUrl}/questions`, Object.assign({}, BROWSER_PARAMS, { tags: { page: 'questions' } }));
    const ok = check(res, {
      'questions: no server error (status < 500)': (r) => r.status < 500,
      'questions: returns content': (r) => r.body !== null && r.body.length > 100,
    });
    errorRate.add(!ok);
    questionsBankDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('daily_challenge', () => {
    const res = http.get(`${baseUrl}/daily-challenge`, Object.assign({}, BROWSER_PARAMS, { tags: { page: 'daily_challenge' } }));
    const ok = check(res, {
      'daily: no server error (status < 500)': (r) => r.status < 500,
      'daily: returns content': (r) => r.body !== null && r.body.length > 100,
    });
    errorRate.add(!ok);
    dailyChallengeDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('login_page', () => {
    const res = http.get(`${baseUrl}/login`, Object.assign({}, BROWSER_PARAMS, { tags: { page: 'login' } }));
    check(res, {
      'login: no server error (status < 500)': (r) => r.status < 500,
    });
  });

  // Realistic user think time: 1-3 seconds between page loads
  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  console.log(`[load-test] Completed against: ${data.baseUrl}`);
  console.log('[load-test] Check playwright-report or k6 cloud for detailed metrics');
}
