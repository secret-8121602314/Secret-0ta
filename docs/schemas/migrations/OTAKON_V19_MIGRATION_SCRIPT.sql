-- 🚀 OTAKON V19 SAFE MIGRATION SCRIPT
-- This script safely adds new v19 tables without affecting existing data
-- It checks for existing tables and only creates what's needed

-- =====================================================
-- STEP 1: EXTENSIONS AND SETTINGS
-- =====================================================

-- Enable required extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- =====================================================
-- STEP 2: CHECK EXISTING TABLES AND CREATE NEW ONES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 Checking existing tables and creating new v19 tables...';
END $$;

-- =====================================================
-- STEP 3: PLAYER PROFILES TABLE (v19 NEW)
-- =====================================================

-- Check if player_profiles exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'player_profiles') THEN
        RAISE NOTICE 'Creating player_profiles table...';
        
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
        
        RAISE NOTICE '✅ player_profiles table created successfully';
    ELSE
        RAISE NOTICE 'ℹ️  player_profiles table already exists, skipping...';
    END IF;
END $$;

-- =====================================================
-- STEP 4: GAME CONTEXTS TABLE (v19 NEW)
-- =====================================================

-- Check if game_contexts exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_contexts') THEN
        RAISE NOTICE 'Creating game_contexts table...';
        
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
        
        RAISE NOTICE '✅ game_contexts table created successfully';
    ELSE
        RAISE NOTICE 'ℹ️  game_contexts table already exists, skipping...';
    END IF;
END $$;

-- =====================================================
-- STEP 5: BUILD SNAPSHOTS TABLE (v19 NEW)
-- =====================================================

-- Check if build_snapshots exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'build_snapshots') THEN
        RAISE NOTICE 'Creating build_snapshots table...';
        
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
        
        RAISE NOTICE '✅ build_snapshots table created successfully';
    ELSE
        RAISE NOTICE 'ℹ️  build_snapshots table already exists, skipping...';
    END IF;
END $$;

-- =====================================================
-- STEP 6: SESSION SUMMARIES TABLE (v19 NEW)
-- =====================================================

-- Check if session_summaries exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session_summaries') THEN
        RAISE NOTICE 'Creating session_summaries table...';
        
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
        
        RAISE NOTICE '✅ session_summaries table created successfully';
    ELSE
        RAISE NOTICE 'ℹ️  session_summaries table already exists, skipping...';
    END IF;
END $$;

-- =====================================================
-- STEP 7: CONVERSATION CONTEXTS TABLE (v19 NEW)
-- =====================================================

-- Check if conversation_contexts exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversation_contexts') THEN
        RAISE NOTICE 'Creating conversation_contexts table...';
        
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
        
        RAISE NOTICE '✅ conversation_contexts table created successfully';
    ELSE
        RAISE NOTICE 'ℹ️  conversation_contexts table already exists, skipping...';
    END IF;
END $$;

-- =====================================================
-- STEP 8: ENHANCED INSIGHTS TABLE (v19 NEW)
-- =====================================================

-- Check if enhanced_insights exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enhanced_insights') THEN
        RAISE NOTICE 'Creating enhanced_insights table...';
        
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
        
        RAISE NOTICE '✅ enhanced_insights table created successfully';
    ELSE
        RAISE NOTICE 'ℹ️  enhanced_insights table already exists, skipping...';
    END IF;
END $$;

-- =====================================================
-- STEP 9: PROACTIVE TRIGGERS TABLE (v19 NEW)
-- =====================================================

-- Check if proactive_triggers exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'proactive_triggers') THEN
        RAISE NOTICE 'Creating proactive_triggers table...';
        
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
        
        RAISE NOTICE '✅ proactive_triggers table created successfully';
    ELSE
        RAISE NOTICE 'ℹ️  proactive_triggers table already exists, skipping...';
    END IF;
END $$;

-- =====================================================
-- STEP 10: PROACTIVE INSIGHTS TABLE (v19 NEW)
-- =====================================================

-- Check if proactive_insights exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'proactive_insights') THEN
        RAISE NOTICE 'Creating proactive_insights table...';
        
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
        
        RAISE NOTICE '✅ proactive_insights table created successfully';
    ELSE
        RAISE NOTICE 'ℹ️  proactive_insights table already exists, skipping...';
    END IF;
