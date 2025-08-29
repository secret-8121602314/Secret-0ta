-- 🧪 TEST SIMPLE FUNCTION WITH SEARCH PATH
-- This is a minimal test to verify the search path approach works

-- Drop if exists
DROP FUNCTION IF EXISTS test_simple_function() CASCADE;

-- Create simple test function
CREATE OR REPLACE FUNCTION test_simple_function()
RETURNS TEXT AS $$
BEGIN
    -- Set explicit search path for security
    SET search_path = 'public';
    
    RETURN 'Function executed successfully with secure search path';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT test_simple_function() as result;

-- Verify search path is set
SELECT 
    proname,
    CASE 
        WHEN prosrc LIKE '%SET search_path%' THEN '✅ SECURE'
        ELSE '❌ INSECURE'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname = 'test_simple_function';

-- Clean up
DROP FUNCTION IF EXISTS test_simple_function() CASCADE;
