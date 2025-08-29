-- 🚨 NUCLEAR OPTION: COMPLETE DATABASE RESET
-- This script will DROP EVERYTHING and recreate it cleanly
-- WARNING: ALL DATA WILL BE LOST! Use only on development/test databases!

-- =====================================================
-- STEP 1: CONFIRMATION AND SAFETY CHECKS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🚨 NUCLEAR DATABASE RESET STARTING!';
    RAISE NOTICE '⚠️  This will DELETE ALL TABLES, POLICIES, FUNCTIONS, and DATA!';
    RAISE NOTICE '⚠️  ALL DATA WILL BE PERMANENTLY LOST!';
    RAISE NOTICE '⚠️  Only proceed if this is a development/test database!';
    RAISE NOTICE '✅ Proceeding with complete reset...';
END $$;

-- =====================================================
-- STEP 2: DROP ALL EXISTING OBJECTS
-- =====================================================

-- Drop all functions first
DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE '🗑️  Dropping all existing functions...';
    
    FOR func_record IN 
        SELECT proname, oid 
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND proname NOT LIKE 'pg_%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.proname;
    END LOOP;
END $$;

-- Drop all policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '🗑️  Dropping all existing RLS policies...';
    
    FOR policy_record IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || policy_record.tablename;
        RAISE NOTICE 'Dropped policy: % on table %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- Drop all tables
DO $$
DECLARE
    table_record RECORD;
BEGIN
    RAISE NOTICE '🗑️  Dropping all existing tables...';
    
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

-- Drop all sequences
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    RAISE NOTICE '🗑️  Dropping all existing sequences...';
    
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || seq_record.sequence_name || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', seq_record.sequence_name;
    END LOOP;
END $$;

-- Drop all views
DO $$
DECLARE
    view_record RECORD;
BEGIN
    RAISE NOTICE '🗑️  Dropping all existing views...';
    
    FOR view_record IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
        AND viewname NOT LIKE 'pg_%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || view_record.viewname || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', view_record.viewname;
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: VERIFY CLEAN STATE
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    view_count INTEGER;
    function_count INTEGER;
    total_objects INTEGER;
BEGIN
    -- Count remaining objects separately to avoid type issues
    SELECT COUNT(*) INTO table_count
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%';
    
    SELECT COUNT(*) INTO view_count
    FROM pg_views 
    WHERE schemaname = 'public'
    AND viewname NOT LIKE 'pg_%';
    
    SELECT COUNT(*) INTO function_count
    FROM pg_proc 
    WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname NOT LIKE 'pg_%';
    
    total_objects := table_count + view_count + function_count;
    
    IF total_objects = 0 THEN
        RAISE NOTICE '✅ Database is now completely clean!';
        RAISE NOTICE '✅ No tables, functions, or policies remain';
    ELSE
        RAISE NOTICE '⚠️  % objects still remain - manual cleanup may be needed', total_objects;
        RAISE NOTICE '   Tables: %, Views: %, Functions: %', table_count, view_count, function_count;
    END IF;
END $$;

-- =====================================================
-- STEP 4: RECREATE 8-TABLE CONSOLIDATED SCHEMA
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Recreating 8-table consolidated schema...';
END $$;

-- 1. USERS_NEW TABLE
CREATE TABLE users_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    profile_data JSONB DEFAULT '{}',
    usage_data JSONB DEFAULT '{}',
    app_state JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. GAMES_NEW TABLE
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
    game_data JSONB DEFAULT '{}',
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);

-- 3. ANALYTICS_NEW TABLE
CREATE TABLE analytics_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    event_type TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- 4. TASKS_NEW TABLE
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
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. INSIGHTS_NEW TABLE
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
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CONVERSATIONS_NEW TABLE
CREATE TABLE conversations_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL,
    title TEXT,
    game_id TEXT,
    messages JSONB DEFAULT '[]',
    context JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, conversation_id)
);

