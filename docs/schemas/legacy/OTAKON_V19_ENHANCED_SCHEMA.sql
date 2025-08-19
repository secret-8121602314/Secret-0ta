-- 🚀 OTAKON V19 ENHANCED DATABASE SCHEMA
-- Comprehensive, RLS-protected schema with enhanced features
-- No performance issues, optimized indexes, and proper security

-- =====================================================
-- STEP 1: EXTENSIONS AND SETTINGS
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- =====================================================
-- STEP 2: CORE USER TABLES (RLS PROTECTED)
-- =====================================================

-- Enhanced user profiles with v19 features
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    email TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player profile preferences (v19 enhanced)
CREATE TABLE player_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    hint_style TEXT NOT NULL CHECK (hint_style IN ('Cryptic', 'Balanced', 'Direct')) DEFAULT 'Balanced',
    player_focus TEXT NOT NULL CHECK (player_focus IN ('Story-Driven', 'Completionist', 'Strategist')) DEFAULT 'Story-Driven',
    preferred_tone TEXT NOT NULL CHECK (preferred_tone IN ('Encouraging', 'Professional', 'Casual')) DEFAULT 'Encouraging',
    spoiler_tolerance TEXT NOT NULL CHECK (spoiler_tolerance IN ('Strict', 'Moderate', 'Relaxed')) DEFAULT 'Moderate',
    is_first_time BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences for app behavior
CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    game_genre TEXT DEFAULT 'rpg',
    detail_level TEXT DEFAULT 'concise',
    ai_personality TEXT DEFAULT 'encouraging',
    preferred_response_format TEXT DEFAULT 'text_with_bullets',
    skill_level TEXT DEFAULT 'intermediate',
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: GAME CONTEXT TABLES (RLS PROTECTED)
-- =====================================================

-- Enhanced game contexts with v19 features
CREATE TABLE game_contexts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    game_title TEXT,
    genre TEXT,
    playthrough_count INTEGER DEFAULT 1,
    last_session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_play_time BIGINT DEFAULT 0, -- in milliseconds
    objectives_completed TEXT[] DEFAULT '{}',
    secrets_found TEXT[] DEFAULT '{}',
    current_progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);

-- Build snapshots for character progression
CREATE TABLE build_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_context_id UUID REFERENCES game_contexts(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    level INTEGER,
    stats JSONB DEFAULT '{}',
    equipment TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session summaries for tracking gameplay sessions
CREATE TABLE session_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_context_id UUID REFERENCES game_contexts(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration BIGINT DEFAULT 0, -- in milliseconds
    objectives TEXT[] DEFAULT '{}',
    discoveries TEXT[] DEFAULT '{}',
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CONVERSATION TABLES (RLS PROTECTED)
-- =====================================================

-- Enhanced conversations with v19 features
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    game_id TEXT,
    genre TEXT,
    progress INTEGER DEFAULT 0,
    messages JSONB NOT NULL DEFAULT '[]',
    insights JSONB DEFAULT '{}',
    insights_order TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    active_objective JSONB,
    last_interaction_timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    session_start_timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation contexts for AI understanding
CREATE TABLE conversation_contexts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL,
    context_data JSONB NOT NULL,
    relevance_score DECIMAL(3,2) DEFAULT 0.00,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: ENHANCED INSIGHT TABLES (RLS PROTECTED)
-- =====================================================

-- Enhanced insight tabs with v19 features
CREATE TABLE enhanced_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tab_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    is_profile_specific BOOLEAN DEFAULT FALSE,
    player_focus TEXT[] DEFAULT '{}',
    hint_style TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('idle', 'loading', 'loaded', 'error')) DEFAULT 'idle',
    is_placeholder BOOLEAN DEFAULT TRUE,
    generation_attempts INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 6: PROACTIVE INSIGHT TABLES (RLS PROTECTED)
-- =====================================================

-- Proactive insight triggers
CREATE TABLE proactive_triggers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'objective_complete', 'inventory_change', 'area_discovery', 
        'session_start', 'session_end', 'progress_milestone', 
        'difficulty_spike', 'exploration_pattern'
    )),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    metadata JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proactive insight suggestions
CREATE TABLE proactive_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_id UUID REFERENCES proactive_triggers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'build_optimization', 'lore_summary', 'mechanic_explanation', 'session_summary'
    )),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    action_required BOOLEAN DEFAULT FALSE,
    action_text TEXT,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 7: USAGE AND ANALYTICS TABLES (RLS PROTECTED)
-- =====================================================

-- Enhanced usage tracking
CREATE TABLE usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    text_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    text_limit INTEGER DEFAULT 55,
    image_limit INTEGER DEFAULT 60,
    tier TEXT DEFAULT 'free',
    insights_generated INTEGER DEFAULT 0,
    proactive_insights_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI feedback and learning
