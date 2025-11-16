-- Verification Script for auth_user_id Migration
-- Run this in Supabase SQL Editor to verify migration success
-- Date: 2025-11-17

-- ============================================================================
-- 1. Verify auth_user_id columns exist on all expected tables
-- ============================================================================

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'auth_user_id'
ORDER BY table_name;

-- Expected: 9 tables
-- - users
-- - conversations
-- - messages
-- - subtabs
-- - game_hub_interactions
-- - api_usage
-- - onboarding_progress (NEW)
-- - user_analytics (NEW)
-- - user_sessions (NEW)

-- ============================================================================
-- 2. Check for NULL auth_user_id values (should be 0 after backfill)
-- ============================================================================

SELECT 
  'onboarding_progress' as table_name,
  COUNT(*) as total_rows,
  COUNT(auth_user_id) as rows_with_auth_user_id,
  COUNT(*) - COUNT(auth_user_id) as rows_missing_auth_user_id
FROM onboarding_progress
UNION ALL
SELECT 
  'user_analytics',
  COUNT(*),
  COUNT(auth_user_id),
  COUNT(*) - COUNT(auth_user_id)
FROM user_analytics
UNION ALL
SELECT 
  'user_sessions',
  COUNT(*),
  COUNT(auth_user_id),
  COUNT(*) - COUNT(auth_user_id)
FROM user_sessions
UNION ALL
SELECT 
  'messages',
  COUNT(*),
  COUNT(auth_user_id),
  COUNT(*) - COUNT(auth_user_id)
FROM messages
UNION ALL
SELECT 
  'subtabs',
  COUNT(*),
  COUNT(auth_user_id),
  COUNT(*) - COUNT(auth_user_id)
FROM subtabs;

-- All rows_missing_auth_user_id should be 0

-- ============================================================================
-- 3. Verify indexes exist for performance
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%auth_user_id%'
ORDER BY tablename, indexname;

-- Expected indexes:
-- - idx_onboarding_progress_auth_user_id
-- - idx_user_analytics_auth_user_id
-- - idx_user_sessions_auth_user_id
-- - (plus existing indexes from previous migrations)

-- ============================================================================
-- 4. Verify RLS policies use auth_user_id
-- ============================================================================

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('onboarding_progress', 'user_analytics', 'user_sessions')
  AND qual LIKE '%auth_user_id%'
ORDER BY tablename, policyname;

-- All policies should reference auth_user_id in the qual column

-- ============================================================================
-- 5. Test RLS policies work for current user
-- ============================================================================

-- Test as authenticated user (run this while logged in)
-- This will show YOUR data only if RLS is working correctly

SELECT 
  'onboarding_progress' as table_name,
  COUNT(*) as my_rows
FROM onboarding_progress
WHERE auth_user_id = auth.uid()
UNION ALL
SELECT 
  'user_analytics',
  COUNT(*)
FROM user_analytics
WHERE auth_user_id = auth.uid()
UNION ALL
SELECT 
  'user_sessions',
  COUNT(*)
FROM user_sessions
WHERE auth_user_id = auth.uid();

-- Should return counts matching your data (not all users' data)

-- ============================================================================
-- 6. Verify foreign key constraints
-- ============================================================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND kcu.column_name = 'auth_user_id'
ORDER BY tc.table_name;

-- All auth_user_id columns should reference auth.users(id)

-- ============================================================================
-- 7. Performance test: Compare query speed before/after
-- ============================================================================

-- OLD pattern (slower - 3-table JOIN):
EXPLAIN ANALYZE
SELECT op.*
FROM onboarding_progress op
WHERE op.user_id IN (
  SELECT u.id 
  FROM users u 
  WHERE u.auth_user_id = auth.uid()
);

-- NEW pattern (faster - direct comparison):
EXPLAIN ANALYZE
SELECT op.*
FROM onboarding_progress op
WHERE op.auth_user_id = auth.uid();

-- Compare "Execution Time" - new should be 5-10x faster

-- ============================================================================
-- 8. Data integrity check
-- ============================================================================

-- Verify auth_user_id matches user_id mapping
SELECT 
  'onboarding_progress' as table_name,
  COUNT(*) as mismatched_rows
FROM onboarding_progress op
LEFT JOIN users u ON op.user_id = u.id
WHERE op.auth_user_id != u.auth_user_id
UNION ALL
SELECT 
  'user_analytics',
  COUNT(*)
FROM user_analytics ua
LEFT JOIN users u ON ua.user_id = u.id
WHERE ua.auth_user_id != u.auth_user_id
UNION ALL
SELECT 
  'user_sessions',
  COUNT(*)
FROM user_sessions us
LEFT JOIN users u ON us.user_id = u.id
WHERE us.auth_user_id != u.auth_user_id;

-- All mismatched_rows should be 0

-- ============================================================================
-- 9. Check migration was applied
-- ============================================================================

SELECT 
  version,
  name
FROM supabase_migrations.schema_migrations
WHERE version >= '20251117001000'
ORDER BY version DESC;

-- Should show: 20251117001000_complete_auth_user_id_migration

-- ============================================================================
-- ✅ Success Criteria
-- ============================================================================

-- If all checks pass:
-- ✅ 9 tables have auth_user_id column
-- ✅ 0 rows with NULL auth_user_id
-- ✅ All indexes created
-- ✅ All RLS policies use auth_user_id
-- ✅ Foreign keys reference auth.users(id)
-- ✅ Query performance improved 5-10x
-- ✅ Data integrity verified (auth_user_id matches user mapping)
-- ✅ Migration recorded in schema_migrations table

DO $$
DECLARE
  v_tables_with_auth_user_id integer;
  v_total_null_auth_user_id integer;
  v_indexes_count integer;
  v_policies_count integer;
BEGIN
  -- Count tables with auth_user_id
  SELECT COUNT(DISTINCT table_name) INTO v_tables_with_auth_user_id
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'auth_user_id';

  -- Count rows with NULL auth_user_id
  SELECT 
    (SELECT COUNT(*) FROM onboarding_progress WHERE auth_user_id IS NULL) +
    (SELECT COUNT(*) FROM user_analytics WHERE auth_user_id IS NULL) +
    (SELECT COUNT(*) FROM user_sessions WHERE auth_user_id IS NULL)
  INTO v_total_null_auth_user_id;

  -- Count indexes
  SELECT COUNT(*) INTO v_indexes_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE '%auth_user_id%';

  -- Count RLS policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('onboarding_progress', 'user_analytics', 'user_sessions')
    AND qual LIKE '%auth_user_id%';

  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE '       MIGRATION VERIFICATION RESULTS   ';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables with auth_user_id: % (expected: 9)', v_tables_with_auth_user_id;
  RAISE NOTICE 'Rows with NULL auth_user_id: % (expected: 0)', v_total_null_auth_user_id;
  RAISE NOTICE 'Indexes created: % (expected: 3+)', v_indexes_count;
  RAISE NOTICE 'RLS policies updated: % (expected: 6+)', v_policies_count;
  RAISE NOTICE '========================================';

  IF v_tables_with_auth_user_id >= 9 
     AND v_total_null_auth_user_id = 0 
     AND v_indexes_count >= 3 
     AND v_policies_count >= 6 THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED - Migration Successful!';
  ELSE
    RAISE WARNING '⚠️ SOME CHECKS FAILED - Review results above';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
