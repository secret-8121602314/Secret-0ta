-- ========================================
-- ULTRA MINIMAL TEST - ONE TABLE ONLY
-- This will help isolate the exact issue
-- ========================================

-- Test 1: Basic table without any references
CREATE TABLE IF NOT EXISTS public.test_simple (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test 2: Check if the table was created
SELECT 
    'Test 1 Result' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'test_simple'
        ) THEN '✅ Basic table created successfully'
        ELSE '❌ Basic table creation failed'
    END as result;

-- Test 3: Try to create a table with auth.users reference
DO $$
BEGIN
    RAISE NOTICE 'Attempting to create table with auth.users reference...';
    
    CREATE TABLE IF NOT EXISTS public.test_auth (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        data TEXT
    );
    
    RAISE NOTICE '✅ Auth reference table created successfully';
    
    -- Clean up
    DROP TABLE IF EXISTS public.test_auth;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Auth reference table failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
        RAISE NOTICE 'Error detail: %', SQLERRM;
END $$;

-- Test 4: Check what schemas exist
SELECT 
    'Available Schemas' as info,
    schema_name,
    schema_owner
FROM information_schema.schemata
ORDER BY schema_name;

-- Test 5: Check if we can see auth.users
SELECT 
    'Auth Users Check' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'auth' AND table_name = 'users'
        ) THEN '✅ auth.users table exists'
        ELSE '❌ auth.users table does not exist'
    END as result;

-- Test 6: Clean up
DROP TABLE IF EXISTS public.test_simple;

-- Final status
SELECT 
    'Ultra minimal test completed' as status,
    'Check the results above to identify the issue' as next_step;
