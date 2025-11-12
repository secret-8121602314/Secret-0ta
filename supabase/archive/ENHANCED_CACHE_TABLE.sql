-- Enhanced Cache Table for Chat Persistence and AI Memory
-- This replaces the basic CREATE_CACHE_TABLE.sql with a more comprehensive solution

-- Drop existing cache table if it exists (for clean migration)
DROP TABLE IF EXISTS public.app_cache CASCADE;

-- Create the main cache table with optimized structure
CREATE TABLE public.app_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cache_type TEXT NOT NULL DEFAULT 'general', -- 'conversation', 'user', 'context', 'memory', 'rate_limit'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For user-specific cache entries
  size_bytes INTEGER DEFAULT 0, -- Track cache entry size for monitoring
  access_count INTEGER DEFAULT 0, -- Track how often this cache entry is accessed
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_app_cache_expires_at ON public.app_cache (expires_at);
CREATE INDEX idx_app_cache_user_id ON public.app_cache (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_app_cache_type ON public.app_cache (cache_type);
CREATE INDEX idx_app_cache_last_accessed ON public.app_cache (last_accessed_at);
CREATE INDEX idx_app_cache_created_at ON public.app_cache (created_at);

-- Create partial indexes for specific cache types
CREATE INDEX idx_app_cache_conversations ON public.app_cache (user_id, key) 
  WHERE cache_type = 'conversation' AND user_id IS NOT NULL;

CREATE INDEX idx_app_cache_user_data ON public.app_cache (user_id, key) 
  WHERE cache_type = 'user' AND user_id IS NOT NULL;

CREATE INDEX idx_app_cache_context ON public.app_cache (user_id, key) 
  WHERE cache_type = 'context' AND user_id IS NOT NULL;

CREATE INDEX idx_app_cache_memory ON public.app_cache (user_id, key) 
  WHERE cache_type = 'memory' AND user_id IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_cache ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their own cache entries
CREATE POLICY "Users can manage their own cache entries" ON public.app_cache
FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    -- User-specific cache entries
    (user_id = (select auth.uid()) AND user_id IS NOT NULL) OR
    -- Global cache entries (no user_id)
    (user_id IS NULL AND cache_type IN ('general', 'rate_limit'))
  )
) WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User-specific cache entries
    (user_id = (select auth.uid()) AND user_id IS NOT NULL) OR
    -- Global cache entries (no user_id)
    (user_id IS NULL AND cache_type IN ('general', 'rate_limit'))
  )
);

-- Policy for anonymous users to read global cache entries only
CREATE POLICY "Anonymous users can read global cache" ON public.app_cache
FOR SELECT USING (
  auth.uid() IS NULL AND 
  user_id IS NULL AND 
  cache_type IN ('general', 'rate_limit') AND
  expires_at > NOW()
);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_accessed_at = NOW();
  NEW.access_count = OLD.access_count + 1;
  NEW.size_bytes = LENGTH(NEW.value::TEXT);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps and access count
CREATE TRIGGER update_cache_updated_at_trigger
  BEFORE UPDATE ON public.app_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_cache_updated_at();