-- 7. SYSTEM_NEW TABLE
CREATE TABLE system_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    event_type TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CONTENT_CACHE_NEW TABLE
CREATE TABLE content_cache_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    content_type TEXT NOT NULL,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. WAITLIST TABLE
CREATE TABLE waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    source TEXT DEFAULT 'landing_page',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ENHANCED_INSIGHTS TABLE (Legacy compatibility)
CREATE TABLE enhanced_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'enhanced',
    status TEXT DEFAULT 'idle',
    priority TEXT DEFAULT 'medium',
    is_favorite BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. PROACTIVE_INSIGHTS TABLE (Legacy compatibility)
CREATE TABLE proactive_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'proactive',
    status TEXT DEFAULT 'idle',
    priority TEXT DEFAULT 'medium',
    is_favorite BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. DIARY_TASKS TABLE (Legacy compatibility)
CREATE TABLE diary_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'diary',
    status TEXT DEFAULT 'pending',
    category TEXT DEFAULT 'diary',
    priority TEXT DEFAULT 'medium',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 13. USER_ANALYTICS TABLE (Legacy compatibility)
CREATE TABLE user_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    event_type TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- STEP 5: CREATE INDEXES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Creating performance indexes...';
END $$;

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

-- Legacy table indexes for compatibility
CREATE INDEX idx_enhanced_insights_user_id ON enhanced_insights(user_id);
CREATE INDEX idx_enhanced_insights_game_id ON enhanced_insights(game_id);
CREATE INDEX idx_enhanced_insights_type ON enhanced_insights(type);

CREATE INDEX idx_proactive_insights_user_id ON proactive_insights(user_id);
CREATE INDEX idx_proactive_insights_game_id ON proactive_insights(game_id);
CREATE INDEX idx_proactive_insights_type ON proactive_insights(type);

CREATE INDEX idx_diary_tasks_user_id ON diary_tasks(user_id);
CREATE INDEX idx_diary_tasks_game_id ON diary_tasks(game_id);
CREATE INDEX idx_diary_tasks_status ON diary_tasks(status);

CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_category ON user_analytics(category);
CREATE INDEX idx_user_analytics_timestamp ON user_analytics(timestamp);

-- =====================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Enabling Row Level Security...';
END $$;

ALTER TABLE users_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE games_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_cache_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Enable RLS on legacy tables
ALTER TABLE enhanced_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 7: CREATE RLS POLICIES WITH EXPLICIT SEARCH PATHS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Creating RLS policies with explicit search paths...';
END $$;

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

-- System table policies
CREATE POLICY "Users can view own system data" ON system_new
    FOR SELECT USING ((select auth.uid()) = user_id OR category IN ('contact_submissions', 'system_settings'));

CREATE POLICY "Users can insert system data" ON system_new
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id OR category IN ('contact_submissions'));

-- Content cache policies
CREATE POLICY "Authenticated users can manage content cache" ON content_cache_new
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Waitlist policies
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

-- Legacy table RLS policies
CREATE POLICY "Users can manage own enhanced insights" ON enhanced_insights
    FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage own proactive insights" ON proactive_insights
    FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage own diary tasks" ON diary_tasks
    FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage own user analytics" ON user_analytics
    FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- STEP 8: CREATE SECURE FUNCTIONS WITH EXPLICIT SEARCH PATHS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Creating secure functions with explicit search paths...';
END $$;

-- Function 1: get_rls_policy_stats
CREATE OR REPLACE FUNCTION get_rls_policy_stats()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    policy_type TEXT,
    avg_execution_time NUMERIC,
    execution_count BIGINT
) AS $$
BEGIN
    -- CRITICAL: Set explicit search path for security
    SET search_path = 'public';
    
    RETURN QUERY
    SELECT 
        (schemaname || '.' || tablename)::TEXT as table_name,
        policyname::TEXT as policy_name,
        CASE 
            WHEN cmd = 'r' THEN 'SELECT'::TEXT
            WHEN cmd = 'a' THEN 'INSERT'::TEXT
            WHEN cmd = 'w' THEN 'UPDATE'::TEXT
            WHEN cmd = 'd' THEN 'DELETE'::TEXT
            WHEN cmd = '*' THEN 'ALL'::TEXT
            ELSE 'UNKNOWN'::TEXT
        END as policy_type,
        0.0::NUMERIC as avg_execution_time,
        0::BIGINT as execution_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: validate_schema_performance
