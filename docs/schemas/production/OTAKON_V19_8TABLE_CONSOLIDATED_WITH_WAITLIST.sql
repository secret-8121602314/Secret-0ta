-- 🚀 OTAKON V19 8-TABLE CONSOLIDATED SCHEMA WITH WAITLIST
-- This script provides the new consolidated 8-table schema plus separate waitlist table
-- Optimized for performance and maintainability

-- =====================================================
-- STEP 1: CONFIRMATION AND SAFETY CHECKS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🚨 OTAKON V19 8-TABLE CONSOLIDATED SCHEMA STARTING!';
    RAISE NOTICE '⚠️  This will DELETE ALL TABLES and recreate them!';
    RAISE NOTICE '⚠️  ALL DATA WILL BE LOST!';
    RAISE NOTICE '✅ Proceeding with 8-table consolidated approach...';
END $$;

-- =====================================================
-- STEP 2: FORCE DROP ALL EXISTING TABLES
-- =====================================================

-- Drop all existing tables
DROP TABLE IF EXISTS users_new CASCADE;
DROP TABLE IF EXISTS games_new CASCADE;
DROP TABLE IF EXISTS analytics_new CASCADE;
DROP TABLE IF EXISTS tasks_new CASCADE;
DROP TABLE IF EXISTS insights_new CASCADE;
DROP TABLE IF EXISTS conversations_new CASCADE;
DROP TABLE IF EXISTS system_new CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;

-- Drop any other tables that might exist
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || table_record.tablename || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', table_record.tablename;
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: CREATE 8 CONSOLIDATED TABLES
-- =====================================================

-- 1. USERS_NEW TABLE (Consolidates: users, user_profiles, user_preferences, usage, tiers)
CREATE TABLE users_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    profile_data JSONB DEFAULT '{}', -- Player profile, preferences, settings
    usage_data JSONB DEFAULT '{}',   -- Usage counts, limits, tier info
    app_state JSONB DEFAULT '{}',    -- App state, UI preferences, last visited
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. GAMES_NEW TABLE (Consolidates: games, game_objectives, game_solutions, knowledge_patterns)
CREATE TABLE games_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    title TEXT NOT NULL,
    genre TEXT,
    platform TEXT[],
    release_date DATE,
    developer TEXT,
    publisher TEXT,
    description TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    game_data JSONB DEFAULT '{}',    -- Objectives, solutions, knowledge patterns
    session_data JSONB DEFAULT '{}',  -- Progress, context, game state
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);

-- 3. ANALYTICS_NEW TABLE (Consolidates: user_analytics, api_cost_tracking, performance_metrics)
CREATE TABLE analytics_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,           -- 'api_costs', 'performance', 'user_behavior', 'feedback'
    event_type TEXT NOT NULL,        -- 'api_call', 'page_load', 'user_action', 'error'
    data JSONB DEFAULT '{}',         -- Event-specific data
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'      -- Additional context, tags, etc.
);

-- 4. TASKS_NEW TABLE (Consolidates: diary_tasks, user_tasks, objectives)
CREATE TABLE tasks_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'user_created' CHECK (type IN ('user_created', 'ai_suggested')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'need_help')),
    category TEXT DEFAULT 'custom' CHECK (category IN ('quest', 'boss', 'exploration', 'item', 'character', 'custom')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    metadata JSONB DEFAULT '{}',     -- Additional task data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. INSIGHTS_NEW TABLE (Consolidates: insights, enhanced_insights, proactive_insights)
CREATE TABLE insights_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'insight' CHECK (type IN ('insight', 'enhanced', 'proactive', 'ai_response')),
    status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'loading', 'loaded', 'error')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_favorite BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',     -- Insight-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CONVERSATIONS_NEW TABLE (Consolidates: conversations, conversation_contexts, chat_history)
CREATE TABLE conversations_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL,
    title TEXT,
    game_id TEXT,
    messages JSONB DEFAULT '[]',      -- Chat message history
    context JSONB DEFAULT '{}',       -- Conversation context, game state
    metadata JSONB DEFAULT '{}',      -- Additional conversation data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, conversation_id)
);

-- 7. SYSTEM_NEW TABLE (Consolidates: system_settings, contact_submissions, admin_data)
CREATE TABLE system_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,           -- 'contact_submissions', 'system_settings', 'admin_data'
    event_type TEXT NOT NULL,        -- 'contact_form', 'system_update', 'admin_action'
    data JSONB DEFAULT '{}',         -- Event-specific data
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CONTENT_CACHE_NEW TABLE (Consolidates: global_content_cache, content_variety, generation_triggers)
CREATE TABLE content_cache_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    content_type TEXT NOT NULL,      -- 'ai_response', 'insight', 'content_variety'
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',     -- Cache metadata, tags, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE SEPARATE WAITLIST TABLE
-- =====================================================

