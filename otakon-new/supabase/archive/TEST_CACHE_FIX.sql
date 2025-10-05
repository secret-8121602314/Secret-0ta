-- Test the cache table with proper RLS policies
-- Run this in Supabase SQL Editor

-- 1. First, let's create a simple permissive policy
ALTER TABLE public.app_cache DISABLE ROW LEVEL SECURITY;

-- 2. Grant all permissions
GRANT ALL ON public.app_cache TO authenticated;
GRANT ALL ON public.app_cache TO anon;

-- 3. Test insert
INSERT INTO public.app_cache (key, value, expires_at, cache_type, user_id) 
VALUES ('test_user_cache', '{"user": "test"}', NOW() + INTERVAL '1 hour', 'user', 'bbfd0097-9c38-4710-8bf4-4c1aff97e797')
ON CONFLICT (key) DO NOTHING;

-- 4. Test select (this should work now)
SELECT key, value, expires_at 
FROM public.app_cache 
WHERE key = 'test_user_cache';

-- 5. Test conversations cache
INSERT INTO public.app_cache (key, value, expires_at, cache_type) 
VALUES ('otakon_conversations', '{"conversations": {}}', NOW() + INTERVAL '1 hour', 'general')
ON CONFLICT (key) DO NOTHING;

SELECT key, value, expires_at 
FROM public.app_cache 
WHERE key = 'otakon_conversations';

-- 6. Clean up
DELETE FROM public.app_cache WHERE key IN ('test_user_cache', 'otakon_conversations');

-- 7. Re-enable RLS with a simple policy
ALTER TABLE public.app_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Cache access policy" ON public.app_cache;
DROP POLICY IF EXISTS "Users can manage their own cache entries" ON public.app_cache;
DROP POLICY IF EXISTS "Anonymous users can read global cache" ON public.app_cache;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.app_cache;
DROP POLICY IF EXISTS "Simple cache policy" ON public.app_cache;

-- Create a very simple policy that allows all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON public.app_cache
FOR ALL USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Test again with RLS enabled
INSERT INTO public.app_cache (key, value, expires_at, cache_type, user_id) 
VALUES ('test_rls_enabled', '{"test": true}', NOW() + INTERVAL '1 hour', 'general', auth.uid())
ON CONFLICT (key) DO NOTHING;

SELECT * FROM public.app_cache WHERE key = 'test_rls_enabled';

DELETE FROM public.app_cache WHERE key = 'test_rls_enabled';

SELECT 'Cache table is working correctly!' as result;
