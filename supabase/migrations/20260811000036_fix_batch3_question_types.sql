-- Migration: 20260811000036_fix_batch3_question_types.sql
-- Purpose: Correct the type field on 5 Batch 3 published questions that were
-- incorrectly stored as 'Multiple Choice' by the ingestion pipeline.
-- These questions are open_ended or scenario in substance.
-- Also fix the question_format in ingested_questions table for these candidates.

-- Fix public.questions type
UPDATE public.questions
SET type = 'Scenario'
WHERE id = 'q-pub-6640174f806a4c90b699a496f695c745';

UPDATE public.questions
SET type = 'Open-ended'
WHERE id = 'q-pub-9bc2965a014945809adfda1269f0703a';

UPDATE public.questions
SET type = 'Open-ended'
WHERE id = 'q-pub-c454c7304f5244e2883c257c95044373';

UPDATE public.questions
SET type = 'Scenario'
WHERE id = 'q-pub-94c39ee91a8c4d81a7027d5413745681';

UPDATE public.questions
SET type = 'Open-ended'
WHERE id = 'q-pub-0d4f74c4c14345f297f7639cb76435e2';

-- Fix question_format in ingested_questions for the same candidates
-- (so future re-publish or admin display shows correct format)
UPDATE public.ingested_questions
SET question_format = 'scenario'
WHERE id IN (
  'ingest-6640174f806a4c90b699a496f695c745',
  'ingest-94c39ee91a8c4d81a7027d5413745681'
);

UPDATE public.ingested_questions
SET question_format = 'open_ended'
WHERE id IN (
  'ingest-9bc2965a014945809adfda1269f0703a',
  'ingest-c454c7304f5244e2883c257c95044373',
  'ingest-0d4f74c4c14345f297f7639cb76435e2'
);
