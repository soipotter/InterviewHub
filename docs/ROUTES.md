# Route Architecture — InterviewHub

This document specifies the client-side URL route structure for InterviewHub powered by `react-router-dom`.

---

## 1. Complete Route Specification Table

| Route Path | View / Component | Access Level | Description |
|---|---|---|---|
| `/` | `LandingPage` | **Public** | Platform overview, topic highlights, primary CTA |
| `/questions` | `QuestionBankPage` | **Public** | Question list with search, category & difficulty filters |
| `/questions/:questionId` | `QuestionDetailPage` | **Public** | Detailed question breakdown, explanation, code example |
| `/practice` | `PracticeQuizPage` | **Public** | Quiz builder & active quiz session (Client-side for anonymous) |
| `/practice/:quizId` | `ActiveQuizPage` | **Public** | Active session for a specific generated quiz |
| `/daily-challenge` | `DailyChallengePage` | **Public** | 5-question daily challenge (Temporary for anonymous; Saved for auth) |
| `/login` | `LoginPage` | **Public** | User authentication login form |
| `/register` | `RegisterPage` | **Public** | User account registration form |
| `/results/:attemptId` | `QuizResultPage` | **Authenticated** | Persistent quiz score, percentage, answer review, & topic breakdown |
| `/dashboard` | `DashboardPage` | **Authenticated** | User home dashboard, streak status, quick actions |
| `/bookmarks` | `BookmarksPage` | **Authenticated** | Saved question bank for revision |
| `/progress` | `ProgressPage` | **Authenticated** | Category mastery metrics & weak topic diagnostics |
| `/community/submit` | `SubmitQuestionPage` | **Authenticated** | Community interview question submission form |
| `/admin` | `AdminDashboardPage` | **Admin Only** | Overview of moderation queue and admin controls |
| `/admin/community` | `AdminCommunityPage` | **Admin Only** | Pending moderation queue to review community submissions |
| `/admin/community/:submissionId` | `AdminCommunityDetailPage` | **Admin Only** | Read-only inspection detail view of a single community submission |

---

## 2. Route Access Categories & Privacy Rules

### A. Public Routes (No Authentication Required)
Accessible to all visitors. Allows anonymous users to explore content and try practice quizzes before registering.
- `/`
- `/questions`
- `/questions/:questionId`
- `/practice`
- `/practice/:quizId`
- `/daily-challenge`
- `/login`
- `/register`

#### Daily Challenge Behavior (`/daily-challenge` - Public)
- **Anonymous Users**: Can view and attempt the daily challenge. Results are displayed temporarily in local state. History and streaks are NOT stored. Prompted to log in/register to save completion and streak.
- **Authenticated Users**: Completion is persisted to database, updates user streak, and is restricted to once per calendar day.

### B. Authenticated Routes (Requires Logged-In User)
Requires an active user session (`auth.uid() !== null`). If accessed anonymously, the app redirects to `/login?redirectTo=<path>`.
- `/results/:attemptId` *(Persistent quiz attempt history strictly locked to the owner via Supabase RLS)*
- `/dashboard`
- `/bookmarks`
- `/progress`
- `/community/submit`

#### Quiz Result Privacy Rule (`/results/:attemptId` - Authenticated)
- Persistent attempts and stored quiz results are user-owned data.
- Anonymous quiz takers view immediate, temporary client-side results at the end of `/practice` without creating a persistent `/results/:attemptId` record.
- Access to persistent `/results/:attemptId` requires authentication and is restricted to the owning user.

### C. Admin Routes (Requires Admin Privileges)
Requires an active user session with `user.role === 'admin'`.
- `/admin`
- `/admin/community`

*Note: Frontend role checks control UI element visibility and routing boundaries. Database authorization is strictly enforced by Supabase Row-Level Security (RLS).*

---

## 3. Navigation Layouts Specification

### Desktop Navigation Structure
- **Primary Public Links**: `Home` (`/`), `Questions` (`/questions`), `Practice` (`/practice`), `Daily Challenge` (`/daily-challenge`).
- **User Dropdown Menu**: `Dashboard` (`/dashboard`), `Progress` (`/progress`), `Logout`. *(Note: Standalone Profile page is excluded from MVP).*
- **Admin Navigation** *(Visible ONLY when `role === 'admin'`)*: `Admin` (`/admin`), `Review Queue` (`/admin/community`).

### Mobile Navigation Structure
- **Bottom Navigation Bar**: `Home` (`/`), `Questions` (`/questions`), `Practice` (`/practice`), `Daily` (`/daily-challenge`).
- **Slide-Over Drawer**: Links to `Dashboard`, `Bookmarks`, `Progress`, `Submit Question`, and Admin links (if privileged).

---

## 4. Recommended Layout Wrappers (React Router v6 Outlet Structure)

```tsx
<Routes>
  {/* Main Layout Shell */}
  <Route element={<MainLayout />}>
    {/* Public Routes */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/questions" element={<QuestionBankPage />} />
    <Route path="/questions/:questionId" element={<QuestionDetailPage />} />
    <Route path="/practice" element={<PracticeQuizPage />} />
    <Route path="/practice/:quizId" element={<ActiveQuizPage />} />
    <Route path="/daily-challenge" element={<DailyChallengePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* Authenticated User Routes */}
    <Route path="/results/:attemptId" element={<QuizResultPage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/bookmarks" element={<BookmarksPage />} />
    <Route path="/progress" element={<ProgressPage />} />
    <Route path="/community/submit" element={<SubmitQuestionPage />} />
  </Route>

  {/* Admin Layout Shell */}
  <Route element={<AdminLayout />}>
    <Route path="/admin" element={<AdminDashboardPage />} />
    <Route path="/admin/community" element={<AdminModerationPage />} />
  </Route>
</Routes>
```
