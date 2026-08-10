-- Migration ID: 20260810000008_harden_daily_challenge_security.sql
-- Daily Challenge Security Hardening: UTC Date Resolution, Advisory Locks, Question Set Validation, and Privilege Control

-- 1. REVOKE OLD PARAMETERIZED RPC EXECUTE FROM PUBLIC
REVOKE EXECUTE ON FUNCTION public.get_daily_challenge(DATE) FROM PUBLIC, anon, authenticated;

-- 2. CREATE ZERO-ARGUMENT PUBLIC RPC: get_daily_challenge()
CREATE OR REPLACE FUNCTION public.get_daily_challenge()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_target_date DATE;
  v_challenge_id UUID;
  v_pub_count INTEGER;
  v_pos_count INTEGER;
  v_result JSONB;
BEGIN
  -- Always resolve to canonical UTC date
  v_target_date := (NOW() AT TIME ZONE 'UTC')::DATE;

  -- Transaction advisory lock on UTC date hash to serialize concurrent midnight requests safely
  PERFORM pg_advisory_xact_lock(hashtext(v_target_date::TEXT));

  -- Get or create daily_challenges row
  SELECT id INTO v_challenge_id
  FROM public.daily_challenges
  WHERE challenge_date = v_target_date;

  IF v_challenge_id IS NULL THEN
    INSERT INTO public.daily_challenges (challenge_date)
    VALUES (v_target_date)
    ON CONFLICT (challenge_date) DO NOTHING;

    SELECT id INTO v_challenge_id
    FROM public.daily_challenges
    WHERE challenge_date = v_target_date;
  END IF;

  -- Populate 5 deterministic published questions if not already populated
  IF NOT EXISTS (SELECT 1 FROM public.daily_challenge_questions WHERE challenge_id = v_challenge_id) THEN
    -- Verify 5 published questions invariant
    SELECT COUNT(*) INTO v_pub_count
    FROM public.questions
    WHERE status = 'published';

    IF v_pub_count < 5 THEN
      RAISE EXCEPTION 'Insufficient published questions to generate Daily Challenge (found %, required 5)', v_pub_count;
    END IF;

    INSERT INTO public.daily_challenge_questions (challenge_id, question_id, position)
    SELECT
      v_challenge_id,
      q.id,
      ROW_NUMBER() OVER (ORDER BY md5(v_target_date::TEXT || q.id))::SMALLINT AS position
    FROM public.questions q
    WHERE q.status = 'published'
    ORDER BY md5(v_target_date::TEXT || q.id)
    LIMIT 5
    ON CONFLICT (challenge_id, position) DO NOTHING;

    -- Verify exactly 5 positions populated
    SELECT COUNT(*) INTO v_pos_count
    FROM public.daily_challenge_questions
    WHERE challenge_id = v_challenge_id;

    IF v_pos_count != 5 THEN
      RAISE EXCEPTION 'Daily Challenge question count invariant failed (found %, expected 5)', v_pos_count;
    END IF;
  END IF;

  -- Build JSONB response payload
  SELECT jsonb_build_object(
    'id', c.id,
    'challengeDate', c.challenge_date,
    'createdAt', c.created_at,
    'questions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'position', dcq.position,
          'question', jsonb_build_object(
            'id', q.id,
            'title', q.title,
            'slug', q.slug,
            'topic', q.topic,
            'difficulty', q.difficulty,
            'type', q.type,
            'shortSummary', q.short_summary,
            'explanation', q.explanation,
            'codeSnippet', q.code_snippet,
            'interviewTip', q.interview_tip,
            'options', q.options,
            'correctAnswer', q.correct_answer,
            'tags', q.tags,
            'sources', q.sources,
            'estimatedMinutes', q.estimated_minutes,
            'category', cat.name
          )
        ) ORDER BY dcq.position ASC
      )
      FROM public.daily_challenge_questions dcq
      JOIN public.questions q ON q.id = dcq.question_id
      JOIN public.categories cat ON cat.id = q.category_id
      WHERE dcq.challenge_id = c.id
    )
  ) INTO v_result
  FROM public.daily_challenges c
  WHERE c.id = v_challenge_id;

  RETURN v_result;
END;
$$;

-- RESTRICT EXECUTE GRANTS ON get_daily_challenge()
REVOKE EXECUTE ON FUNCTION public.get_daily_challenge() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_daily_challenge() TO anon, authenticated;

-- 3. HARDEN complete_daily_challenge WITH ATTEMPT QUESTION-SET EQUALITY CHECK
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
  v_matching_questions INTEGER;
BEGIN
  -- 1. Verify caller authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to record Daily Challenge completion';
  END IF;

  -- 2. Verify challenge exists
  IF NOT EXISTS (SELECT 1 FROM public.daily_challenges WHERE id = p_challenge_id) THEN
    RAISE EXCEPTION 'Invalid challenge_id: Daily Challenge not found';
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

  -- 4. CRITICAL QUESTION-SET EQUALITY VALIDATION
  -- Prove that the attempt contains exactly the 5 questions belonging to the specified Daily Challenge
  SELECT COUNT(*) INTO v_matching_questions
  FROM public.daily_challenge_questions dcq
  JOIN public.quiz_answers qa ON qa.question_id = dcq.question_id
  WHERE dcq.challenge_id = p_challenge_id
    AND qa.attempt_id = p_attempt_id;

  IF v_matching_questions != 5 THEN
    RAISE EXCEPTION 'Invalid attempt: Quiz attempt questions do not match Daily Challenge questions (matching %, expected 5)', v_matching_questions;
  END IF;

  -- 5. Record completion (idempotent, 1 completion per user per challenge)
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

-- RESTRICT EXECUTE GRANTS ON complete_daily_challenge
REVOKE EXECUTE ON FUNCTION public.complete_daily_challenge(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_daily_challenge(UUID, TEXT) TO authenticated;
