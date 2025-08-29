-- ========================================
-- DIAGNOSE THE USER_ID COLUMN ISSUE
-- Run this to identify the exact problem
-- ========================================

-- Check 1: Verify we're in Supabase
SELECT 
    'Environment Check' as check_type,
    CASE 
        WHEN current_database() LIKE '%supabase%' THEN '✅ Supabase detected'
        ELSE '❌ Not Supabase: ' || current_database()
    END as result;

-- Check 2: Verify auth schema exists
SELECT 
    'Auth Schema Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.schemata 
            WHERE schema_name = 'auth'
        ) THEN '✅ Auth schema exists'
        ELSE '❌ Auth schema missing'
    END as result;

-- Check 3: Verify auth.users table exists
SELECT 
    'Auth Users Table Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'auth' AND table_name = 'users'
        ) THEN '✅ Auth.users table exists'
        ELSE '❌ Auth.users table missing'
    END as result;

-- Check 4: Check auth.users table structure
SELECT 
    'Auth Users Structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- Check 5: Test basic table creation
DO $$
BEGIN
    RAISE NOTICE 'Testing basic table creation...';
    
    -- Try to create a simple test table
    CREATE TABLE IF NOT EXISTS public.test_basic (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT
    );
    
    RAISE NOTICE '✅ Basic table creation works';
    
    -- Clean up
    DROP TABLE IF EXISTS public.test_basic;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Basic table creation failed: %', SQLERRM;
END $$;

-- Check 6: Test auth.users reference
DO $$
BEGIN
    RAISE NOTICE 'Testing auth.users reference...';
    
    -- Try to create a table with auth.users reference
    CREATE TABLE IF NOT EXISTS public.test_auth_ref (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        data TEXT
    );
    
    RAISE NOTICE '✅ Auth.users reference works';
    
    -- Clean up
    DROP TABLE IF EXISTS public.test_auth_ref;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Auth.users reference failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- Check 7: Verify current user permissions
SELECT 
    'Current User Permissions' as check_type,
    current_user as username,
    session_user as session_username,
    current_schema as current_schema;

-- Check 8: Summary
SELECT 
    'Diagnosis Summary' as summary,
    'Run the minimal schema if all checks pass' as recommendation,
    'Check Supabase project settings if auth schema is missing' as troubleshooting;
