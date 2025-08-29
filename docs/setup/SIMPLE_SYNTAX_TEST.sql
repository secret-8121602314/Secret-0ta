-- 🧪 SIMPLE SYNTAX TEST
-- Basic test to verify PostgreSQL syntax works

-- Test 1: Basic DO block
DO $$
BEGIN
    RAISE NOTICE '✅ Basic DO block syntax works';
END $$;

-- Test 2: Simple function creation
CREATE OR REPLACE FUNCTION simple_test()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Function creation works';
END;
$$ LANGUAGE plpgsql;

-- Test 3: Simple table creation
CREATE TABLE simple_test_table (
    id SERIAL PRIMARY KEY,
    name TEXT
);

-- Test 4: Cleanup
DROP FUNCTION IF EXISTS simple_test() CASCADE;
DROP TABLE IF EXISTS simple_test_table CASCADE;

-- Test 5: Final success
DO $$
BEGIN
    RAISE NOTICE '🎉 All basic syntax tests passed!';
END $$;