-- 9. WAITLIST TABLE (Separate table for email waitlist management)
CREATE TABLE waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    source TEXT DEFAULT 'landing_page', -- Where the signup came from
    metadata JSONB DEFAULT '{}',        -- Additional waitlist data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_new_auth_user_id ON users_new(auth_user_id);
CREATE INDEX idx_users_new_profile_data ON users_new USING GIN (profile_data);
CREATE INDEX idx_users_new_usage_data ON users_new USING GIN (usage_data);

-- Games table indexes
CREATE INDEX idx_games_new_user_id ON games_new(user_id);
CREATE INDEX idx_games_new_game_id ON games_new(game_id);
CREATE INDEX idx_games_new_genre ON games_new(genre);
CREATE INDEX idx_games_new_game_data ON games_new USING GIN (game_data);

-- Analytics table indexes
CREATE INDEX idx_analytics_new_user_id ON analytics_new(user_id);
CREATE INDEX idx_analytics_new_category ON analytics_new(category);
CREATE INDEX idx_analytics_new_event_type ON analytics_new(event_type);
CREATE INDEX idx_analytics_new_timestamp ON analytics_new(timestamp);
CREATE INDEX idx_analytics_new_data ON analytics_new USING GIN (data);

-- Tasks table indexes
CREATE INDEX idx_tasks_new_user_id ON tasks_new(user_id);
CREATE INDEX idx_tasks_new_game_id ON tasks_new(game_id);
CREATE INDEX idx_tasks_new_status ON tasks_new(status);
CREATE INDEX idx_tasks_new_category ON tasks_new(category);

-- Insights table indexes
CREATE INDEX idx_insights_new_user_id ON insights_new(user_id);
CREATE INDEX idx_insights_new_game_id ON insights_new(game_id);
CREATE INDEX idx_insights_new_type ON insights_new(type);
CREATE INDEX idx_insights_new_status ON insights_new(status);

-- Conversations table indexes
CREATE INDEX idx_conversations_new_user_id ON conversations_new(user_id);
CREATE INDEX idx_conversations_new_conversation_id ON conversations_new(conversation_id);
CREATE INDEX idx_conversations_new_game_id ON conversations_new(game_id);

-- System table indexes
CREATE INDEX idx_system_new_category ON system_new(category);
CREATE INDEX idx_system_new_event_type ON system_new(event_type);
CREATE INDEX idx_system_new_user_id ON system_new(user_id);

-- Content cache table indexes
CREATE INDEX idx_content_cache_new_cache_key ON content_cache_new(cache_key);
CREATE INDEX idx_content_cache_new_content_type ON content_cache_new(content_type);
CREATE INDEX idx_content_cache_new_expires_at ON content_cache_new(expires_at);

-- Waitlist table indexes
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_source ON waitlist(source);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at);

-- =====================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE games_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_cache_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 7: CREATE RLS POLICIES (PERFORMANCE OPTIMIZED)
-- =====================================================
-- Note: All auth.uid() and auth.role() calls are wrapped in (select ...) 
-- to prevent re-evaluation for each row, improving query performance

-- Users table policies
CREATE POLICY "Users can view own data" ON users_new
    FOR SELECT USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update own data" ON users_new
    FOR UPDATE USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert own data" ON users_new
    FOR INSERT WITH CHECK ((select auth.uid()) = auth_user_id);

-- Games table policies
CREATE POLICY "Users can manage own games" ON games_new
    FOR ALL USING ((select auth.uid()) = user_id);

-- Analytics table policies
CREATE POLICY "Users can view own analytics" ON analytics_new
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own analytics" ON analytics_new
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Tasks table policies
CREATE POLICY "Users can manage own tasks" ON tasks_new
    FOR ALL USING ((select auth.uid()) = user_id);

-- Insights table policies
CREATE POLICY "Users can manage own insights" ON insights_new
    FOR ALL USING ((select auth.uid()) = user_id);

-- Conversations table policies
CREATE POLICY "Users can manage own conversations" ON conversations_new
    FOR ALL USING ((select auth.uid()) = user_id);

-- System table policies (admin access for some categories)
CREATE POLICY "Users can view own system data" ON system_new
    FOR SELECT USING ((select auth.uid()) = user_id OR category IN ('contact_submissions', 'system_settings'));

CREATE POLICY "Users can insert system data" ON system_new
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id OR category IN ('contact_submissions'));

-- Content cache policies (single policy for all operations)
CREATE POLICY "Authenticated users can manage content cache" ON content_cache_new
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Waitlist policies (simplified - single policy per action)
CREATE POLICY "Public can view waitlist" ON waitlist
    FOR SELECT USING (true);

