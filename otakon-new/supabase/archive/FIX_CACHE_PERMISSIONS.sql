-- Fix permissions and RLS for existing app_cache table
-- Run this in your Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE public.app_cache ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Cache access policy" ON public.app_cache;
DROP POLICY IF EXISTS "Users can manage their own cache entries" ON public.app_cache;
DROP POLICY IF EXISTS "Anonymous users can read global cache" ON public.app_cache;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.app_cache;

-- Create a simple, working policy
CREATE POLICY "Cache access policy" ON public.app_cache
FOR ALL USING (
  -- Authenticated users can access their own data or global data
  (auth.uid() IS NOT NULL AND (
    (user_id = (select auth.uid()) AND user_id IS NOT NULL) OR
    (user_id IS NULL AND cache_type IN ('general', 'rate_limit'))
  )) OR
  -- Anonymous users can only read global cache entries that are not expired
  (auth.uid() IS NULL AND 
   user_id IS NULL AND 
   cache_type IN ('general', 'rate_limit') AND
   expires_at > NOW())
) WITH CHECK (
  -- Only authenticated users can insert/update
  auth.uid() IS NOT NULL AND (
    (user_id = (select auth.uid()) AND user_id IS NOT NULL) OR
    (user_id IS NULL AND cache_type IN ('general', 'rate_limit'))
  )
);

-- Grant permissions
GRANT ALL ON public.app_cache TO authenticated;
GRANT SELECT ON public.app_cache TO anon;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_app_cache_expires_at ON public.app_cache (expires_at);
CREATE INDEX IF NOT EXISTS idx_app_cache_user_id ON public.app_cache (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_app_cache_type ON public.app_cache (cache_type);
CREATE INDEX IF NOT EXISTS idx_app_cache_last_accessed ON public.app_cache (last_accessed_at);

-- Test the table access
INSERT INTO public.app_cache (key, value, expires_at, cache_type) 
VALUES ('test_permissions', '{"working": true}', NOW() + INTERVAL '1 hour', 'general')
ON CONFLICT (key) DO NOTHING;

-- Test select
SELECT * FROM public.app_cache WHERE key = 'test_permissions';

-- Clean up test
DELETE FROM public.app_cache WHERE key = 'test_permissions';

-- Success message
SELECT 'Cache table permissions fixed successfully!' as result;
