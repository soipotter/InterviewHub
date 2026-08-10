# Database Blueprint — InterviewHub (Supabase / PostgreSQL)

> [!NOTE]
> Supabase database integration is active in **Phase 5** & **Phase 6**.
> This document defines the relational database schema, tables, and row-level security (RLS) policies deployed for the MVP.

---

## 1. Entity-Relationship Overview

```
+------------------+         +----------------------+         +-------------------+
|      users       | <------ |      bookmarks       | ------> |     questions     |
+------------------+         +----------------------+         +-------------------+
        ^                                                               ^
        |                                                               |
+------------------+         +----------------------+         +-------------------+
|  quiz_attempts   | <------ |     quiz_answers     |         |    categories     |
+------------------+         +----------------------+         +-------------------+
        ^                                                               
        |                                                               
+-----------------------------+         +----------------------------------+
| daily_challenge_completions | ------> |         daily_challenges         |
+-----------------------------+         +----------------------------------+
                                                        ^
                                                        |
                                        +----------------------------------+
                                        |    daily_challenge_questions     |
                                        +----------------------------------+
```

---

## 2. Core Table Specifications

### `users` (Managed by Supabase Auth & public profile mirror)
- `id`: UUID (Primary Key, references `auth.users.id`)
- `email`: TEXT (Unique, Not Null)
- `full_name`: TEXT
- `role`: TEXT DEFAULT 'user' ('user', 'admin')
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### `categories`
- `id`: UUID (Primary Key)
- `name`: TEXT (Unique, Not Null) -- e.g. "HTML", "CSS", "JavaScript", "React", "TypeScript", "Web Fundamentals", "Git"
- `slug`: TEXT (Unique, Not Null)
- `description`: TEXT
- `icon_name`: TEXT
- `sort_order`: INTEGER NOT NULL DEFAULT 0

### `questions`
- `id`: TEXT (Primary Key)
- `category_id`: UUID (Foreign Key -> `categories.id`)
- `title`: TEXT (Not Null)
- `slug`: TEXT (Unique, Not Null)
- `topic`: TEXT (Not Null)
- `type`: TEXT (Enum: `'Multiple Choice'`, `'True/False'`)
- `difficulty`: TEXT (Enum: `'Beginner'`, `'Junior'`, `'Intermediate'`)
- `short_summary`: TEXT
- `explanation`: TEXT
- `interview_tip`: TEXT
- `code_snippet`: TEXT
- `options`: JSONB (Array of option strings)
- `correct_answer`: TEXT
- `tags`: TEXT[] (Array of lowercase tags e.g. `['react', 'hooks']`)
- `sources`: JSONB (Array of reference links `[{ name: 'MDN', url: '...' }]`)
- `status`: TEXT DEFAULT 'published' ('published', 'draft', 'archived')
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### `bookmarks`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> `users.id` ON DELETE CASCADE)
- `question_id`: TEXT (Foreign Key -> `questions.id` ON DELETE CASCADE)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- *Constraint*: UNIQUE(`user_id`, `question_id`)

### `quiz_attempts` & `quiz_answers`
- `quiz_attempts.id`: TEXT (Primary Key)
- `quiz_attempts.user_id`: UUID (Foreign Key -> `users.id` ON DELETE CASCADE)
- `quiz_answers.attempt_id`: TEXT (Foreign Key -> `quiz_attempts.id` ON DELETE CASCADE)
- `quiz_answers.question_id`: TEXT (Foreign Key -> `questions.id` ON DELETE CASCADE)

### `daily_challenges` [Phase 6A/6A.1]
- `id`: UUID (Primary Key)
- `challenge_date`: DATE (Unique, Not Null, Canonical UTC)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### `daily_challenge_questions` [Phase 6A/6A.1]
- `challenge_id`: UUID (Foreign Key -> `daily_challenges.id` ON DELETE CASCADE)
- `question_id`: TEXT (Foreign Key -> `questions.id` ON DELETE CASCADE)
- `position`: SMALLINT NOT NULL (CHECK 1..5)
- *Constraint*: UNIQUE(`challenge_id`, `question_id`), UNIQUE(`challenge_id`, `position`)

### `daily_challenge_completions` [Phase 6A/6A.1]
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> `users.id` ON DELETE CASCADE)
- `challenge_id`: UUID (Foreign Key -> `daily_challenges.id` ON DELETE CASCADE)
- `attempt_id`: TEXT (Foreign Key -> `quiz_attempts.id` ON DELETE CASCADE)
- `completed_at`: TIMESTAMPTZ DEFAULT NOW()
- *Constraint*: UNIQUE(`user_id`, `challenge_id`)

---

## 3. Security Strategy & RPC Functions

