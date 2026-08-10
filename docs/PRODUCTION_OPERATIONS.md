# InterviewHub Production Operations & Maintenance Manual

## 1. Environment & Architecture Overview

- **Production URL**: `https://interview-hubb.vercel.app`
- **GitHub Repository**: `https://github.com/soipotter/InterviewHub`
- **Production Branch**: `main`
- **Hosting & CDN**: Vercel (Vite + React SPA with HTML5 client-side rewrite)
- **Database & Backend**: Supabase PostgreSQL (Free Tier) + Auth + RLS + Stored Procedures (RPCs)
- **Observability**: Vercel Web Analytics (`@vercel/analytics` v2.0.1) + Vercel Speed Insights (`@vercel/speed-insights` v2.0.0)

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

## 3. Database Backup & Disaster Recovery Strategy

### Supabase Plan Facts
- **Current Plan**: Supabase Free Tier
- **Automatic Daily Backups**: NO (Pro / Team tier feature)
- **Point-In-Time Recovery (PITR)**: NO (Optional paid add-on on Pro / Team tiers)
- **Backup Retention**: N/A for Free Tier automatic backups

### Manual Logical Backup Commands (Mandatory for Free Tier)

Before applying structural migrations or data transformations, run a manual logical dump:

#### Windows PowerShell:
```powershell
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
npx supabase db dump --data-only -f "backup_$timestamp.sql"
```

#### Linux / macOS Bash:
```bash
npx supabase db dump --data-only -f "backup_$(date +%Y%m%d_%H%M%S).sql"
```

---

## 4. Authentication Email Configuration & Custom SMTP Setup

### Auth Email Configuration
- **Email Confirmation Required**: YES (`EMAIL_CONFIRMATION_REQUIRED = YES`)
- **Password Recovery Email Enabled**: YES (`PASSWORD_RECOVERY_EMAIL_ENABLED = YES`)
- **Custom SMTP Configured**: NO (`CUSTOM_SMTP_CONFIGURED = NO` — currently utilizing Supabase built-in default email provider)

### Signup Capacity & Launch Bottleneck
- **Status**: `SMTP BOTTLENECK`
- **Assessment**: The built-in Supabase email provider has a strict rate limit of approximately 3-4 emails per hour across the entire project. Inviting multiple beta users will cause email delivery failures (HTTP 429 rate limit error) during user registration.

### Custom SMTP Configuration Guide (Action Required for Launch)
To resolve the launch email bottleneck, the project administrator must configure a custom SMTP provider in the Supabase Dashboard:

1. **Dashboard Location**: `Supabase Dashboard -> Project Settings -> Authentication -> Email Settings / SMTP Settings`.
2. **Enable Custom SMTP**: Toggle "Enable Custom SMTP" to ON.
3. **Recommended Provider Options**:
   - **Resend** (Recommended): `smtp.resend.com` (Port 465/587)
   - **SendGrid**: `smtp.sendgrid.net` (Port 587)
   - **AWS SES**: `email-smtp.<region>.amazonaws.com` (Port 587)
4. **Input Credentials**: Provide Host, Port, Sender Email, Username, and API Key/Password. Save settings.
5. **Security Note**: Never commit SMTP passwords or API keys to git repositories.

---

## 5. Rollback Procedure

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
1. Log in to Vercel Dashboard -> InterviewHub project.
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

## 6. Public Beta Rollout Plan

### Stage A: Closed Beta (10 - 30 Users)
- **Prerequisite**: Custom SMTP configured in Supabase Dashboard.
- **Target Audience**: Internal testers, core contributors, and select IT students.
- **Duration**: 48 - 72 hours.
- **Monitoring Focus**: Auth session persistence, initial Supabase query latency, signup email delivery.

### Stage B: Expanded Beta (50 - 100 Users)
- **Target Audience**: Developer community, university tech clubs.
- **Duration**: 5 - 7 days.
- **Monitoring Focus**: Community question submissions, daily challenge participation, Vercel Speed Insights Web Vitals.

### Stage C: General Public Launch
- **Target Audience**: Public developer audience, social channels, job prep boards.
- **Gate Criteria to Advance to Next Stage**:
  - **Zero** unresolved P0 or P1 bugs.
  - **Zero** recurring authentication or session loss incidents.
  - Vercel Web Analytics and Speed Insights show healthy performance baselines.
  - Custom SMTP email delivery rate > 99%.

---

## 7. Operational Monitoring Checklist

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
  - Review user bug reports submitted via [docs/BUG_REPORT_TEMPLATE.md](file:///c:/Users/van%20hieu/Downloads/InterviewHub/docs/BUG_REPORT_TEMPLATE.md).