END $$;

-- =====================================================
-- STEP 11: ENHANCE EXISTING TABLES (SAFE UPDATES)
-- =====================================================

-- Add new columns to existing conversations table if they don't exist
DO $$
BEGIN
    -- Add game_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'game_id') THEN
        ALTER TABLE conversations ADD COLUMN game_id TEXT;
        RAISE NOTICE '✅ Added game_id column to conversations table';
    ELSE
        RAISE NOTICE 'ℹ️  game_id column already exists in conversations table';
    END IF;
    
    -- Add session_start_timestamp column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'session_start_timestamp') THEN
        ALTER TABLE conversations ADD COLUMN session_start_timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;
        RAISE NOTICE '✅ Added session_start_timestamp column to conversations table';
    ELSE
        RAISE NOTICE 'ℹ️  session_start_timestamp column already exists in conversations table';
    END IF;
END $$;

-- Add new columns to existing usage table if they don't exist
DO $$
BEGIN
    -- Add insights_generated column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usage' AND column_name = 'insights_generated') THEN
        ALTER TABLE usage ADD COLUMN insights_generated INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added insights_generated column to usage table';
    ELSE
        RAISE NOTICE 'ℹ️  insights_generated column already exists in usage table';
    END IF;
    
    -- Add proactive_insights_count column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usage' AND column_name = 'proactive_insights_count') THEN
        ALTER TABLE usage ADD COLUMN proactive_insights_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added proactive_insights_count column to usage table';
    ELSE
        RAISE NOTICE 'ℹ️  proactive_insights_count column already exists in usage table';
    END IF;
END $$;

-- =====================================================
-- STEP 12: CREATE INDEXES (SAFE - IF NOT EXISTS)
-- =====================================================

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

-- =====================================================
-- STEP 13: ENABLE RLS ON NEW TABLES (SAFE)
-- =====================================================

-- Enable RLS on new tables (safe to run multiple times)
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 14: CREATE RLS POLICIES (SAFE - IF NOT EXISTS)
-- =====================================================

-- Player profiles RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'player_profiles' AND policyname = 'Users can view own player profile') THEN
        CREATE POLICY "Users can view own player profile" ON player_profiles
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created player_profiles SELECT policy';
    ELSE
        RAISE NOTICE 'ℹ️  player_profiles SELECT policy already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'player_profiles' AND policyname = 'Users can update own player profile') THEN
        CREATE POLICY "Users can update own player profile" ON player_profiles
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created player_profiles UPDATE policy';
    ELSE
        RAISE NOTICE 'ℹ️  player_profiles UPDATE policy already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'player_profiles' AND policyname = 'Users can insert own player profile') THEN
        CREATE POLICY "Users can insert own player profile" ON player_profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE '✅ Created player_profiles INSERT policy';
    ELSE
        RAISE NOTICE 'ℹ️  player_profiles INSERT policy already exists';
    END IF;
END $$;

-- Game contexts RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'game_contexts' AND policyname = 'Users can view own game contexts') THEN
        CREATE POLICY "Users can view own game contexts" ON game_contexts
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created game_contexts SELECT policy';
    ELSE
        RAISE NOTICE 'ℹ️  game_contexts SELECT policy already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'game_contexts' AND policyname = 'Users can update own game contexts') THEN
        CREATE POLICY "Users can update own game contexts" ON game_contexts
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created game_contexts UPDATE policy';
    ELSE
        RAISE NOTICE 'ℹ️  game_contexts UPDATE policy already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'game_contexts' AND policyname = 'Users can insert own game contexts') THEN
        CREATE POLICY "Users can insert own game contexts" ON game_contexts
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE '✅ Created game_contexts INSERT policy';
    ELSE
        RAISE NOTICE 'ℹ️  game_contexts INSERT policy already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'game_contexts' AND policyname = 'Users can delete own game contexts') THEN
        CREATE POLICY "Users can delete own game contexts" ON game_contexts
            FOR DELETE USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created game_contexts DELETE policy';
    ELSE
        RAISE NOTICE 'ℹ️  game_contexts DELETE policy already exists';
    END IF;
END $$;

