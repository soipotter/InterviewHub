# Live Bug Inventory — Phase 13 Production Burn-In

| Bug ID | Severity | Route | Description | Root Cause | Regression Test | Fix Commit | Status |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| BUG-13.1-01 | P1 | `/questions/comm-*` | Community published question link rendered "Question Not Found" | `getQuestionById` used `startsWith('q-')` which failed for `comm-` IDs, querying `slug` instead of `id` | `scratch/test_query.cjs` & `tests/e2e/22-community-publish-linkage.spec.ts` | `b720978` | **CLOSED** |

## Summary
- Total Defects Discovered: **1** (P0: 0, P1: 1, P2: 0, P3: 0)
- Total Defects Resolved: **1**
- Production Retest (5/5 Repetitions): **PASS** (5/5 PASS)
- Verification Status: **COMMUNITY PUBLICATION STABLE**
