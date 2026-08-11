-- Migration: 20260811000037_confirm_e2e_test_user.sql
-- Purpose: Auto-confirm the email for the E2E test user account (testuserqa@gmail.com)
-- so that Playwright authenticated tests can log in without requiring email verification.
-- This is a test infrastructure concern only — it does not affect production data.
-- The testuserqa@gmail.com account has role='user' (not admin) as created by registration.

UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'testuserqa@gmail.com'
  AND email_confirmed_at IS NULL;
