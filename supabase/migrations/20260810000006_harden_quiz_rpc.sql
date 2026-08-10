-- Migration ID: 20260810000006_harden_quiz_rpc.sql
-- Hardens save_quiz_attempt_with_answers RPC function against unauthorized and cross-user execution

CREATE OR REPLACE FUNCTION public.save_quiz_attempt_with_answers(
  p_attempt JSONB,
  p_answers JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_attempt_id TEXT;
  v_ans JSONB;
BEGIN
  -- 1. Strictly require authenticated session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to save quiz attempts';
  END IF;

  v_attempt_id := p_attempt->>'attemptId';

  -- 2. Insert parent attempt record bound to authenticated user
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
    p_attempt->>'quizId',
    p_attempt->'config',
    (p_attempt->>'totalQuestions')::INTEGER,
    (p_attempt->>'correctAnswersCount')::INTEGER,
    (p_attempt->>'incorrectAnswersCount')::INTEGER,
    (p_attempt->>'scorePercentage')::INTEGER,
    (p_attempt->>'startedAt')::TIMESTAMPTZ,
    (p_attempt->>'completedAt')::TIMESTAMPTZ
  )
  ON CONFLICT (id) DO NOTHING;

  -- 3. Insert child answer records atomically
  FOR v_ans IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    INSERT INTO public.quiz_answers (
      attempt_id,
      question_id,
      selected_answer,
      is_correct
    ) VALUES (
      v_attempt_id,
      v_ans->>'questionId',
      v_ans->>'selectedAnswer',
      COALESCE((v_ans->>'isCorrect')::BOOLEAN, FALSE)
    );
  END LOOP;
END;
$$;

-- 4. Restrict execution privileges
REVOKE EXECUTE ON FUNCTION public.save_quiz_attempt_with_answers(JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_quiz_attempt_with_answers(JSONB, JSONB) TO authenticated;
