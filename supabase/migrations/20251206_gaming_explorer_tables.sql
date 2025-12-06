-- Gaming Explorer Data Migration
-- Migrates localStorage data to Supabase for the Gaming Explorer mini-app
-- 
-- This migration creates tables to store:
-- 1. Game Library (owned, wishlist, favorites, disliked games)
-- 2. Timeline Events (consoles, PC builds, game milestones, albums)
-- 3. Game Knowledge Base (AI-extracted game guides and tips)
-- 4. User Gaming Profile (gaming start year, stats)
-- 5. Search History (recently searched games)
-- 6. IGDB Home Cache (cached game data for home tab)

-- ============================================================================
-- GAME LIBRARY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS gaming_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    igdb_game_id INTEGER NOT NULL,
    game_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('own', 'wishlist', 'favorite', 'disliked')),
    platform TEXT,
    personal_rating INTEGER CHECK (personal_rating BETWEEN 1 AND 5),
    completion_status TEXT CHECK (completion_status IN ('not_started', 'playing', 'completed', 'abandoned')),
    hours_played REAL,
    notes TEXT,
    igdb_data JSONB, -- Cached IGDB data for offline access
    date_added TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicates: same game can't be in same category twice for a user
    UNIQUE(auth_user_id, igdb_game_id, category)
);

-- Indexes for efficient queries
CREATE INDEX idx_gaming_library_user ON gaming_library(auth_user_id);
CREATE INDEX idx_gaming_library_category ON gaming_library(auth_user_id, category);
CREATE INDEX idx_gaming_library_game ON gaming_library(igdb_game_id);

-- RLS Policies
ALTER TABLE gaming_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own library"
    ON gaming_library FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert to their own library"
    ON gaming_library FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own library"
    ON gaming_library FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete from their own library"
    ON gaming_library FOR DELETE
    USING (auth.uid() = auth_user_id);

-- ============================================================================
-- TIMELINE EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS gaming_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('console', 'game', 'pc_build', 'album', 'gameplay_session')),
    event_date DATE NOT NULL,
    year INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    specs JSONB, -- For PC builds: { "CPU": "...", "GPU": "...", etc. }
    photos TEXT[], -- Array of URLs
    igdb_game_id INTEGER, -- For game events
    igdb_data JSONB, -- Cached IGDB data
    screenshot_count INTEGER DEFAULT 0, -- For gameplay sessions
    ai_summary TEXT, -- AI analysis summary
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gaming_timeline_user ON gaming_timeline(auth_user_id);
CREATE INDEX idx_gaming_timeline_year ON gaming_timeline(auth_user_id, year);
CREATE INDEX idx_gaming_timeline_type ON gaming_timeline(auth_user_id, event_type);

-- RLS Policies
ALTER TABLE gaming_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own timeline"
    ON gaming_timeline FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert to their own timeline"
    ON gaming_timeline FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own timeline"
    ON gaming_timeline FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete from their own timeline"
    ON gaming_timeline FOR DELETE
    USING (auth.uid() = auth_user_id);

-- ============================================================================
-- GAME KNOWLEDGE BASE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS gaming_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    igdb_game_id INTEGER NOT NULL,
    game_name TEXT NOT NULL,
    walkthrough_data TEXT,
    story_progression JSONB,
    collectibles JSONB,
    achievements JSONB,
    tips_and_tricks TEXT,
    boss_strategies JSONB,
    character_builds JSONB,
    game_mechanics TEXT,
    extracted_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- One knowledge base per game per user
    UNIQUE(auth_user_id, igdb_game_id)
);

-- Indexes
CREATE INDEX idx_gaming_knowledge_user ON gaming_knowledge(auth_user_id);
CREATE INDEX idx_gaming_knowledge_game ON gaming_knowledge(igdb_game_id);

-- RLS Policies
ALTER TABLE gaming_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge"
    ON gaming_knowledge FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own knowledge"
    ON gaming_knowledge FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own knowledge"
    ON gaming_knowledge FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete their own knowledge"
    ON gaming_knowledge FOR DELETE
    USING (auth.uid() = auth_user_id);

-- ============================================================================
-- USER GAMING PROFILE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS gaming_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    gaming_start_year INTEGER,
    owned_count INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    wishlist_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    disliked_count INTEGER DEFAULT 0,
    total_hours_played REAL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE gaming_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON gaming_profiles FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile"
    ON gaming_profiles FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
    ON gaming_profiles FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- ============================================================================
