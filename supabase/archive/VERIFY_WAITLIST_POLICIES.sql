-- VERIFY WAITLIST POLICIES
-- Run this script to check the current state of waitlist policies
-- and verify that the multiple permissive policies issue is resolved

-- Check all current policies on waitlist table
SELECT 
    'CURRENT POLICIES' as status,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'waitlist'
ORDER BY policyname;

-- Count policies by action type
SELECT 
    'POLICY COUNT BY ACTION' as status,
    cmd as action,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'waitlist'
GROUP BY cmd
ORDER BY cmd;

-- Check for multiple permissive policies (this should return 0 rows if fixed)
SELECT 
    'MULTIPLE PERMISSIVE POLICIES CHECK' as status,
    cmd as action,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 1 THEN 'WARNING: Multiple policies found!'
        ELSE 'OK: Single policy per action'
    END as status_check
FROM pg_policies 
WHERE tablename = 'waitlist' 
AND permissive = true
GROUP BY cmd
HAVING COUNT(*) > 1
ORDER BY cmd;

-- Test table access
SELECT 
    'ACCESS TEST' as status,
    COUNT(*) as waitlist_count,
    'Table accessible' as access_status
FROM public.waitlist;

-- Final summary
SELECT 
    'SUMMARY' as status,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    CASE 
        WHEN COUNT(*) = 2 AND 
             COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) = 1 AND
             COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) = 1 
        THEN 'SUCCESS: Exactly 2 policies (1 SELECT, 1 INSERT)'
        ELSE 'ISSUE: Expected 2 policies (1 SELECT, 1 INSERT)'
    END as final_status
FROM pg_policies 
WHERE tablename = 'waitlist';
