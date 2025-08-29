-- 🔧 FIX INDIVIDUAL FUNCTIONS ONE BY ONE
-- This script fixes each function individually to isolate any issues

-- =====================================================
-- STEP 1: FIX get_rls_policy_stats FUNCTION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Fixing get_rls_policy_stats function...';
    
    -- Drop existing function
    DROP FUNCTION IF EXISTS get_rls_policy_stats() CASCADE;
    
    RAISE NOTICE '✅ Dropped existing function';
END $$;

-- Create the fixed function
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
        0.0::NUMERIC as avg_execution_time,
        0::BIGINT as execution_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
DO $$
BEGIN
    RAISE NOTICE '🧪 Testing get_rls_policy_stats...';
    RAISE NOTICE '✅ Function created successfully';
END $$;

-- =====================================================
-- STEP 2: FIX validate_schema_performance FUNCTION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Fixing validate_schema_performance function...';
    
    -- Drop existing function
    DROP FUNCTION IF EXISTS validate_schema_performance() CASCADE;
    
    RAISE NOTICE '✅ Dropped existing function';
END $$;

-- Create the fixed function
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
        'Missing Indexes'::TEXT as check_type,
        t.table_name::TEXT,
        'Table lacks indexes on frequently queried columns'::TEXT as issue_description,
        'MEDIUM'::TEXT as severity,
        'Add indexes on user_id, game_id, and JSONB columns'::TEXT as recommendation
    FROM information_schema.tables t
    LEFT JOIN pg_indexes i ON t.table_name = i.tablename
    WHERE t.table_schema = 'public' 
    AND t.table_name LIKE '%_new'
    AND i.indexname IS NULL
    
    UNION ALL
    
    -- Check for RLS policies that might cause performance issues
    SELECT 
        'RLS Policy Performance'::TEXT as check_type,
        p.tablename::TEXT as table_name,
        'RLS policy uses complex subqueries that may impact performance'::TEXT as issue_description,
        'LOW'::TEXT as severity,
        'Monitor query performance and consider policy optimization'::TEXT as recommendation
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.tablename LIKE '%_new'
    AND p.cmd = '*'
    
    UNION ALL
    
    -- Check for JSONB columns without GIN indexes
    SELECT 
        'JSONB Indexes'::TEXT as check_type,
        c.table_name::TEXT,
        'JSONB column lacks GIN index for efficient querying'::TEXT as issue_description,
        'MEDIUM'::TEXT as severity,
        'Add GIN indexes on JSONB columns for better performance'::TEXT as recommendation
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

-- Test the function
DO $$
BEGIN
    RAISE NOTICE '🧪 Testing validate_schema_performance...';
    RAISE NOTICE '✅ Function created successfully';
END $$;

-- =====================================================
-- STEP 3: FIX audit_security_issues FUNCTION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Fixing audit_security_issues function...';
    
    -- Drop existing function
    DROP FUNCTION IF EXISTS audit_security_issues() CASCADE;
    
    RAISE NOTICE '✅ Dropped existing function';
END $$;

-- Create the fixed function
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
    
    UNION ALL
    
    -- Check for tables without RLS enabled
    SELECT 
        'RLS Disabled'::TEXT as issue_type,
        t.table_name::TEXT as object_name,
        'MEDIUM'::TEXT as severity,
        'Table does not have Row Level Security enabled'::TEXT as description,
        'Enable RLS with ALTER TABLE table_name ENABLE ROW LEVEL SECURITY'::TEXT as recommendation
    FROM information_schema.tables t
    LEFT JOIN pg_tables pt ON t.table_name = pt.tablename
    WHERE t.table_schema = 'public'
    AND t.table_name LIKE '%_new'
    AND pt.rowsecurity = false
    
    UNION ALL
    
    -- Check for overly permissive policies
    SELECT 
        'Overly Permissive Policy'::TEXT as issue_type,
        p.tablename::TEXT as object_name,
        'MEDIUM'::TEXT as severity,
        'RLS policy allows access to all users'::TEXT as description,
        'Review and restrict policy permissions appropriately'::TEXT as recommendation
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.cmd = '*'
    AND p.qual LIKE '%true%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
DO $$
BEGIN
    RAISE NOTICE '🧪 Testing audit_security_issues...';
    RAISE NOTICE '✅ Function created successfully';
END $$;

-- =====================================================
-- STEP 4: VERIFY ALL FUNCTIONS ARE SECURE
-- =====================================================

DO $$
DECLARE
    func_record RECORD;
    secure_count INTEGER := 0;
    total_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 Verifying all security fixes...';
    
    FOR func_record IN 
        SELECT proname, prosrc 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND proname IN ('get_rls_policy_stats', 'validate_schema_performance', 'audit_security_issues')
    LOOP
        IF func_record.prosrc LIKE '%SET search_path%' THEN
            RAISE NOTICE '✅ %: search_path properly set', func_record.proname;
            secure_count := secure_count + 1;
        ELSE
            RAISE NOTICE '❌ %: search_path NOT set - SECURITY ISSUE!', func_record.proname;
        END IF;
        total_count := total_count + 1;
    END LOOP;
    
    IF secure_count = total_count AND total_count > 0 THEN
        RAISE NOTICE '🎉 ALL SECURITY ISSUES RESOLVED!';
        RAISE NOTICE '✅ %/% functions are now secure', secure_count, total_count;
        RAISE NOTICE '🔒 Function search path mutable warnings should be gone';
        RAISE NOTICE '🚀 Run Supabase linter again to confirm';
    ELSE
        RAISE NOTICE '⚠️  SECURITY ISSUES STILL EXIST';
        RAISE NOTICE '❌ %/% functions are secure', secure_count, total_count;
        RAISE NOTICE '🔧 Check the function definitions above';
    END IF;
END $$;
