# InterviewHub Production Deployment Guide (Vercel & Supabase)

This document provides step-by-step instructions for deploying InterviewHub to **Vercel** with **Supabase** backend authentication and database infrastructure.

---

## 1. Vercel Build Configuration

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `./` (repository root)

### Single Page Application (SPA) Routing
InterviewHub uses React Router for client-side navigation. `vercel.json` is configured at the project root to redirect all route paths to `/index.html`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 2. Environment Variables Configuration

Configure the following **browser-safe** public environment variables in **Vercel Project Settings → Environment Variables**:

| Variable Name | Environment | Description | Public / Secret |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Production & Preview | URL of your remote Supabase project (`https://<project-id>.supabase.co`) | **Public** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production & Preview | Supabase Publishable / Anon public key | **Public** |
| `VITE_SUPABASE_ANON_KEY` | Production & Preview | (Optional legacy alias) Same value as publishable key | **Public** |

> [!CAUTION]
> **DO NOT** add `SUPABASE_SERVICE_ROLE_KEY`, database passwords, or JWT secrets to Vercel environment variables. Only public client credentials should be exposed in Vite environment variables.

---

## 3. Supabase Auth URL Configuration

After your Vercel deployment domain is live (e.g. `https://interviewhub.vercel.app`), configure Supabase Authentication settings in the **Supabase Dashboard → Authentication → URL Configuration**:

### A. Site URL
Set the canonical production domain:
```
https://interviewhub.vercel.app
```

### B. Redirect URLs
Add allowed redirect URLs for auth flows (Login, Signup, Magic Link, Password Reset):
1. **Production Pattern**:
   ```
   https://interviewhub.vercel.app/**
   ```
2. **Local Development Pattern**:
   ```
   http://localhost:5173/**
   ```
3. **Vercel Preview Deployment Wildcard** (Replace `<team-slug>` with your Vercel team/account slug):
   ```
   https://*-<team-slug>.vercel.app/**
   ```

---

## 4. Deployment Steps

### Option A: Vercel Git Integration (Recommended)
1. Push the repository to GitHub/GitLab/Bitbucket.
2. In Vercel, click **Add New Project** and import the repository.
3. Select `Vite` framework preset.
4. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Click **Deploy**.

### Option B: Vercel CLI Deployment
```bash
# Preview Deployment
npx vercel

# Production Deployment
npx vercel --prod
```

---

## 5. Post-Deployment Production Smoke Test Checklist

After deployment, verify the following core paths on the live production domain:

- [ ] **Home / Landing**: `https://<domain>/` loads cleanly.
- [ ] **Question Bank**: `https://<domain>/questions` displays published Supabase questions, category filters, and search work.
- [ ] **Question Detail**: `https://<domain>/questions/:questionId` loads deep-linked question content without 404.
- [ ] **Daily Challenge**: `https://<domain>/daily-challenge` displays today's canonical 5 questions.
- [ ] **Auth Flow**: User Signup & Login redirect cleanly and persist session.
- [ ] **Protected Dashboard**: `https://<domain>/dashboard` displays stats for logged-in user.
- [ ] **Community Submission**: `https://<domain>/community/submit` submits pending question to database via RPC.
- [ ] **Admin Console**: `https://<domain>/admin` blocks non-admins with 403 `UnauthorizedView` and allows authenticated Admins to inspect the moderation queue.
- [ ] **SPA Refresh**: Direct browser refresh on any deep link returns the application view without a platform 404.
