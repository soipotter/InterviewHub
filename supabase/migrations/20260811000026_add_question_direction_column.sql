-- ============================================================================
-- MIGRATION: 20260811000026_add_question_direction_column.sql
-- DESCRIPTION: Add question_direction column to public.ingested_questions
-- ============================================================================

ALTER TABLE public.ingested_questions
  ADD COLUMN IF NOT EXISTS question_direction TEXT DEFAULT 'INTERVIEWER_TO_CANDIDATE'
  CHECK (question_direction IN ('INTERVIEWER_TO_CANDIDATE', 'CANDIDATE_TO_INTERVIEWER', 'AUTHOR_TO_COMMUNITY', 'COMMUNITY_TO_AUTHOR', 'AUTHOR_COMMENTARY', 'UNKNOWN'));
