-- Create missing Gaming Explorer tables in Supabase
-- These tables are referenced in the code but don't exist in production schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/sql

-- ============================================================================
-- 1. GAMING_PROFILES TABLE
-- ============================================================================

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
    
    -- Constraints
    CONSTRAINT gaming_profiles_auth_user_id_key UNIQUE (auth_user_id)
);

-- Add comments
COMMENT ON TABLE public.gaming_profiles IS 'User gaming profile statistics from Gaming HQ';
COMMENT ON COLUMN public.gaming_profiles.gaming_start_year IS 'Year the user started gaming';
COMMENT ON COLUMN public.gaming_profiles.owned_count IS 'Count of owned games';
COMMENT ON COLUMN public.gaming_profiles.completed_count IS 'Count of completed games';
COMMENT ON COLUMN public.gaming_profiles.wishlist_count IS 'Count of wishlist games';
COMMENT ON COLUMN public.gaming_profiles.favorites_count IS 'Count of favorite games';
COMMENT ON COLUMN public.gaming_profiles.disliked_count IS 'Count of disliked games';
COMMENT ON COLUMN public.gaming_profiles.total_hours_played IS 'Total hours played across all games';

-- Create indexes
CREATE INDEX IF NOT EXISTS gaming_profiles_auth_user_id_idx ON public.gaming_profiles(auth_user_id);

-- Enable RLS
ALTER TABLE public.gaming_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own gaming profile" ON public.gaming_profiles;
DROP POLICY IF EXISTS "Users can insert their own gaming profile" ON public.gaming_profiles;
DROP POLICY IF EXISTS "Users can update their own gaming profile" ON public.gaming_profiles;
DROP POLICY IF EXISTS "Users can delete their own gaming profile" ON public.gaming_profiles;

-- RLS Policies
CREATE POLICY "Users can view their own gaming profile"
    ON public.gaming_profiles FOR SELECT
    USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert their own gaming profile"
    ON public.gaming_profiles FOR INSERT
    WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update their own gaming profile"
    ON public.gaming_profiles FOR UPDATE
    USING ((select auth.uid()) = auth_user_id)
    WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can delete their own gaming profile"
    ON public.gaming_profiles FOR DELETE
    USING ((select auth.uid()) = auth_user_id);

-- ============================================================================
-- 2. GAMING_SEARCH_HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gaming_search_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    igdb_game_id integer NOT NULL,
    game_data jsonb NOT NULL,
    searched_at timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT gaming_search_history_unique_search UNIQUE (auth_user_id, igdb_game_id)
);

-- Add comments
COMMENT ON TABLE public.gaming_search_history IS 'User game search history from Gaming HQ';
COMMENT ON COLUMN public.gaming_search_history.igdb_game_id IS 'IGDB game ID';
COMMENT ON COLUMN public.gaming_search_history.game_data IS 'Full IGDB game data (cached for offline access)';
COMMENT ON COLUMN public.gaming_search_history.searched_at IS 'When the user last searched for this game';

-- Create indexes
CREATE INDEX IF NOT EXISTS gaming_search_history_auth_user_id_idx ON public.gaming_search_history(auth_user_id);
CREATE INDEX IF NOT EXISTS gaming_search_history_searched_at_idx ON public.gaming_search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS gaming_search_history_igdb_game_id_idx ON public.gaming_search_history(igdb_game_id);

-- Enable RLS
ALTER TABLE public.gaming_search_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own search history" ON public.gaming_search_history;
DROP POLICY IF EXISTS "Users can insert their own search history" ON public.gaming_search_history;
DROP POLICY IF EXISTS "Users can update their own search history" ON public.gaming_search_history;
DROP POLICY IF EXISTS "Users can delete their own search history" ON public.gaming_search_history;

-- RLS Policies
CREATE POLICY "Users can view their own search history"
    ON public.gaming_search_history FOR SELECT
    USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert their own search history"
    ON public.gaming_search_history FOR INSERT
    WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update their own search history"
    ON public.gaming_search_history FOR UPDATE
    USING ((select auth.uid()) = auth_user_id)
    WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can delete their own search history"
    ON public.gaming_search_history FOR DELETE
    USING ((select auth.uid()) = auth_user_id);

-- ============================================================================
-- 3. GAMING_KNOWLEDGE TABLE
-- ============================================================================

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
    
    -- Constraints
    CONSTRAINT gaming_knowledge_unique_game UNIQUE (auth_user_id, igdb_game_id)
);

-- Add comments
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

-- Create indexes
CREATE INDEX IF NOT EXISTS gaming_knowledge_auth_user_id_idx ON public.gaming_knowledge(auth_user_id);
CREATE INDEX IF NOT EXISTS gaming_knowledge_igdb_game_id_idx ON public.gaming_knowledge(igdb_game_id);
CREATE INDEX IF NOT EXISTS gaming_knowledge_game_name_idx ON public.gaming_knowledge(game_name);
CREATE INDEX IF NOT EXISTS gaming_knowledge_last_updated_idx ON public.gaming_knowledge(last_updated DESC);

-- Enable RLS
ALTER TABLE public.gaming_knowledge ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own gaming knowledge" ON public.gaming_knowledge;
DROP POLICY IF EXISTS "Users can insert their own gaming knowledge" ON public.gaming_knowledge;
DROP POLICY IF EXISTS "Users can update their own gaming knowledge" ON public.gaming_knowledge;
DROP POLICY IF EXISTS "Users can delete their own gaming knowledge" ON public.gaming_knowledge;

-- RLS Policies
CREATE POLICY "Users can view their own gaming knowledge"
    ON public.gaming_knowledge FOR SELECT
    USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert their own gaming knowledge"
    ON public.gaming_knowledge FOR INSERT
    WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update their own gaming knowledge"
    ON public.gaming_knowledge FOR UPDATE
    USING ((select auth.uid()) = auth_user_id)
    WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can delete their own gaming knowledge"
    ON public.gaming_knowledge FOR DELETE
    USING ((select auth.uid()) = auth_user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables were created
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('gaming_profiles', 'gaming_search_history', 'gaming_knowledge')
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('gaming_profiles', 'gaming_search_history', 'gaming_knowledge')
ORDER BY tablename;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
