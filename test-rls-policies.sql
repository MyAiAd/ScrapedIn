-- =============================================
-- Test RLS Policies for ScrapedIn Database
-- =============================================

-- Test 1: Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('jobs', 'email_queue') 
AND table_schema = 'public';

-- Test 2: Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('jobs', 'email_queue');

-- Test 3: List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('jobs', 'email_queue');

-- Test 4: Test basic operations (run these with service_role)
-- Insert test job
INSERT INTO jobs (title, company, status) 
VALUES ('Test Job', 'Test Company', 'pending');

-- Select jobs
SELECT id, title, company, status, created_at 
FROM jobs 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 5: Count records
SELECT 
    (SELECT COUNT(*) FROM jobs) as jobs_count,
    (SELECT COUNT(*) FROM email_queue) as email_queue_count;

-- Test 6: Check permissions
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('jobs', 'email_queue')
AND grantee = 'service_role';

-- Cleanup test data
DELETE FROM jobs WHERE title = 'Test Job' AND company = 'Test Company'; 