-- ============================================================================
-- MIGRATION: 20260811000021_fix_options_jsonb_type.sql
-- DESCRIPTION: Fix options jsonb type in approve_ingested_question RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.approve_ingested_question(
  p_ingested_id TEXT,
  p_normalized_question TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role TEXT;
  v_ingested public.ingested_questions%ROWTYPE;
  v_pub_id TEXT;
  v_slug TEXT;
  v_category_id UUID;
BEGIN
  -- Verify authenticated caller is an admin
  SELECT role INTO v_admin_role FROM public.users WHERE id = auth.uid();
  IF v_admin_role IS NULL OR v_admin_role <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required for approving ingested questions.';
  END IF;

  -- Lock ingested question row
  SELECT * INTO v_ingested
  FROM public.ingested_questions
  WHERE id = p_ingested_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ingested question not found: %', p_ingested_id;
  END IF;

  IF v_ingested.status = 'approved' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_approved', true,
      'published_question_id', v_ingested.published_question_id
    );
  END IF;

  -- Resolve category_id as UUID
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE LOWER(name) = LOWER(COALESCE(p_category, v_ingested.category))
  LIMIT 1;

  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM public.categories LIMIT 1;
  END IF;

  -- Generate published question ID & slug
  v_pub_id := 'q-pub-' || replace(p_ingested_id, 'ingest-', '');
  v_slug := 'ingest-' || LOWER(regexp_replace(TRIM(COALESCE(p_normalized_question, v_ingested.normalized_question)), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  -- Insert into public.questions with options as jsonb
  INSERT INTO public.questions (
    id,
    slug,
    title,
    category_id,
    topic,
    difficulty,
    type,
    short_summary,
    explanation,
    options,
    correct_answer,
    status
  ) VALUES (
    v_pub_id,
    v_slug,
    COALESCE(p_normalized_question, v_ingested.normalized_question),
    v_category_id,
    COALESCE(p_company, v_ingested.company) || ' ' || COALESCE(p_role, v_ingested.role) || ' Interview',
    COALESCE(p_difficulty, v_ingested.difficulty),
    'Multiple Choice',
    'Candidate-reported question from ' || COALESCE(p_company, v_ingested.company) || ' (' || COALESCE(p_role, v_ingested.role) || '). Original text: "' || v_ingested.original_text || '"',
    'This technical interview question was reported by a candidate interviewing for ' || COALESCE(p_role, v_ingested.role) || ' at ' || COALESCE(p_company, v_ingested.company) || '. Source: ' || v_ingested.source_url,
    jsonb_build_array('Option A (Correct)', 'Option B', 'Option C', 'Option D'),
    'Option A (Correct)',
    'published'
  );

  -- Update ingested_questions status
  UPDATE public.ingested_questions
  SET
    status = 'approved',
    published_question_id = v_pub_id,
    moderated_by = auth.uid(),
    normalized_question = COALESCE(p_normalized_question, v_ingested.normalized_question),
    company = COALESCE(p_company, v_ingested.company),
    role = COALESCE(p_role, v_ingested.role),
    category = COALESCE(p_category, v_ingested.category),
    difficulty = COALESCE(p_difficulty, v_ingested.difficulty),
    updated_at = NOW()
  WHERE id = p_ingested_id;

  RETURN jsonb_build_object(
    'success', true,
    'published_question_id', v_pub_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_ingested_question TO authenticated;
