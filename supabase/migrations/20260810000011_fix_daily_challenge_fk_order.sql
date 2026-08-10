-- Migration ID: 20260810000011_fix_daily_challenge_fk_order.sql
-- Fixes Foreign Key insertion order in submit_daily_challenge RPC:
-- Order: 1. quiz_attempts (parent) -> 2. quiz_answers (5 children) -> 3. daily_challenge_completions

CREATE OR REPLACE FUNCTION public.submit_daily_challenge(
  p_challenge_id UUID,
  p_answers JSONB,
  p_started_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_today DATE;
  v_challenge_date DATE;
  v_challenge_question_count INTEGER;
  v_answer_count INTEGER;
  v_distinct_question_count INTEGER;
  v_attempt_id TEXT;
  v_completion_id UUID;
  v_existing_completion_id UUID;
  v_existing_attempt_id TEXT;
  v_correct_count INTEGER := 0;
  v_incorrect_count INTEGER := 0;
  v_score_percentage INTEGER;
  v_started_at TIMESTAMPTZ;
  v_completed_at TIMESTAMPTZ;
  v_ans JSONB;
  v_question_id TEXT;
  v_selected_answer TEXT;
  v_correct_answer TEXT;
  v_is_correct BOOLEAN;
BEGIN
  -- 1. Require authenticated session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to submit Daily Challenge';
  END IF;

  -- 2. Advisory lock: prevent concurrent double-submissions per user per challenge
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::TEXT || p_challenge_id::TEXT));

  -- 3. Idempotency: check for existing completion
  SELECT id, attempt_id INTO v_existing_completion_id, v_existing_attempt_id
  FROM public.daily_challenge_completions
  WHERE user_id = v_user_id AND challenge_id = p_challenge_id;

  IF v_existing_completion_id IS NOT NULL THEN
    -- Already completed: return existing result without creating duplicates
    DECLARE
      v_attempt_row public.quiz_attempts%ROWTYPE;
    BEGIN
      SELECT * INTO v_attempt_row FROM public.quiz_attempts WHERE id = v_existing_attempt_id;
      RETURN jsonb_build_object(
        'completionId', v_existing_completion_id,
        'attemptId', v_existing_attempt_id,
        'challengeId', p_challenge_id,
        'challengeDate', (SELECT challenge_date FROM public.daily_challenges WHERE id = p_challenge_id),
        'correctCount', v_attempt_row.correct_count,
        'incorrectCount', v_attempt_row.incorrect_count,
        'scorePercentage', v_attempt_row.score_percentage,
        'alreadyCompleted', TRUE
      );
    END;
  END IF;

  -- 4. Validate challenge is today's UTC challenge
  v_today := (NOW() AT TIME ZONE 'UTC')::DATE;

  SELECT challenge_date INTO v_challenge_date
  FROM public.daily_challenges
  WHERE id = p_challenge_id;

  IF v_challenge_date IS NULL THEN
    RAISE EXCEPTION 'Invalid challenge_id: Daily Challenge not found';
  END IF;

  IF v_challenge_date != v_today THEN
    RAISE EXCEPTION 'Stale challenge: This challenge is from % but today is %. Please refresh to get today''s challenge.',
      v_challenge_date, v_today;
  END IF;

  -- 5. Validate challenge has exactly 5 questions
  SELECT COUNT(*) INTO v_challenge_question_count
  FROM public.daily_challenge_questions
  WHERE challenge_id = p_challenge_id;

  IF v_challenge_question_count != 5 THEN
    RAISE EXCEPTION 'Challenge integrity error: expected 5 questions, found %', v_challenge_question_count;
  END IF;

  -- 6. Validate payload structure
  v_answer_count := jsonb_array_length(p_answers);
  IF v_answer_count != 5 THEN
    RAISE EXCEPTION 'Invalid payload: expected 5 answers, received %', v_answer_count;
  END IF;

  SELECT COUNT(DISTINCT (elem->>'questionId')) INTO v_distinct_question_count
  FROM jsonb_array_elements(p_answers) AS elem;

  IF v_distinct_question_count != 5 THEN
    RAISE EXCEPTION 'Invalid payload: expected 5 distinct question IDs, found %', v_distinct_question_count;
  END IF;

  -- 7. Bidirectional question-set equality (A): every challenge question in payload
  IF EXISTS (
    SELECT 1 FROM public.daily_challenge_questions dcq
    WHERE dcq.challenge_id = p_challenge_id
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(p_answers) AS elem
        WHERE elem->>'questionId' = dcq.question_id
      )
  ) THEN
    RAISE EXCEPTION 'Invalid payload: missing at least one challenge question from submitted answers';
  END IF;

  -- (B): every payload question in challenge questions
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_answers) AS elem
    WHERE NOT EXISTS (
      SELECT 1 FROM public.daily_challenge_questions dcq
      WHERE dcq.challenge_id = p_challenge_id
        AND dcq.question_id = elem->>'questionId'
    )
  ) THEN
    RAISE EXCEPTION 'Invalid payload: submitted answers contain question IDs not belonging to this challenge';
  END IF;

  -- 8. Build timestamps & generate attempt ID
  v_completed_at := NOW() AT TIME ZONE 'UTC';
  v_started_at := COALESCE(p_started_at, v_completed_at - INTERVAL '5 minutes');

  v_attempt_id := 'att_dc_' || extract(epoch from v_completed_at)::BIGINT::TEXT || '_' ||
                  substr(md5(random()::TEXT), 1, 8);

  -- 9. PASS 1: Database-authoritative scoring loop BEFORE parent insert (no DB writes)
  FOR v_ans IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    v_question_id := v_ans->>'questionId';
    v_selected_answer := v_ans->>'selectedAnswer';

    -- Load authoritative correct answer from database
    SELECT correct_answer INTO v_correct_answer
    FROM public.questions
    WHERE id = v_question_id;

    -- Compute correctness server-side
    v_is_correct := (v_selected_answer IS NOT NULL
                     AND v_selected_answer != ''
                     AND v_selected_answer = v_correct_answer);

    IF v_is_correct THEN
      v_correct_count := v_correct_count + 1;
    ELSE
      v_incorrect_count := v_incorrect_count + 1;
    END IF;
  END LOOP;

  v_score_percentage := ROUND((v_correct_count::NUMERIC / 5.0) * 100)::INTEGER;

  -- 10. STEP 1: INSERT PARENT ROW (quiz_attempts) FIRST
  INSERT INTO public.quiz_attempts (
    id,
    user_id,
    quiz_id,
    config,
    total_questions,
    correct_count,
    incorrect_count,
    score_percentage,
    started_at,
    completed_at
  ) VALUES (
    v_attempt_id,
    v_user_id,
    'daily-challenge-' || v_challenge_date::TEXT,
    jsonb_build_object(
      'source', 'daily-challenge',
      'challengeId', p_challenge_id,
      'challengeDate', v_challenge_date,
      'category', 'All',
      'difficulty', 'All',
      'type', 'All',
      'count', 5
    ),
    5,
    v_correct_count,
    v_incorrect_count,
    v_score_percentage,
    v_started_at,
    v_completed_at
  );

  -- 11. STEP 2: PASS 2 - INSERT CHILD ROWS (quiz_answers) REFERENCING PARENT v_attempt_id
  FOR v_ans IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    v_question_id := v_ans->>'questionId';
    v_selected_answer := v_ans->>'selectedAnswer';

    SELECT correct_answer INTO v_correct_answer
    FROM public.questions
    WHERE id = v_question_id;

    v_is_correct := (v_selected_answer IS NOT NULL
                     AND v_selected_answer != ''
                     AND v_selected_answer = v_correct_answer);

    INSERT INTO public.quiz_answers (
      attempt_id,
      question_id,
      selected_answer,
      is_correct
    ) VALUES (
      v_attempt_id,
      v_question_id,
      v_selected_answer,
      v_is_correct
    );
  END LOOP;

  -- 12. STEP 3: INSERT COMPLETION RECORD (daily_challenge_completions)
  INSERT INTO public.daily_challenge_completions (
    user_id,
    challenge_id,
    attempt_id
  ) VALUES (
    v_user_id,
    p_challenge_id,
    v_attempt_id
  )
  RETURNING id INTO v_completion_id;

  -- 13. Return authoritative result
  RETURN jsonb_build_object(
    'completionId', v_completion_id,
    'attemptId', v_attempt_id,
    'challengeId', p_challenge_id,
    'challengeDate', v_challenge_date,
    'correctCount', v_correct_count,
    'incorrectCount', v_incorrect_count,
    'scorePercentage', v_score_percentage,
    'alreadyCompleted', FALSE
  );
END;
$$;

-- GRANT EXECUTE GRANTS
REVOKE EXECUTE ON FUNCTION public.submit_daily_challenge(UUID, JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_daily_challenge(UUID, JSONB, TIMESTAMPTZ) TO authenticated;
