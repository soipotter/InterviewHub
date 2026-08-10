# User Journeys & Workflow Specifications — InterviewHub

This document outlines the step-by-step user journeys for each persona interacting with InterviewHub.

---

## 1. Anonymous User Journey

```
[ Landing Page (/) ] 
       │
       ▼
[ Question Bank (/questions) ] 
       │
       ▼
[ Question Detail (/questions/:id) ] 
       │
       ├────────────────────────────────────────┐
       ▼                                        ▼
[ Practice Quiz (/practice) ]         [ Daily Challenge (/daily-challenge) ]
       │                                        │
       ▼                                        ▼
[ Temporary Client-Side Score ]       [ Temporary Score Review ]
(No persistent database attempt)      (Streak & history NOT stored)
       │                                        │
       └───────────────────┬────────────────────┘
                           │
                           ▼
             [ Prompt to Register / Login ]
```

### Steps & Detailed Behavior:
1. **Landing (`/`)**: Discovers platform value proposition and frontend topic categories (React, TS, JS, CSS, etc.).
2. **Browse & Filter (`/questions`)**: Views frontend questions with `Beginner`, `Junior`, and `Intermediate` difficulty badges.
3. **Question Detail (`/questions/:id`)**: Reads question statement, markdown explanation, code sample, interview tips, and reference links.
4. **Practice Quiz (`/practice`)**: Takes a practice quiz session.
   - *Result Privacy Rule*: Score and answer review are rendered **temporarily on the client-side**. No persistent attempt record (`/results/:attemptId`) is created in the database.
5. **Daily Challenge (`/daily-challenge`)**: Attempts the 5-question daily challenge.
   - *Daily Challenge Rule*: Score is displayed temporarily in local state. Streak increment and completion history are **NOT stored**.
6. **Prompt to Create Account**: Banner encourages registration/login to unlock persistent progress tracking, bookmarks, streaks, and saved quiz history.

---

## 2. Authenticated User Journey

```
[ Login (/login) ] ─────► [ Dashboard (/dashboard) ]
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
[ Daily Challenge ]       [ Practice Quiz ]         [ Question Bank ]
(/daily-challenge)           (/practice)               (/questions)
     │                           │                           │
     ▼                           ▼                           ▼
[ Persist & +1 Streak ]   [ View Saved Result ]     [ Bookmark Question ]
(Once per calendar day)    (/results/:attemptId)       (/bookmarks)
     │                           │                           │
     └───────────────────────────┴───────────────────────────┘
                                 │
                                 ▼
                     [ Progress & Weak Topics ]
                      (/progress & #weak-topics)
```

### Steps & Detailed Behavior:
1. **Login (`/login`)**: Enters email/password to log in. User dropdown menu displays: **Dashboard**, **Progress**, **Logout**.
2. **Dashboard (`/dashboard`)**: Sees current streak counter, daily challenge banner, category mastery, and saved bookmarks.
3. **Practice Quiz (`/practice`)**: Configures and completes a practice quiz.
4. **Persistent Quiz Result (`/results/:attemptId`)**: Quiz attempt is persisted to database. Result page `/results/:attemptId` is **Authenticated-only** and strictly accessible by the owning user (`auth.uid() = user_id`).
5. **Bookmark Question**: Saves questions from `/questions/:id` to `/bookmarks`.
6. **Progress & Weak Topics (`/progress`)**: Analyzes accuracy metrics. Topics under **70% accuracy** trigger a *"Weak Topic"* alert with a one-click practice recommendation.
7. **Daily Challenge (`/daily-challenge`)**: Completes the daily challenge.
   - *Streak Rule*: Completion is persisted to database, increments `current_streak` by +1, and is restricted to **once per calendar day**.

---

## 3. Community Contributor Journey

```
[ Authenticated User ] ──► [ Submit Question Form (/community/submit) ]
                                      │
                                      ▼
                            [ Status: Pending Review ]
                                      │
                                      ▼
                             [ Admin Review Queue ]
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                    [ Rejected ]              [ Approved ]
            (Feedback given to user)   (Published to Question Bank)
```

### Steps & Detailed Behavior:
1. **Submit Question (`/community/submit`)**: Logged-in user fills in question details, category, topic, difficulty, role, optional company, and source.
2. **Pending Review**: Entry saved with `status = 'pending'`.
3. **Admin Moderation**: Admin reviews submission in `/admin/community`.
4. **Approval & Publication**: If approved, status becomes `published`. The question appears publicly labeled as *"Community-Reported Interview Question"*.

---

## 4. Admin User Journey & Authorization Pipeline

```
[ Admin Login ] ──► [ Frontend Role Check ] ──► [ Admin Area (/admin) ]
                                                        │
                                                        ▼
                                          [ Review Queue (/admin/community) ]
                                                        │
                                                        ▼
                                         [ Supabase RLS Enforcement ]
                                         (auth.jwt() -> role === 'admin')
```

### Steps & Detailed Behavior:
1. **Admin Login**: Admin logs in. Frontend checks `user.role === 'admin'` to display `/admin` navigation links.
2. **Moderation Queue (`/admin/community`)**: Admin inspects pending community submissions, edits text/formatting if needed, and clicks **Approve** or **Reject**.
3. **Authorization Pipeline**: Frontend role checks control UI element visibility. Data modifications on `questions` and `community_submissions` are strictly authorized at the database level by **Supabase Row Level Security (RLS)**.
