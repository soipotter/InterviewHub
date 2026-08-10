-- Migration ID: 20260810000007_daily_challenge_foundation.sql
-- Daily Challenge Database Foundation: Tables, Indexes, RLS Policies, and RPC Functions

-- 1. DAILY CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DAILY CHALLENGE QUESTIONS TABLE (Exactly 5 questions per challenge)
CREATE TABLE IF NOT EXISTS public.daily_challenge_questions (
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_daily_challenge_questions PRIMARY KEY (challenge_id, question_id),
  CONSTRAINT uq_daily_challenge_position UNIQUE (challenge_id, position)
);

-- 3. DAILY CHALLENGE COMPLETIONS TABLE (Authenticated user completions)
CREATE TABLE IF NOT EXISTS public.daily_challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  attempt_id TEXT NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_daily_challenge_completion UNIQUE (user_id, challenge_id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_questions_cid ON public.daily_challenge_questions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_completions_uid ON public.daily_challenge_completions(user_id);

-- ENABLE RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_completions ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Public read daily challenges" ON public.daily_challenges
  FOR SELECT USING (TRUE);

CREATE POLICY "Public read daily challenge questions" ON public.daily_challenge_questions
  FOR SELECT USING (TRUE);

CREATE POLICY "Users read own daily challenge completions" ON public.daily_challenge_completions
  FOR SELECT USING (auth.uid() = user_id);

-- 4. DETERMINISTIC RPC FUNCTION: get_daily_challenge(p_date DATE)
CREATE OR REPLACE FUNCTION public.get_daily_challenge(
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_target_date DATE;
  v_challenge_id UUID;
  v_result JSONB;
BEGIN
  v_target_date := COALESCE(p_date, CURRENT_DATE);

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

  -- Populate exactly 5 deterministic published questions if not already populated
  IF NOT EXISTS (SELECT 1 FROM public.daily_challenge_questions WHERE challenge_id = v_challenge_id) THEN
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

-- GRANT PUBLIC EXECUTE ON get_daily_challenge
GRANT EXECUTE ON FUNCTION public.get_daily_challenge(DATE) TO PUBLIC, anon, authenticated;

-- 5. AUTHENTICATED RPC FUNCTION: complete_daily_challenge(p_challenge_id UUID, p_attempt_id TEXT)
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
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to record Daily Challenge completion';
  END IF;

  -- Verify attempt exists and belongs to calling user
  SELECT user_id INTO v_attempt_user_id
  FROM public.quiz_attempts
  WHERE id = p_attempt_id;

  IF v_attempt_user_id IS NULL OR v_attempt_user_id != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Invalid quiz attempt or user mismatch';
  END IF;

  -- Verify challenge exists
  IF NOT EXISTS (SELECT 1 FROM public.daily_challenges WHERE id = p_challenge_id) THEN
    RAISE EXCEPTION 'Invalid challenge_id';
  END IF;

  -- Record completion (idempotent, 1 per user per challenge)
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

-- RESTRICT EXECUTE ON complete_daily_challenge
REVOKE EXECUTE ON FUNCTION public.complete_daily_challenge(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_daily_challenge(UUID, TEXT) TO authenticated;
