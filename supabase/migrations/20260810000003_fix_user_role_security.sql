-- Migration ID: 20260810000003_fix_user_role_security.sql
-- Fixes critical role privilege escalation vulnerability on public.users

-- 1. Drop old permissive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 2. Re-create UPDATE policy requiring that role cannot be modified by user
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
  );

-- 3. Restrict column update privileges for authenticated users
REVOKE UPDATE (role, id, email) ON public.users FROM authenticated;
GRANT UPDATE (full_name, updated_at) ON public.users TO authenticated;
