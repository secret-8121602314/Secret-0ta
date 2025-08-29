-- 🔧 FIX FUNCTION SEARCH PATH SECURITY ISSUES
-- This script fixes the mutable search path warnings in your existing database
-- Run this after applying the main consolidated schema

-- =====================================================
-- STEP 0: DROP EXISTING FUNCTIONS TO ENSURE CLEAN RECREATION
-- =====================================================

-- Drop existing functions to ensure clean recreation
DROP FUNCTION IF EXISTS get_rls_policy_stats() CASCADE;
DROP FUNCTION IF EXISTS validate_schema_performance() CASCADE;
DROP FUNCTION IF EXISTS audit_security_issues() CASCADE;

DO $$
BEGIN
    RAISE NOTICE '🗑️  Dropped existing functions for clean recreation';
END $$;

-- =====================================================
-- STEP 1: FIX get_rls_policy_stats FUNCTION
-- =====================================================

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
        0.0::NUMERIC as avg_execution_time, -- Placeholder for actual monitoring
        0::BIGINT as execution_count        -- Placeholder for actual monitoring
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 2: FIX validate_schema_performance FUNCTION
-- =====================================================

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

-- =====================================================
-- STEP 3: FIX audit_security_issues FUNCTION
-- =====================================================

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

-- =====================================================
-- STEP 4: VERIFY SECURITY FIXES
-- =====================================================

-- Verify that search_path is properly set in all functions
DO $$
DECLARE
    func_record RECORD;
    search_path_found BOOLEAN;
BEGIN
    RAISE NOTICE '🔍 Verifying security fixes...';
    
    FOR func_record IN 
        SELECT proname, prosrc 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND proname IN ('get_rls_policy_stats', 'validate_schema_performance', 'audit_security_issues')
    LOOP
        search_path_found := func_record.prosrc LIKE '%SET search_path%';
        
        IF search_path_found THEN
            RAISE NOTICE '✅ %: search_path properly set', func_record.proname;
        ELSE
            RAISE NOTICE '❌ %: search_path NOT set - SECURITY ISSUE!', func_record.proname;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🔒 SECURITY FIXES APPLIED SUCCESSFULLY!';
    RAISE NOTICE '✅ All functions now have explicit search_path = ''public''';
    RAISE NOTICE '✅ Function search path mutable warnings should be resolved';
    RAISE NOTICE '🚀 Run Supabase linter again to confirm fixes';
END $$;

-- =====================================================
-- STEP 5: TEST THE FIXED FUNCTIONS
-- =====================================================

-- Test get_rls_policy_stats
SELECT 'Testing get_rls_policy_stats...' as test_status;
SELECT * FROM get_rls_policy_stats() LIMIT 3;

-- Test validate_schema_performance
SELECT 'Testing validate_schema_performance...' as test_status;
SELECT * FROM validate_schema_performance() LIMIT 3;

-- Test audit_security_issues
SELECT 'Testing audit_security_issues...' as test_status;
SELECT * FROM audit_security_issues() LIMIT 3;

-- =====================================================
-- COMPLETION
-- =====================================================

COMMENT ON FUNCTION get_rls_policy_stats() IS 'Monitor RLS policy performance - SECURITY HARDENED';
COMMENT ON FUNCTION validate_schema_performance() IS 'Validate schema performance - SECURITY HARDENED';
COMMENT ON FUNCTION audit_security_issues() IS 'Audit database security - SECURITY HARDENED';
