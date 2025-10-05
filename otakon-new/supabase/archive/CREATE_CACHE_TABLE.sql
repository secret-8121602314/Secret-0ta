-- Create app_cache table for centralized caching
CREATE TABLE IF NOT EXISTS public.app_cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_app_cache_expires_at ON public.app_cache(expires_at);

-- Create index for efficient key lookups
CREATE INDEX IF NOT EXISTS idx_app_cache_key ON public.app_cache(key);

-- Enable RLS
ALTER TABLE public.app_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for app_cache
-- Users can only access their own cache entries
CREATE POLICY "Users can view own cache entries" ON public.app_cache
    FOR SELECT USING (key LIKE (select auth.uid())::text || ':%');

CREATE POLICY "Users can insert own cache entries" ON public.app_cache
    FOR INSERT WITH CHECK (key LIKE (select auth.uid())::text || ':%');

CREATE POLICY "Users can update own cache entries" ON public.app_cache
    FOR UPDATE USING (key LIKE (select auth.uid())::text || ':%');

CREATE POLICY "Users can delete own cache entries" ON public.app_cache
    FOR DELETE USING (key LIKE (select auth.uid())::text || ':%');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_app_cache_updated_at
    BEFORE UPDATE ON public.app_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_app_cache_updated_at();

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.app_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS TABLE (
    total_entries BIGINT,
    expired_entries BIGINT,
    memory_usage_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_entries,
        COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_entries,
        pg_total_relation_size('public.app_cache') as memory_usage_bytes;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_cache TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_stats() TO authenticated;
