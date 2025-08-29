-- ========================================
-- EXACT FAILURE TEST - REPLICATE THE FAILING SCHEMA
-- This tests the exact structure that's failing
-- ========================================

-- Test 1: Create the exact table structure that's failing
DO $$
BEGIN
    RAISE NOTICE 'Testing exact table structure...';
    
    -- This is the exact structure from the failing schema
    CREATE TABLE IF NOT EXISTS public.test_exact_structure (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        genre TEXT,
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ Exact structure table created successfully';
    
    -- Clean up
    DROP TABLE IF EXISTS public.test_exact_structure;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Exact structure failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
        RAISE NOTICE 'This is the exact error from your schema!';
END $$;

-- Test 2: Check if uuid_generate_v4() function exists
SELECT 
    'UUID Function Check' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc WHERE proname = 'uuid_generate_v4'
        ) THEN '✅ uuid_generate_v4 function exists'
        ELSE '❌ uuid_generate_v4 function missing'
    END as result;

-- Test 3: Check if uuid-ossp extension is available
SELECT 
    'UUID Extension Check' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
        ) THEN '✅ uuid-ossp extension available'
        ELSE '❌ uuid-ossp extension not available'
    END as result;

-- Test 4: Test the exact CREATE TABLE statement step by step
DO $$
BEGIN
    RAISE NOTICE 'Testing step by step...';
    
    -- Step 1: Just the basic table
    CREATE TABLE IF NOT EXISTS public.test_step1 (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL
    );
    RAISE NOTICE '✅ Step 1: Basic table with user_id column created';
    
    -- Step 2: Add the foreign key reference
    ALTER TABLE public.test_step1 
    ADD CONSTRAINT test_step1_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Step 2: Foreign key reference added';
    
    -- Clean up
    DROP TABLE IF EXISTS public.test_step1;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step-by-step failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
        RAISE NOTICE 'This tells us exactly where it breaks!';
END $$;

-- Test 5: Check current search path
SELECT 
    'Search Path Check' as test,
    current_setting('search_path') as current_search_path;

-- Final status
SELECT 
    'Exact failure test completed' as status,
    'Check the results above to see exactly where it breaks' as note;
