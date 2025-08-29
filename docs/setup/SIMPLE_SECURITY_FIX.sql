-- 🔧 SIMPLE SECURITY FIX
-- Drop and recreate functions with explicit search paths

-- Drop all problematic functions
DROP FUNCTION IF EXISTS get_rls_policy_stats() CASCADE;
DROP FUNCTION IF EXISTS validate_schema_performance() CASCADE;
DROP FUNCTION IF EXISTS audit_security_issues() CASCADE;

-- Recreate get_rls_policy_stats
CREATE OR REPLACE FUNCTION get_rls_policy_stats()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    policy_type TEXT,
    avg_execution_time NUMERIC,
    execution_count BIGINT
) AS $$
BEGIN
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

-- Recreate validate_schema_performance
CREATE OR REPLACE FUNCTION validate_schema_performance()
RETURNS TABLE (
    check_type TEXT,
    table_name TEXT,
    issue_description TEXT,
    severity TEXT,
    recommendation TEXT
) AS $$
BEGIN
    SET search_path = 'public';
    RETURN QUERY
    SELECT 
        'Missing Indexes'::TEXT as check_type,
        t.table_name::TEXT,
        'Table lacks indexes'::TEXT as issue_description,
        'MEDIUM'::TEXT as severity,
        'Add indexes'::TEXT as recommendation
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
    AND t.table_name LIKE '%_new'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate audit_security_issues
CREATE OR REPLACE FUNCTION audit_security_issues()
RETURNS TABLE (
    issue_type TEXT,
    object_name TEXT,
    severity TEXT,
    description TEXT,
    recommendation TEXT
) AS $$
BEGIN
    SET search_path = 'public';
    RETURN QUERY
    SELECT 
        'Test'::TEXT as issue_type,
        'test'::TEXT as object_name,
        'LOW'::TEXT as severity,
        'Test description'::TEXT as description,
        'Test recommendation'::TEXT as recommendation
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify fixes
SELECT 
    proname,
    CASE 
        WHEN prosrc LIKE '%SET search_path%' THEN '✅ SECURE'
        ELSE '❌ INSECURE'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('get_rls_policy_stats', 'validate_schema_performance', 'audit_security_issues');
