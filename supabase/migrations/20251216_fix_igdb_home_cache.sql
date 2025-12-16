-- Fix IGDB Home Cache Table
-- This ensures the igdb_home_cache table exists and has proper permissions for INSERT/UPDATE operations

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS igdb_home_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL UNIQUE, -- e.g., 'featured_games', 'latest_games', 'category_rpg'
    data JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for expiration checks
CREATE INDEX IF NOT EXISTS idx_igdb_home_cache_expiry ON igdb_home_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_igdb_home_cache_key ON igdb_home_cache(cache_key);

-- RLS: Anyone can read, anyone can insert/update (upsert for caching)
ALTER TABLE igdb_home_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read IGDB home cache" ON igdb_home_cache;
DROP POLICY IF EXISTS "Anyone can insert IGDB home cache" ON igdb_home_cache;
DROP POLICY IF EXISTS "Anyone can update IGDB home cache" ON igdb_home_cache;

-- Create policies
CREATE POLICY "Anyone can read IGDB home cache"
    ON igdb_home_cache FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert IGDB home cache"
    ON igdb_home_cache FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update IGDB home cache"
    ON igdb_home_cache FOR UPDATE
    USING (true);

-- Comment for documentation
COMMENT ON TABLE igdb_home_cache IS 'Global cache for IGDB home tab data - shared across all users to reduce API calls. Expires after set time.';
COMMENT ON COLUMN igdb_home_cache.cache_key IS 'Unique identifier for cached data (e.g., featured_games, latest_games, new_releases, highest_rated, categories)';
COMMENT ON COLUMN igdb_home_cache.data IS 'Cached IGDB game data in JSONB format';
COMMENT ON COLUMN igdb_home_cache.expires_at IS 'Expiration timestamp - data should be refreshed after this time';
