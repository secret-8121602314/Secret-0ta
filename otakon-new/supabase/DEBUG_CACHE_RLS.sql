-- Debug script to check app_cache table RLS policies and permissions
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'app_cache';

-- 2. Check all policies on app_cache table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'app_cache';

-- 3. Check table permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'app_cache' 
AND table_schema = 'public';

-- 4. Test basic access (this should work)
SELECT COUNT(*) as total_entries FROM public.app_cache;

-- 5. Test specific query that's failing (user cache)
SELECT key, value, expires_at 
FROM public.app_cache 
WHERE key = 'user:bbfd0097-9c38-4710-8bf4-4c1aff97e797'
LIMIT 1;

-- 6. Test conversations query
SELECT key, value, expires_at 
FROM public.app_cache 
WHERE key = 'otakon_conversations'
LIMIT 1;

-- 7. Check current user context
SELECT auth.uid() as current_user_id;

-- 8. Test insert (this might fail with 406)
INSERT INTO public.app_cache (key, value, expires_at, cache_type, user_id) 
VALUES ('test_debug', '{"test": true}', NOW() + INTERVAL '1 hour', 'general', auth.uid())
ON CONFLICT (key) DO NOTHING;

-- 9. Test select of the inserted record
SELECT * FROM public.app_cache WHERE key = 'test_debug';

-- 10. Clean up test
DELETE FROM public.app_cache WHERE key = 'test_debug';
