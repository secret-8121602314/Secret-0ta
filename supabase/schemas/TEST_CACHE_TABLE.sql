-- Test script to verify app_cache table is working
-- Run this after FIX_CACHE_TABLE.sql

-- Test 1: Check if table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'app_cache' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 2: Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'app_cache';

-- Test 3: Check policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'app_cache';

-- Test 4: Try to insert a test record (this should work for authenticated users)
INSERT INTO public.app_cache (key, value, expires_at, cache_type) 
VALUES ('test_' || EXTRACT(EPOCH FROM NOW())::TEXT, '{"test": "value"}', NOW() + INTERVAL '1 hour', 'general')
ON CONFLICT (key) DO NOTHING;

-- Test 5: Try to read the test record
SELECT * FROM public.app_cache WHERE key LIKE 'test_%' ORDER BY created_at DESC LIMIT 1;

-- Test 6: Test cache functions
SELECT public.get_cache_stats();

-- Test 7: Clean up test records
DELETE FROM public.app_cache WHERE key LIKE 'test_%';

-- Test 8: Check if we can access the table from the app perspective
-- This simulates what the cache service does
SELECT key, value, expires_at 
FROM public.app_cache 
WHERE key = 'user:test-user-id' 
LIMIT 1;
