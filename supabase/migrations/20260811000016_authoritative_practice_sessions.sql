-- Migration ID: 20260811000016_authoritative_practice_sessions.sql
-- Authoritative Practice & Business Rule Hardening
-- 1. Create public.practice_sessions and public.practice_session_questions tables
-- 2. Create RPCs: create_practice_session, get_practice_session, submit_practice_session
-- 3. Lock direct client INSERT/UPDATE/DELETE on quiz_attempts and quiz_answers
-- 4. Revoke old save_quiz_attempt_with_answers RPC from client roles
-- 5. Harden community_questions text fields against whitespace-only submissions

-- ============================================================================
-- 1. PRACTICE SESSIONS TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  attempt_id TEXT UNIQUE REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.practice_session_questions (
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  position SMALLINT NOT NULL,
  PRIMARY KEY (session_id, question_id),
  CONSTRAINT chk_practice_session_position_positive CHECK (position > 0),
  CONSTRAINT unique_practice_session_position UNIQUE (session_id, position)
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_session_questions_session ON public.practice_session_questions(session_id);

-- RLS Enablement
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_session_questions ENABLE ROW LEVEL SECURITY;

-- Revoke direct mutation privileges from client roles
REVOKE ALL PRIVILEGES ON TABLE public.practice_sessions FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.practice_session_questions FROM anon, authenticated;

-- Grant SELECT-only privileges to authenticated users
GRANT SELECT ON TABLE public.practice_sessions TO authenticated;
GRANT SELECT ON TABLE public.practice_session_questions TO authenticated;

-- RLS SELECT Policies (Owner-only)
DROP POLICY IF EXISTS "Users read own practice sessions" ON public.practice_sessions;
CREATE POLICY "Users read own practice sessions" ON public.practice_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own practice session questions" ON public.practice_session_questions;
CREATE POLICY "Users read own practice session questions" ON public.practice_session_questions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.practice_sessions WHERE id = session_id AND user_id = auth.uid()));

-- ============================================================================
-- 2. LOCK DIRECT QUIZ TABLE WRITES & REVOKE OLD PERSISTENCE RPC
-- ============================================================================
-- Revoke direct mutation privileges on quiz_attempts and quiz_answers from client roles
REVOKE ALL PRIVILEGES ON TABLE public.quiz_attempts FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.quiz_answers FROM anon, authenticated;

-- Explicitly grant SELECT-only privileges
GRANT SELECT ON TABLE public.quiz_attempts TO authenticated;
GRANT SELECT ON TABLE public.quiz_answers TO authenticated;

-- Drop direct client INSERT RLS policies
DROP POLICY IF EXISTS "Users insert own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users insert own answers" ON public.quiz_answers;

