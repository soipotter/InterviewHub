-- Migration: 20260811000028_update_question_format_and_classification.sql
-- Description: Supports open_ended, coding, and scenario question formats alongside multiple_choice and true_false.
-- Enforces format-aware constraints, source classification rules, and auto-scorable practice/daily challenge boundaries.

-- 1. Add model_answer column to questions, ingested_questions, community_questions if not exists
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS model_answer TEXT;
ALTER TABLE public.ingested_questions ADD COLUMN IF NOT EXISTS model_answer TEXT;
ALTER TABLE public.community_questions ADD COLUMN IF NOT EXISTS model_answer TEXT;

ALTER TABLE public.ingested_questions ADD COLUMN IF NOT EXISTS question_format TEXT DEFAULT 'multiple_choice';
ALTER TABLE public.ingested_questions ADD COLUMN IF NOT EXISTS source_classification TEXT DEFAULT 'actual_question';

-- 2. Drop legacy restrictive type constraints if present
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS check_questions_type;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- Add updated format constraint to public.questions
ALTER TABLE public.questions ADD CONSTRAINT check_questions_type CHECK (
  type IN ('multiple_choice', 'true_false', 'open_ended', 'coding', 'scenario', 'Multiple Choice', 'True/False', 'Open-ended', 'Coding', 'Scenario')
);

-- Drop legacy constraints on ingested_questions
ALTER TABLE public.ingested_questions DROP CONSTRAINT IF EXISTS check_ingested_questions_format;
ALTER TABLE public.ingested_questions DROP CONSTRAINT IF EXISTS check_ingested_questions_classification;

ALTER TABLE public.ingested_questions ADD CONSTRAINT check_ingested_questions_format CHECK (
  question_format IN ('multiple_choice', 'true_false', 'open_ended', 'coding', 'scenario', 'Multiple Choice', 'True/False', 'Open-ended', 'Coding', 'Scenario')
);

ALTER TABLE public.ingested_questions ADD CONSTRAINT check_ingested_questions_classification CHECK (
  source_classification IN ('actual_question', 'question_with_context', 'not_a_question', 'insufficient_evidence', 'EXPLICIT_QUESTION', 'SPECIFIC_PROMPT', 'TOPIC_ONLY', 'UNSUPPORTED')
);

-- Drop legacy check constraints on community_questions
ALTER TABLE public.community_questions DROP CONSTRAINT IF EXISTS check_community_questions_type;
ALTER TABLE public.community_questions ADD CONSTRAINT check_community_questions_type CHECK (
  type IN ('multiple_choice', 'true_false', 'open_ended', 'coding', 'scenario', 'Multiple Choice', 'True/False', 'Open-ended', 'Coding', 'Scenario')
);

