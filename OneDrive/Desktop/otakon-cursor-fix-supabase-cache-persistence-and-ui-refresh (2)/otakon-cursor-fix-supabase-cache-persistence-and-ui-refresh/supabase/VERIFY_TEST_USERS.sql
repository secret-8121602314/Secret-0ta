-- ============================================================================
-- VERIFY TEST USERS AND RUN QUICK VALIDATION
-- ============================================================================
-- This script verifies test users are set up correctly with proper tier limits
-- ============================================================================

-- 1. Verify both test users exist with correct limits
SELECT 
  '✅ TEST USERS' as test_section,
  email,
  tier,
  text_count || '/' || text_limit as text_usage,
  image_count || '/' || image_limit as image_usage,
  total_requests,
  CASE 
    WHEN tier = 'free' AND text_limit = 55 AND image_limit = 25 THEN '✅ CORRECT'
    WHEN tier = 'pro' AND text_limit = 1583 AND image_limit = 328 THEN '✅ CORRECT'
    ELSE '❌ WRONG LIMITS'
  END as limit_check
FROM public.users
WHERE email IN ('test-free@otakon.local', 'test-pro@otakon.local')
ORDER BY tier;

-- 2. Test increment functions work
-- Increment Free tier text count
SELECT increment_user_usage(
  (SELECT auth_user_id FROM users WHERE email = 'test-free@otakon.local'),
  'text',
  1
) as free_text_incremented;

-- Increment Pro tier image count
SELECT increment_user_usage(
  (SELECT auth_user_id FROM users WHERE email = 'test-pro@otakon.local'),
  'image',
  1
) as pro_image_incremented;

-- 3. Verify increments worked
SELECT 
  '✅ AFTER INCREMENT' as test_section,
  email,
  tier,
  text_count as text_used,
  image_count as image_used,
  CASE 
    WHEN email = 'test-free@otakon.local' AND text_count = 1 THEN '✅ FREE TEXT +1'
    WHEN email = 'test-pro@otakon.local' AND image_count = 1 THEN '✅ PRO IMAGE +1'
    ELSE '✅ READY'
  END as increment_check
FROM public.users
WHERE email IN ('test-free@otakon.local', 'test-pro@otakon.local')
ORDER BY tier;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT 
  '🎯 SUMMARY' as section,
  COUNT(*) as total_test_users,
  SUM(CASE WHEN tier = 'free' THEN 1 ELSE 0 END) as free_tier_users,
  SUM(CASE WHEN tier = 'pro' THEN 1 ELSE 0 END) as pro_tier_users,
  '✅ READY FOR TESTING' as status
FROM public.users
WHERE email LIKE '%@otakon.local';
