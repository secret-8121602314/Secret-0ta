-- ============================================================================
-- COMPREHENSIVE SCHEMA VERIFICATION SCRIPT
-- December 16, 2025
-- ============================================================================
-- This script verifies the complete Otagon schema including:
-- 1. All tables count and status
-- 2. Table sizes and row counts
-- 3. RLS status for each table
-- 4. Indexes and their health
-- 5. Foreign key relationships
-- 6. Column information
-- 7. Policy information
-- ============================================================================

-- ============================================================================
-- 1. COMPLETE TABLE INVENTORY
-- ============================================================================
SELECT 
    tablename,
    schemaname,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ No RLS' END as security_status,
    (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = pg_tables.tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. TABLE SIZES AND ROW COUNTS
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size,
    (SELECT count(*) FROM information_schema.tables t2 WHERE t2.table_schema = pg_tables.schemaname AND t2.table_name = pg_tables.tablename) as exists_check
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 3. ALL INDEXES
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE' ELSE 'Non-unique' END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. RLS POLICIES BREAKDOWN
-- ============================================================================
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policies,
    STRING_AGG(cmd, ', ') as commands
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 5. FOREIGN KEY RELATIONSHIPS
-- ============================================================================
SELECT 
    kcu.constraint_name,
    kcu.table_schema,
    kcu.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.key_column_usage kcu
JOIN information_schema.constraint_column_usage ccu ON kcu.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name
WHERE kcu.table_schema = 'public'
ORDER BY kcu.table_name, kcu.column_name;

-- ============================================================================
-- 6. CORE TABLES - DETAILED COLUMN INFO
-- ============================================================================
SELECT 
    table_name,
    column_name,
    ordinal_position,
    data_type,
    is_nullable,
    column_default,
    CASE WHEN column_name IN ('id', 'auth_user_id', 'user_id') THEN '🔑 Key' ELSE '' END as column_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN (
        'users',
        'conversations',
        'messages',
        'subtabs',
        'user_library',
        'games',
        'ai_feedback',
        'user_feedback',
        'api_usage'
    )
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 7. GAMING EXPLORER TABLES - DETAILED COLUMN INFO
-- ============================================================================
SELECT 
    table_name,
    column_name,
    ordinal_position,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN (
        'gaming_profiles',
        'gaming_search_history',
        'gaming_knowledge'
    )
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 8. CACHE & TRACKING TABLES
-- ============================================================================
SELECT 
    table_name,
    column_name,
    ordinal_position,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN (
        'game_knowledge_cache',
        'igdb_game_cache',
        'news_cache',
        'app_cache',
        'user_grounding_usage',
        'subtab_refresh_usage',
        'user_analytics',
        'user_sessions',
        'user_timeline',
        'user_screenshots',
        'unreleased_game_tabs',
        'game_hub_interactions',
        'ai_responses',
        'ai_shown_prompts',
        'subscriptions',
        'payment_events',
        'waitlist'
    )
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 9. TABLE CONSTRAINTS
-- ============================================================================
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN '🔑' 
         WHEN tc.constraint_type = 'UNIQUE' THEN '✓'
         WHEN tc.constraint_type = 'FOREIGN KEY' THEN '→'
         WHEN tc.constraint_type = 'CHECK' THEN '✔'
         ELSE '' END as icon
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- 10. FINAL SUMMARY
-- ============================================================================
WITH table_summary AS (
    SELECT 
        COUNT(*) as total_tables,
        SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as tables_with_rls,
        SUM(CASE WHEN rowsecurity THEN 0 ELSE 1 END) as tables_without_rls
    FROM pg_tables
    WHERE schemaname = 'public'
)
SELECT 
    total_tables as "📊 Total Tables",
    tables_with_rls as "✅ Tables with RLS",
    tables_without_rls as "⚠️ Tables without RLS",
    ROUND((tables_with_rls::numeric / total_tables * 100), 1) || '%' as "RLS Coverage"
FROM table_summary;

-- ============================================================================
-- 11. SCHEMA SIZE SUMMARY
-- ============================================================================
SELECT 
    'Database' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
    'Public Schema',
    pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename)))
FROM pg_tables
WHERE schemaname = 'public';

-- ============================================================================
-- 12. CRITICAL TABLES VERIFICATION
-- ============================================================================
SELECT 
    'CORE MESSAGING' as category,
    tablename,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = pg_tables.tablename) as exists,
    CASE WHEN rowsecurity THEN '✅' ELSE '⚠️' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('conversations', 'messages')

UNION ALL

SELECT 
    'USER MANAGEMENT',
    tablename,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = pg_tables.tablename),
    CASE WHEN rowsecurity THEN '✅' ELSE '⚠️' END
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('users', 'user_sessions', 'user_analytics')

UNION ALL

SELECT 
    'FEEDBACK & TRACKING',
    tablename,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = pg_tables.tablename),
    CASE WHEN rowsecurity THEN '✅' ELSE '⚠️' END
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('ai_feedback', 'user_feedback', 'api_usage')

UNION ALL

SELECT 
    'GAMING EXPLORER',
    tablename,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = pg_tables.tablename),
    CASE WHEN rowsecurity THEN '✅' ELSE '⚠️' END
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('gaming_profiles', 'gaming_search_history', 'gaming_knowledge')

UNION ALL

SELECT 
    'CACHING',
    tablename,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = pg_tables.tablename),
    CASE WHEN rowsecurity THEN '✅' ELSE '⚠️' END
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('game_knowledge_cache', 'igdb_game_cache', 'news_cache', 'app_cache')

ORDER BY category, tablename;

-- ============================================================================
-- 13. DEPRECATED TABLES CHECK
-- ============================================================================
-- Verify deprecated tables are removed
SELECT 
    'onboarding_progress' as table_name,
    CASE WHEN EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'onboarding_progress'
    ) THEN '❌ Still exists' ELSE '✅ Removed' END as status
UNION ALL
SELECT 
    'games',
    CASE WHEN EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'games'
        AND EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'games'
            AND column_name IN ('auth_user_id', 'user_id')
        )
    ) THEN '⚠️ Old structure' ELSE '✅ Redesigned' END as status;

-- ============================================================================
-- 14. QUICK HEALTH CHECK
-- ============================================================================
SELECT 
    'Total tables' as check_name,
    COUNT(*)::text as result,
    CASE WHEN COUNT(*) = 31 THEN '✅ PASS' ELSE '⚠️ CHECK' END as status
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Tables with RLS',
    COUNT(*)::text,
    CASE WHEN COUNT(*) >= 25 THEN '✅ PASS' ELSE '⚠️ CHECK' END
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT 
    'No user_id in games table',
    CASE WHEN EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'games'
        AND column_name = 'user_id'
    ) THEN 'FAIL' ELSE 'PASS' END as result,
    CASE WHEN EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'games'
        AND column_name = 'user_id'
    ) THEN '❌ FAIL' ELSE '✅ PASS' END as status

UNION ALL

SELECT 
    'Games is global analytics',
    CASE WHEN EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'games'
        AND column_name = 'total_users'
    ) THEN 'PASS' ELSE 'FAIL' END as result,
    CASE WHEN EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'games'
        AND column_name = 'total_users'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status

UNION ALL

SELECT 
    'Gaming Explorer tables exist',
    COUNT(*)::text,
    CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename IN ('gaming_profiles', 'gaming_search_history', 'gaming_knowledge')

ORDER BY status DESC, check_name;

-- ============================================================================
-- END OF VERIFICATION
-- ============================================================================
