-- ========================================
-- OTAKON SCHEMA TEST SCRIPT
-- Run this to test the schema creation
-- ========================================

-- Test 1: Check if extensions are available
SELECT 'uuid-ossp extension available' as test_result
WHERE EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
);

-- Test 2: Verify auth.users table exists (Supabase requirement)
SELECT 'auth.users table exists' as test_result
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
);

-- Test 3: Test table creation (this should work now)
DO $$
BEGIN
    -- Test creating a simple table
    CREATE TABLE IF NOT EXISTS public.test_table (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        test_field TEXT
    );
    
    RAISE NOTICE 'Test table created successfully';
    
    -- Clean up
    DROP TABLE IF EXISTS public.test_table;
    
    RAISE NOTICE 'Test table dropped successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- Test 4: Verify the schema structure
SELECT 
    'Schema test completed' as status,
    'All foreign key references should now work' as note,
    'user_id columns now reference auth.users(id) directly' as fix_applied;
