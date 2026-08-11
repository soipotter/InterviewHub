-- ============================================================================
-- MIGRATION: 20260811000024_add_extraction_classification_column.sql
-- DESCRIPTION: Add extraction_classification column to public.ingested_questions
-- ============================================================================

ALTER TABLE public.ingested_questions
  ADD COLUMN IF NOT EXISTS extraction_classification TEXT DEFAULT 'SPECIFIC_PROMPT'
  CHECK (extraction_classification IN ('EXPLICIT_QUESTION', 'SPECIFIC_PROMPT', 'TOPIC_ONLY', 'UNSUPPORTED'));
