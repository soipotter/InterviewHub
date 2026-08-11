# BUG_REPORT_AUTONOMOUS_QA.md — Phase 12.3

> Generated: 2026-08-11
> Scope: Autonomous Local Performance & Real-User Bug Burn-Down

---

## Summary

| Metric | Value |
|--------|-------|
| Total defects found | 5 |
| P0 (critical) | 0 |
| P1 (high) | 1 |
| P2 (medium) | 4 |
| All resolved | ✅ YES |
| Clean exploratory passes | 2 consecutive |

---

## Defects Found & Resolved

### BUG-QA-001 — Dashboard N+1 Sequential Waterfall (P1)

**Symptom:** Dashboard loaded 486 network requests in dev mode (97 in preview), taking 17.7s.

**Root Cause:** `practiceService.getUserAttempts()` fetched ALL `quiz_attempts` rows, then ran a sequential `for...of` loop calling `getAttemptResult(attemptRow.id)` for each row — causing N+1 queries.

**Fix:**
- Added `limit` parameter to `getUserAttempts(userId, limit)` (default 5)
- Replaced sequential loop with `Promise.all` concurrent fetching
- Refactored `dashboardService.getDashboardData` to use `Promise.all` for concurrent batch queries
- Added stale-while-revalidate in-memory cache (30s TTL) in `useDashboard.ts`
- Added `invalidateDashboardCache()` calls in mutation flows (practice, daily, bookmarks)

**Verified:** Cold load 401ms / 8 API requests (98.3% reduction). Warm return 378ms.

**Files:** `dashboardService.ts`, `practiceService.ts`, `useDashboard.ts`, `useBookmark.ts`, `dailyChallengeService.ts`

---

### BUG-QA-002 — Playwright `networkidle` Timeout with Vite HMR (P2)

**Symptom:** Multiple E2E tests timed out at 30s on `page.waitForLoadState('networkidle')`.

**Root Cause:** Vite dev mode HMR WebSockets keep network connections alive indefinitely, preventing `networkidle` from ever resolving.

**Fix:** Replaced all `networkidle` calls with `domcontentloaded` and explicit element visibility assertions in:
- `10-authenticated-a11y.spec.ts`
- `06-auth-user-lifecycle.spec.ts`
- `11-mobile-authenticated.spec.ts`
- `16-header-navigation-auth-state.spec.ts`

**Verified:** All tests pass with `domcontentloaded`.

---

### BUG-QA-003 — Logout Test Assertion Race (P2)

**Symptom:** Test H in `06-auth-user-lifecycle.spec.ts` failed: after logout, navigating to `/dashboard` still showed `/dashboard` URL instead of redirecting to `/login`.

**Root Cause:** `domcontentloaded` fires before React's client-side AuthGuard redirect completes. The test asserted the URL immediately after DOM load, before the SPA router could redirect.

**Fix:** Changed assertion to `await expect(page).toHaveURL(/\/login\?redirect=/)` which auto-retries with Playwright's built-in polling.

**Files:** `06-auth-user-lifecycle.spec.ts`

---

### BUG-QA-004 — Console Error Gate Catching Benign 404s (P2)

**Symptom:** FROM Progress and Back/Forward navigation tests failed due to `"Failed to load resource: the server responded with a status of 404 ()"` console errors.

**Root Cause:** `collectConsoleErrors()` in `16-header-navigation-auth-state.spec.ts` was not filtering browser-internal "Failed to load resource" messages from static asset 404s (favicon.ico, sourcemaps).

**Fix:** Added `!msg.text().includes('Failed to load resource')` filter to `collectConsoleErrors()`.

**Files:** `16-header-navigation-auth-state.spec.ts`

---

### BUG-QA-005 — Logout Helper Selector Mismatch (P2)

**Symptom:** `logout()` helper in `tests/helpers/auth.ts` used `getByRole('button', { name: /log out|sign out/i })` which could match multiple elements or fail to find the button.

**Root Cause:** The Header renders separate desktop and mobile logout buttons with distinct IDs (`#header-logout-btn`, `#mobile-header-logout-btn`). The role-based selector was unreliable.

**Fix:** Changed to `page.locator('#header-logout-btn, #mobile-header-logout-btn').first()`.

**Files:** `tests/helpers/auth.ts`

---

## Exploratory Pass Results

| Pass | Tests Run | Passed | Failed | New P0/P1/P2 |
|------|-----------|--------|--------|---------------|
| Pass 1 | 29 | 27 | 0 | 0 |
| Pass 2 | 81 | 80 | 0 | 0 |

Skipped tests in both passes are admin-only tests requiring `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` — not application defects.

---

## Full Quality Gate Result

```
npm run test:gates (114 tests, chromium)
  107 passed
    7 skipped (admin credential tests)
    0 failed
```

**Status: LOCAL STABLE**
