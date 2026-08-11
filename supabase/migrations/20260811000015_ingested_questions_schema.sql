-- ============================================================================
-- MIGRATION: 20260811000015_ingested_questions_schema.sql
-- DESCRIPTION: Candidate-Reported Interview Question Ingestion Schema & RLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ingested_questions (
  id TEXT PRIMARY KEY DEFAULT ('ingest-' || replace(gen_random_uuid()::text, '-', '')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('forum', 'reddit', 'blog', 'generic_article')),
  source_published_at TIMESTAMPTZ,
  original_text TEXT NOT NULL,
  normalized_question TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  seniority TEXT NOT NULL DEFAULT 'Unknown',
  round TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Junior', 'Intermediate', 'Advanced')),
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.95,
  is_duplicate_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  duplicate_of_id TEXT REFERENCES public.ingested_questions(id),
  similarity_score NUMERIC(3,2),
  rejection_reason TEXT,
  published_question_id TEXT REFERENCES public.questions(id),
  moderated_by UUID REFERENCES public.users(id),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ingested_questions ENABLE ROW LEVEL SECURITY;

-- Admins can read all ingested questions
CREATE POLICY "Admins read ingested questions"
  ON public.ingested_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

-- Admins can update ingested questions
CREATE POLICY "Admins update ingested questions"
  ON public.ingested_questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );
