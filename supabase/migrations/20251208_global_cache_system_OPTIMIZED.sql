-- ============================================================================
-- GLOBAL CACHE SYSTEM MIGRATION - OPTIMIZED (Linter-Compliant)
-- Date: December 8, 2025
-- Purpose: Implement global caching for GameKnowledge, News, and IGDB data
-- Fixed: All security and performance warnings from Supabase linter
-- ============================================================================

-- ============================================================================
-- 1. GAME KNOWLEDGE GLOBAL CACHE
-- Purpose: Store comprehensive game knowledge fetched once, used by all users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.game_knowledge_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    igdb_id INTEGER UNIQUE NOT NULL,
    game_name TEXT NOT NULL,
    game_slug TEXT, -- For URL-friendly lookups
    
    -- Comprehensive game knowledge (up to 60K tokens for maximum detail)
    comprehensive_knowledge TEXT NOT NULL,
    knowledge_summary TEXT, -- Short summary for quick reference
    
    -- Metadata
    tokens_used INTEGER DEFAULT 0,
    fetched_with_grounding BOOLEAN DEFAULT true,
    is_post_cutoff BOOLEAN DEFAULT false, -- Released after Jan 2025
    is_unreleased BOOLEAN DEFAULT false,
    release_date DATE,
    
    -- Version control
    version INTEGER DEFAULT 1,
    last_refreshed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Stats
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_knowledge_igdb_id ON public.game_knowledge_cache(igdb_id);
CREATE INDEX IF NOT EXISTS idx_game_knowledge_game_slug ON public.game_knowledge_cache(game_slug);
CREATE INDEX IF NOT EXISTS idx_game_knowledge_release_date ON public.game_knowledge_cache(release_date);
CREATE INDEX IF NOT EXISTS idx_game_knowledge_is_unreleased ON public.game_knowledge_cache(is_unreleased) WHERE is_unreleased = true;

-- Comments
COMMENT ON TABLE public.game_knowledge_cache IS 'Global cache for comprehensive game knowledge. Fetched once with grounding, shared across all users and tiers.';
COMMENT ON COLUMN public.game_knowledge_cache.comprehensive_knowledge IS 'Full game knowledge including spoilers, strategies, secrets. Used as RAG context.';
COMMENT ON COLUMN public.game_knowledge_cache.is_post_cutoff IS 'Game released after Gemini knowledge cutoff (Jan 2025)';
COMMENT ON COLUMN public.game_knowledge_cache.version IS 'Knowledge version for tracking updates (DLC, patches)';

-- ============================================================================
-- 2. NEWS CACHE (24-HOUR TTL)
-- Purpose: Cache latest gaming news prompts shared across all users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.news_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_hash TEXT UNIQUE NOT NULL, -- SHA-256 of normalized prompt
    prompt_text TEXT NOT NULL,
    
    -- Response data
    response_text TEXT NOT NULL,
    response_metadata JSONB DEFAULT '{}'::jsonb,
    grounding_metadata JSONB, -- Search results metadata
    
    -- Cache metadata
    cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL, -- 24 hours from cached_at
    
    -- Stats
    first_requested_by_tier TEXT, -- 'free', 'pro', 'vanguard_pro'
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    
    -- Check constraint
    CONSTRAINT news_cache_expires_check CHECK (expires_at > cached_at),
    CONSTRAINT news_cache_tier_check CHECK (first_requested_by_tier IN ('free', 'pro', 'vanguard_pro'))
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_news_cache_prompt_hash ON public.news_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_news_cache_expires_at ON public.news_cache(expires_at);

-- Comments
COMMENT ON TABLE public.news_cache IS '24-hour cache for latest gaming news prompts. Shared across all users and tiers.';
COMMENT ON COLUMN public.news_cache.prompt_hash IS 'SHA-256 hash of normalized prompt text for deduplication';
COMMENT ON COLUMN public.news_cache.expires_at IS 'Cache expires 24 hours after creation. Auto-cleaned by cron job.';

-- ============================================================================
-- 3. UPDATE IGDB_GAME_CACHE TABLE
-- Purpose: Extend existing IGDB cache with better expiry logic
-- ============================================================================

-- Add new columns to existing igdb_game_cache
ALTER TABLE public.igdb_game_cache 
ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS release_date DATE,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- Update comment
COMMENT ON TABLE public.igdb_game_cache IS 'Global cache for IGDB API responses. 30-day TTL for unreleased games, permanent for released games.';
COMMENT ON COLUMN public.igdb_game_cache.is_released IS 'If false, cache expires in 30 days. If true, cache never expires.';

