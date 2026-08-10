-- Migration ID: 20260810000014_secure_community_moderation.sql
-- Secure Atomic Community Question Moderation:
-- 1. Add published_question_id FK to public.community_questions
-- 2. Enforce database-level moderation state invariant (CHECK constraint)
-- 3. Create atomic public.approve_community_question RPC with row locking & content publication
-- 4. Create atomic public.reject_community_question RPC with row locking & reason validation
-- 5. Revoke EXECUTE from PUBLIC/anon, GRANT to authenticated (strictly guarded by DB admin check)

-- ============================================================================
-- 1. PUBLISHED QUESTION LINKAGE COLUMN
-- ============================================================================
ALTER TABLE public.community_questions
  ADD COLUMN IF NOT EXISTS published_question_id TEXT UNIQUE REFERENCES public.questions(id) ON DELETE RESTRICT;

-- ============================================================================
-- 2. MODERATION STATE DATABASE INVARIANT
-- ============================================================================
ALTER TABLE public.community_questions
  DROP CONSTRAINT IF EXISTS chk_community_question_moderation_state;

ALTER TABLE public.community_questions
  ADD CONSTRAINT chk_community_question_moderation_state CHECK (
    (status = 'pending'  AND moderated_by IS NULL     AND rejection_reason IS NULL AND published_question_id IS NULL) OR
    (status = 'approved' AND moderated_by IS NOT NULL AND rejection_reason IS NULL AND published_question_id IS NOT NULL) OR
    (status = 'rejected' AND moderated_by IS NOT NULL AND rejection_reason IS NOT NULL AND btrim(rejection_reason) <> '' AND published_question_id IS NULL)
  );

