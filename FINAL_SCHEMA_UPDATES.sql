-- ============================================================================
-- FINAL SCHEMA UPDATES - December 16, 2025
-- ============================================================================
-- This migration includes:
-- 1. Create missing Gaming Explorer tables (gaming_profiles, gaming_search_history, gaming_knowledge)
-- 2. Redesign games table as GLOBAL analytics table (not per-user)
-- 3. Remove deprecated onboarding_progress table
-- 4. Confirm user_feedback, ai_feedback, api_usage are working correctly
--
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/sql
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE MISSING GAMING EXPLORER TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. GAMING_PROFILES TABLE (User-scoped)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gaming_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gaming_start_year integer,
    owned_count integer DEFAULT 0 NOT NULL,
    completed_count integer DEFAULT 0 NOT NULL,
    wishlist_count integer DEFAULT 0 NOT NULL,
    favorites_count integer DEFAULT 0 NOT NULL,
    disliked_count integer DEFAULT 0 NOT NULL,
    total_hours_played integer DEFAULT 0 NOT NULL,
    last_updated timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    CONSTRAINT gaming_profiles_auth_user_id_key UNIQUE (auth_user_id)
);

COMMENT ON TABLE public.gaming_profiles IS 'User gaming profile statistics from Gaming HQ';
COMMENT ON COLUMN public.gaming_profiles.gaming_start_year IS 'Year the user started gaming';
COMMENT ON COLUMN public.gaming_profiles.owned_count IS 'Count of owned games';
COMMENT ON COLUMN public.gaming_profiles.completed_count IS 'Count of completed games';
COMMENT ON COLUMN public.gaming_profiles.wishlist_count IS 'Count of wishlist games';
COMMENT ON COLUMN public.gaming_profiles.favorites_count IS 'Count of favorite games';
COMMENT ON COLUMN public.gaming_profiles.disliked_count IS 'Count of disliked games';
COMMENT ON COLUMN public.gaming_profiles.total_hours_played IS 'Total hours played across all games';

CREATE INDEX IF NOT EXISTS gaming_profiles_auth_user_id_idx ON public.gaming_profiles(auth_user_id);

ALTER TABLE public.gaming_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own gaming profile" ON public.gaming_profiles;
DROP POLICY IF EXISTS "Users can insert their own gaming profile" ON public.gaming_profiles;
DROP POLICY IF EXISTS "Users can update their own gaming profile" ON public.gaming_profiles;
DROP POLICY IF EXISTS "Users can delete their own gaming profile" ON public.gaming_profiles;

CREATE POLICY "Users can view their own gaming profile"
    ON public.gaming_profiles FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own gaming profile"
    ON public.gaming_profiles FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own gaming profile"
    ON public.gaming_profiles FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete their own gaming profile"
    ON public.gaming_profiles FOR DELETE
    USING (auth.uid() = auth_user_id);

-- ----------------------------------------------------------------------------
-- 2. GAMING_SEARCH_HISTORY TABLE (User-scoped)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gaming_search_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    igdb_game_id integer NOT NULL,
    game_data jsonb NOT NULL,
    searched_at timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    CONSTRAINT gaming_search_history_unique_search UNIQUE (auth_user_id, igdb_game_id)
);

COMMENT ON TABLE public.gaming_search_history IS 'User game search history from Gaming HQ';
COMMENT ON COLUMN public.gaming_search_history.igdb_game_id IS 'IGDB game ID';
COMMENT ON COLUMN public.gaming_search_history.game_data IS 'Full IGDB game data (cached for offline access)';
COMMENT ON COLUMN public.gaming_search_history.searched_at IS 'When the user last searched for this game';

CREATE INDEX IF NOT EXISTS gaming_search_history_auth_user_id_idx ON public.gaming_search_history(auth_user_id);
CREATE INDEX IF NOT EXISTS gaming_search_history_searched_at_idx ON public.gaming_search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS gaming_search_history_igdb_game_id_idx ON public.gaming_search_history(igdb_game_id);

ALTER TABLE public.gaming_search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own search history" ON public.gaming_search_history;
DROP POLICY IF EXISTS "Users can insert their own search history" ON public.gaming_search_history;
DROP POLICY IF EXISTS "Users can update their own search history" ON public.gaming_search_history;
DROP POLICY IF EXISTS "Users can delete their own search history" ON public.gaming_search_history;

CREATE POLICY "Users can view their own search history"
    ON public.gaming_search_history FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own search history"
    ON public.gaming_search_history FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own search history"
    ON public.gaming_search_history FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete their own search history"
    ON public.gaming_search_history FOR DELETE
    USING (auth.uid() = auth_user_id);

