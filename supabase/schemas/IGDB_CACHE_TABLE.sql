-- IGDB Game Cache Table Migration
-- Date: January 2025
-- Purpose: Cache IGDB API responses for 24 hours to reduce API calls

-- Create the IGDB game cache table
CREATE TABLE IF NOT EXISTS public.igdb_game_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_name_key TEXT NOT NULL UNIQUE,  -- Lowercase normalized game name for lookups
  igdb_id INTEGER,                      -- IGDB game ID
  game_data JSONB NOT NULL,             -- Full IGDB response data
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,      -- Cache TTL (24 hours from creation)
  
  -- Indexes for efficient lookups
  CONSTRAINT igdb_cache_expires_check CHECK (expires_at > created_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_igdb_cache_game_name ON public.igdb_game_cache(game_name_key);
CREATE INDEX IF NOT EXISTS idx_igdb_cache_igdb_id ON public.igdb_game_cache(igdb_id);
CREATE INDEX IF NOT EXISTS idx_igdb_cache_expires ON public.igdb_game_cache(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.igdb_game_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to fix the multiple permissive policies warning)
DROP POLICY IF EXISTS "Service role has full access to igdb_game_cache" ON public.igdb_game_cache;
DROP POLICY IF EXISTS "Authenticated users can read igdb_game_cache" ON public.igdb_game_cache;

-- Policy: Service role has full access (edge function uses service role)
-- Note: service_role bypasses RLS by default, but explicit policy for clarity
CREATE POLICY "Service role has full access to igdb_game_cache"
ON public.igdb_game_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to read non-expired cached data only
CREATE POLICY "Authenticated users can read igdb_game_cache"
ON public.igdb_game_cache
FOR SELECT
TO authenticated
USING (expires_at > NOW());

-- Add comments
COMMENT ON TABLE public.igdb_game_cache IS 'Cache for IGDB API responses with 24-hour TTL';
COMMENT ON COLUMN public.igdb_game_cache.game_name_key IS 'Lowercase normalized game name for cache lookups';
COMMENT ON COLUMN public.igdb_game_cache.igdb_id IS 'IGDB game ID for direct lookups';
COMMENT ON COLUMN public.igdb_game_cache.game_data IS 'Full IGDB game data including cover, screenshots, etc';
COMMENT ON COLUMN public.igdb_game_cache.expires_at IS 'Cache expiry timestamp (24 hours from creation)';

-- Grant permissions
GRANT SELECT ON public.igdb_game_cache TO authenticated;
GRANT ALL ON public.igdb_game_cache TO service_role;

-- Verify
SELECT 'IGDB cache table created successfully' AS status;
