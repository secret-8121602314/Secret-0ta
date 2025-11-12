-- ============================================================================
-- CREATE TEST USERS FOR TIER LIMIT VERIFICATION
-- ============================================================================
-- Run this script in Supabase SQL Editor to create test users
-- This creates auth users first, then public.users entries
-- ============================================================================

-- STEP 1: Create auth users (requires admin privileges)
-- These are dummy auth entries for testing purposes
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test-free@otakon.local',
  crypt('test-password-free', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
), (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test-pro@otakon.local',
  crypt('test-password-pro', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- STEP 2: Create corresponding public.users entries

-- Test User 1: Free Tier (55 text + 25 image queries/month)
INSERT INTO public.users (
  auth_user_id,
  email,
  full_name,
  tier,
  text_count,
  text_limit,
  image_count,
  image_limit,
  total_requests,
  last_reset,
  has_seen_splash_screens,
  has_seen_how_to_use,
  has_seen_features_connected,
  onboarding_completed,
  has_welcome_message,
  is_new_user,
  has_used_trial,
  profile_data
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test-free@otakon.local',
  'Free Test User',
  'free',
  0,
  55,
  0,
  25,
  0,
  NOW(),
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  '{"persona": "balanced", "avatar": "default", "displayName": "Free Test User"}'::jsonb
) ON CONFLICT (auth_user_id) DO UPDATE SET
  email = EXCLUDED.email,
  tier = EXCLUDED.tier,
  text_limit = EXCLUDED.text_limit,
  image_limit = EXCLUDED.image_limit,
  text_count = 0,
  image_count = 0,
  updated_at = NOW();

-- Test User 2: Pro Tier (1583 text + 328 image queries/month)
INSERT INTO public.users (
  auth_user_id,
  email,
  full_name,
  tier,
  text_count,
  text_limit,
  image_count,
  image_limit,
  total_requests,
  last_reset,
  has_seen_splash_screens,
  has_seen_how_to_use,
  has_seen_features_connected,
  has_seen_pro_features,
  onboarding_completed,
  has_welcome_message,
  is_new_user,
  has_used_trial,
  profile_data
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'test-pro@otakon.local',
  'Pro Test User',
  'pro',
  0,
  1583,
  0,
  328,
  0,
  NOW(),
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  '{"persona": "strategic", "avatar": "premium", "displayName": "Pro Test User"}'::jsonb
) ON CONFLICT (auth_user_id) DO UPDATE SET
  email = EXCLUDED.email,
  tier = EXCLUDED.tier,
  text_limit = EXCLUDED.text_limit,
  image_limit = EXCLUDED.image_limit,
  text_count = 0,
  image_count = 0,
  updated_at = NOW();

-- ============================================================================
-- VERIFY TEST USERS CREATED
-- ============================================================================

SELECT 
  email,
  tier,
  text_count,
  text_limit,
  image_count,
  image_limit,
  total_requests,
  created_at
FROM public.users
WHERE email IN ('test-free@otakon.local', 'test-pro@otakon.local')
ORDER BY tier;

-- ============================================================================
-- TEST USAGE INCREMENT FUNCTIONS
-- ============================================================================

-- Test Free tier text increment
SELECT increment_user_usage(
  (SELECT auth_user_id FROM users WHERE email = 'test-free@otakon.local'),
  'text',
  1
);

-- Verify Free tier count increased
SELECT email, tier, text_count, text_limit 
FROM users 
WHERE email = 'test-free@otakon.local';

-- Test Pro tier image increment  
SELECT increment_user_usage(
  (SELECT auth_user_id FROM users WHERE email = 'test-pro@otakon.local'),
  'image',
  1
);

-- Verify Pro tier count increased
SELECT email, tier, image_count, image_limit
FROM users
WHERE email = 'test-pro@otakon.local';

-- ============================================================================
-- TEST LIMIT ENFORCEMENT (Run these to test reaching limits)
-- ============================================================================

-- Simulate Free tier reaching text limit (55 queries)
UPDATE users 
SET text_count = 54
WHERE email = 'test-free@otakon.local';

-- This should work (54 -> 55, at limit)
SELECT increment_user_usage(
  (SELECT auth_user_id FROM users WHERE email = 'test-free@otakon.local'),
  'text',
  1
);

-- This should fail or warn (55 -> 56, over limit)
SELECT increment_user_usage(
  (SELECT auth_user_id FROM users WHERE email = 'test-free@otakon.local'),
  'text',
  1
);

-- Check if at limit
SELECT 
  email,
  tier,
  text_count,
  text_limit,
  CASE 
    WHEN text_count >= text_limit THEN '🚫 AT LIMIT'
    ELSE '✅ UNDER LIMIT'
  END as status
FROM users
WHERE email = 'test-free@otakon.local';

-- Simulate Pro tier reaching text limit (1583 queries)
UPDATE users 
SET text_count = 1582
WHERE email = 'test-pro@otakon.local';

-- This should work (1582 -> 1583, at limit)
SELECT increment_user_usage(
  (SELECT auth_user_id FROM users WHERE email = 'test-pro@otakon.local'),
  'text',
  1
);

-- This should fail or warn (1583 -> 1584, over limit)
SELECT increment_user_usage(
  (SELECT auth_user_id FROM users WHERE email = 'test-pro@otakon.local'),
  'text',
  1
);

-- Check if at limit
SELECT 
  email,
  tier,
  text_count,
  text_limit,
  CASE 
    WHEN text_count >= text_limit THEN '🚫 AT LIMIT'
    ELSE '✅ UNDER LIMIT'
  END as status
FROM users
WHERE email = 'test-pro@otakon.local';

-- ============================================================================
-- TEST MONTHLY RESET
-- ============================================================================

-- Test reset function (should reset both users to 0)
SELECT reset_monthly_usage();

-- Verify counts reset to 0
SELECT 
  email,
  tier,
  text_count,
  image_count,
  last_reset
FROM users
WHERE email IN ('test-free@otakon.local', 'test-pro@otakon.local')
ORDER BY tier;

-- ============================================================================
-- CLEANUP (Run this to remove test users when done)
-- ============================================================================

-- Remove from public.users first (due to foreign key)
-- DELETE FROM public.users 
-- WHERE email IN ('test-free@otakon.local', 'test-pro@otakon.local');

-- Then remove from auth.users
-- DELETE FROM auth.users
-- WHERE email IN ('test-free@otakon.local', 'test-pro@otakon.local');

-- Verify deletion
-- SELECT COUNT(*) as remaining_test_users_public
-- FROM public.users
-- WHERE email LIKE '%@otakon.local';

-- SELECT COUNT(*) as remaining_test_users_auth
-- FROM auth.users
-- WHERE email LIKE '%@otakon.local';
