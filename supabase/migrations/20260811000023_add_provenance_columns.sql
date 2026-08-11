-- ============================================================================
-- MIGRATION: 20260811000023_add_provenance_columns.sql
-- DESCRIPTION: Add strict source validation & evidence provenance columns to public.ingested_questions
-- ============================================================================

ALTER TABLE public.ingested_questions
  ADD COLUMN IF NOT EXISTS source_requested_url TEXT,
  ADD COLUMN IF NOT EXISTS source_final_url TEXT,
  ADD COLUMN IF NOT EXISTS source_page_title TEXT,
  ADD COLUMN IF NOT EXISTS source_evidence_text TEXT,
  ADD COLUMN IF NOT EXISTS source_evidence_hash TEXT,
  ADD COLUMN IF NOT EXISTS source_fetched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_http_status INTEGER;