CREATE POLICY "Public can insert to waitlist" ON waitlist
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can manage waitlist" ON waitlist
    FOR UPDATE USING ((select auth.uid()) IN (
        SELECT auth_user_id FROM users_new 
        WHERE profile_data->>'is_admin' = 'true'
    ));

CREATE POLICY "Admin can delete waitlist" ON waitlist
    FOR DELETE USING ((select auth.uid()) IN (
        SELECT auth_user_id FROM users_new 
        WHERE profile_data->>'is_admin' = 'true'
    ));

-- =====================================================
-- STEP 8: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON users_new TO authenticated;
GRANT ALL ON games_new TO authenticated;
GRANT ALL ON analytics_new TO authenticated;
GRANT ALL ON tasks_new TO authenticated;
GRANT ALL ON insights_new TO authenticated;
GRANT ALL ON conversations_new TO authenticated;
GRANT ALL ON system_new TO authenticated;
GRANT ALL ON content_cache_new TO authenticated;

-- Grant permissions to anonymous users (for waitlist)
GRANT SELECT, INSERT ON waitlist TO anon;
GRANT SELECT ON waitlist TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- STEP 9: VERIFICATION AND COMPLETION
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name LIKE '%_new' OR table_name = 'waitlist';
    
    RAISE NOTICE '✅ Successfully created % consolidated tables + waitlist table', table_count;
    RAISE NOTICE '🚀 OTAKON V19 8-TABLE CONSOLIDATED SCHEMA WITH WAITLIST COMPLETE!';
END $$;

-- =====================================================
-- SECURITY BEST PRACTICES AND GUIDELINES
-- =====================================================

-- Security checklist for future development:
-- 1. Always set explicit search_path in functions: SET search_path = 'public';
-- 2. Use SECURITY DEFINER only when necessary and with proper validation
-- 3. Validate all user inputs before processing
-- 4. Use parameterized queries to prevent SQL injection
-- 5. Regularly audit RLS policies for overly permissive access
-- 6. Monitor function execution for unusual patterns
-- 7. Keep database functions minimal and focused
-- 8. Use proper error handling without exposing sensitive information

-- =====================================================
-- SCHEMA COMPLETION
-- =====================================================

COMMENT ON TABLE users_new IS 'Consolidated users table: profiles, preferences, usage, tiers';
COMMENT ON TABLE games_new IS 'Consolidated games table: objectives, solutions, knowledge patterns';
COMMENT ON TABLE analytics_new IS 'Consolidated analytics table: user behavior, API costs, performance';
COMMENT ON TABLE tasks_new IS 'Consolidated tasks table: diary tasks, objectives, user tasks';
COMMENT ON TABLE insights_new IS 'Consolidated insights table: AI insights, enhanced insights, proactive insights';
COMMENT ON TABLE conversations_new IS 'Consolidated conversations table: chat history, context, game state';
COMMENT ON TABLE system_new IS 'Consolidated system table: settings, contact submissions, admin data';
COMMENT ON TABLE content_cache_new IS 'Consolidated content cache table: AI responses, content variety, triggers';
COMMENT ON TABLE waitlist IS 'Separate waitlist table for email management';

COMMENT ON COLUMN users_new.profile_data IS 'JSONB containing: hintStyle, playerFocus, preferredTone, spoilerTolerance, isFirstTime';
COMMENT ON COLUMN users_new.usage_data IS 'JSONB containing: textCount, imageCount, textLimit, imageLimit, tier';
COMMENT ON COLUMN users_new.app_state IS 'JSONB containing: UI preferences, last visited, app settings';

COMMENT ON COLUMN games_new.game_data IS 'JSONB containing: objectives[], solutions[], knowledge_patterns[], metadata{}';
COMMENT ON COLUMN games_new.session_data IS 'JSONB containing: progress{}, user_context{}, game_state{}';

COMMENT ON COLUMN analytics_new.category IS 'Categories: api_costs, performance, user_behavior, feedback, waitlist';
COMMENT ON COLUMN analytics_new.event_type IS 'Event types: api_call, page_load, user_action, error, email_registration';
COMMENT ON COLUMN analytics_new.data IS 'Event-specific data in JSONB format';

COMMENT ON COLUMN waitlist.email IS 'Unique email address for waitlist registration';
COMMENT ON COLUMN waitlist.status IS 'Status: pending, approved, rejected';
COMMENT ON COLUMN waitlist.source IS 'Source: landing_page, referral, social_media, etc.';

-- =====================================================
-- PERFORMANCE MONITORING AND OPTIMIZATION (SECURITY HARDENED)
-- =====================================================
-- Note: All functions use explicit search_path = 'public' to prevent
-- privilege escalation through search path manipulation

