# Product Requirements Document (PRD) — InterviewHub

## 1. Executive Summary
**InterviewHub** is a professional interview preparation platform tailored for IT students, fresh computer science graduates, and junior software developers. The application provides structured, high-yield interview preparation through curated technical questions, in-depth explanations, interactive practice quizzes, daily challenges, personalized progress tracking, weak-topic detection, and community question contributions.

During the MVP release, InterviewHub focuses strictly on **Frontend Developer** technical interview preparation.

---

## 2. Target Audience & Personas
- **IT Students & Fresh Graduates**: Preparing for campus placement drives or entry-level software engineering interviews. Requires organized category roadmaps, foundational concepts, and clear code explanations.
- **Junior Developers (0–2 years experience)**: Looking to transition to stronger engineering roles or prepare for frontend stack interviews (React, TypeScript, JavaScript, CSS). Needs quick practice quizzes, bookmarking, and weak-topic diagnostics.
- **Self-Taught Developers**: Seeking structured, peer-reviewed interview practice questions and daily preparation habits.

---

## 3. Product Vision & Primary Goals
1. **Curated Technical Questions**: Deliver high-quality, verified questions across core frontend engineering domains.
2. **Clear Explanations & Examples**: Provide comprehensive answer breakdowns, interview tips, and practical code snippets.
3. **Practice Quizzes**: Enable timed and untimed multiple-choice/true-false quiz sessions with immediate scoring and feedback.
4. **Daily Challenges & Streaks**: Encourage daily preparation habits through 5-question daily challenges and consecutive-day streaks.
5. **Progress Tracking & Analytics**: Help users visualize completion rates and topic mastery over time.
6. **Weak-Topic Detection**: Automatically flag topics where accuracy drops below 70% to guide targeted practice.
7. **Community Contribution**: Allow users to share real-world interview questions with an admin moderation safety net.

---

## 4. MVP Technical Scope & Categories

The MVP initial content taxonomy focuses **exclusively on Frontend Engineering**:

- **HTML**: Semantic elements, accessibility (aria), DOM structure, HTML5 forms & APIs.
- **CSS**: Layouts (Flexbox, Grid), specificity, responsive design, animations, Tailwind CSS.
- **JavaScript**: ES6+ syntax, closures, promises/async-await, event loop, prototype chain, DOM manipulation.
- **React**: Component lifecycle, hooks (`useState`, `useEffect`, custom hooks), state management, rendering optimization, JSX.
- **TypeScript**: Types vs. interfaces, generics, utility types, type narrowing, strict compiler configuration.
- **Web Fundamentals**: HTTP/HTTPS, browser rendering pipeline, CORS, web storage (localStorage, cookies), performance metrics.
- **Git**: Branching strategies, rebase vs. merge, stash, cherry-pick, conflict resolution, workflow conventions.

> [!IMPORTANT]
> **Out of Scope for MVP**: Backend languages (Java, C#, Python, Go), DevOps, Cloud Infrastructure, and Complex System Design are explicitly excluded during MVP.

---

## 5. MVP Feature Specifications & Access Rules

### 1. Landing Page (`/`) — Public
- Public hero section highlighting platform value proposition.
- Quick topic entry points (HTML, CSS, JS, React, TS, Web Fundamentals, Git) and CTA to browse or try a practice quiz.

### 2. Question Bank (`/questions`) — Public
- Comprehensive list of vetted frontend interview questions with Category, Difficulty, and Tag filters.

### 3. Question Search & Filtering (`/questions?q=...`) — Public
- Real-time keyword search across titles, summaries, and tags. Multi-criteria filter by Category, Difficulty (`Beginner`, `Junior`, `Intermediate`), and Type (`Multiple Choice`, `True/False`).

### 4. Question Detail (`/questions/:questionId`) — Public
- Full question text, code snippets, markdown answer explanation, interview tips, and reference links (MDN, React, TS, Git docs).

### 5. Bookmarking (`/bookmarks`) — Authenticated
- Save/unsave questions for quick revision (Requires logged-in user).

### 6. Quiz / Practice Generator (`/practice`) — Public
- Interactive builder (Category, Topic, Difficulty, Question Count).
- Anonymous users can complete quizzes with immediate client-side results (results are temporary and not saved to database).

### 7. Persistent Quiz Result (`/results/:attemptId`) — Authenticated
- Persistent attempt records are user-owned data accessible strictly by the owning user (`auth.uid() = user_id`).
- Displays percentage score `(correct / total) * 100`, correct/incorrect review, and topic accuracy breakdown.

### 8. Learning Progress & Dashboard (`/dashboard`, `/progress`) — Authenticated
- User dashboard displaying streak counter, overall accuracy, completed count, and category breakdown.
- User dropdown menu contains: **Dashboard**, **Progress**, **Logout**. *(Note: Standalone Profile page is excluded from MVP).*

### 9. Weak Topic Detection (`/progress#weak-topics`) — Authenticated
- Deterministic logic flagging topics with **< 70% accuracy** (minimum 3 attempts) for targeted practice.

### 10. Daily Challenge (`/daily-challenge`) — Public Entrypoint
- 5-question daily challenge set updated once per calendar day.
- **Anonymous Users**: Can view and attempt challenge; score shown temporarily in local state. Streak and history are NOT stored. Prompted to log in/register.
- **Authenticated Users**: Completion is persisted, updates consecutive-day streak, and is limited to once per calendar day.

### 11. Basic Streak Tracking (`/dashboard`) — Authenticated
- Consecutive-day activity counter incremented by +1 upon Daily Challenge completion. Resets to 0 if a calendar day is missed.

### 12. Authentication (`/login`, `/register`) — Public
- User registration, login, and session retention powered by Supabase Auth (Phase 5).

### 13. Community Question Submission (`/community/submit`) — Authenticated
- Form for logged-in users to submit interview questions encountered in interviews (Enters `Pending` state).

### 14. Basic Admin Moderation (`/admin/community`) — Admin Only
- Review queue for admin users to Approve, Edit, or Reject community submissions.

---

## 6. Out of Scope for MVP (Future Enhancements)
- Standalone Profile Management Page (`/profile`)
- AI Interviewer & Automated Mock Interviews
- Voice & Video Interview Practice
- Monetization, Payments & Subscription Tiers
- Direct Messaging & Real-Time Chat
- Native Mobile Applications (iOS / Android)
- Real-Time Collaborative Practice
- Private Company Question Banks
- Advanced Machine Learning Recommendation Engines
- Complex Admin Analytics

---

## 7. Non-Functional Requirements
- **Performance**: FCP < 1.2s, LCP < 2.0s.
- **Accessibility**: WCAG 2.1 Level AA compliance.
- **Responsiveness**: Pixel-perfect layout across Mobile (< 640px), Tablet (640px–1024px), Desktop (> 1024px).
- **Type Safety**: 100% strict TypeScript types (`tsc --noEmit`).
- **Security & Authorization Pipeline**:
  `Authentication` → `User identity` → `User role data` → `Frontend UI visibility` → `Supabase RLS enforcement`
