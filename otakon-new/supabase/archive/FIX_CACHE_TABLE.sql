-- Fix existing app_cache table issues
-- This script fixes permissions and structure without recreating the table

-- First, let's check what exists and fix permissions
DO $$
BEGIN
    -- Check if app_cache table exists and has the right structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_cache' AND table_schema = 'public') THEN
        RAISE NOTICE 'app_cache table exists, checking structure...';
        
        -- Check if all required columns exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_cache' AND column_name = 'cache_type') THEN
            RAISE NOTICE 'Adding missing cache_type column...';
            ALTER TABLE public.app_cache ADD COLUMN cache_type TEXT NOT NULL DEFAULT 'general';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_cache' AND column_name = 'user_id') THEN
            RAISE NOTICE 'Adding missing user_id column...';
            ALTER TABLE public.app_cache ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_cache' AND column_name = 'size_bytes') THEN
            RAISE NOTICE 'Adding missing size_bytes column...';
            ALTER TABLE public.app_cache ADD COLUMN size_bytes INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_cache' AND column_name = 'access_count') THEN
            RAISE NOTICE 'Adding missing access_count column...';
            ALTER TABLE public.app_cache ADD COLUMN access_count INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_cache' AND column_name = 'last_accessed_at') THEN
            RAISE NOTICE 'Adding missing last_accessed_at column...';
            ALTER TABLE public.app_cache ADD COLUMN last_accessed_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        RAISE NOTICE 'app_cache table structure updated successfully';
    ELSE
        RAISE NOTICE 'app_cache table does not exist, creating it...';
        -- Create the table if it doesn't exist
        CREATE TABLE public.app_cache (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          cache_type TEXT NOT NULL DEFAULT 'general',
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          size_bytes INTEGER DEFAULT 0,
          access_count INTEGER DEFAULT 0,
          last_accessed_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END;
$$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_app_cache_expires_at ON public.app_cache (expires_at);
CREATE INDEX IF NOT EXISTS idx_app_cache_user_id ON public.app_cache (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_app_cache_type ON public.app_cache (cache_type);
CREATE INDEX IF NOT EXISTS idx_app_cache_last_accessed ON public.app_cache (last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_app_cache_created_at ON public.app_cache (created_at);

-- Create partial indexes for specific cache types
CREATE INDEX IF NOT EXISTS idx_app_cache_conversations ON public.app_cache (user_id, key) 
  WHERE cache_type = 'conversation' AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_cache_user_data ON public.app_cache (user_id, key) 
  WHERE cache_type = 'user' AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_cache_context ON public.app_cache (user_id, key) 
  WHERE cache_type = 'context' AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_cache_memory ON public.app_cache (user_id, key) 
  WHERE cache_type = 'memory' AND user_id IS NOT NULL;

-- Enable RLS if not already enabled
ALTER TABLE public.app_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Cache access policy" ON public.app_cache;
DROP POLICY IF EXISTS "Users can manage their own cache entries" ON public.app_cache;
DROP POLICY IF EXISTS "Anonymous users can read global cache" ON public.app_cache;

-- Create the consolidated cache policy
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_cache TO authenticated;
GRANT SELECT ON public.app_cache TO anon;

-- Create or replace cache functions
CREATE OR REPLACE FUNCTION public.update_cache_updated_at()
RETURNS TRIGGER 
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_accessed_at = NOW();
  NEW.access_count = OLD.access_count + 1;
  NEW.size_bytes = LENGTH(NEW.value::TEXT);
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_cache_updated_at_trigger ON public.app_cache;
CREATE TRIGGER update_cache_updated_at_trigger
  BEFORE UPDATE ON public.app_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cache_updated_at();

-- Create cache cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER 
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.app_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Create cache stats function
CREATE OR REPLACE FUNCTION public.get_cache_stats()
RETURNS JSONB 
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_entries', COUNT(*),
    'total_size_bytes', COALESCE(SUM(size_bytes), 0),
    'expired_entries', COUNT(*) FILTER (WHERE expires_at < NOW()),
    'by_type', (
      SELECT jsonb_object_agg(cache_type, type_count)
      FROM (
        SELECT cache_type, COUNT(*) as type_count
        FROM public.app_cache
        WHERE expires_at > NOW()
        GROUP BY cache_type
      ) type_stats
    )
  ) INTO stats
  FROM public.app_cache
  WHERE expires_at > NOW();
  
  RETURN stats;
END;
$$;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.cleanup_expired_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cache_stats() TO authenticated;

-- Test the table access
DO $$
BEGIN
    -- Try to insert a test record
    INSERT INTO public.app_cache (key, value, expires_at, cache_type) 
    VALUES ('test_key', '{"test": "value"}', NOW() + INTERVAL '1 hour', 'general')
    ON CONFLICT (key) DO NOTHING;
    
    RAISE NOTICE '✅ app_cache table is working correctly!';
    
    -- Clean up test record
    DELETE FROM public.app_cache WHERE key = 'test_key';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error with app_cache table: %', SQLERRM;
END;
$$;