### Daily Challenge Security Strategy
- **Canonical UTC Resolution**: Public zero-argument RPC `get_daily_challenge()` resolves `(NOW() AT TIME ZONE 'UTC')::DATE` internally. Public clients cannot supply date arguments to generate arbitrary historical/future challenges.
- **Transaction Advisory Locking**: `pg_advisory_xact_lock(hashtext(v_target_date::TEXT))` serializes concurrent first requests at midnight UTC safely.
- **Strict Question Set Validation**: `complete_daily_challenge(p_challenge_id, p_attempt_id)` compares `daily_challenge_questions` against `quiz_answers` using exact 5-question ID set equality. Attempts from ordinary Practice quizzes are rejected.
- **RLS & Execution Grants**: `get_daily_challenge()` granted to `anon` and `authenticated`. `complete_daily_challenge()` granted strictly to `authenticated` (`auth.uid() = user_id`).

## 4. Atomic Submission RPC - submit_daily_challenge [Phase 6C]
Sole frontend entry-point for authenticated Daily Challenge persistence.
Atomically writes quiz_attempts + quiz_answers + daily_challenge_completions in one transaction.

- SECURITY DEFINER SET search_path = ''
- User identity from auth.uid() only - no frontend user_id accepted
- Advisory lock on hashtext(userId || challengeId) prevents concurrent duplicates
- Idempotent: returns existing completion if already completed
- Today-only: challenge_date = (NOW() AT TIME ZONE 'UTC')::DATE
- Database-authoritative scoring: correct_answer loaded from public.questions server-side
- complete_daily_challenge() is REVOKED from all client roles (Phase 6C)

## 5. Streak Derivation [Phase 6C]
Streak is NEVER stored as a mutable column in public.users.
Source of truth: daily_challenge_completions JOIN daily_challenges.challenge_date.

src/features/dailyChallenge/utils/streakUtils.ts computes from YYYY-MM-DD strings:
- currentStreak: Consecutive days ending today or yesterday (UTC). Gap older than yesterday = 0.
- longestStreak: Maximum consecutive run in full completion history.
All arithmetic is UTC-safe using string-based day-index calculation to prevent timezone bugs.

## 6. Community Questions Remediation - submit_community_question [Phase 7A.1]
Database schema and security remediation for user-submitted community questions:

- Schema additions: options (JSONB), correct_answer (TEXT), code_snippet (TEXT), interview_tip (TEXT)
- Triggers: trg_validate_community_question BEFORE INSERT OR UPDATE validates question type, options array structure, and ensures correct_answer is present in options array (for Multiple Choice) or is 'True'/'False' (for True/False).
- Security RPC: public.submit_community_question(p_title, p_category_id, p_topic, p_difficulty, p_type, p_short_summary, p_explanation, p_options, p_correct_answer, p_code_snippet, p_interview_tip)
  - SECURITY DEFINER SET search_path = ''
  - user_id derived exclusively from auth.uid()
  - status forced to 'pending' (moderated_by = NULL, rejection_reason = NULL)
  - REVOKED FROM PUBLIC, anon; GRANTED TO authenticated
- Direct Table INSERT: Direct INSERT policy for authenticated users is REVOKED. All submissions must pass through the secure submit_community_question RPC.

## 7. Community Moderation RPCs - approve_community_question & reject_community_question [Phase 8C]
Database-authoritative atomic moderation for community question submissions:

- **Linkage Column**: `published_question_id TEXT UNIQUE REFERENCES public.questions(id) ON DELETE RESTRICT`
- **Moderation State Invariant (CHECK Constraint `chk_community_question_moderation_state`)**:
  - `pending`: `status = 'pending' AND moderated_by IS NULL AND rejection_reason IS NULL AND published_question_id IS NULL`
  - `approved`: `status = 'approved' AND moderated_by IS NOT NULL AND rejection_reason IS NULL AND published_question_id IS NOT NULL`
  - `rejected`: `status = 'rejected' AND moderated_by IS NOT NULL AND TRIM(rejection_reason) <> '' AND published_question_id IS NULL`
- **Approval RPC (`public.approve_community_question(p_submission_id UUID)`)**:
  - Verifies caller `auth.uid()` has `role = 'admin'` in `public.users`.
  - Locks submission row `FOR UPDATE` to prevent concurrency races.
  - Idempotent: returns `alreadyModerated = true` if already approved.
  - Re-validates category existence and question structure before publication.
  - Generates deterministic published question ID (`comm-<submission-id-clean>`) and unique slug.
  - Atomically performs `INSERT INTO public.questions` and `UPDATE public.community_questions` in one PostgreSQL transaction.
- **Rejection RPC (`public.reject_community_question(p_submission_id UUID, p_rejection_reason TEXT)`)**:
  - Verifies caller `auth.uid()` has `role = 'admin'` in `public.users`.
  - Validates `p_rejection_reason` is non-empty after trimming.
  - Locks submission row `FOR UPDATE`.
  - Atomically sets `status = 'rejected'`, `moderated_by = auth.uid()`, `rejection_reason = TRIM(p_rejection_reason)`.
- **Security & Privileges**: `REVOKED FROM PUBLIC, anon; GRANTED TO authenticated`. Non-admin authenticated callers fail internal DB admin check.

