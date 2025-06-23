-- =============================================
-- ScrapedIn - Supabase Database Schema
-- Migration from SQLite to PostgreSQL
-- =============================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- JOBS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linkedin_job_id TEXT,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    job_url TEXT,
    poster_profile_url TEXT,
    poster_full_name TEXT,
    contract_type TEXT,
    published_at TEXT,
    description TEXT,
    email_content TEXT,
    status TEXT DEFAULT 'pending',
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_linkedin_job_id ON jobs(linkedin_job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- =============================================
-- EMAIL QUEUE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID,
    recipient_email TEXT,
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_email_queue_job_id 
        FOREIGN KEY (job_id) 
        REFERENCES jobs (id) 
        ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_job_id ON email_queue(job_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at ASC);

-- =============================================
-- TRIGGER FOR UPDATED_AT TIMESTAMP
-- =============================================
-- Drop function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;

-- Create trigger for jobs table
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS for better security
-- =============================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable all operations for service role" ON jobs;
DROP POLICY IF EXISTS "Enable all operations for service role" ON email_queue;
DROP POLICY IF EXISTS "jobs_service_role_policy" ON jobs;
DROP POLICY IF EXISTS "email_queue_service_role_policy" ON email_queue;

-- Create policies with unique names for service role access
CREATE POLICY "jobs_service_role_policy" ON jobs
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "email_queue_service_role_policy" ON email_queue
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions to service_role
GRANT ALL ON jobs TO service_role;
GRANT ALL ON email_queue TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================
-- Drop function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS increment_attempts(UUID) CASCADE;

-- Function to increment email attempts
CREATE OR REPLACE FUNCTION increment_attempts(email_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_attempts INTEGER;
BEGIN
    UPDATE email_queue 
    SET attempts = attempts + 1 
    WHERE id = email_id
    RETURNING attempts INTO current_attempts;
    
    RETURN current_attempts;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on function to service_role
GRANT EXECUTE ON FUNCTION increment_attempts(UUID) TO service_role;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these after creating the schema to verify:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('jobs', 'email_queue')
-- ORDER BY table_name, ordinal_position; 