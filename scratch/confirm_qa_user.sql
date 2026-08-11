UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'qa.interviewhub.test@gmail.com';
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'qa.interviewhub.test@gmail.com';
