-- Migration ID: 20260811000033_fix_moderated_by_uuid.sql
-- Description: Cast moderated_by column assignment to UUID in approve_ingested_question RPC

CREATE OR REPLACE FUNCTION public.approve_ingested_question(
  p_ingested_id TEXT,
  p_normalized_question TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_moderator_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role TEXT;
  v_rec public.ingested_questions%ROWTYPE;
  v_new_question_id TEXT;
  v_slug TEXT;
  v_category_id UUID;
  v_norm_type TEXT;
  v_title TEXT;
  v_company TEXT;
  v_role TEXT;
  v_category TEXT;
  v_difficulty TEXT;
  v_options JSONB := NULL;
  v_correct_answer TEXT := NULL;
  v_model_answer TEXT := NULL;
  v_rec_json JSONB;
BEGIN
  SELECT role INTO v_admin_role FROM public.users WHERE id = auth.uid();
  IF v_admin_role IS NULL OR v_admin_role <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required for approving ingested questions.';
  END IF;

  SELECT * INTO v_rec
  FROM public.ingested_questions
  WHERE id = p_ingested_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ingested question not found: %', p_ingested_id;
  END IF;

  IF v_rec.status = 'approved' AND v_rec.published_question_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_approved', true,
      'published_question_id', v_rec.published_question_id
    );
  END IF;

  IF v_rec.source_classification IN ('not_a_question', 'insufficient_evidence', 'NOT_A_QUESTION', 'INSUFFICIENT_EVIDENCE', 'TOPIC_ONLY', 'UNSUPPORTED') THEN
    RAISE EXCEPTION 'Cannot publish candidate %: source classification "%" is not a valid interview question.', p_ingested_id, v_rec.source_classification;
  END IF;

  v_rec_json := to_jsonb(v_rec);

  v_title := COALESCE(NULLIF(TRIM(p_normalized_question), ''), v_rec.normalized_question, v_rec.original_text);
  v_company := COALESCE(NULLIF(TRIM(p_company), ''), v_rec.company, 'Unknown');
  v_role := COALESCE(NULLIF(TRIM(p_role), ''), v_rec.role, 'Engineer');
  v_category := COALESCE(NULLIF(TRIM(p_category), ''), v_rec.category, 'Web Fundamentals');
  v_difficulty := COALESCE(NULLIF(TRIM(p_difficulty), ''), v_rec.difficulty, 'Junior');

  SELECT id INTO v_category_id FROM public.categories WHERE LOWER(name) = LOWER(v_category) LIMIT 1;
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM public.categories WHERE name = 'Web Fundamentals' LIMIT 1;
  END IF;

  v_norm_type := COALESCE(v_rec_json->>'question_format', 'open_ended');
  IF v_norm_type = 'multiple_choice' OR v_norm_type = 'Multiple Choice' THEN
    v_norm_type := 'Multiple Choice';
    v_options := COALESCE(v_rec_json->'options', '[]'::jsonb);
    v_correct_answer := v_rec_json->>'correct_answer';
  ELSIF v_norm_type = 'true_false' OR v_norm_type = 'True/False' THEN
    v_norm_type := 'True/False';
    v_options := COALESCE(v_rec_json->'options', '["True", "False"]'::jsonb);
    v_correct_answer := v_rec_json->>'correct_answer';
  ELSIF v_norm_type = 'coding' OR v_norm_type = 'Coding' THEN
    v_norm_type := 'Coding';
    v_options := NULL;
    v_correct_answer := NULL;
    v_model_answer := COALESCE(v_rec_json->>'model_answer', v_rec.original_text);
  ELSIF v_norm_type = 'scenario' OR v_norm_type = 'Scenario' THEN
    v_norm_type := 'Scenario';
    v_options := NULL;
    v_correct_answer := NULL;
    v_model_answer := COALESCE(v_rec_json->>'model_answer', v_rec.original_text);
  ELSE
    v_norm_type := 'Open-ended';
    v_options := NULL;
    v_correct_answer := NULL;
    v_model_answer := COALESCE(v_rec_json->>'model_answer', v_rec.original_text);
  END IF;

  v_new_question_id := 'q-pub-' || LOWER(REGEXP_REPLACE(REPLACE(v_rec.id::text, 'ingest-', ''), '[^a-zA-Z0-9]', '', 'g'));
  v_slug := 'q-ingest-' || LOWER(REGEXP_REPLACE(v_rec.id::text, '[^a-zA-Z0-9]', '', 'g'));

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
    model_answer,
    tags,
    sources,
    estimated_minutes,
    status
  ) VALUES (
    v_new_question_id,
    v_title,
    v_slug,
    v_category_id,
    v_company || ' - ' || v_role,
    v_difficulty,
    v_norm_type,
    v_rec.original_text,
    'Technical interview question reported from ' || v_company || ' (' || v_role || ').',
    NULL,
    'Focus on technical depth, core principles, and practical problem-solving approach.',
    v_options,
    v_correct_answer,
    v_model_answer,
    ARRAY[v_company, v_role, 'Candidate-Reported'],
    jsonb_build_array(jsonb_build_object('name', v_rec.source_name, 'url', v_rec.source_url)),
    3,
    'published'
  );

  UPDATE public.ingested_questions
  SET
    status = 'approved',
    published_question_id = v_new_question_id,
    moderated_by = CASE 
      WHEN p_moderator_id IS NOT NULL AND p_moderator_id ~ '^[0-9a-fA-F-]{36}$' THEN p_moderator_id::uuid
      ELSE auth.uid()
    END,
    updated_at = NOW()
  WHERE id = p_ingested_id;

  RETURN jsonb_build_object(
    'success', true,
    'published_question_id', v_new_question_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_ingested_question(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
