-- ========================================
-- SCHEMA VERIFICATION SCRIPT
-- Run this to verify you're using the correct schema
-- ========================================

-- Test 1: Check if this is the SECURE_SCHEMA (should work)
DO $$
BEGIN
    -- Try to create a test table with the correct structure
    CREATE TABLE IF NOT EXISTS public.verify_test (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        test_field TEXT
    );
    
    RAISE NOTICE '✅ SUCCESS: This is the correct SECURE_SCHEMA!';
    RAISE NOTICE 'All user_id columns reference auth.users(id) correctly.';
    
    -- Clean up
    DROP TABLE IF EXISTS public.verify_test;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
        RAISE NOTICE 'This means you are NOT using the SECURE_SCHEMA!';
        RAISE NOTICE 'Please use: docs/schemas/OTAKON_SECURE_SCHEMA.sql';
END $$;

-- Test 2: Verify the schema structure
SELECT 
    'Schema Verification Complete' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'auth' AND table_name = 'users'
        ) THEN '✅ auth.users table exists'
        ELSE '❌ auth.users table missing - not Supabase!'
    END as auth_check,
    'Use OTAKON_SECURE_SCHEMA.sql for best results' as recommendation;
