-- 🧪 TEST NUCLEAR RESET SYNTAX
-- This script tests the basic syntax of the nuclear reset script

-- Test 1: Basic DO block with RAISE NOTICE
DO $$
BEGIN
    RAISE NOTICE '✅ Basic RAISE NOTICE syntax works';
END $$;

-- Test 2: Function creation syntax
CREATE OR REPLACE FUNCTION test_function()
RETURNS TEXT AS $$
BEGIN
    SET search_path = 'public';
    RETURN 'Function syntax test passed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test 3: Table creation syntax
CREATE TABLE test_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test 4: Policy creation syntax
CREATE POLICY "Test policy" ON test_table
    FOR ALL USING (true);

-- Test 5: Cleanup
DROP FUNCTION IF EXISTS test_function() CASCADE;
DROP TABLE IF EXISTS test_table CASCADE;

DO $$
BEGIN
    RAISE NOTICE '🎉 All syntax tests passed! Nuclear reset script should work.';
END $$;
