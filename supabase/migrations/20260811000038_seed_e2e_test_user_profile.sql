-- Migration: 20260811000038_seed_e2e_test_user_profile.sql  
-- Purpose: Create the public.users row for the E2E test user account.
-- The trigger normally fires on auth.users INSERT, but the user was
-- registered before email confirmation (trigger may have not created the row
-- if it checks confirmed status, or the row wasn't created for another reason).
-- This upsert is idempotent.

INSERT INTO public.users (id, email, role)
VALUES (
  '9b2714c3-1bf3-4a21-9b7d-c47155b87afa',
  'testuserqa@gmail.com',
  'user'
)
ON CONFLICT (id) DO NOTHING;