-- Monitor RLS policy performance
CREATE OR REPLACE FUNCTION get_rls_policy_stats()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    policy_type TEXT,
    avg_execution_time NUMERIC,
    execution_count BIGINT
) AS $$
BEGIN
    -- Set explicit search path for security
    SET search_path = 'public';
    
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        policyname as policy_name,
        CASE 
            WHEN cmd = 'r' THEN 'SELECT'
            WHEN cmd = 'a' THEN 'INSERT'
            WHEN cmd = 'w' THEN 'UPDATE'
            WHEN cmd = 'd' THEN 'DELETE'
            WHEN cmd = '*' THEN 'ALL'
            ELSE 'UNKNOWN'
        END as policy_type,
        0.0 as avg_execution_time, -- Placeholder for actual monitoring
        0 as execution_count        -- Placeholder for actual monitoring
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_rls_policy_stats() TO authenticated;

-- Performance optimization tips
COMMENT ON FUNCTION get_rls_policy_stats() IS 'Monitor RLS policy performance and identify bottlenecks';

-- Validate schema performance and identify potential issues
CREATE OR REPLACE FUNCTION validate_schema_performance()
RETURNS TABLE (
    check_type TEXT,
    table_name TEXT,
    issue_description TEXT,
    severity TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Set explicit search path for security
    SET search_path = 'public';
    
    RETURN QUERY
    -- Check for tables without proper indexes
    SELECT 
        'Missing Indexes' as check_type,
        t.table_name,
        'Table lacks indexes on frequently queried columns' as issue_description,
        'MEDIUM' as severity,
        'Add indexes on user_id, game_id, and JSONB columns' as recommendation
    FROM information_schema.tables t
    LEFT JOIN pg_indexes i ON t.table_name = i.tablename
    WHERE t.table_schema = 'public' 
    AND t.table_name LIKE '%_new'
    AND i.indexname IS NULL
    
    UNION ALL
    
    -- Check for RLS policies that might cause performance issues
    SELECT 
        'RLS Policy Performance' as check_type,
        p.tablename as table_name,
        'RLS policy uses complex subqueries that may impact performance' as issue_description,
        'LOW' as severity,
        'Monitor query performance and consider policy optimization' as recommendation
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.tablename LIKE '%_new'
    AND p.cmd = '*'
    
    UNION ALL
    
    -- Check for JSONB columns without GIN indexes
    SELECT 
        'JSONB Indexes' as check_type,
        c.table_name,
        'JSONB column lacks GIN index for efficient querying' as issue_description,
        'MEDIUM' as severity,
        'Add GIN indexes on JSONB columns for better performance' as recommendation
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    AND c.data_type = 'jsonb'
    AND c.table_name LIKE '%_new'
    AND NOT EXISTS (
        SELECT 1 FROM pg_indexes i 
        WHERE i.tablename = c.table_name 
        AND i.indexdef LIKE '%GIN%'
        AND i.indexdef LIKE '%' || c.column_name || '%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION validate_schema_performance() TO authenticated;

COMMENT ON FUNCTION validate_schema_performance() IS 'Validate schema performance and identify optimization opportunities';

-- Security audit function to check for potential vulnerabilities
CREATE OR REPLACE FUNCTION audit_security_issues()
RETURNS TABLE (
    issue_type TEXT,
    object_name TEXT,
    severity TEXT,
    description TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Set explicit search path for security
    SET search_path = 'public';
    
    RETURN QUERY
    -- Check for functions without explicit search path
    SELECT 
        'Function Search Path' as issue_type,
        p.proname as object_name,
        'HIGH' as severity,
        'Function lacks explicit search_path setting' as description,
        'Add SET search_path = ''public'' to function body' as recommendation
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosrc NOT LIKE '%SET search_path%'
    AND p.prosrc LIKE '%CREATE%FUNCTION%'
    
    UNION ALL
    
    -- Check for tables without RLS enabled
    SELECT 
        'RLS Disabled' as issue_type,
        t.table_name as object_name,
        'MEDIUM' as severity,
        'Table does not have Row Level Security enabled' as description,
        'Enable RLS with ALTER TABLE table_name ENABLE ROW LEVEL SECURITY' as recommendation
    FROM information_schema.tables t
    LEFT JOIN pg_tables pt ON t.table_name = pt.tablename
    WHERE t.table_schema = 'public'
    AND t.table_name LIKE '%_new'
    AND pt.rowsecurity = false
    
    UNION ALL
    
    -- Check for overly permissive policies
    SELECT 
        'Overly Permissive Policy' as issue_type,
        p.tablename as object_name,
        'MEDIUM' as severity,
        'RLS policy allows access to all users' as description,
        'Review and restrict policy permissions appropriately' as recommendation
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.cmd = '*'
    AND p.qual LIKE '%true%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION audit_security_issues() TO authenticated;

COMMENT ON FUNCTION audit_security_issues() IS 'Audit database for potential security vulnerabilities';

-- =====================================================
-- SCHEMA COMPLETION
-- =====================================================