-- Create a function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.app_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO public.app_cache (
    key, 
    value, 
    expires_at, 
    cache_type, 
    user_id
  ) VALUES (
    'cleanup_log_' || EXTRACT(EPOCH FROM NOW())::TEXT,
    jsonb_build_object(
      'deleted_count', deleted_count,
      'cleanup_time', NOW(),
      'type', 'cleanup_log'
    ),
    NOW() + INTERVAL '1 day',
    'general',
    NULL
  ) ON CONFLICT (key) DO NOTHING;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS JSONB AS $$
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
    ),
    'by_user', (
      SELECT jsonb_object_agg(
        COALESCE(user_id::TEXT, 'global'), 
        user_count
      )
      FROM (
        SELECT user_id, COUNT(*) as user_count
        FROM public.app_cache
        WHERE expires_at > NOW()
        GROUP BY user_id
      ) user_stats
    ),
    'most_accessed', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'key', key,
          'access_count', access_count,
          'cache_type', cache_type
        )
      )
      FROM (
        SELECT key, access_count, cache_type
        FROM public.app_cache
        WHERE expires_at > NOW()
        ORDER BY access_count DESC
        LIMIT 10
      ) top_accessed
    )
  ) INTO stats
  FROM public.app_cache
  WHERE expires_at > NOW();
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user-specific cache entries
CREATE OR REPLACE FUNCTION get_user_cache_entries(target_user_id UUID)
RETURNS TABLE (
  key TEXT,
  value JSONB,
  cache_type TEXT,
  expires_at TIMESTAMPTZ,
  access_count INTEGER,
  size_bytes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.key,
    ac.value,
    ac.cache_type,
    ac.expires_at,
    ac.access_count,
    ac.size_bytes
  FROM public.app_cache ac
  WHERE ac.user_id = target_user_id
    AND ac.expires_at > NOW()
  ORDER BY ac.last_accessed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to clear user cache
CREATE OR REPLACE FUNCTION clear_user_cache(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.app_cache 
  WHERE user_id = target_user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get cache performance metrics
CREATE OR REPLACE FUNCTION get_cache_performance_metrics()
RETURNS JSONB AS $$
DECLARE
  metrics JSONB;
BEGIN
  SELECT jsonb_build_object(
    'hit_rate', (
      SELECT COALESCE(
        AVG(access_count::FLOAT / GREATEST(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600, 1)),
        0
      )
      FROM public.app_cache
      WHERE expires_at > NOW()
    ),
    'average_size', (
      SELECT COALESCE(AVG(size_bytes), 0)
      FROM public.app_cache
      WHERE expires_at > NOW()
    ),
    'largest_entries', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'key', key,
          'size_bytes', size_bytes,
          'cache_type', cache_type
        )
      )
      FROM (
        SELECT key, size_bytes, cache_type
        FROM public.app_cache
        WHERE expires_at > NOW()
        ORDER BY size_bytes DESC
        LIMIT 5
      ) largest
    ),
    'oldest_entries', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'key', key,
          'created_at', created_at,
          'cache_type', cache_type
        )
      )
      FROM (
        SELECT key, created_at, cache_type
        FROM public.app_cache
        WHERE expires_at > NOW()
        ORDER BY created_at ASC
        LIMIT 5
      ) oldest
    )
  ) INTO metrics
  FROM public.app_cache;
  
  RETURN metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up expired cache entries (if pg_cron is available)
-- This would need to be set up separately in Supabase dashboard
-- SELECT cron.schedule('cleanup-expired-cache', '0 */6 * * *', 'SELECT cleanup_expired_cache();');

-- Insert some initial cache entries for testing
INSERT INTO public.app_cache (key, value, expires_at, cache_type, user_id) VALUES
('app_version', '{"version": "1.0.0", "build": "2024-01-01"}', NOW() + INTERVAL '30 days', 'general', NULL),
('rate_limit_global', '{"count": 0, "reset_time": 0}', NOW() + INTERVAL '1 hour', 'rate_limit', NULL);

-- Create a view for monitoring cache health
CREATE VIEW cache_health_monitor AS
SELECT 
  cache_type,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_entries,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
  COALESCE(SUM(size_bytes), 0) as total_size_bytes,
  COALESCE(AVG(size_bytes), 0) as avg_size_bytes,
  COALESCE(MAX(access_count), 0) as max_access_count,
  COALESCE(AVG(access_count), 0) as avg_access_count
FROM public.app_cache
GROUP BY cache_type
ORDER BY total_entries DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_cache TO authenticated;
GRANT SELECT ON public.app_cache TO anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_cache_entries(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_user_cache(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_performance_metrics() TO authenticated;
GRANT SELECT ON cache_health_monitor TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.app_cache IS 'Centralized cache table for application data with user-specific and global entries';
COMMENT ON COLUMN public.app_cache.key IS 'Unique cache key identifier';
COMMENT ON COLUMN public.app_cache.value IS 'Cached data as JSONB';
COMMENT ON COLUMN public.app_cache.expires_at IS 'When this cache entry expires';
COMMENT ON COLUMN public.app_cache.cache_type IS 'Type of cache entry: conversation, user, context, memory, rate_limit, general';
COMMENT ON COLUMN public.app_cache.user_id IS 'User ID for user-specific cache entries, NULL for global entries';
COMMENT ON COLUMN public.app_cache.size_bytes IS 'Size of the cache entry in bytes for monitoring';
COMMENT ON COLUMN public.app_cache.access_count IS 'Number of times this cache entry has been accessed';
COMMENT ON COLUMN public.app_cache.last_accessed_at IS 'When this cache entry was last accessed';

COMMENT ON FUNCTION cleanup_expired_cache() IS 'Removes expired cache entries and returns count of deleted entries';
COMMENT ON FUNCTION get_cache_stats() IS 'Returns comprehensive cache statistics including size, type distribution, and access patterns';
COMMENT ON FUNCTION get_user_cache_entries(UUID) IS 'Returns all active cache entries for a specific user';
COMMENT ON FUNCTION clear_user_cache(UUID) IS 'Removes all cache entries for a specific user';
COMMENT ON FUNCTION get_cache_performance_metrics() IS 'Returns cache performance metrics including hit rates and size analysis';
