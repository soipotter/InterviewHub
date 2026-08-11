-- Migration ID: 20260811000029_remediate_phase14_published_ingestion.sql
-- Description: Unpublish non-question candidate screenshot item and align existing published ingestion items to Phase 14 formats

-- 1. Unpublish screenshot question item classified as not_a_question (interview advice)
UPDATE public.questions
SET status = 'archived',
    options = NULL,
    correct_answer = NULL
WHERE id = 'q-pub-52e6829d1a444a4d8a6540cfd62c6fa7';

UPDATE public.ingested_questions
SET status = 'rejected',
    rejection_reason = 'Classified as not_a_question (interview advice/experience commentary)'
WHERE id = 'ingest-52e6829d1a444a4d8a6540cfd62c6fa7';

-- 2. Align published open-ended technical discussion question (Trusting Social FE)
UPDATE public.questions
SET type = 'Open-ended',
    options = NULL,
    correct_answer = NULL,
    model_answer = title
WHERE id = 'q-pub-79bf5ccc855b4caabc06b50bf88e6fb6';

-- 3. Align published coding problem question (Trusting Social FE Hackerrank)
UPDATE public.questions
SET type = 'Coding',
    options = NULL,
    correct_answer = NULL,
    model_answer = title
WHERE id = 'q-pub-618bfa10c250427da15267e4fdfd38b7';