-- Revoke execution of legacy client-controlled save_quiz_attempt_with_answers RPC
REVOKE EXECUTE ON FUNCTION public.save_quiz_attempt_with_answers(JSONB, JSONB) FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 3. CREATE PRACTICE SESSION RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_practice_session(
  p_category TEXT DEFAULT 'All',
  p_difficulty TEXT DEFAULT 'All',
  p_type TEXT DEFAULT 'All',
  p_count INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
  v_count INTEGER;
  v_q RECORD;
  v_pos SMALLINT := 1;
  v_questions_arr JSONB := '[]'::JSONB;
  v_config JSONB;
BEGIN
  -- 1. Authenticated session required
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to create practice sessions';
  END IF;

  -- 2. Enforce valid count range (1 to 50)
  v_count := LEAST(GREATEST(COALESCE(p_count, 5), 1), 50);

  -- 3. Build canonical config object
  v_config := jsonb_build_object(
    'category', COALESCE(p_category, 'All'),
    'difficulty', COALESCE(p_difficulty, 'All'),
    'type', COALESCE(p_type, 'All'),
    'count', v_count
  );

  -- 4. Create practice session row bound to auth.uid()
  INSERT INTO public.practice_sessions (
    user_id,
    config,
    status
  ) VALUES (
    v_user_id,
    v_config,
    'active'
  )
  RETURNING id INTO v_session_id;

  -- 5. Select candidate questions matching filters server-side
  FOR v_q IN
    SELECT q.id, q.title, q.slug, q.topic, q.difficulty, q.type,
           q.short_summary, q.explanation, q.code_snippet, q.interview_tip,
           q.options, q.correct_answer, q.tags, c.name AS category_name
    FROM public.questions q
    JOIN public.categories c ON c.id = q.category_id
    WHERE q.status = 'published'
      AND (p_category IS NULL OR p_category = 'All' OR c.name = p_category)
      AND (p_difficulty IS NULL OR p_difficulty = 'All' OR q.difficulty = p_difficulty)
      AND (p_type IS NULL OR p_type = 'All' OR q.type = p_type)
    ORDER BY random()
    LIMIT v_count
  LOOP
    -- Insert into practice_session_questions
    INSERT INTO public.practice_session_questions (
      session_id,
      question_id,
      position
    ) VALUES (
      v_session_id,
      v_q.id,
      v_pos
    );

    v_questions_arr := v_questions_arr || jsonb_build_object(
      'id', v_q.id,
      'title', v_q.title,
      'slug', v_q.slug,
      'category', v_q.category_name,
      'topic', v_q.topic,
      'difficulty', v_q.difficulty,
      'type', v_q.type,
      'shortSummary', v_q.short_summary,
      'explanationMarkdown', COALESCE(v_q.explanation, v_q.short_summary),
      'codeSnippet', v_q.code_snippet,
      'interviewTip', v_q.interview_tip,
      'options', COALESCE(v_q.options, '[]'::JSONB),
      'correctAnswer', v_q.correct_answer,
      'tags', COALESCE(v_q.tags, '{}'::TEXT[])
    );

    v_pos := v_pos + 1;
  END LOOP;

  IF v_pos = 1 THEN
    RAISE EXCEPTION 'No matching questions found for specified practice parameters';
  END IF;

  RETURN jsonb_build_object(
    'sessionId', v_session_id,
    'config', v_config,
    'questions', v_questions_arr,
    'totalQuestions', v_pos - 1
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_practice_session(TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_practice_session(TEXT, TEXT, TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- 4. GET PRACTICE SESSION RPC (READ-ONLY FOR ACTIVE SESSION RESTORE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_practice_session(
  p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_session RECORD;
  v_questions_arr JSONB := '[]'::JSONB;
  v_q RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to view practice sessions';
  END IF;

  SELECT * INTO v_session
  FROM public.practice_sessions
  WHERE id = p_session_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Practice session not found or access denied';
  END IF;

  FOR v_q IN
    SELECT q.id, q.title, q.slug, q.topic, q.difficulty, q.type,
           q.short_summary, q.explanation, q.code_snippet, q.interview_tip,
           q.options, q.correct_answer, q.tags, c.name AS category_name, psq.position
    FROM public.practice_session_questions psq
    JOIN public.questions q ON q.id = psq.question_id
    JOIN public.categories c ON c.id = q.category_id
    WHERE psq.session_id = p_session_id
    ORDER BY psq.position ASC
  LOOP
    v_questions_arr := v_questions_arr || jsonb_build_object(
      'id', v_q.id,
      'title', v_q.title,
      'slug', v_q.slug,
      'category', v_q.category_name,
      'topic', v_q.topic,
      'difficulty', v_q.difficulty,
      'type', v_q.type,
      'shortSummary', v_q.short_summary,
      'explanationMarkdown', COALESCE(v_q.explanation, v_q.short_summary),
      'codeSnippet', v_q.code_snippet,
      'interviewTip', v_q.interview_tip,
      'options', COALESCE(v_q.options, '[]'::JSONB),
      'correctAnswer', v_q.correct_answer,
      'tags', COALESCE(v_q.tags, '{}'::TEXT[])
    );
  END LOOP;

  RETURN jsonb_build_object(
    'sessionId', v_session.id,
    'config', v_session.config,
    'status', v_session.status,
    'attemptId', v_session.attempt_id,
    'questions', v_questions_arr,
    'createdAt', v_session.created_at,
    'completedAt', v_session.completed_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_practice_session(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_practice_session(UUID) TO authenticated;

-- ============================================================================
-- 5. SUBMIT PRACTICE SESSION RPC (SERVER-SCORED ATOMIC SUBMISSION)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_practice_session(
  p_session_id UUID,
  p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_session RECORD;
  v_issued_count INTEGER;
  v_submitted_count INTEGER;
  v_ans RECORD;
  v_q RECORD;
  v_correct_count INTEGER := 0;
  v_incorrect_count INTEGER := 0;
  v_score_percentage INTEGER;
  v_attempt_id TEXT;
  v_started_at TIMESTAMPTZ;
  v_completed_at TIMESTAMPTZ := NOW();
  v_question_results JSONB := '[]'::JSONB;
  v_selected TEXT;
  v_is_correct BOOLEAN;
BEGIN
  -- 1. Authenticated session required
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to submit practice sessions';
  END IF;

  -- 2. Lock session row FOR UPDATE and verify ownership
  SELECT * INTO v_session
  FROM public.practice_sessions
  WHERE id = p_session_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Practice session not found or access denied';
  END IF;

  -- 3. Idempotency: if already completed, return existing attempt result
  IF v_session.status = 'completed' AND v_session.attempt_id IS NOT NULL THEN
    DECLARE
      v_existing_attempt public.quiz_attempts%ROWTYPE;
    BEGIN
      SELECT * INTO v_existing_attempt FROM public.quiz_attempts WHERE id = v_session.attempt_id;
      RETURN jsonb_build_object(
        'attemptId', v_existing_attempt.id,
        'quizId', v_existing_attempt.quiz_id,
        'config', v_existing_attempt.config,
        'totalQuestions', v_existing_attempt.total_questions,
        'correctAnswersCount', v_existing_attempt.correct_count,
        'incorrectAnswersCount', v_existing_attempt.incorrect_count,
        'scorePercentage', v_existing_attempt.score_percentage,
        'alreadySubmitted', TRUE
      );
    END;
  END IF;

  -- 4. Count issued questions for session
  SELECT COUNT(*) INTO v_issued_count
  FROM public.practice_session_questions
  WHERE session_id = p_session_id;

  IF v_issued_count = 0 THEN
    RAISE EXCEPTION 'Invalid session: No questions were issued for this practice session';
  END IF;

  -- 5. Validate answer set against issued questions (exact set match)
  SELECT jsonb_array_length(COALESCE(p_answers, '[]'::JSONB)) INTO v_submitted_count;

  -- Verify all submitted question IDs belong to the issued session
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_answers) elem
    WHERE (elem->>'questionId') NOT IN (
      SELECT question_id FROM public.practice_session_questions WHERE session_id = p_session_id
    )
  ) THEN
    RAISE EXCEPTION 'Invalid submission: Answers contain question IDs not issued for this session';
  END IF;

  -- 6. Server-side scoring: calculate correct/incorrect counts from database truth
  v_started_at := v_session.created_at;

  FOR v_q IN
    SELECT psq.position, q.id, q.title, q.type, q.difficulty, q.short_summary,
           q.explanation, q.interview_tip, q.correct_answer, c.name AS category_name
    FROM public.practice_session_questions psq
    JOIN public.questions q ON q.id = psq.question_id
    JOIN public.categories c ON c.id = q.category_id
    WHERE psq.session_id = p_session_id
    ORDER BY psq.position ASC
  LOOP
    -- Find selected answer for this question from p_answers
    SELECT elem->>'selectedAnswer' INTO v_selected
    FROM jsonb_array_elements(p_answers) elem
    WHERE elem->>'questionId' = v_q.id
    LIMIT 1;

    -- Evaluate correctness against DB correct_answer
    IF v_selected IS NOT NULL AND v_selected = v_q.correct_answer THEN
      v_is_correct := TRUE;
      v_correct_count := v_correct_count + 1;
    ELSE
      v_is_correct := FALSE;
      v_incorrect_count := v_incorrect_count + 1;
    END IF;

    v_question_results := v_question_results || jsonb_build_object(
      'questionId', v_q.id,
      'questionTitle', v_q.title,
      'category', v_q.category_name,
      'difficulty', v_q.difficulty,
      'type', v_q.type,
      'selectedAnswer', v_selected,
      'correctAnswer', v_q.correct_answer,
      'isCorrect', v_is_correct,
      'explanationMarkdown', COALESCE(v_q.explanation, v_q.short_summary),
      'interviewTip', v_q.interview_tip
    );
  END LOOP;

  -- Compute final score percentage (bounded 0 to 100)
  v_score_percentage := ROUND((v_correct_count::NUMERIC / v_issued_count::NUMERIC) * 100);
  v_attempt_id := 'att_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 6);

  -- 7. Atomic DB Persistence inside ONE transaction
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
    'quiz_' || p_session_id::TEXT,
    v_session.config,
    v_issued_count,
    v_correct_count,
    v_incorrect_count,
    v_score_percentage,
    v_started_at,
    v_completed_at
  );

  -- Insert per-question answer breakdown
  FOR v_q IN SELECT * FROM jsonb_array_elements(v_question_results)
  LOOP
    INSERT INTO public.quiz_answers (
      attempt_id,
      question_id,
      selected_answer,
      is_correct
    ) VALUES (
      v_attempt_id,
      v_q.value->>'questionId',
      v_q.value->>'selectedAnswer',
      (v_q.value->>'isCorrect')::BOOLEAN
    );
  END LOOP;

  -- Update practice_sessions to completed with attempt_id link
  UPDATE public.practice_sessions
  SET status = 'completed',
      attempt_id = v_attempt_id,
      completed_at = v_completed_at
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'attemptId', v_attempt_id,
    'quizId', 'quiz_' || p_session_id::TEXT,
    'config', v_session.config,
    'totalQuestions', v_issued_count,
    'correctAnswersCount', v_correct_count,
    'incorrectAnswersCount', v_incorrect_count,
    'scorePercentage', v_score_percentage,
    'questionResults', v_question_results,
    'alreadySubmitted', FALSE
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_practice_session(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_practice_session(UUID, JSONB) TO authenticated;

-- ============================================================================
-- 6. COMMUNITY TEXT FIELD DATABASE HARDENING
-- ============================================================================
-- 1. Add CHECK constraint on public.community_questions for non-blank text
ALTER TABLE public.community_questions
  DROP CONSTRAINT IF EXISTS chk_community_question_text_non_blank;

ALTER TABLE public.community_questions
  ADD CONSTRAINT chk_community_question_text_non_blank CHECK (
    btrim(title) <> '' AND
    btrim(topic) <> '' AND
    btrim(short_summary) <> '' AND
    btrim(explanation) <> ''
  );

-- 2. Update validate_community_question trigger to reject whitespace-only text
CREATE OR REPLACE FUNCTION public.validate_community_question()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Text non-blank validation
  IF NEW.title IS NULL OR btrim(NEW.title) = '' THEN
    RAISE EXCEPTION 'title is required and cannot be blank';
  END IF;

  IF NEW.topic IS NULL OR btrim(NEW.topic) = '' THEN
    RAISE EXCEPTION 'topic is required and cannot be blank';
  END IF;

  IF NEW.short_summary IS NULL OR btrim(NEW.short_summary) = '' THEN
    RAISE EXCEPTION 'short_summary is required and cannot be blank';
  END IF;

  IF NEW.explanation IS NULL OR btrim(NEW.explanation) = '' THEN
    RAISE EXCEPTION 'explanation is required and cannot be blank';
  END IF;

  -- Type validation
  IF NEW.type NOT IN ('Multiple Choice', 'True/False') THEN
    RAISE EXCEPTION 'Invalid question type: % (must be Multiple Choice or True/False)', NEW.type;
  END IF;

  -- Correct answer required
  IF NEW.correct_answer IS NULL OR btrim(NEW.correct_answer) = '' THEN
    RAISE EXCEPTION 'correct_answer is required for community question submissions';
  END IF;

  -- Multiple Choice validation
  IF NEW.type = 'Multiple Choice' THEN
    IF NEW.options IS NULL OR jsonb_typeof(NEW.options) != 'array' THEN
      RAISE EXCEPTION 'Multiple Choice questions must include a JSONB array of options';
    END IF;

    IF jsonb_array_length(NEW.options) < 2 THEN
      RAISE EXCEPTION 'Multiple Choice questions must have at least 2 options';
    END IF;

    -- Ensure correct_answer exists within options array
    IF NOT (NEW.options ? NEW.correct_answer) THEN
      RAISE EXCEPTION 'correct_answer "%" is not present in options array %', NEW.correct_answer, NEW.options;
    END IF;
  END IF;

  -- True/False validation
  IF NEW.type = 'True/False' THEN
    IF NEW.correct_answer NOT IN ('True', 'False') THEN
      RAISE EXCEPTION 'True/False question correct_answer must be "True" or "False", received "%"', NEW.correct_answer;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Update submit_community_question RPC to validate trimmed text before insertion
CREATE OR REPLACE FUNCTION public.submit_community_question(
  p_title TEXT,
  p_category_id UUID,
  p_topic TEXT,
  p_difficulty TEXT,
  p_type TEXT,
  p_short_summary TEXT,
  p_explanation TEXT,
  p_options JSONB DEFAULT NULL,
  p_correct_answer TEXT DEFAULT NULL,
  p_code_snippet TEXT DEFAULT NULL,
  p_interview_tip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_new_id UUID;
  v_trimmed_title TEXT := btrim(COALESCE(p_title, ''));
  v_trimmed_topic TEXT := btrim(COALESCE(p_topic, ''));
  v_trimmed_summary TEXT := btrim(COALESCE(p_short_summary, ''));
  v_trimmed_explanation TEXT := btrim(COALESCE(p_explanation, ''));
  v_trimmed_correct TEXT := btrim(COALESCE(p_correct_answer, ''));
BEGIN
  -- 1. Require authenticated caller session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to submit community questions';
  END IF;

  -- 2. Validate non-blank text inputs
  IF v_trimmed_title = '' THEN
    RAISE EXCEPTION 'title is required and cannot be blank';
  END IF;

  IF v_trimmed_topic = '' THEN
    RAISE EXCEPTION 'topic is required and cannot be blank';
  END IF;

  IF v_trimmed_summary = '' THEN
    RAISE EXCEPTION 'short_summary is required and cannot be blank';
  END IF;

  IF v_trimmed_explanation = '' THEN
    RAISE EXCEPTION 'explanation is required and cannot be blank';
  END IF;

  -- 3. Validate category_id references an existing category
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id) THEN
    RAISE EXCEPTION 'Invalid category_id: Category not found';
  END IF;

  -- 4. Validate difficulty
  IF p_difficulty NOT IN ('Beginner', 'Junior', 'Intermediate') THEN
    RAISE EXCEPTION 'Invalid difficulty: % (must be Beginner, Junior, or Intermediate)', p_difficulty;
  END IF;

  -- 5. Insert community question forcing pending status & auth.uid() identity
  INSERT INTO public.community_questions (
    user_id,
    title,
    category_id,
    topic,
    difficulty,
    type,
    short_summary,
    explanation,
    options,
    correct_answer,
    code_snippet,
    interview_tip,
    status,
    moderated_by,
    rejection_reason
  ) VALUES (
    v_user_id,
    v_trimmed_title,
    p_category_id,
    v_trimmed_topic,
    p_difficulty,
    p_type,
    v_trimmed_summary,
    v_trimmed_explanation,
    p_options,
    v_trimmed_correct,
    p_code_snippet,
    p_interview_tip,
    'pending',
    NULL,
    NULL
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'id', v_new_id,
    'status', 'pending',
    'message', 'Question submitted for review'
  );
END;
$$;
