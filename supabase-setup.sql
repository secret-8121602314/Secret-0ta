-- =====================================================
-- OTAKON GAMING ENHANCEMENT - COMPLETE SUPABASE SETUP
-- =====================================================
-- This file contains all the SQL needed to set up the enhanced
-- gaming features for the Otakon app on the Supabase side.

-- =====================================================
-- 1. ENHANCED EXISTING TABLES
-- =====================================================

-- Enhance user_gaming_context table with new gaming fields
ALTER TABLE user_gaming_context 
ADD COLUMN IF NOT EXISTS game_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS wiki_sources TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS progress_milestones JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_played TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_playtime INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS achievements_unlocked TEXT[] DEFAULT '{}',
ADD COLUMN IF NULL story_progress TEXT,
ADD COLUMN IF NOT EXISTS side_quests_completed TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS collectibles_found TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS multiplayer_stats JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN user_gaming_context.game_metadata IS 'Structured game data from IGDB including ratings, genres, platforms';
COMMENT ON COLUMN user_gaming_context.wiki_sources IS 'Array of relevant wiki sources for this game';
COMMENT ON COLUMN user_gaming_context.progress_milestones IS 'Array of progress milestones and achievements';
COMMENT ON COLUMN user_gaming_context.last_played IS 'Timestamp of last game session';
COMMENT ON COLUMN user_gaming_context.total_playtime IS 'Total playtime in minutes';
COMMENT ON COLUMN user_gaming_context.achievements_unlocked IS 'Array of unlocked achievement IDs';
COMMENT ON COLUMN user_gaming_context.story_progress IS 'Current story progress description';
COMMENT ON COLUMN user_gaming_context.side_quests_completed IS 'Array of completed side quest IDs';
COMMENT ON COLUMN user_gaming_context.collectibles_found IS 'Array of found collectible IDs';
COMMENT ON COLUMN user_gaming_context.difficulty_level IS 'Current difficulty setting';
COMMENT ON COLUMN user_gaming_context.multiplayer_stats IS 'Multiplayer statistics and rankings';

-- Enhance user_app_state table with gaming preferences
ALTER TABLE user_app_state 
ADD COLUMN IF NOT EXISTS gaming_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS favorite_platforms TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gaming_schedule JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_gaming BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS achievement_hunting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS story_focus BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS modding_interest BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS retro_gaming BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN user_app_state.gaming_preferences IS 'User gaming preferences and settings';
COMMENT ON COLUMN user_app_state.favorite_platforms IS 'Array of favorite gaming platforms';
COMMENT ON COLUMN user_app_state.gaming_schedule IS 'Preferred gaming schedule and availability';
COMMENT ON COLUMN user_app_state.social_gaming IS 'Whether user prefers multiplayer/social gaming';
COMMENT ON COLUMN user_app_state.achievement_hunting IS 'Whether user focuses on achievements';
COMMENT ON COLUMN user_app_state.story_focus IS 'Whether user prioritizes story over gameplay';
COMMENT ON COLUMN user_app_state.modding_interest IS 'Whether user is interested in game mods';
COMMENT ON COLUMN user_app_state.retro_gaming IS 'Whether user enjoys retro/classic games';

-- =====================================================
-- 2. NEW TABLES FOR GAMING ENHANCEMENTS
-- =====================================================

-- Gaming Wiki Sources table for dynamic search
CREATE TABLE IF NOT EXISTS gaming_wiki_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('franchise', 'platform', 'genre', 'general')),
    source_name VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    relevance_score INTEGER DEFAULT 1 CHECK (relevance_score BETWEEN 1 AND 10),
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE gaming_wiki_sources IS 'Curated list of trusted gaming wiki sources for dynamic search';
COMMENT ON COLUMN gaming_wiki_sources.year IS 'Year this wiki source is most relevant for';
COMMENT ON COLUMN gaming_wiki_sources.category IS 'Category of wiki: franchise, platform, genre, or general';
COMMENT ON COLUMN gaming_wiki_sources.source_name IS 'Display name of the wiki source';
COMMENT ON COLUMN gaming_wiki_sources.source_url IS 'Base URL of the wiki source';
COMMENT ON COLUMN gaming_wiki_sources.relevance_score IS 'Relevance score from 1-10 for this source';

