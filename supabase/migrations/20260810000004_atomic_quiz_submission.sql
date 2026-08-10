-- Migration ID: 20260810000004_atomic_quiz_submission.sql
-- Provides 100% atomic transaction persistence for quiz attempts and per-question answers

CREATE OR REPLACE FUNCTION public.save_quiz_attempt_with_answers(
  p_attempt JSONB,
  p_answers JSONB
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_attempt_id TEXT;
  v_ans JSONB;
BEGIN
  v_attempt_id := p_attempt->>'attemptId';

  -- Verify authenticated user identity
  IF (p_attempt->>'user_id') IS NOT NULL AND (p_attempt->>'user_id') != '' THEN
    v_user_id := (p_attempt->>'user_id')::UUID;
    IF auth.uid() IS NOT NULL AND auth.uid() != v_user_id THEN
      RAISE EXCEPTION 'Unauthorized: User ID mismatch';
    END IF;
  ELSE
    v_user_id := auth.uid();
  END IF;

  -- 1. Insert parent attempt record
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

  -- 2. Insert child answer records atomically
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
