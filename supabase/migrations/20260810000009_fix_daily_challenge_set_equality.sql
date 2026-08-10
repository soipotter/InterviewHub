-- Migration ID: 20260810000009_fix_daily_challenge_set_equality.sql
-- Implements TRUE bidirectional set-equality check in complete_daily_challenge
-- and adds UNIQUE(attempt_id, question_id) constraint to quiz_answers after duplicate check.

-- 1. ADD UNIQUE CONSTRAINT ON quiz_answers(attempt_id, question_id) IF NO DUPLICATES EXIST
--    (Raises an exception and aborts if duplicates are found, preventing silent data corruption.)
DO $$
DECLARE
  v_dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_dup_count
  FROM (
    SELECT attempt_id, question_id
    FROM public.quiz_answers
    GROUP BY attempt_id, question_id
    HAVING COUNT(*) > 1
  ) dupes;

  IF v_dup_count > 0 THEN
    RAISE EXCEPTION 'Cannot add UNIQUE(attempt_id, question_id): % duplicate (attempt_id, question_id) pair(s) found in quiz_answers. Manual cleanup required before applying this migration.', v_dup_count;
  END IF;
END;
$$;

ALTER TABLE public.quiz_answers
  ADD CONSTRAINT uq_quiz_answers_attempt_question UNIQUE (attempt_id, question_id);

-- 2. REPLACE complete_daily_challenge WITH TRUE BIDIRECTIONAL SET-EQUALITY
CREATE OR REPLACE FUNCTION public.complete_daily_challenge(
  p_challenge_id UUID,
  p_attempt_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_attempt_user_id UUID;
  v_attempt_completed TIMESTAMPTZ;
  v_challenge_question_count INTEGER;
  v_attempt_answer_count INTEGER;
  v_attempt_distinct_question_count INTEGER;
BEGIN
  -- 1. Require authenticated session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to record Daily Challenge completion';
  END IF;

  -- 2. Verify challenge exists and has exactly 5 questions
  IF NOT EXISTS (SELECT 1 FROM public.daily_challenges WHERE id = p_challenge_id) THEN
    RAISE EXCEPTION 'Invalid challenge_id: Daily Challenge not found';
  END IF;

  SELECT COUNT(*) INTO v_challenge_question_count
  FROM public.daily_challenge_questions
  WHERE challenge_id = p_challenge_id;

  IF v_challenge_question_count != 5 THEN
    RAISE EXCEPTION 'Daily Challenge integrity error: challenge has % questions, expected 5', v_challenge_question_count;
  END IF;

  -- 3. Verify attempt exists, belongs to caller, and is completed
  SELECT user_id, completed_at INTO v_attempt_user_id, v_attempt_completed
  FROM public.quiz_attempts
  WHERE id = p_attempt_id;

  IF v_attempt_user_id IS NULL OR v_attempt_user_id != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Invalid quiz attempt or user mismatch';
  END IF;

  IF v_attempt_completed IS NULL THEN
    RAISE EXCEPTION 'Invalid attempt: Quiz attempt is not completed';
  END IF;

  -- 4. Verify attempt contains exactly 5 answer rows and 5 DISTINCT question IDs
  SELECT COUNT(*), COUNT(DISTINCT question_id)
  INTO v_attempt_answer_count, v_attempt_distinct_question_count
  FROM public.quiz_answers
  WHERE attempt_id = p_attempt_id;

  IF v_attempt_answer_count != 5 THEN
    RAISE EXCEPTION 'Invalid attempt: Expected 5 answers, found %', v_attempt_answer_count;
  END IF;

  IF v_attempt_distinct_question_count != 5 THEN
    RAISE EXCEPTION 'Invalid attempt: Expected 5 distinct questions, found % (possible duplicate answers)', v_attempt_distinct_question_count;
  END IF;

  -- 5. TRUE BIDIRECTIONAL SET EQUALITY
  --    A: Every challenge question must appear in quiz_answers
  IF EXISTS (
    SELECT 1
    FROM public.daily_challenge_questions dcq
    WHERE dcq.challenge_id = p_challenge_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.quiz_answers qa
        WHERE qa.attempt_id = p_attempt_id
          AND qa.question_id = dcq.question_id
      )
  ) THEN
    RAISE EXCEPTION 'Invalid attempt: At least one challenge question is missing from the quiz answers';
  END IF;

  --    B: Every quiz answer question must appear in daily_challenge_questions
  IF EXISTS (
    SELECT 1
    FROM public.quiz_answers qa
    WHERE qa.attempt_id = p_attempt_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.daily_challenge_questions dcq
        WHERE dcq.challenge_id = p_challenge_id
          AND dcq.question_id = qa.question_id
      )
  ) THEN
    RAISE EXCEPTION 'Invalid attempt: Attempt contains extra questions not belonging to this Daily Challenge';
  END IF;

  -- 6. Record completion (idempotent, 1 completion per user per challenge)
  INSERT INTO public.daily_challenge_completions (
    user_id,
    challenge_id,
    attempt_id
  ) VALUES (
    v_user_id,
    p_challenge_id,
    p_attempt_id
  )
  ON CONFLICT (user_id, challenge_id) DO NOTHING;
END;
$$;

-- 3. PRESERVE EXECUTE GRANTS (authenticated only)
REVOKE EXECUTE ON FUNCTION public.complete_daily_challenge(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_daily_challenge(UUID, TEXT) TO authenticated;