-- 3. Update approve_ingested_question RPC to be format-aware and reject non-question sources
CREATE OR REPLACE FUNCTION public.approve_ingested_question(
  p_ingested_id UUID,
  p_moderator_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_category_id UUID;
  v_new_question_id UUID;
  v_slug TEXT;
  v_norm_type TEXT;
BEGIN
  -- Fetch candidate record
  SELECT * INTO v_rec FROM public.ingested_questions WHERE id = p_ingested_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ingested question % not found', p_ingested_id;
  END IF;

  IF v_rec.status = 'approved' THEN
    IF v_rec.published_question_id IS NOT NULL THEN
      RETURN v_rec.published_question_id;
    END IF;
  END IF;

  -- Strictly reject non-question or insufficient evidence sources
  IF v_rec.source_classification IN ('not_a_question', 'insufficient_evidence', 'NOT_A_QUESTION', 'INSUFFICIENT_EVIDENCE', 'TOPIC_ONLY', 'UNSUPPORTED') THEN
    RAISE EXCEPTION 'Cannot publish candidate %: source classification "%" is not a valid interview question.', p_ingested_id, v_rec.source_classification;
  END IF;

  -- Map/Normalize category
  SELECT id INTO v_category_id FROM public.categories WHERE LOWER(name) = LOWER(v_rec.category) LIMIT 1;
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM public.categories WHERE name = 'Web Fundamentals' LIMIT 1;
  END IF;

  -- Normalize type / format
  v_norm_type := COALESCE(v_rec.question_format, 'open_ended');
  IF v_norm_type = 'multiple_choice' OR v_norm_type = 'Multiple Choice' THEN
    v_norm_type := 'Multiple Choice';
  ELSIF v_norm_type = 'true_false' OR v_norm_type = 'True/False' THEN
    v_norm_type := 'True/False';
  ELSIF v_norm_type = 'coding' OR v_norm_type = 'Coding' THEN
    v_norm_type := 'Coding';
  ELSIF v_norm_type = 'scenario' OR v_norm_type = 'Scenario' THEN
    v_norm_type := 'Scenario';
  ELSE
    v_norm_type := 'Open-ended';
  END IF;

  v_slug := 'q-ingest-' || LOWER(REGEXP_REPLACE(v_rec.id::text, '[^a-zA-Z0-9]', '', 'g'));

  -- Insert into public.questions
  INSERT INTO public.questions (
    title,
    slug,
    category_id,
    topic,
    difficulty,
    type,
    short_summary,
    explanation,
    code_snippet,
    interview_tip,
    options,
    correct_answer,
    model_answer,
    tags,
    sources,
    estimated_minutes,
    status
  ) VALUES (
    v_rec.normalized_question,
    v_slug,
    v_category_id,
    v_rec.company || ' - ' || v_rec.role,
    CASE 
      WHEN v_rec.difficulty IN ('Beginner', 'Junior', 'Intermediate', 'Advanced') THEN v_rec.difficulty
      ELSE 'Junior'
    END,
    v_norm_type,
    v_rec.original_text,
    v_rec.source_evidence_text,
    NULL,
    'Candidate experience reported from ' || v_rec.company || ' (' || v_rec.role || ').',
    v_rec.options,
    v_rec.correct_answer,
    v_rec.model_answer,
    ARRAY[v_rec.company, v_rec.role, 'Candidate-Reported'],
    jsonb_build_array(jsonb_build_object('name', v_rec.source_name, 'url', v_rec.source_url)),
    3,
    'published'
  )
  RETURNING id INTO v_new_question_id;

  -- Update candidate status
  UPDATE public.ingested_questions
  SET
    status = 'approved',
    published_question_id = v_new_question_id,
    moderated_by = COALESCE(p_moderator_id, auth.uid()::text),
    updated_at = NOW()
  WHERE id = p_ingested_id;

  RETURN v_new_question_id;
END;
$$;

-- 4. Ensure Practice Session RPC filters ONLY auto-scorable questions (multiple_choice, true_false)
CREATE OR REPLACE FUNCTION public.create_practice_session(
  p_category TEXT DEFAULT 'All',
  p_difficulty TEXT DEFAULT 'All',
  p_type TEXT DEFAULT 'All',
  p_count INT DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
  v_questions JSONB;
  v_question_ids UUID[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a practice session';
  END IF;

  -- Select published auto-scorable questions ONLY (Multiple Choice or True/False)
  WITH candidates AS (
    SELECT q.id
    FROM public.questions q
    LEFT JOIN public.categories c ON q.category_id = c.id
    WHERE q.status = 'published'
      AND q.type IN ('Multiple Choice', 'True/False', 'multiple_choice', 'true_false')
      AND (p_category = 'All' OR LOWER(c.name) = LOWER(p_category))
      AND (p_difficulty = 'All' OR LOWER(q.difficulty) = LOWER(p_difficulty))
      AND (p_type = 'All' OR LOWER(q.type) = LOWER(p_type))
    ORDER BY RANDOM()
    LIMIT GREATEST(1, LEAST(p_count, 20))
  )
  SELECT array_agg(id) INTO v_question_ids FROM candidates;

  IF v_question_ids IS NULL OR array_length(v_question_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No matching auto-scorable questions found for criteria';
  END IF;

  INSERT INTO public.practice_sessions (user_id, config, question_ids, status)
  VALUES (
    v_user_id,
    jsonb_build_object('category', p_category, 'difficulty', p_difficulty, 'type', p_type, 'count', p_count),
    v_question_ids,
    'active'
  )
  RETURNING id INTO v_session_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'title', q.title,
      'slug', q.slug,
      'category', COALESCE(c.name, 'HTML'),
      'topic', q.topic,
      'difficulty', q.difficulty,
      'type', q.type,
      'shortSummary', q.short_summary,
      'explanationMarkdown', q.explanation,
      'codeSnippet', q.code_snippet,
      'interviewTip', q.interview_tip,
      'options', q.options,
      'correctAnswer', q.correct_answer,
      'tags', q.tags
    )
  ) INTO v_questions
  FROM unnest(v_question_ids) WITH ORDINALITY AS t(qid, ord)
  JOIN public.questions q ON q.id = t.qid
  LEFT JOIN public.categories c ON q.category_id = c.id
  ORDER BY t.ord;

  RETURN jsonb_build_object(
    'sessionId', v_session_id,
    'questions', v_questions,
    'createdAt', NOW()
  );
END;
$$;

-- 5. Ensure Daily Challenge RPC selects ONLY auto-scorable questions
CREATE OR REPLACE FUNCTION public.get_daily_challenge()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_challenge_id UUID;
  v_questions JSONB;
BEGIN
  SELECT id INTO v_challenge_id FROM public.daily_challenges WHERE challenge_date = v_today;

  IF v_challenge_id IS NULL THEN
    INSERT INTO public.daily_challenges (challenge_date) VALUES (v_today)
    RETURNING id INTO v_challenge_id;

    INSERT INTO public.daily_challenge_questions (challenge_id, question_id, position)
    SELECT v_challenge_id, q.id, ROW_NUMBER() OVER ()
    FROM (
      SELECT id FROM public.questions
      WHERE status = 'published'
        AND type IN ('Multiple Choice', 'True/False', 'multiple_choice', 'true_false')
      ORDER BY RANDOM()
      LIMIT 5
    ) q;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'position', dcq.position,
      'question', jsonb_build_object(
        'id', q.id,
        'title', q.title,
        'slug', q.slug,
        'category_id', q.category_id,
        'topic', q.topic,
        'difficulty', q.difficulty,
        'type', q.type,
        'short_summary', q.short_summary,
        'explanation', q.explanation,
        'code_snippet', q.code_snippet,
        'interview_tip', q.interview_tip,
        'options', q.options,
        'correct_answer', q.correct_answer,
        'tags', q.tags,
        'estimated_minutes', q.estimated_minutes,
        'status', q.status,
        'categories', jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
      )
    )
    ORDER BY dcq.position
  ) INTO v_questions
  FROM public.daily_challenge_questions dcq
  JOIN public.questions q ON q.id = dcq.question_id
  LEFT JOIN public.categories c ON q.category_id = c.id
  WHERE dcq.challenge_id = v_challenge_id;

  RETURN jsonb_build_object(
    'id', v_challenge_id,
    'challengeDate', v_today,
    'createdAt', NOW(),
    'questions', COALESCE(v_questions, '[]'::jsonb)
  );
END;
$$;
