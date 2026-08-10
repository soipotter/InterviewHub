-- Migration ID: 20260810000015_enforce_rpc_only_moderation_writes.sql
-- RPC-Only Admin Moderation Write Hardening:
-- 1. Revoke direct table & column mutation privileges (INSERT, UPDATE, DELETE) on questions and community_questions from anon and authenticated client roles.
-- 2. Drop legacy Admin RLS write policies that permitted direct table mutations.
-- 3. Enforce SELECT-only access for client roles while preserving SECURITY DEFINER RPC execution for submission and atomic moderation.

-- ============================================================================
-- 1. REVOKE DIRECT TABLE & COLUMN MUTATION PRIVILEGES FROM CLIENT ROLES
-- ============================================================================
-- Revoke all table-level and column-level privileges from client roles
REVOKE ALL PRIVILEGES ON TABLE public.questions FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.community_questions FROM anon, authenticated;

-- Explicitly grant SELECT-only access to client roles
GRANT SELECT ON TABLE public.questions TO anon, authenticated;
GRANT SELECT ON TABLE public.community_questions TO anon, authenticated;

-- ============================================================================
-- 2. CLEAN UP LEGACY RLS WRITE POLICIES
-- ============================================================================
-- Drop legacy full-access / update policies on public.questions
DROP POLICY IF EXISTS "Admins full access questions" ON public.questions;

-- Ensure Admins have SELECT access on all questions
DROP POLICY IF EXISTS "Admins read all questions" ON public.questions;
CREATE POLICY "Admins read all questions" ON public.questions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Drop legacy update policies on public.community_questions
DROP POLICY IF EXISTS "Admins update community questions" ON public.community_questions;

-- Ensure RLS write policies do not exist for client roles on questions and community_questions.
-- Mutations pass exclusively through SECURITY DEFINER RPCs:
--   - public.submit_community_question()
--   - public.approve_community_question()
--   - public.reject_community_question()