-- ============================================================================
-- 4. UNRELEASED TAB TRACKING
-- Purpose: Track unreleased game tabs per user to enforce limits
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.unreleased_game_tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    game_title TEXT NOT NULL,
    igdb_id INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Unique constraint: one entry per conversation
    UNIQUE(conversation_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_unreleased_tabs_user ON public.unreleased_game_tabs(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_unreleased_tabs_igdb ON public.unreleased_game_tabs(igdb_id);

-- Comments
COMMENT ON TABLE public.unreleased_game_tabs IS 'Tracks unreleased game tabs per user. Free: 2-3 max, Pro/Vanguard: 10 max.';

-- ============================================================================
-- 5. LIVE SERVICE SUBTAB REFRESH TRACKING
-- Purpose: Track daily subtab refresh usage (3 per day for Pro/Vanguard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subtab_refresh_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    subtab_id UUID NOT NULL REFERENCES public.subtabs(id) ON DELETE CASCADE,
    
    -- Refresh details
    refresh_date DATE DEFAULT CURRENT_DATE NOT NULL,
    refresh_count INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_refresh_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Unique: one row per user+date
    UNIQUE(auth_user_id, refresh_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subtab_refresh_user_date ON public.subtab_refresh_usage(auth_user_id, refresh_date);

-- Comments
COMMENT ON TABLE public.subtab_refresh_usage IS 'Tracks daily subtab refresh usage. Pro/Vanguard: 3 refreshes per day.';
COMMENT ON COLUMN public.subtab_refresh_usage.refresh_count IS 'Number of subtab refreshes used today (max 3 for Pro/Vanguard)';

-- ============================================================================
-- 6. ENHANCE EXISTING GAMES TABLE
-- Purpose: Add IGDB integration to existing games table for GameKnowledge linking
-- ============================================================================

-- Add IGDB columns to existing games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS igdb_game_id INTEGER,
ADD COLUMN IF NOT EXISTS game_slug TEXT,
ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMPTZ;

-- Create index for IGDB lookups
CREATE INDEX IF NOT EXISTS idx_games_igdb_id ON public.games(igdb_game_id);
CREATE INDEX IF NOT EXISTS idx_games_slug ON public.games(game_slug);

-- Add unique constraint for user+igdb_game combination
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'games_user_igdb_unique'
    ) THEN
        ALTER TABLE public.games 
        ADD CONSTRAINT games_user_igdb_unique UNIQUE(auth_user_id, igdb_game_id);
    END IF;
END $$;

-- Update comments
COMMENT ON COLUMN public.games.igdb_game_id IS 'IGDB game ID for linking to game_knowledge_cache';
COMMENT ON COLUMN public.games.game_slug IS 'URL-friendly game slug from IGDB';
COMMENT ON COLUMN public.games.last_played_at IS 'Last time user played this game';

-- ============================================================================
-- 7. USER SCREENSHOTS (HQ GALLERY)
-- Purpose: Store user screenshots for gallery view
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Screenshot data
    screenshot_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- Game context
    game_title TEXT,
    detected_game_id INTEGER, -- IGDB ID
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE SET NULL,
    
    -- Metadata
    width INTEGER,
    height INTEGER,
    file_size_bytes INTEGER,
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    captured_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_screenshots_user ON public.user_screenshots(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_game ON public.user_screenshots(detected_game_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_conversation ON public.user_screenshots(conversation_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_captured_at ON public.user_screenshots(captured_at DESC);

-- Comments
COMMENT ON TABLE public.user_screenshots IS 'User screenshot gallery for HQ interface. Replaces LocalStorage.';

-- ============================================================================
-- 8. USER TIMELINE (HQ JOURNEY TRACKER)
-- Purpose: Track user's gaming journey events
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Event details
    event_type TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_description TEXT,
    event_data JSONB DEFAULT '{}'::jsonb,
    
    -- Game context
    game_title TEXT,
    igdb_game_id INTEGER,
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE SET NULL,
    
    -- Timestamps
    event_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT timeline_event_type_check CHECK (event_type IN (
        'game_added', 'game_completed', 'boss_defeated', 
        'achievement_unlocked', 'milestone_reached', 'note_added', 'other'
    ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timeline_user_date ON public.user_timeline(auth_user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_game ON public.user_timeline(igdb_game_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_type ON public.user_timeline(event_type);

-- Comments
COMMENT ON TABLE public.user_timeline IS 'User gaming journey timeline for HQ interface. Replaces LocalStorage.';

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES - OPTIMIZED
-- ============================================================================

-- Game Knowledge Cache: Read-only for all authenticated users
ALTER TABLE public.game_knowledge_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read game knowledge cache" ON public.game_knowledge_cache;
CREATE POLICY "Anyone can read game knowledge cache"
ON public.game_knowledge_cache FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Service role can manage game knowledge" ON public.game_knowledge_cache;
CREATE POLICY "Service role can manage game knowledge"
ON public.game_knowledge_cache FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- News Cache: Read-only for all users (anon + authenticated)
ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read news cache" ON public.news_cache;
CREATE POLICY "Anyone can read news cache"
ON public.news_cache FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Service role can manage news cache" ON public.news_cache;
CREATE POLICY "Service role can manage news cache"
ON public.news_cache FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Unreleased Tabs: Users can manage their own (OPTIMIZED with select auth.uid())
ALTER TABLE public.unreleased_game_tabs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own unreleased tabs" ON public.unreleased_game_tabs;
CREATE POLICY "Users can view own unreleased tabs"
ON public.unreleased_game_tabs FOR SELECT
TO authenticated
USING ((select auth.uid()) = auth_user_id);

DROP POLICY IF EXISTS "Users can insert own unreleased tabs" ON public.unreleased_game_tabs;
CREATE POLICY "Users can insert own unreleased tabs"
ON public.unreleased_game_tabs FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = auth_user_id);

DROP POLICY IF EXISTS "Users can delete own unreleased tabs" ON public.unreleased_game_tabs;
CREATE POLICY "Users can delete own unreleased tabs"
ON public.unreleased_game_tabs FOR DELETE
TO authenticated
USING ((select auth.uid()) = auth_user_id);

-- Subtab Refresh Usage: Users can manage their own (OPTIMIZED)
ALTER TABLE public.subtab_refresh_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own refresh usage" ON public.subtab_refresh_usage;
CREATE POLICY "Users can view own refresh usage"
ON public.subtab_refresh_usage FOR SELECT
TO authenticated
USING ((select auth.uid()) = auth_user_id);

DROP POLICY IF EXISTS "Users can insert own refresh usage" ON public.subtab_refresh_usage;
CREATE POLICY "Users can insert own refresh usage"
ON public.subtab_refresh_usage FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = auth_user_id);

DROP POLICY IF EXISTS "Users can update own refresh usage" ON public.subtab_refresh_usage;
CREATE POLICY "Users can update own refresh usage"
ON public.subtab_refresh_usage FOR UPDATE
TO authenticated
USING ((select auth.uid()) = auth_user_id)
WITH CHECK ((select auth.uid()) = auth_user_id);

-- Screenshots: Users can manage their own (OPTIMIZED)
ALTER TABLE public.user_screenshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own screenshots" ON public.user_screenshots;
CREATE POLICY "Users can view own screenshots"
ON public.user_screenshots FOR SELECT
TO authenticated
USING ((select auth.uid()) = auth_user_id);

DROP POLICY IF EXISTS "Users can insert own screenshots" ON public.user_screenshots;
CREATE POLICY "Users can insert own screenshots"
ON public.user_screenshots FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = auth_user_id);

DROP POLICY IF EXISTS "Users can delete own screenshots" ON public.user_screenshots;
CREATE POLICY "Users can delete own screenshots"
ON public.user_screenshots FOR DELETE
TO authenticated
USING ((select auth.uid()) = auth_user_id);

-- Timeline: Users can manage their own (OPTIMIZED)
ALTER TABLE public.user_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own timeline" ON public.user_timeline;
CREATE POLICY "Users can view own timeline"
ON public.user_timeline FOR SELECT
TO authenticated
USING ((select auth.uid()) = auth_user_id);

DROP POLICY IF EXISTS "Users can insert own timeline events" ON public.user_timeline;
CREATE POLICY "Users can insert own timeline events"
ON public.user_timeline FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = auth_user_id);

DROP POLICY IF EXISTS "Users can update own timeline events" ON public.user_timeline;
CREATE POLICY "Users can update own timeline events"
ON public.user_timeline FOR UPDATE
TO authenticated
USING ((select auth.uid()) = auth_user_id)
WITH CHECK ((select auth.uid()) = auth_user_id);

DROP POLICY IF EXISTS "Users can delete own timeline events" ON public.user_timeline;
CREATE POLICY "Users can delete own timeline events"
ON public.user_timeline FOR DELETE
TO authenticated
USING ((select auth.uid()) = auth_user_id);

-- ============================================================================
-- 10. HELPER FUNCTIONS - SECURITY HARDENED
-- ============================================================================

-- Function: Get or fetch game knowledge (FIXED: Added SET search_path)
CREATE OR REPLACE FUNCTION public.get_game_knowledge(p_igdb_id INTEGER)
RETURNS TABLE (
    knowledge TEXT,
    cached BOOLEAN,
    version INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        comprehensive_knowledge,
        true::BOOLEAN as cached,
        version
    FROM public.game_knowledge_cache
    WHERE igdb_id = p_igdb_id;
    
    -- Update access stats
    UPDATE public.game_knowledge_cache
    SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE igdb_id = p_igdb_id;
END;
$$;

-- Function: Check news cache validity (FIXED: Added SET search_path)
CREATE OR REPLACE FUNCTION public.get_cached_news(p_prompt_hash TEXT)
RETURNS TABLE (
    response TEXT,
    cached_at TIMESTAMPTZ,
    is_expired BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        response_text,
        news_cache.cached_at,
        (expires_at < NOW()) as is_expired
    FROM public.news_cache
    WHERE prompt_hash = p_prompt_hash;
    
    -- Update access stats if not expired
    UPDATE public.news_cache
    SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE prompt_hash = p_prompt_hash
    AND expires_at > NOW();
END;
$$;

-- Function: Count unreleased tabs for user (FIXED: Added SET search_path)
CREATE OR REPLACE FUNCTION public.count_unreleased_tabs(p_auth_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    tab_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO tab_count
    FROM public.unreleased_game_tabs
    WHERE auth_user_id = p_auth_user_id;
    
    RETURN tab_count;
END;
$$;

-- Function: Get daily subtab refresh count (FIXED: Added SET search_path)
CREATE OR REPLACE FUNCTION public.get_daily_refresh_count(p_auth_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    refresh_count INTEGER;
BEGIN
    SELECT COALESCE(SUM(refresh_count), 0)
    INTO refresh_count
    FROM public.subtab_refresh_usage
    WHERE auth_user_id = p_auth_user_id
    AND refresh_date = CURRENT_DATE;
    
    RETURN refresh_count;
END;
$$;

-- Function: Increment subtab refresh count (FIXED: Added SET search_path)
CREATE OR REPLACE FUNCTION public.increment_refresh_count(
    p_auth_user_id UUID,
    p_conversation_id TEXT,
    p_subtab_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Get current count
    SELECT COALESCE(SUM(refresh_count), 0)
    INTO current_count
    FROM public.subtab_refresh_usage
    WHERE auth_user_id = p_auth_user_id
    AND refresh_date = CURRENT_DATE;
    
    -- Check limit (3 per day)
    IF current_count >= 3 THEN
        RETURN false;
    END IF;
    
    -- Insert or update
    INSERT INTO public.subtab_refresh_usage (
        auth_user_id,
        conversation_id,
        subtab_id,
        refresh_date,
        refresh_count
    ) VALUES (
        p_auth_user_id,
        p_conversation_id,
        p_subtab_id,
        CURRENT_DATE,
        1
    )
    ON CONFLICT (auth_user_id, refresh_date)
    DO UPDATE SET
        refresh_count = subtab_refresh_usage.refresh_count + 1,
        last_refresh_at = NOW();
    
    RETURN true;
END;
$$;

-- ============================================================================
-- 11. CRON JOBS (Requires pg_cron extension)
-- ============================================================================

-- Clean up expired news cache (FIXED: Added SET search_path)
CREATE OR REPLACE FUNCTION public.cleanup_expired_news_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.news_cache
    WHERE expires_at < NOW();
END;
$$;

-- Note: To schedule, run in Supabase Dashboard SQL Editor:
-- SELECT cron.schedule('cleanup-expired-news', '0 2 * * *', 'SELECT cleanup_expired_news_cache()');

-- ============================================================================
-- 12. GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON TABLE public.game_knowledge_cache TO authenticated;
GRANT ALL ON TABLE public.game_knowledge_cache TO service_role;

GRANT ALL ON TABLE public.news_cache TO authenticated;
GRANT ALL ON TABLE public.news_cache TO anon;
GRANT ALL ON TABLE public.news_cache TO service_role;

GRANT ALL ON TABLE public.unreleased_game_tabs TO authenticated;
GRANT ALL ON TABLE public.unreleased_game_tabs TO service_role;

GRANT ALL ON TABLE public.subtab_refresh_usage TO authenticated;
GRANT ALL ON TABLE public.subtab_refresh_usage TO service_role;

GRANT ALL ON TABLE public.user_screenshots TO authenticated;
GRANT ALL ON TABLE public.user_screenshots TO service_role;

GRANT ALL ON TABLE public.user_timeline TO authenticated;
GRANT ALL ON TABLE public.user_timeline TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_game_knowledge(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_cached_news(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.count_unreleased_tabs(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_daily_refresh_count(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_refresh_count(UUID, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_news_cache() TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE - ALL LINTER WARNINGS RESOLVED
-- ============================================================================

COMMENT ON SCHEMA public IS 'Global cache system for GameKnowledge, News, IGDB, and HQ features. Reduces grounding costs and improves performance.';
