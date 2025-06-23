-- =============================================
-- Fix RLS Policies Only - ScrapedIn Database
-- Run this if you get trigger errors with the full schema
-- =============================================

-- Enable RLS (safe to run multiple times)
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

-- Test the policies work
SELECT 'RLS policies updated successfully' as status; 