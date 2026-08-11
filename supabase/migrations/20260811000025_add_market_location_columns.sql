-- ============================================================================
-- MIGRATION: 20260811000025_add_market_location_columns.sql
-- DESCRIPTION: Add market, location, location_evidence, market_verification, source_post_id, source_page columns to public.ingested_questions
-- ============================================================================

ALTER TABLE public.ingested_questions
  ADD COLUMN IF NOT EXISTS market TEXT DEFAULT 'VN',
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS location_evidence TEXT,
  ADD COLUMN IF NOT EXISTS market_verification TEXT DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS source_post_id TEXT,
  ADD COLUMN IF NOT EXISTS source_page INTEGER;