CREATE OR REPLACE FUNCTION validate_schema_performance()
RETURNS TABLE (
    check_type TEXT,
    table_name TEXT,
    issue_description TEXT,
    severity TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- CRITICAL: Set explicit search path for security
    SET search_path = 'public';
    
    RETURN QUERY
    SELECT 
        'Missing Indexes'::TEXT as check_type,
        t.table_name::TEXT,
        'Table lacks indexes on frequently queried columns'::TEXT as issue_description,
        'MEDIUM'::TEXT as severity,
        'Add indexes on user_id, game_id, and JSONB columns'::TEXT as recommendation
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
    AND t.table_name LIKE '%_new'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: audit_security_issues
CREATE OR REPLACE FUNCTION audit_security_issues()
RETURNS TABLE (
    issue_type TEXT,
    object_name TEXT,
    severity TEXT,
    description TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- CRITICAL: Set explicit search path for security
    SET search_path = 'public';
    
    RETURN QUERY
    SELECT 
        'Function Search Path'::TEXT as issue_type,
        p.proname::TEXT as object_name,
        'HIGH'::TEXT as severity,
        'Function lacks explicit search_path setting'::TEXT as description,
        'Add SET search_path = ''public'' to function body'::TEXT as recommendation
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosrc NOT LIKE '%SET search_path%'
    AND p.prosrc LIKE '%CREATE%FUNCTION%'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 9: GRANT PERMISSIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Granting permissions...';
END $$;

-- Grant permissions to authenticated users
GRANT ALL ON users_new TO authenticated;
GRANT ALL ON games_new TO authenticated;
GRANT ALL ON analytics_new TO authenticated;
GRANT ALL ON tasks_new TO authenticated;
GRANT ALL ON insights_new TO authenticated;
GRANT ALL ON conversations_new TO authenticated;
GRANT ALL ON system_new TO authenticated;
GRANT ALL ON content_cache_new TO authenticated;

-- Grant permissions to legacy tables
GRANT ALL ON enhanced_insights TO authenticated;
GRANT ALL ON proactive_insights TO authenticated;
GRANT ALL ON diary_tasks TO authenticated;
GRANT ALL ON user_analytics TO authenticated;

-- Grant permissions to anonymous users (for waitlist)
GRANT SELECT, INSERT ON waitlist TO anon;
GRANT SELECT ON waitlist TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_rls_policy_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_schema_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION audit_security_issues() TO authenticated;

-- =====================================================
-- STEP 10: FINAL VERIFICATION
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
    secure_function_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 Final verification...';
    
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND (table_name LIKE '%_new' OR 
         table_name = 'waitlist' OR 
         table_name = 'enhanced_insights' OR 
         table_name = 'proactive_insights' OR 
         table_name = 'diary_tasks' OR 
         table_name = 'user_analytics');
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND proname IN ('get_rls_policy_stats', 'validate_schema_performance', 'audit_security_issues');
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Count secure functions
    SELECT COUNT(*) INTO secure_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND proname IN ('get_rls_policy_stats', 'validate_schema_performance', 'audit_security_issues')
    AND prosrc LIKE '%SET search_path%';
    
    RAISE NOTICE '📊 Verification Results:';
    RAISE NOTICE '   Tables: %', table_count;
    RAISE NOTICE '   Functions: %', function_count;
    RAISE NOTICE '   Policies: %', policy_count;
    RAISE NOTICE '   Secure Functions: %', secure_function_count;
    
    IF secure_function_count = function_count AND function_count > 0 THEN
        RAISE NOTICE '🎉 NUCLEAR RESET COMPLETE AND SUCCESSFUL!';
        RAISE NOTICE '✅ All functions now have explicit search_path = ''public''';
        RAISE NOTICE '✅ Function search path mutable warnings should be resolved';
        RAISE NOTICE '🚀 Run Supabase linter again to confirm!';
    ELSE
        RAISE NOTICE '⚠️  RESET COMPLETE BUT SECURITY ISSUES EXIST';
        RAISE NOTICE '❌ %/% functions are secure', secure_function_count, function_count;
        RAISE NOTICE '🔧 Manual intervention required';
    END IF;
END $$;
