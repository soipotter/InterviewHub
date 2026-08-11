-- Create ingestion_sources table
CREATE TABLE IF NOT EXISTS public.ingestion_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL DEFAULT 'voz',
    source_name VARCHAR(255) NOT NULL,
    canonical_url TEXT NOT NULL,
    thread_id VARCHAR(100),
    title TEXT,
    first_discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_checked_at TIMESTAMPTZ,
    last_processed_post_id VARCHAR(100),
    last_processed_page INT DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'discovered',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    historical_complete BOOLEAN NOT NULL DEFAULT FALSE,
    discovery_method VARCHAR(100) DEFAULT 'auto_keyword_search',
    content_hash VARCHAR(64),
    questions_collected_count INT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ingestion_sources_type_url UNIQUE (source_type, canonical_url)
);

-- Create ingestion_runs table
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL DEFAULT 'voz',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    sources_discovered INT DEFAULT 0,
    sources_processed INT DEFAULT 0,
    pages_processed INT DEFAULT 0,
    posts_processed INT DEFAULT 0,
    questions_found INT DEFAULT 0,
    questions_inserted INT DEFAULT 0,
    duplicates INT DEFAULT 0,
    rejected INT DEFAULT 0,
    errors INT DEFAULT 0,
    summary_log JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ingestion_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users, full access for admins
CREATE POLICY "Public read for ingestion_sources" ON public.ingestion_sources
    FOR SELECT USING (true);

CREATE POLICY "Admin write for ingestion_sources" ON public.ingestion_sources
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read for ingestion_runs" ON public.ingestion_runs
    FOR SELECT USING (true);

CREATE POLICY "Admin write for ingestion_runs" ON public.ingestion_runs
    FOR ALL USING (auth.role() = 'authenticated');

-- Pre-register historical thread 206897 as historical_complete
INSERT INTO public.ingestion_sources (
    source_type, source_name, canonical_url, thread_id, title,
    status, is_active, historical_complete, last_processed_page, questions_collected_count
) VALUES (
    'voz', 'Voz Forum - IT Company Interview Review',
    'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
    '206897', 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
    'processed', true, true, 102, 88
) ON CONFLICT (source_type, canonical_url) DO UPDATE SET
    historical_complete = true,
    last_processed_page = 102,
    status = 'processed';