-- Enhanced Otaku Diary Tasks table
CREATE TABLE IF NOT EXISTS enhanced_otaku_diary_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('story', 'exploration', 'combat', 'achievement', 'collection', 'custom')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    game_name VARCHAR(255),
    igdb_id INTEGER,
    platform VARCHAR(100),
    estimated_time INTEGER, -- in minutes
    prerequisites TEXT[] DEFAULT '{}',
    rewards TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    user_notes TEXT,
    ai_generated BOOLEAN DEFAULT false,
    source_conversation UUID,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100)
);

-- Add comments for documentation
COMMENT ON TABLE enhanced_otaku_diary_tasks IS 'Enhanced Otaku Diary tasks with gaming context and AI generation';
COMMENT ON COLUMN enhanced_otaku_diary_tasks.category IS 'Task category for organization';
COMMENT ON COLUMN enhanced_otaku_diary_tasks.difficulty IS 'Estimated difficulty level';
COMMENT ON COLUMN enhanced_otaku_diary_tasks.game_name IS 'Associated game name';
COMMENT ON COLUMN enhanced_otaku_diary_tasks.igdb_id IS 'IGDB game ID for reference';
COMMENT ON COLUMN enhanced_otaku_diary_tasks.estimated_time IS 'Estimated completion time in minutes';
COMMENT ON COLUMN enhanced_otaku_diary_tasks.prerequisites IS 'Array of prerequisite tasks or requirements';
COMMENT ON COLUMN enhanced_otaku_diary_tasks.rewards IS 'Array of rewards for completing the task';
COMMENT ON COLUMN enhanced_otaku_diary_tasks.ai_generated IS 'Whether this task was generated by AI';
COMMENT ON COLUMN enhanced_otaku_diary_tasks.progress_percentage IS 'Current progress percentage (0-100)';

-- Gaming Progress Tracking table
CREATE TABLE IF NOT EXISTS gaming_progress_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_name VARCHAR(255) NOT NULL,
    igdb_id INTEGER,
    platform VARCHAR(100),
    current_chapter TEXT,
    current_quest TEXT,
    story_progress_percentage INTEGER DEFAULT 0 CHECK (story_progress_percentage BETWEEN 0 AND 100),
    side_quests_completed INTEGER DEFAULT 0,
    total_side_quests INTEGER DEFAULT 0,
    achievements_unlocked INTEGER DEFAULT 0,
    total_achievements INTEGER DEFAULT 0,
    collectibles_found INTEGER DEFAULT 0,
    total_collectibles INTEGER DEFAULT 0,
    playtime_hours DECIMAL(8,2) DEFAULT 0,
    last_session_duration INTEGER DEFAULT 0, -- in minutes
    difficulty_level TEXT DEFAULT 'normal',
    save_slots_used INTEGER DEFAULT 1,
    multiplayer_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE gaming_progress_tracking IS 'Detailed gaming progress tracking for each game';
COMMENT ON COLUMN gaming_progress_tracking.current_chapter IS 'Current story chapter or section';
COMMENT ON COLUMN gaming_progress_tracking.current_quest IS 'Current active quest or objective';
COMMENT ON COLUMN gaming_progress_tracking.story_progress_percentage IS 'Story completion percentage';
COMMENT ON COLUMN gaming_progress_tracking.playtime_hours IS 'Total playtime in hours with decimal precision';
COMMENT ON COLUMN gaming_progress_tracking.last_session_duration IS 'Duration of last gaming session in minutes';