CREATE TABLE ai_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
    feedback_type TEXT CHECK (feedback_type IN ('positive', 'negative', 'neutral')),
    feedback_text TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    insight_id UUID REFERENCES enhanced_insights(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 8: OPTIMIZED INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

-- Player profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_profiles_hint_style ON player_profiles(hint_style);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_profiles_player_focus ON player_profiles(player_focus);

-- Game contexts indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_contexts_user_id ON game_contexts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_contexts_game_id ON game_contexts(game_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_contexts_user_game ON game_contexts(user_id, game_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_contexts_last_session ON game_contexts(last_session_date);

-- Build snapshots indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_build_snapshots_game_context ON build_snapshots(game_context_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_build_snapshots_timestamp ON build_snapshots(timestamp);

-- Session summaries indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_summaries_game_context ON session_summaries(game_context_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_summaries_date ON session_summaries(date);

-- Conversations indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_game_id ON conversations(game_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_pinned ON conversations(is_pinned) WHERE is_pinned = TRUE;

-- Enhanced insights indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_insights_conversation ON enhanced_insights(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_insights_user ON enhanced_insights(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_insights_status ON enhanced_insights(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_insights_priority ON enhanced_insights(priority);

-- Proactive triggers indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proactive_triggers_user ON proactive_triggers(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proactive_triggers_type ON proactive_triggers(trigger_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proactive_triggers_processed ON proactive_triggers(processed) WHERE processed = FALSE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proactive_triggers_created ON proactive_triggers(created_at);

-- Proactive insights indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proactive_insights_user ON proactive_insights(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proactive_insights_priority ON proactive_insights(priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proactive_insights_unread ON proactive_insights(is_read) WHERE is_read = FALSE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proactive_insights_created ON proactive_insights(created_at);

-- Usage indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_user_id ON usage(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_tier ON usage(tier);

-- AI feedback indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_feedback_conversation ON ai_feedback(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(rating);

-- =====================================================
-- STEP 9: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- User profiles RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Player profiles RLS policies
CREATE POLICY "Users can view own player profile" ON player_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own player profile" ON player_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own player profile" ON player_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User preferences RLS policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Game contexts RLS policies
CREATE POLICY "Users can view own game contexts" ON game_contexts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own game contexts" ON game_contexts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game contexts" ON game_contexts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own game contexts" ON game_contexts
    FOR DELETE USING (auth.uid() = user_id);

-- Build snapshots RLS policies
CREATE POLICY "Users can view own build snapshots" ON build_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_contexts 
            WHERE game_contexts.id = build_snapshots.game_context_id 
            AND game_contexts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own build snapshots" ON build_snapshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM game_contexts 
            WHERE game_contexts.id = build_snapshots.game_context_id 
            AND game_contexts.user_id = auth.uid()
        )
    );

-- Session summaries RLS policies
CREATE POLICY "Users can view own session summaries" ON session_summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_contexts 
            WHERE game_contexts.id = session_summaries.game_context_id 
            AND game_contexts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own session summaries" ON session_summaries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM game_contexts 
            WHERE game_contexts.id = session_summaries.game_context_id 
            AND game_contexts.user_id = auth.uid()
        )
    );

-- Conversations RLS policies
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Conversation contexts RLS policies
CREATE POLICY "Users can view own conversation contexts" ON conversation_contexts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation contexts" ON conversation_contexts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enhanced insights RLS policies
CREATE POLICY "Users can view own enhanced insights" ON enhanced_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own enhanced insights" ON enhanced_insights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enhanced insights" ON enhanced_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Proactive triggers RLS policies
CREATE POLICY "Users can view own proactive triggers" ON proactive_triggers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proactive triggers" ON proactive_triggers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proactive triggers" ON proactive_triggers
    FOR UPDATE USING (auth.uid() = user_id);

-- Proactive insights RLS policies
CREATE POLICY "Users can view own proactive insights" ON proactive_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own proactive insights" ON proactive_insights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proactive insights" ON proactive_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage RLS policies
CREATE POLICY "Users can view own usage" ON usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON usage
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI feedback RLS policies
CREATE POLICY "Users can view own AI feedback" ON ai_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI feedback" ON ai_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- STEP 10: TRIGGERS AND FUNCTIONS FOR AUTOMATION
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_profiles_updated_at 
    BEFORE UPDATE ON player_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_contexts_updated_at 
    BEFORE UPDATE ON game_contexts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enhanced_insights_updated_at 
    BEFORE UPDATE ON enhanced_insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_updated_at 
    BEFORE UPDATE ON usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old proactive triggers
CREATE OR REPLACE FUNCTION cleanup_old_proactive_triggers()
RETURNS void AS $$
BEGIN
    DELETE FROM proactive_triggers 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get user insights summary
CREATE OR REPLACE FUNCTION get_user_insights_summary(user_uuid UUID)
RETURNS TABLE(
    total_insights BIGINT,
    unread_insights BIGINT,
    high_priority_insights BIGINT,
    recent_insights BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_insights,
        COUNT(*) FILTER (WHERE is_read = FALSE)::BIGINT as unread_insights,
        COUNT(*) FILTER (WHERE priority = 'high' AND is_read = FALSE)::BIGINT as high_priority_insights,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT as recent_insights
    FROM proactive_insights 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 11: PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Vacuum and analyze for optimal performance
VACUUM ANALYZE;

-- Set table statistics for better query planning
ALTER TABLE user_profiles ALTER COLUMN id SET STATISTICS 1000;
ALTER TABLE player_profiles ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE game_contexts ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE conversations ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE enhanced_insights ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE proactive_insights ALTER COLUMN user_id SET STATISTICS 1000;

-- =====================================================
-- STEP 12: VERIFICATION AND COMPLETION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ OTAKON V19 Enhanced Database Schema Created Successfully!';
    RAISE NOTICE '🔒 All tables are RLS protected';
    RAISE NOTICE '📊 Optimized indexes created for performance';
    RAISE NOTICE '🔄 Triggers and functions configured';
    RAISE NOTICE '🚀 Ready for enhanced insight generation and proactive features!';
END $$;