-- ============================================================================
-- 3. APPROVE COMMUNITY QUESTION RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.approve_community_question(
  p_submission_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin_id UUID;
  v_submission RECORD;
  v_pub_q_id TEXT;
  v_slug TEXT;
BEGIN
  -- 1. Verify authenticated caller
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required for community moderation';
  END IF;

  -- 2. Verify admin role from trusted public.users table
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = v_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: Admin privilege required for community moderation';
  END IF;

  -- 3. Acquire row-level lock BEFORE checking moderation status (prevents race conditions)
  SELECT * INTO v_submission
  FROM public.community_questions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF v_submission.id IS NULL THEN
    RAISE EXCEPTION 'Community question submission not found (ID: %)', p_submission_id;
  END IF;

  -- 4. Idempotency & state handling
  IF v_submission.status = 'approved' THEN
    RETURN jsonb_build_object(
      'submissionId', v_submission.id,
      'status', 'approved',
      'publishedQuestionId', v_submission.published_question_id,
      'alreadyModerated', true,
      'message', 'Submission is already approved'
    );
  END IF;

  IF v_submission.status = 'rejected' THEN
    RAISE EXCEPTION 'Cannot approve submission %: Submission has already been rejected', p_submission_id;
  END IF;

  -- 5. Revalidate content requirements before publication
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = v_submission.category_id) THEN
    RAISE EXCEPTION 'Invalid submission: Referenced category_id no longer exists';
  END IF;

  IF v_submission.type NOT IN ('Multiple Choice', 'True/False') THEN
    RAISE EXCEPTION 'Invalid submission type: %', v_submission.type;
  END IF;

  IF v_submission.difficulty NOT IN ('Beginner', 'Junior', 'Intermediate') THEN
    RAISE EXCEPTION 'Invalid submission difficulty: %', v_submission.difficulty;
  END IF;

  IF v_submission.correct_answer IS NULL OR TRIM(v_submission.correct_answer) = '' THEN
    RAISE EXCEPTION 'Invalid submission: correct_answer is required';
  END IF;

  IF v_submission.type = 'Multiple Choice' THEN
    IF v_submission.options IS NULL OR jsonb_typeof(v_submission.options) != 'array' THEN
      RAISE EXCEPTION 'Invalid Multiple Choice submission: options array required';
    END IF;

    IF jsonb_array_length(v_submission.options) < 2 THEN
      RAISE EXCEPTION 'Invalid Multiple Choice submission: at least 2 options required';
    END IF;

    IF NOT (v_submission.options ? v_submission.correct_answer) THEN
      RAISE EXCEPTION 'Invalid Multiple Choice submission: correct_answer not in options';
    END IF;
  END IF;

  -- 6. Generate deterministic published question ID & unique slug
  v_pub_q_id := 'comm-' || replace(p_submission_id::text, '-', '');
  v_slug := 'comm-' || LOWER(regexp_replace(TRIM(v_submission.title), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(replace(p_submission_id::text, '-', ''), 1, 8);

  -- 7. INSERT published question into public.questions
  INSERT INTO public.questions (
    id,
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
    tags,
    sources,
    estimated_minutes,
    status,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    v_pub_q_id,
    v_submission.title,
    v_slug,
    v_submission.category_id,
    v_submission.topic,
    v_submission.difficulty,
    v_submission.type,
    v_submission.short_summary,
    v_submission.explanation,
    v_submission.code_snippet,
    v_submission.interview_tip,
    v_submission.options,
    v_submission.correct_answer,
    ARRAY['community']::TEXT[],
    NULL,
    3,
    'published',
    v_submission.user_id,
    NOW(),
    NOW()
  );

  -- 8. UPDATE public.community_questions atomically in same transaction
  UPDATE public.community_questions
  SET
    status = 'approved',
    moderated_by = v_admin_id,
    rejection_reason = NULL,
    published_question_id = v_pub_q_id,
    updated_at = NOW()
  WHERE id = p_submission_id;

  RETURN jsonb_build_object(
    'submissionId', p_submission_id,
    'status', 'approved',
    'publishedQuestionId', v_pub_q_id,
    'alreadyModerated', false,
    'message', 'Community question approved and published successfully'
  );
END;
$$;

-- Grant EXECUTE only to authenticated users
REVOKE EXECUTE ON FUNCTION public.approve_community_question(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_community_question(UUID) TO authenticated;

-- ============================================================================
-- 4. REJECT COMMUNITY QUESTION RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reject_community_question(
  p_submission_id UUID,
  p_rejection_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin_id UUID;
  v_submission RECORD;
  v_clean_reason TEXT;
BEGIN
  -- 1. Verify authenticated caller
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required for community moderation';
  END IF;

  -- 2. Verify admin role from trusted public.users table
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = v_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: Admin privilege required for community moderation';
  END IF;

  -- 3. Validate rejection reason
  v_clean_reason := TRIM(p_rejection_reason);
  IF v_clean_reason IS NULL OR v_clean_reason = '' THEN
    RAISE EXCEPTION 'rejection_reason is required when rejecting a community submission';
  END IF;

  -- 4. Acquire row-level lock BEFORE checking moderation status
  SELECT * INTO v_submission
  FROM public.community_questions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF v_submission.id IS NULL THEN
    RAISE EXCEPTION 'Community question submission not found (ID: %)', p_submission_id;
  END IF;

  -- 5. Idempotency & state handling
  IF v_submission.status = 'rejected' THEN
    RETURN jsonb_build_object(
      'submissionId', v_submission.id,
      'status', 'rejected',
      'rejectionReason', v_submission.rejection_reason,
      'alreadyModerated', true,
      'message', 'Submission is already rejected'
    );
  END IF;

  IF v_submission.status = 'approved' THEN
    RAISE EXCEPTION 'Cannot reject submission %: Submission has already been approved and published', p_submission_id;
  END IF;

  -- 6. UPDATE public.community_questions
  UPDATE public.community_questions
  SET
    status = 'rejected',
    moderated_by = v_admin_id,
    rejection_reason = v_clean_reason,
    published_question_id = NULL,
    updated_at = NOW()
  WHERE id = p_submission_id;

  RETURN jsonb_build_object(
    'submissionId', p_submission_id,
    'status', 'rejected',
    'rejectionReason', v_clean_reason,
    'alreadyModerated', false,
    'message', 'Community question rejected'
  );
END;
$$;

-- Grant EXECUTE only to authenticated users
REVOKE EXECUTE ON FUNCTION public.reject_community_question(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_community_question(UUID, TEXT) TO authenticated;
