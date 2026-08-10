# MVP Scope Definition — InterviewHub

This document defines the exact scope boundaries for the **InterviewHub Minimum Viable Product (MVP)**.

---

## 1. Primary MVP Objective
To provide a clean, high-performance, accessible interview preparation platform for IT students, fresh graduates, and junior developers, focusing initially on **Frontend Web Engineering** (HTML, CSS, JavaScript, React, TypeScript, Web Fundamentals, Git).

---

## 2. In-Scope MVP Feature Specifications

### 1. Landing Page (`/`) — Public
- Public hero section highlighting platform value proposition and frontend topics.

### 2. Question Bank (`/questions`) — Public
- Categorized list of vetted frontend interview questions with search and filter controls.

### 3. Question Search & Filtering (`/questions?q=...`) — Public
- Real-time keyword search and multi-criteria filters (Category, Difficulty: `Beginner`, `Junior`, `Intermediate`, Type: `Multiple Choice`, `True/False`).

### 4. Question Detail (`/questions/:questionId`) — Public
- Full question text, code snippets, markdown answer breakdown, interview tips, and reference links.

### 5. Bookmarking (`/bookmarks`) — Authenticated
- Save/unsave questions for quick revision (Requires logged-in user).

### 6. Quiz / Practice Generator (`/practice`) — Public
- Interactive builder (Category, Topic, Difficulty, Question Count) with single-question step UI.
- Anonymous users complete quizzes with temporary client-side score displays.

### 7. Persistent Quiz Result (`/results/:attemptId`) — Authenticated
- Persistent attempt records are user-owned data accessible strictly by the owning user (`auth.uid() = user_id`).
- Displays percentage score, correct/incorrect review, and topic accuracy breakdown.

### 8. Learning Progress & Dashboard (`/dashboard`, `/progress`) — Authenticated
- User dashboard showing streak status, completed question count, and category mastery breakdown.
- User menu links: **Dashboard**, **Progress**, **Logout** (Standalone `/profile` page is excluded).

### 9. Weak Topic Detection (`/progress#weak-topics`) — Authenticated
- Deterministic logic flagging topics with **< 70% accuracy** (minimum 3 attempts) for targeted practice.

### 10. Daily Challenge (`/daily-challenge`) — Public Entrypoint
- 5-question daily challenge updated once per calendar day.
- **Anonymous Users**: Can view and attempt challenge; results shown temporarily in local state. History and streaks are NOT stored.
- **Authenticated Users**: Completion is persisted, updates consecutive-day streak, and is limited to once per calendar day.

### 11. Basic Streak Tracking (`/dashboard`) — Authenticated
- Simple consecutive-day streak counter incremented by +1 upon Daily Challenge completion. Resets to 0 if a calendar day is missed.

### 12. Authentication (`/login`, `/register`) — Public
- Supabase Auth integration (Phase 5) supporting Email/Password login and registration.

### 13. Community Question Submission (`/community/submit`) — Authenticated
- Form allowing users to submit interview questions encountered in actual interviews (Enters `Pending` status).

### 14. Basic Admin Moderation (`/admin/community`) — Admin Only
- Admin review queue for users with `role === 'admin'`.
- Approve, Edit, or Reject community submissions.

---

## 3. Explicitly Out-of-Scope Features for MVP

- ❌ **Standalone Profile Management Page (`/profile`)**: Excluded from MVP. Profile data is integrated into Dashboard and User Menu.
- ❌ **AI Mock Interviewer**: AI-generated audio/text interview simulation.
- ❌ **Voice / Audio Evaluation**: Speech-to-text recording or verbal answer scoring.
- ❌ **Video Interview Practice**: Webcam recording or video response analysis.
- ❌ **Monetization & Payments**: Paid tiers, subscriptions, paywalls.
- ❌ **Chat & Messaging**: Direct messaging or peer chat rooms.
- ❌ **Native Mobile Applications**: iOS or Android native apps.
- ❌ **Real-Time Collaboration**: Collaborative pair-interviewing.
- ❌ **Private Company Banks**: Gated custom question banks for specific companies.
- ❌ **Advanced Recommendation AI**: Neural recommendation engine.
- ❌ **Complex Admin Analytics**: Multi-tenant analytics pipelines.