-- Gaming Wiki Search Cache table
CREATE TABLE IF NOT EXISTS gaming_wiki_search_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_query TEXT NOT NULL,
    game_context JSONB DEFAULT '{}',
    search_results JSONB NOT NULL,
    total_results INTEGER DEFAULT 0,
    search_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    cache_hits INTEGER DEFAULT 0
);

-- Add comments for documentation
COMMENT ON TABLE gaming_wiki_search_cache IS 'Cache for gaming wiki search results to improve performance';
COMMENT ON COLUMN gaming_wiki_search_cache.search_query IS 'The original search query';
COMMENT ON COLUMN gaming_wiki_search_cache.game_context IS 'Game context used for the search';
COMMENT ON COLUMN gaming_wiki_search_cache.search_results IS 'Cached search results';
COMMENT ON COLUMN gaming_wiki_search_cache.search_time_ms IS 'Original search time in milliseconds';
COMMENT ON COLUMN gaming_wiki_search_cache.expires_at IS 'When this cache entry expires';
COMMENT ON COLUMN gaming_wiki_search_cache.cache_hits IS 'Number of times this cache was used';

-- IGDB Game Data Cache table
CREATE TABLE IF NOT EXISTS igdb_game_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    igdb_id INTEGER UNIQUE NOT NULL,
    game_name VARCHAR(255) NOT NULL,
    game_data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    cache_hits INTEGER DEFAULT 0,
    search_queries TEXT[] DEFAULT '{}' -- Track what queries led to this cache
);

