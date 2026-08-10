-- Migration ID: 20260810000012_community_questions_remediation.sql
-- Community Question Submission Remediation:
-- 1. Add missing fields (options, correct_answer, code_snippet, interview_tip)
-- 2. Database validation trigger for question structure and option set consistency
-- 3. Secure submission RPC (submit_community_question) forcing auth.uid() & status = 'pending'
-- 4. Revoke direct table INSERT from authenticated users (RPC-only submission model)

-- ============================================================================
-- 1. ADD MISSING QUESTION FIELDS
-- ============================================================================
ALTER TABLE public.community_questions
  ADD COLUMN IF NOT EXISTS options JSONB,
  ADD COLUMN IF NOT EXISTS correct_answer TEXT,
  ADD COLUMN IF NOT EXISTS code_snippet TEXT,
  ADD COLUMN IF NOT EXISTS interview_tip TEXT;

-- ============================================================================
-- 2. DATABASE QUESTION VALIDATION TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_community_question()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- 1. Type validation
  IF NEW.type NOT IN ('Multiple Choice', 'True/False') THEN
    RAISE EXCEPTION 'Invalid question type: % (must be Multiple Choice or True/False)', NEW.type;
  END IF;

  -- 2. Correct answer required
  IF NEW.correct_answer IS NULL OR TRIM(NEW.correct_answer) = '' THEN
    RAISE EXCEPTION 'correct_answer is required for community question submissions';
  END IF;

  -- 3. Multiple Choice validation
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

  -- 4. True/False validation
  IF NEW.type = 'True/False' THEN
    IF NEW.correct_answer NOT IN ('True', 'False') THEN
      RAISE EXCEPTION 'True/False question correct_answer must be "True" or "False", received "%"', NEW.correct_answer;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_community_question ON public.community_questions;
CREATE TRIGGER trg_validate_community_question
  BEFORE INSERT OR UPDATE ON public.community_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_community_question();

-- ============================================================================
-- 3. SECURE SUBMISSION RPC FUNCTION
-- ============================================================================
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
BEGIN
  -- 1. Require authenticated caller session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to submit community questions';
  END IF;

  -- 2. Validate category_id references an existing category
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id) THEN
    RAISE EXCEPTION 'Invalid category_id: Category not found';
  END IF;

  -- 3. Validate difficulty
  IF p_difficulty NOT IN ('Beginner', 'Junior', 'Intermediate') THEN
    RAISE EXCEPTION 'Invalid difficulty: % (must be Beginner, Junior, or Intermediate)', p_difficulty;
  END IF;

  -- 4. Insert community question forcing pending status & auth.uid() identity
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
    TRIM(p_title),
    p_category_id,
    TRIM(p_topic),
    p_difficulty,
    p_type,
    TRIM(p_short_summary),
    TRIM(p_explanation),
    p_options,
    TRIM(p_correct_answer),
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

-- Grant RPC execution only to authenticated users
REVOKE EXECUTE ON FUNCTION public.submit_community_question(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_community_question(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 4. REMOVE DIRECT TABLE INSERT FROM CLIENT ROLES (RPC-ONLY MODEL)
-- ============================================================================
-- Drop direct INSERT RLS policy so clients cannot bypass RPC safeguards
DROP POLICY IF EXISTS "Users insert community questions" ON public.community_questions;
