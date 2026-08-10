# InterviewHub Production Operations & Maintenance Manual

## 1. Environment & Architecture Overview

- **Production URL**: `https://interview-hubb.vercel.app`
- **GitHub Repository**: `https://github.com/soipotter/InterviewHub`
- **Production Branch**: `main`
- **Hosting & CDN**: Vercel (Vite + React SPA with HTML5 client-side rewrite)
- **Database & Backend**: Supabase PostgreSQL + Auth + RLS + Stored Procedures (RPCs)
- **Observability**: Vercel Web Analytics (`@vercel/analytics`) + Vercel Speed Insights (`@vercel/speed-insights`)

---

## 2. Continuous Deployment Flow

### Application Code Deployment
1. Developers commit & push changes to `main` branch.
2. Vercel automatically detects the push on `main` and triggers a production build:
   - Run typecheck: `npm run typecheck`
   - Run linter: `npm run lint`
   - Build assets: `npm run build`
3. Upon build success, Vercel deploys the compiled bundle to `https://interview-hubb.vercel.app`.

### Database Schema Migration Flow
1. Create a new timestamped migration file under `supabase/migrations/YYYYMMDDHHMMSS_description.sql`.
2. Test schema changes locally or on a staging branch.
3. Apply migration to remote production Supabase:
   ```bash
   npx supabase db push
   ```
4. **CRITICAL**: Never modify existing deployed migrations. Always create new additive/corrective migration files.

---

## 3. Disaster Recovery & Backup Strategy

### Automated Backups
- Supabase automatically maintains daily database backups and point-in-time recovery (PITR) snapshots.

### Manual Database Backups
- Before applying major structural migrations or data transformations, create a manual logical backup:
  ```bash
  npx supabase db dump --data-only -f backup_$(date +%Y%m%d_%H%M%S).sql
  ```

---

## 4. Rollback Procedure

If a breaking issue or critical bug reaches production:

### Application Code Rollback (Recommended Standard)
1. Identify the problematic commit hash (`<bad-commit>`).
2. Create a clean git revert commit on `main`:
   ```bash
   git revert <bad-commit>
   ```
3. Push the revert commit to `main`:
   ```bash
   git push origin main
   ```
4. Vercel will build and deploy the reverted codebase automatically within 1-2 minutes.
5. **DO NOT** use `git push --force` or rewrite remote Git history.

### Immediate Vercel Rollback (Instant Mitigation)
1. Log in to the Vercel Dashboard -> InterviewHub project.
2. Navigate to **Deployments**.
3. Locate the last known healthy deployment prior to the bad commit.
4. Click `...` -> **Promote to Production**. This instantly updates the CDN routing to the previous build while the code fix is prepared.

### Database Migration Rollback
1. **Never casually roll database migrations backwards** in production.
2. If a migration causes runtime errors, apply a corrective **forward migration**:
   - Create a new migration file `supabase/migrations/<new_timestamp>_revert_<feature>.sql`.
   - Write the corrective SQL (`ALTER TABLE`, `DROP COLUMN`, `CREATE OR REPLACE FUNCTION`).
   - Push to production using `npx supabase db push`.

---

## 5. Public Beta Rollout Plan

### Stage A: Closed Beta (10 - 30 Users)
- **Target Audience**: Internal testers, core contributors, and select IT students.
- **Duration**: 48 - 72 hours.
- **Monitoring Focus**: Auth session persistence, initial Supabase query latency, login rate limits.

### Stage B: Expanded Beta (50 - 100 Users)
- **Target Audience**: Developer community, university tech clubs.
- **Duration**: 5 - 7 days.
- **Monitoring Focus**: Community question submissions, daily challenge participation, Vercel Speed Insights Web Vitals (LCP, CLS, INP).

### Stage C: General Public Launch
- **Target Audience**: Public developer audience, social channels, job prep boards.
- **Gate Criteria to Advance to Next Stage**:
  - **Zero** unresolved P0 or P1 bugs.
  - **Zero** recurring authentication or session loss incidents.
  - Vercel Web Analytics and Speed Insights show healthy performance baselines.
  - Supabase database resource utilization (CPU, RAM, Connections) remain under 50% capacity.

---

## 6. Operational Monitoring Checklist

### Daily Developer Inspection
- **Vercel Dashboard**:
  - Check **Web Analytics**: Real-time pageviews, top routes, top referrers.
  - Check **Speed Insights**: Core Web Vitals score (LCP, FID/INP, CLS).
  - Check **Deployment Logs**: Ensure zero build failures or 500 runtime rendering errors.
- **Supabase Dashboard**:
  - Check **API & Database**: Request volume, database response latency.
  - Check **Auth Logs**: Monitor failed login attempts, signup rates, and 429 rate-limit errors.
  - Check **Security Advisor**: Ensure RLS policies and function execution roles remain locked down.
  - Check **Performance Advisor**: Audit sequential scans and verify FK index efficiency.
- **Application Level**:
  - Audit new community question submissions in `/admin/community`.
  - Review user bug reports submitted via the standard bug template.