-- Add comments for documentation
COMMENT ON TABLE igdb_game_cache IS 'Cache for IGDB game data to reduce API calls';
COMMENT ON COLUMN igdb_game_cache.igdb_id IS 'IGDB game ID (unique)';
COMMENT ON COLUMN igdb_game_cache.game_data IS 'Full game data from IGDB API';
COMMENT ON COLUMN gaming_wiki_search_cache.expires_at IS 'When this cache entry expires (7 days for game data)';
COMMENT ON COLUMN gaming_wiki_search_cache.search_queries IS 'Array of search queries that led to this cache entry';

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Gaming Wiki Sources indexes
CREATE INDEX IF NOT EXISTS idx_gaming_wiki_sources_year ON gaming_wiki_sources(year);
CREATE INDEX IF NOT EXISTS idx_gaming_wiki_sources_category ON gaming_wiki_sources(category);
CREATE INDEX IF NOT EXISTS idx_gaming_wiki_sources_active ON gaming_wiki_sources(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gaming_wiki_sources_relevance ON gaming_wiki_sources(relevance_score DESC);

-- Enhanced Otaku Diary Tasks indexes
CREATE INDEX IF NOT EXISTS idx_otaku_tasks_user_id ON enhanced_otaku_diary_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_otaku_tasks_category ON enhanced_otaku_diary_tasks(category);
CREATE INDEX IF NOT EXISTS idx_otaku_tasks_status ON enhanced_otaku_diary_tasks(status);
CREATE INDEX IF NOT EXISTS idx_otaku_tasks_game_name ON enhanced_otaku_diary_tasks(game_name);
CREATE INDEX IF NOT EXISTS idx_otaku_tasks_igdb_id ON enhanced_otaku_diary_tasks(igdb_id);
CREATE INDEX IF NOT EXISTS idx_otaku_tasks_ai_generated ON enhanced_otaku_diary_tasks(ai_generated);

-- Gaming Progress Tracking indexes
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON gaming_progress_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_game_name ON gaming_progress_tracking(game_name);
CREATE INDEX IF NOT EXISTS idx_progress_igdb_id ON gaming_progress_tracking(igdb_id);
CREATE INDEX IF NOT EXISTS idx_progress_last_played ON gaming_progress_tracking(last_played DESC);

-- Cache table indexes
CREATE INDEX IF NOT EXISTS idx_wiki_cache_query ON gaming_wiki_search_cache(search_query);
CREATE INDEX IF NOT EXISTS idx_wiki_cache_expires ON gaming_wiki_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_igdb_cache_id ON igdb_game_cache(igdb_id);
CREATE INDEX IF NOT EXISTS idx_igdb_cache_expires ON igdb_game_cache(expires_at);

-- =====================================================
-- 4. SAMPLE DATA FOR GAMING WIKI SOURCES
-- =====================================================

-- Insert curated gaming wiki sources
INSERT INTO gaming_wiki_sources (year, category, source_name, source_url, relevance_score) VALUES
-- Major Franchise Wikis (High relevance)
(2024, 'franchise', 'Elden Ring Wiki', 'https://eldenring.wiki.fextralife.com/', 10),
(2024, 'franchise', 'The Witcher Wiki', 'https://witcher.fandom.com/', 10),
(2024, 'franchise', 'Fallout Wiki', 'https://fallout.fandom.com/', 10),
(2024, 'franchise', 'Dragon Age Wiki', 'https://dragonage.fandom.com/', 10),
(2024, 'franchise', 'Mass Effect Wiki', 'https://masseffect.fandom.com/', 10),
(2024, 'franchise', 'Assassin\'s Creed Wiki', 'https://assassinscreed.fandom.com/', 10),
(2024, 'franchise', 'Call of Duty Wiki', 'https://callofduty.fandom.com/', 10),
(2024, 'franchise', 'Battlefield Wiki', 'https://battlefield.fandom.com/', 10),
(2024, 'franchise', 'FIFA Wiki', 'https://fifa.fandom.com/', 9),
(2024, 'franchise', 'Grand Theft Auto Wiki', 'https://gta.fandom.com/', 10),
(2024, 'franchise', 'Zelda Wiki', 'https://zelda.fandom.com/', 10),
(2024, 'franchise', 'Mario Wiki', 'https://mario.fandom.com/', 10),
(2024, 'franchise', 'Pokemon Wiki', 'https://pokemon.fandom.com/', 10),
(2024, 'franchise', 'Final Fantasy Wiki', 'https://finalfantasy.fandom.com/', 10),
(2024, 'franchise', 'Metal Gear Wiki', 'https://metalgear.fandom.com/', 10),
(2024, 'franchise', 'Resident Evil Wiki', 'https://residentevil.fandom.com/', 10),
(2024, 'franchise', 'Silent Hill Wiki', 'https://silenthill.fandom.com/', 9),
(2024, 'franchise', 'Devil May Cry Wiki', 'https://devilmaycry.fandom.com/', 9),
(2024, 'franchise', 'God of War Wiki', 'https://godofwar.fandom.com/', 10),
(2024, 'franchise', 'Uncharted Wiki', 'https://uncharted.fandom.com/', 9),

-- Platform Wikis (Medium-high relevance)
(2024, 'platform', 'Nintendo Wiki', 'https://nintendo.fandom.com/', 8),
(2024, 'platform', 'PlayStation Wiki', 'https://playstation.fandom.com/', 8),
(2024, 'platform', 'Xbox Wiki', 'https://xbox.fandom.com/', 8),
(2024, 'platform', 'PCGamingWiki', 'https://www.pcgamingwiki.com/', 9),
(2024, 'platform', 'Steam Wiki', 'https://steam.fandom.com/', 7),
(2024, 'platform', 'Origin Wiki', 'https://origin.fandom.com/', 6),
(2024, 'platform', 'Uplay Wiki', 'https://uplay.fandom.com/', 6),

-- Genre Wikis (Medium relevance)
(2024, 'genre', 'RPG Wiki', 'https://rpg.fandom.com/', 7),
(2024, 'genre', 'FPS Wiki', 'https://fps.fandom.com/', 7),
(2024, 'genre', 'Strategy Wiki', 'https://strategy.fandom.com/', 7),
(2024, 'genre', 'Adventure Wiki', 'https://adventure.fandom.com/', 7),
(2024, 'genre', 'Simulation Wiki', 'https://simulation.fandom.com/', 6),
(2024, 'genre', 'Racing Wiki', 'https://racing.fandom.com/', 6),
(2024, 'genre', 'Fighting Wiki', 'https://fighting.fandom.com/', 6),
(2024, 'genre', 'Sports Wiki', 'https://sports.fandom.com/', 6),
(2024, 'genre', 'Puzzle Wiki', 'https://puzzle.fandom.com/', 5),

-- General Gaming Wikis (Medium relevance)
(2024, 'general', 'Gaming Wiki', 'https://gaming.fandom.com/', 6),
(2024, 'general', 'Video Game Wiki', 'https://videogame.fandom.com/', 6),
(2024, 'general', 'GameFAQs Wiki', 'https://gamefaqs.fandom.com/', 7),
(2024, 'general', 'IGN Wiki', 'https://ign.fandom.com/', 6),
(2024, 'general', 'GameSpot Wiki', 'https://gamespot.fandom.com/', 6),
(2024, 'general', 'Metacritic Wiki', 'https://metacritic.fandom.com/', 5),

-- Retro Gaming Wikis (Medium relevance)
(2024, 'general', 'Retro Gaming Wiki', 'https://retrogaming.fandom.com/', 6),
(2024, 'general', 'Classic Gaming Wiki', 'https://classicgaming.fandom.com/', 6),
(2024, 'general', 'Arcade Wiki', 'https://arcade.fandom.com/', 5),
(2024, 'general', 'Console Wiki', 'https://console.fandom.com/', 5),

-- Indie Gaming Wikis (Medium relevance)
(2024, 'general', 'Indie Game Wiki', 'https://indiegame.fandom.com/', 6),
(2024, 'general', 'IndieDB Wiki', 'https://indiedb.fandom.com/', 6),
(2024, 'general', 'Itch.io Wiki', 'https://itchio.fandom.com/', 5)

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE gaming_wiki_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_otaku_diary_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_wiki_search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE igdb_game_cache ENABLE ROW LEVEL SECURITY;

-- Gaming Wiki Sources - Read-only for all authenticated users
CREATE POLICY "Allow read access to gaming wiki sources" ON gaming_wiki_sources
    FOR SELECT USING (true);

-- Enhanced Otaku Diary Tasks - Users can only access their own tasks
CREATE POLICY "Users can manage their own otaku diary tasks" ON enhanced_otaku_diary_tasks
    FOR ALL USING (auth.uid() = user_id);

-- Gaming Progress Tracking - Users can only access their own progress
CREATE POLICY "Users can manage their own gaming progress" ON gaming_progress_tracking
    FOR ALL USING (auth.uid() = user_id);

-- Cache tables - Read/write for all authenticated users (shared cache)
CREATE POLICY "Allow authenticated users to access wiki search cache" ON gaming_wiki_search_cache
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access IGDB cache" ON igdb_game_cache
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_gaming_wiki_sources_updated_at 
    BEFORE UPDATE ON gaming_wiki_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enhanced_otaku_diary_tasks_updated_at 
    BEFORE UPDATE ON enhanced_otaku_diary_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gaming_progress_tracking_updated_at 
    BEFORE UPDATE ON gaming_progress_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM gaming_wiki_search_cache WHERE expires_at < NOW();
    DELETE FROM igdb_game_cache WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Function to get gaming progress summary
CREATE OR REPLACE FUNCTION get_gaming_progress_summary(user_uuid UUID)
RETURNS TABLE (
    game_name VARCHAR(255),
    story_progress INTEGER,
    achievements_progress INTEGER,
    collectibles_progress INTEGER,
    total_playtime DECIMAL(8,2),
    last_played TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gpt.game_name,
        gpt.story_progress_percentage,
        CASE 
            WHEN gpt.total_achievements > 0 
            THEN ROUND((gpt.achievements_unlocked::DECIMAL / gpt.total_achievements) * 100)
            ELSE 0 
        END::INTEGER as achievements_progress,
        CASE 
            WHEN gpt.total_collectibles > 0 
            THEN ROUND((gpt.collectibles_found::DECIMAL / gpt.total_collectibles) * 100)
            ELSE 0 
        END::INTEGER as collectibles_progress,
        gpt.playtime_hours,
        gpt.last_played
    FROM gaming_progress_tracking gpt
    WHERE gpt.user_id = user_uuid
    ORDER BY gpt.last_played DESC;
END;
$$ language 'plpgsql';

-- =====================================================
-- 7. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for user gaming dashboard
CREATE OR REPLACE VIEW user_gaming_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT gpt.game_name) as total_games,
    SUM(gpt.playtime_hours) as total_playtime,
    COUNT(DISTINCT CASE WHEN gpt.story_progress_percentage = 100 THEN gpt.game_name END) as completed_games,
    COUNT(DISTINCT CASE WHEN gpt.story_progress_percentage > 0 AND gpt.story_progress_percentage < 100 THEN gpt.game_name END) as in_progress_games,
    COUNT(DISTINCT CASE WHEN gpt.story_progress_percentage = 0 THEN gpt.game_name END) as not_started_games,
    MAX(gpt.last_played) as last_gaming_session
FROM auth.users u
LEFT JOIN gaming_progress_tracking gpt ON u.id = gpt.user_id
GROUP BY u.id, u.email;

-- View for popular games across users
CREATE OR REPLACE VIEW popular_games AS
SELECT 
    gpt.game_name,
    gpt.platform,
    COUNT(DISTINCT gpt.user_id) as active_players,
    AVG(gpt.story_progress_percentage) as avg_story_progress,
    AVG(gpt.playtime_hours) as avg_playtime,
    MAX(gpt.last_played) as last_activity
FROM gaming_progress_tracking gpt
WHERE gpt.last_played > NOW() - INTERVAL '30 days'
GROUP BY gpt.game_name, gpt.platform
HAVING COUNT(DISTINCT gpt.user_id) >= 1
ORDER BY active_players DESC, avg_story_progress DESC;

-- =====================================================
-- 8. SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample gaming progress data (replace with actual user IDs)
-- Note: These are examples - you'll need to replace the user_id with actual UUIDs
/*
INSERT INTO gaming_progress_tracking (user_id, game_name, platform, current_chapter, story_progress_percentage, playtime_hours) VALUES
('00000000-0000-0000-0000-000000000001', 'Elden Ring', 'PC', 'Limgrave', 15, 25.5),
('00000000-0000-0000-0000-000000000001', 'The Witcher 3', 'PC', 'White Orchard', 5, 8.2),
('00000000-0000-0000-0000-000000000002', 'Cyberpunk 2077', 'PlayStation 5', 'The Street Kid', 45, 67.8);
*/

-- =====================================================
-- 9. CLEANUP AND MAINTENANCE
-- =====================================================

-- Create a scheduled job to clean up expired cache (if using pg_cron)
-- SELECT cron.schedule('cleanup-expired-cache', '0 2 * * *', 'SELECT cleanup_expired_cache();');

-- =====================================================
-- 10. FINAL SETUP COMMANDS
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes for better performance
ANALYZE gaming_wiki_sources;
ANALYZE enhanced_otaku_diary_tasks;
ANALYZE gaming_progress_tracking;
ANALYZE gaming_wiki_search_cache;
ANALYZE igdb_game_cache;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- 
-- Your Supabase database is now set up with:
-- ✅ Enhanced existing tables with gaming fields
-- ✅ New gaming-specific tables
-- ✅ Comprehensive indexes for performance
-- ✅ Row Level Security policies
-- ✅ Sample wiki sources data
-- ✅ Helper functions and views
-- ✅ Cache management
-- 
-- Next steps:
-- 1. Update your environment variables with API keys
-- 2. Test the services with the new database structure
-- 3. Deploy and monitor performance
-- 
-- =====================================================