-- Enhanced insights RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'enhanced_insights' AND policyname = 'Users can view own enhanced insights') THEN
        CREATE POLICY "Users can view own enhanced insights" ON enhanced_insights
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created enhanced_insights SELECT policy';
    ELSE
        RAISE NOTICE 'ℹ️  enhanced_insights SELECT policy already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'enhanced_insights' AND policyname = 'Users can update own enhanced insights') THEN
        CREATE POLICY "Users can update own enhanced insights" ON enhanced_insights
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created enhanced_insights UPDATE policy';
    ELSE
        RAISE NOTICE 'ℹ️  enhanced_insights UPDATE policy already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'enhanced_insights' AND policyname = 'Users can insert own enhanced insights') THEN
        CREATE POLICY "Users can insert own enhanced insights" ON enhanced_insights
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE '✅ Created enhanced_insights INSERT policy';
    ELSE
        RAISE NOTICE 'ℹ️  enhanced_insights INSERT policy already exists';
    END IF;
END $$;

-- Proactive insights RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'proactive_insights' AND policyname = 'Users can view own proactive insights') THEN
        CREATE POLICY "Users can view own proactive insights" ON proactive_insights
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created proactive_insights SELECT policy';
    ELSE
        RAISE NOTICE 'ℹ️  proactive_insights SELECT policy already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'proactive_insights' AND policyname = 'Users can update own proactive insights') THEN
        CREATE POLICY "Users can update own proactive insights" ON proactive_insights
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created proactive_insights UPDATE policy';
    ELSE
        RAISE NOTICE 'ℹ️  proactive_insights UPDATE policy already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'proactive_insights' AND policyname = 'Users can insert own proactive insights') THEN
        CREATE POLICY "Users can insert own proactive insights" ON proactive_insights
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE '✅ Created proactive_insights INSERT policy';
    ELSE
        RAISE NOTICE 'ℹ️  proactive_insights INSERT policy already exists';
    END IF;
END $$;

-- =====================================================
-- STEP 15: CREATE FUNCTIONS (SAFE - OR REPLACE)
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
-- STEP 16: CREATE TRIGGERS (SAFE - IF NOT EXISTS)
-- =====================================================

-- Apply updated_at triggers to new tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_player_profiles_updated_at') THEN
        CREATE TRIGGER update_player_profiles_updated_at 
            BEFORE UPDATE ON player_profiles 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Created player_profiles updated_at trigger';
    ELSE
        RAISE NOTICE 'ℹ️  player_profiles updated_at trigger already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_game_contexts_updated_at') THEN
        CREATE TRIGGER update_game_contexts_updated_at 
            BEFORE UPDATE ON game_contexts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Created game_contexts updated_at trigger';
    ELSE
        RAISE NOTICE 'ℹ️  game_contexts updated_at trigger already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_enhanced_insights_updated_at') THEN
        CREATE TRIGGER update_enhanced_insights_updated_at 
            BEFORE UPDATE ON enhanced_insights 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Created enhanced_insights updated_at trigger';
    ELSE
        RAISE NOTICE 'ℹ️  enhanced_insights updated_at trigger already exists';
    END IF;
END $$;

-- =====================================================
-- STEP 17: VERIFICATION AND COMPLETION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 OTAKON V19 Migration Completed Successfully!';
    RAISE NOTICE '🔒 All new tables are RLS protected';
    RAISE NOTICE '📊 Optimized indexes created for performance';
    RAISE NOTICE '🔄 Triggers and functions configured';
    RAISE NOTICE '🚀 Ready for enhanced insight generation and proactive features!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 New tables added:';
    RAISE NOTICE '   - player_profiles (gaming preferences)';
    RAISE NOTICE '   - game_contexts (game-specific data)';
    RAISE NOTICE '   - build_snapshots (character progression)';
    RAISE NOTICE '   - session_summaries (gameplay sessions)';
    RAISE NOTICE '   - conversation_contexts (AI context)';
    RAISE NOTICE '   - enhanced_insights (profile-aware tabs)';
    RAISE NOTICE '   - proactive_triggers (event triggers)';
    RAISE NOTICE '   - proactive_insights (AI suggestions)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Existing tables enhanced with new columns';
    RAISE NOTICE '📈 All performance optimizations applied';
END $$;
