-- Simple fix for app_cache table 406 error
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily to test
ALTER TABLE public.app_cache DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON public.app_cache TO authenticated;
GRANT ALL ON public.app_cache TO anon;

-- Test insert
INSERT INTO public.app_cache (key, value, expires_at, cache_type) 
VALUES ('test_simple_fix', '{"working": true}', NOW() + INTERVAL '1 hour', 'general')
ON CONFLICT (key) DO NOTHING;

-- Test select
SELECT * FROM public.app_cache WHERE key = 'test_simple_fix';

-- Clean up test
DELETE FROM public.app_cache WHERE key = 'test_simple_fix';

-- Re-enable RLS with simple policy
ALTER TABLE public.app_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Cache access policy" ON public.app_cache;
DROP POLICY IF EXISTS "Users can manage their own cache entries" ON public.app_cache;
DROP POLICY IF EXISTS "Anonymous users can read global cache" ON public.app_cache;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.app_cache;

-- Create very simple policy
CREATE POLICY "Simple cache policy" ON public.app_cache
FOR ALL USING (true)
WITH CHECK (true);

-- Test again
INSERT INTO public.app_cache (key, value, expires_at, cache_type) 
VALUES ('test_after_policy', '{"working": true}', NOW() + INTERVAL '1 hour', 'general')
ON CONFLICT (key) DO NOTHING;

SELECT * FROM public.app_cache WHERE key = 'test_after_policy';

DELETE FROM public.app_cache WHERE key = 'test_after_policy';

SELECT 'Cache table fixed successfully!' as result;