-- SEARCH HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS gaming_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    igdb_game_id INTEGER NOT NULL,
    game_data JSONB NOT NULL, -- Full IGDB game data for display
    searched_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One entry per game per user (upsert on search)
    UNIQUE(auth_user_id, igdb_game_id)
);

-- Indexes
CREATE INDEX idx_gaming_search_history_user ON gaming_search_history(auth_user_id);
CREATE INDEX idx_gaming_search_history_time ON gaming_search_history(auth_user_id, searched_at DESC);

-- RLS Policies
ALTER TABLE gaming_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search history"
    ON gaming_search_history FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert to their own search history"
    ON gaming_search_history FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own search history"
    ON gaming_search_history FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete from their own search history"
    ON gaming_search_history FOR DELETE
    USING (auth.uid() = auth_user_id);

-- ============================================================================
-- NEWS CACHE TABLE (Global cache shared across users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS gaming_news_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_type TEXT NOT NULL CHECK (prompt_type IN ('latest_news', 'trending_games', 'upcoming_releases', 'new_reviews')),
    items JSONB NOT NULL, -- Array of news items
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    generated_by_user_id UUID REFERENCES auth.users(id),
    
    -- One cache entry per prompt type
    UNIQUE(prompt_type)
);

-- Index for expiration checks
CREATE INDEX idx_gaming_news_cache_expiry ON gaming_news_cache(expires_at);

-- RLS: Anyone can read news cache, only system can write
ALTER TABLE gaming_news_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news cache"
    ON gaming_news_cache FOR SELECT
    USING (true);

-- ============================================================================
-- IGDB HOME CACHE TABLE (Global cache for home tab data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS igdb_home_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL UNIQUE, -- e.g., 'featured_games', 'latest_games', 'category_rpg'
    data JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for expiration checks
CREATE INDEX idx_igdb_home_cache_expiry ON igdb_home_cache(expires_at);

-- RLS: Anyone can read
ALTER TABLE igdb_home_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read IGDB home cache"
    ON igdb_home_cache FOR SELECT
    USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update gaming profile stats
CREATE OR REPLACE FUNCTION update_gaming_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate stats from gaming_library
    INSERT INTO gaming_profiles (auth_user_id, owned_count, completed_count, wishlist_count, favorites_count, disliked_count, total_hours_played, last_updated)
    SELECT 
        COALESCE(NEW.auth_user_id, OLD.auth_user_id),
        COUNT(*) FILTER (WHERE category = 'own'),
        COUNT(*) FILTER (WHERE category = 'own' AND completion_status = 'completed'),
        COUNT(*) FILTER (WHERE category = 'wishlist'),
        COUNT(*) FILTER (WHERE category = 'favorite'),
        COUNT(*) FILTER (WHERE category = 'disliked'),
        COALESCE(SUM(hours_played) FILTER (WHERE category = 'own'), 0),
        NOW()
    FROM gaming_library
    WHERE auth_user_id = COALESCE(NEW.auth_user_id, OLD.auth_user_id)
    ON CONFLICT (auth_user_id) 
    DO UPDATE SET
        owned_count = EXCLUDED.owned_count,
        completed_count = EXCLUDED.completed_count,
        wishlist_count = EXCLUDED.wishlist_count,
        favorites_count = EXCLUDED.favorites_count,
        disliked_count = EXCLUDED.disliked_count,
        total_hours_played = EXCLUDED.total_hours_played,
        last_updated = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update stats when library changes
CREATE TRIGGER update_gaming_stats_on_library_change
    AFTER INSERT OR UPDATE OR DELETE ON gaming_library
    FOR EACH ROW
    EXECUTE FUNCTION update_gaming_profile_stats();

-- Function to clean up expired caches
CREATE OR REPLACE FUNCTION cleanup_gaming_caches()
RETURNS void AS $$
BEGIN
    DELETE FROM gaming_news_cache WHERE expires_at < NOW();
    DELETE FROM igdb_home_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLEANUP OLD SEARCH HISTORY (Keep only last 12 per user)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_search_history()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM gaming_search_history
    WHERE auth_user_id = NEW.auth_user_id
    AND id NOT IN (
        SELECT id FROM gaming_search_history
        WHERE auth_user_id = NEW.auth_user_id
        ORDER BY searched_at DESC
        LIMIT 12
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_search_history
    AFTER INSERT ON gaming_search_history
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_search_history();