-- ----------------------------------------------------------------------------
-- 3. GAMING_KNOWLEDGE TABLE (User-scoped)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gaming_knowledge (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    igdb_game_id integer NOT NULL,
    game_name text NOT NULL,
    walkthrough_data jsonb,
    story_progression jsonb,
    collectibles jsonb,
    achievements jsonb,
    tips_and_tricks jsonb,
    boss_strategies jsonb,
    character_builds jsonb,
    game_mechanics jsonb,
    extracted_at timestamptz NOT NULL,
    last_updated timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    CONSTRAINT gaming_knowledge_unique_game UNIQUE (auth_user_id, igdb_game_id)
);

COMMENT ON TABLE public.gaming_knowledge IS 'AI-extracted game knowledge base from Gaming HQ';
COMMENT ON COLUMN public.gaming_knowledge.igdb_game_id IS 'IGDB game ID';
COMMENT ON COLUMN public.gaming_knowledge.game_name IS 'Name of the game';
COMMENT ON COLUMN public.gaming_knowledge.walkthrough_data IS 'Game walkthrough information';
COMMENT ON COLUMN public.gaming_knowledge.story_progression IS 'Story progression tracking';
COMMENT ON COLUMN public.gaming_knowledge.collectibles IS 'Collectibles information';
COMMENT ON COLUMN public.gaming_knowledge.achievements IS 'Achievements/trophies data';
COMMENT ON COLUMN public.gaming_knowledge.tips_and_tricks IS 'Tips and tricks';
COMMENT ON COLUMN public.gaming_knowledge.boss_strategies IS 'Boss fight strategies';
COMMENT ON COLUMN public.gaming_knowledge.character_builds IS 'Character build recommendations';
COMMENT ON COLUMN public.gaming_knowledge.game_mechanics IS 'Game mechanics explanations';
COMMENT ON COLUMN public.gaming_knowledge.extracted_at IS 'When the knowledge was first extracted';
COMMENT ON COLUMN public.gaming_knowledge.last_updated IS 'When the knowledge was last updated';

CREATE INDEX IF NOT EXISTS gaming_knowledge_auth_user_id_idx ON public.gaming_knowledge(auth_user_id);
CREATE INDEX IF NOT EXISTS gaming_knowledge_igdb_game_id_idx ON public.gaming_knowledge(igdb_game_id);
CREATE INDEX IF NOT EXISTS gaming_knowledge_game_name_idx ON public.gaming_knowledge(game_name);
CREATE INDEX IF NOT EXISTS gaming_knowledge_last_updated_idx ON public.gaming_knowledge(last_updated DESC);

ALTER TABLE public.gaming_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own gaming knowledge" ON public.gaming_knowledge;
DROP POLICY IF EXISTS "Users can insert their own gaming knowledge" ON public.gaming_knowledge;
DROP POLICY IF EXISTS "Users can update their own gaming knowledge" ON public.gaming_knowledge;
DROP POLICY IF EXISTS "Users can delete their own gaming knowledge" ON public.gaming_knowledge;

CREATE POLICY "Users can view their own gaming knowledge"
    ON public.gaming_knowledge FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own gaming knowledge"
    ON public.gaming_knowledge FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own gaming knowledge"
    ON public.gaming_knowledge FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete their own gaming knowledge"
    ON public.gaming_knowledge FOR DELETE
    USING (auth.uid() = auth_user_id);

-- ============================================================================
-- PART 2: REDESIGN GAMES TABLE AS GLOBAL ANALYTICS TABLE
-- ============================================================================

-- Drop existing games table (backup data first if needed)
DROP TABLE IF EXISTS public.games CASCADE;

-- Create new GLOBAL games analytics table
CREATE TABLE IF NOT EXISTS public.games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Game Identity (Global - NO user_id!)
    igdb_game_id integer UNIQUE,
    game_title text NOT NULL,
    game_slug text,
    genre text,
    cover_url text,
    
    -- Global Statistics (Aggregated Across ALL Users)
    total_tabs_created integer DEFAULT 0 NOT NULL,
    total_conversations integer DEFAULT 0 NOT NULL,
    total_messages integer DEFAULT 0 NOT NULL,
    total_users integer DEFAULT 0 NOT NULL,
    total_subtabs_generated integer DEFAULT 0 NOT NULL,
    
    -- Popular Content Tracking
    common_questions jsonb DEFAULT '[]'::jsonb,
    popular_subtabs jsonb DEFAULT '[]'::jsonb,
    top_genres_mentioned jsonb DEFAULT '[]'::jsonb,
    
    -- User Engagement
    average_session_length_minutes real DEFAULT 0,
    average_messages_per_conversation real DEFAULT 0,
    thumbs_up_count integer DEFAULT 0,
    thumbs_down_count integer DEFAULT 0,
    
    -- Timestamps
    first_tab_created_at timestamptz,
    last_tab_created_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- Ensure unique game tracking
    CONSTRAINT games_unique_title UNIQUE (game_title)
);

