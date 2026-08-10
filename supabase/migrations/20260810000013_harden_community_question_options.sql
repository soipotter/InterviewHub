-- Migration ID: 20260810000013_harden_community_question_options.sql
-- Community Question Multiple-Choice Database Integrity Hardening:
-- Hardens public.validate_community_question() trigger function against:
-- 1. Non-string JSON elements in options array
-- 2. Empty or whitespace-only Multiple Choice options
-- 3. Case-insensitive / trimmed duplicate Multiple Choice options
-- 4. Correct answer exact membership in options array

CREATE OR REPLACE FUNCTION public.validate_community_question()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_opt JSONB;
  v_opt_str TEXT;
  v_normalized_opt TEXT;
  v_seen_opts TEXT[] := ARRAY[]::TEXT[];
  v_has_exact_correct BOOLEAN := FALSE;
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

    -- Loop through each option in JSONB array
    FOR v_opt IN SELECT * FROM jsonb_array_elements(NEW.options) LOOP
      -- Ensure every option is a JSON string (not number, boolean, object, array, or null)
      IF jsonb_typeof(v_opt) != 'string' THEN
        RAISE EXCEPTION 'All Multiple Choice options must be JSON strings, received type: %', jsonb_typeof(v_opt);
      END IF;

      -- Extract string value from JSONB scalar string
      v_opt_str := v_opt #>> '{}';

      -- Check empty or whitespace-only option
      IF v_opt_str IS NULL OR TRIM(v_opt_str) = '' THEN
        RAISE EXCEPTION 'Multiple Choice options cannot be empty or whitespace-only';
      END IF;

      -- Normalize for case-insensitive and trimmed duplicate checking
      v_normalized_opt := LOWER(TRIM(v_opt_str));

      -- Check duplicate
      IF v_normalized_opt = ANY(v_seen_opts) THEN
        RAISE EXCEPTION 'Multiple Choice options must be unique (case-insensitive duplicate detected: "%")', v_opt_str;
      END IF;

      v_seen_opts := array_append(v_seen_opts, v_normalized_opt);

      -- Check if this option matches correct_answer exactly
      IF v_opt_str = NEW.correct_answer THEN
        v_has_exact_correct := TRUE;
      END IF;
    END LOOP;

    -- Ensure correct_answer exists as an exact match within options array
    IF NOT v_has_exact_correct THEN
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
