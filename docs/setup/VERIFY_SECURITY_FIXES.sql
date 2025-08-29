-- 🔍 VERIFY SECURITY FIXES APPLIED
-- This script verifies that all function search path security issues are resolved

-- =====================================================
-- STEP 1: CHECK FUNCTION SEARCH PATH SETTINGS
-- =====================================================

SELECT 
    'Function Search Path Check' as check_type,
    proname as function_name,
    CASE 
        WHEN prosrc LIKE '%SET search_path%' THEN '✅ SECURE'
        ELSE '❌ INSECURE'
    END as security_status,
    CASE 
        WHEN prosrc LIKE '%SET search_path%' THEN 'Explicit search path set'
        ELSE 'No explicit search path - SECURITY RISK'
    END as details
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('get_rls_policy_stats', 'validate_schema_performance', 'audit_security_issues')
ORDER BY proname;

-- =====================================================
-- STEP 2: TEST FUNCTION EXECUTION
-- =====================================================

-- Test 1: get_rls_policy_stats
SELECT 'Testing get_rls_policy_stats...' as test_name;
SELECT 
    table_name,
    policy_name,
    policy_type
FROM get_rls_policy_stats() 
LIMIT 3;

-- Test 2: validate_schema_performance
SELECT 'Testing validate_schema_performance...' as test_name;
SELECT 
    check_type,
    table_name,
    severity
FROM validate_schema_performance() 
LIMIT 3;

-- Test 3: audit_security_issues
SELECT 'Testing audit_security_issues...' as test_name;
SELECT 
    issue_type,
    object_name,
    severity
FROM audit_security_issues() 
LIMIT 3;

-- =====================================================
-- STEP 3: VERIFY SECURITY SETTINGS
-- =====================================================

-- Check if functions are SECURITY DEFINER
SELECT 
    'Security Definer Check' as check_type,
    proname as function_name,
    CASE 
        WHEN prosecdef THEN '✅ SECURITY DEFINER'
        ELSE '❌ SECURITY INVOKER'
    END as security_setting,
    'Functions should be SECURITY DEFINER for proper access control' as note
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('get_rls_policy_stats', 'validate_schema_performance', 'audit_security_issues')
ORDER BY proname;

-- =====================================================
-- STEP 4: FINAL SECURITY STATUS
-- =====================================================

DO $$
DECLARE
    secure_count INTEGER := 0;
    total_count INTEGER := 0;
BEGIN
    -- Count secure functions
    SELECT COUNT(*) INTO secure_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND proname IN ('get_rls_policy_stats', 'validate_schema_performance', 'audit_security_issues')
    AND prosrc LIKE '%SET search_path%';
    
    -- Count total functions
    SELECT COUNT(*) INTO total_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND proname IN ('get_rls_policy_stats', 'validate_schema_performance', 'audit_security_issues');
    
    IF secure_count = total_count AND total_count > 0 THEN
        RAISE NOTICE '🎉 ALL SECURITY ISSUES RESOLVED!';
        RAISE NOTICE '✅ %/% functions are now secure', secure_count, total_count;
        RAISE NOTICE '🔒 Function search path mutable warnings should be gone';
        RAISE NOTICE '🚀 Run Supabase linter again to confirm';
    ELSE
        RAISE NOTICE '⚠️  SECURITY ISSUES STILL EXIST';
        RAISE NOTICE '❌ %/% functions are secure', secure_count, total_count;
        RAISE NOTICE '🔧 Run the security fix script again';
    END IF;
END $$;
