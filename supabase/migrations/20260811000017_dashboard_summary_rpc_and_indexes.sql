-- Migration: 20260811000017_dashboard_summary_rpc_and_indexes.sql
-- Description: Performance indexes + fix PGRST203 function overload ambiguity.
-- Only indexes that don't already exist in prior migrations are included.

-- Fix PGRST203: Drop the old parameterized get_daily_challenge(DATE) overload.
-- Migration 00008 created a zero-arg replacement and revoked execute on the old one,
-- but never dropped it. PostgREST cannot disambiguate overloaded functions.
DROP FUNCTION IF EXISTS public.get_daily_challenge(DATE);

-- Compound index: quiz_attempts by (user_id, completed_at DESC)
-- Upgrades the simple idx_quiz_attempts_user_id from migration 00001
-- to support ORDER BY completed_at DESC + LIMIT queries efficiently.
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id_completed_at ON public.quiz_attempts(user_id, completed_at DESC);

-- Compound index: daily_challenge_completions by (user_id, completed_at DESC)
-- Upgrades the simple idx_daily_challenge_completions_uid from migration 00007.
CREATE INDEX IF NOT EXISTS idx_daily_challenge_completions_user_id ON public.daily_challenge_completions(user_id, completed_at DESC);

-- New index: community_questions by user_id (no prior equivalent)
CREATE INDEX IF NOT EXISTS idx_community_questions_user_id ON public.community_questions(user_id);
