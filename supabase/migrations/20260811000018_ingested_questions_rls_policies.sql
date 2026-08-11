-- ============================================================================
-- MIGRATION: 20260811000018_ingested_questions_rls_policies.sql
-- DESCRIPTION: Allow Admin authenticated sessions to INSERT and DELETE ingested questions
-- ============================================================================

CREATE POLICY "Admins insert ingested questions"
  ON public.ingested_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

CREATE POLICY "Admins delete ingested questions"
  ON public.ingested_questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );
