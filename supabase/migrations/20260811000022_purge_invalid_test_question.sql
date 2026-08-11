-- ============================================================================
-- MIGRATION: 20260811000022_purge_invalid_test_question.sql
-- DESCRIPTION: Purge invalid test published question q-pub-48d25dd81c1c42f9bba59207f8c7b0f7
-- ============================================================================

DELETE FROM public.questions WHERE id = 'q-pub-48d25dd81c1c42f9bba59207f8c7b0f7';
