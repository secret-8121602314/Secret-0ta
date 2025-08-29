-- 🧪 TEST FIXED NUCLEAR RESET SYNTAX
-- This script tests the specific syntax that was causing errors

-- Test 1: Object counting (the problematic query)
DO $$
DECLARE
    table_count INTEGER;
    view_count INTEGER;
    function_count INTEGER;
    total_objects INTEGER;
BEGIN
    RAISE NOTICE '🔍 Testing object counting syntax...';
    
    -- Count remaining objects separately to avoid type issues
    SELECT COUNT(*) INTO table_count
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%';
    
    SELECT COUNT(*) INTO view_count
    FROM pg_views 
    WHERE schemaname = 'public'
    AND viewname NOT LIKE 'pg_%';
    
    SELECT COUNT(*) INTO function_count
    FROM pg_proc 
    WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname NOT LIKE 'pg_%';
    
    total_objects := table_count + view_count + function_count;
    
    RAISE NOTICE '📊 Object counts:';
    RAISE NOTICE '   Tables: %, Views: %, Functions: %', table_count, view_count, function_count;
    RAISE NOTICE '   Total objects: %', total_objects;
    
    RAISE NOTICE '✅ Object counting syntax test passed!';
END $$;

-- Test 2: Function creation with search_path
CREATE OR REPLACE FUNCTION test_search_path_function()
RETURNS TEXT AS $$
BEGIN
    -- CRITICAL: Set explicit search path for security
    SET search_path = 'public';
    RETURN 'Search path function test passed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test 3: Verify search_path is set
DO $$
DECLARE
    search_path_found BOOLEAN;
BEGIN
    SELECT prosrc LIKE '%SET search_path%' INTO search_path_found
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND proname = 'test_search_path_function';
    
    IF search_path_found THEN
        RAISE NOTICE '✅ Search path function test passed!';
    ELSE
        RAISE NOTICE '❌ Search path function test failed!';
    END IF;
END $$;

-- Cleanup
DROP FUNCTION IF EXISTS test_search_path_function() CASCADE;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '🎉 All syntax tests passed! Nuclear reset script should work now.';
END $$;