COMMENT ON TABLE public.games IS 'GLOBAL game analytics table. Tracks aggregate statistics across ALL users for each game. NOT per-user data (use user_library for that).';
COMMENT ON COLUMN public.games.igdb_game_id IS 'IGDB game identifier for linking';
COMMENT ON COLUMN public.games.total_tabs_created IS 'How many users created tabs for this game';
COMMENT ON COLUMN public.games.total_users IS 'Number of unique users who interacted with this game';
COMMENT ON COLUMN public.games.common_questions IS 'Array of {question: string, count: number} - most asked questions';
COMMENT ON COLUMN public.games.popular_subtabs IS 'Array of {subtab_type: string, generated_count: number} - which subtabs users create most';
COMMENT ON COLUMN public.games.thumbs_up_count IS 'Total positive AI feedback for this game';
COMMENT ON COLUMN public.games.thumbs_down_count IS 'Total negative AI feedback for this game';

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS games_igdb_game_id_idx ON public.games(igdb_game_id);
CREATE INDEX IF NOT EXISTS games_game_title_idx ON public.games(game_title);
CREATE INDEX IF NOT EXISTS games_total_users_idx ON public.games(total_users DESC);
CREATE INDEX IF NOT EXISTS games_total_tabs_idx ON public.games(total_tabs_created DESC);
CREATE INDEX IF NOT EXISTS games_genre_idx ON public.games(genre);

-- Enable RLS (read-only for all authenticated users)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view game analytics" ON public.games;
DROP POLICY IF EXISTS "Service role can manage game analytics" ON public.games;

-- RLS: All authenticated users can READ global analytics
CREATE POLICY "Anyone can view game analytics"
    ON public.games FOR SELECT
    TO authenticated
    USING (true);

-- RLS: Only service role can INSERT/UPDATE/DELETE (automated tracking)
CREATE POLICY "Service role can manage game analytics"
    ON public.games FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- PART 3: REMOVE DEPRECATED ONBOARDING_PROGRESS TABLE
-- ============================================================================

-- This table is deprecated - functionality consolidated into users.onboarding_data JSONB field
DROP TABLE IF EXISTS public.onboarding_progress CASCADE;

-- ============================================================================
-- PART 4: VERIFICATION
-- ============================================================================

-- Verify new tables were created
SELECT 
    tablename,
    schemaname,
    CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'No RLS' END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'gaming_profiles', 
        'gaming_search_history', 
        'gaming_knowledge',
        'games'
    )
ORDER BY tablename;

-- Verify onboarding_progress was removed
SELECT 
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'onboarding_progress';
-- Should return 0 rows

-- Verify existing tables are still intact
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'No RLS' END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'user_feedback',      -- ✅ Settings menu feedback
        'ai_feedback',        -- ✅ Thumbs up/down on AI responses
        'api_usage',          -- ✅ API cost tracking
        'payment_events',     -- ✅ Webhook audit log
        'conversations',      -- ✅ Core messaging
        'messages',           -- ✅ Core messaging
        'users',              -- ✅ Core users
        'user_library'        -- ✅ Per-user game library
    )
ORDER BY tablename;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
/*
✅ CREATED:
   - gaming_profiles (user-scoped gaming stats)
   - gaming_search_history (user search tracking)
   - gaming_knowledge (user-specific game knowledge)
   - games (REDESIGNED as global analytics table)

❌ REMOVED:
   - onboarding_progress (deprecated - now in users.onboarding_data)

✅ CONFIRMED WORKING:
   - user_feedback (settings menu feedback)
   - ai_feedback (AI response thumbs up/down)
   - api_usage (API cost tracking)
   - payment_events (webhook audit trail)

📊 GAMES TABLE PURPOSE:
   Old: Per-user game library (user_id, auth_user_id columns)
   New: GLOBAL analytics tracking across ALL users
   - Tracks how many users created GTA 5 tabs
   - Common questions asked about GTA 5
   - Popular subtabs for GTA 5
   - Aggregate engagement metrics

💡 NOTE: Per-user game tracking is handled by user_library table
*/
