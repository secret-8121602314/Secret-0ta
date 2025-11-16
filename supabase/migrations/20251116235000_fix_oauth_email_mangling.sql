-- Fix OAuth Email Mangling
-- Issue: OAuth users have emails stored as "provider_email@example.com" instead of real emails
-- Solution: Extract real emails from auth.users and update public.users table

-- Step 1: Update users table with real emails from auth.users
UPDATE public.users u
SET 
  email = au.email,
  updated_at = NOW()
FROM auth.users au
WHERE u.auth_user_id = au.id
  AND (
    u.email LIKE 'google_%'
    OR u.email LIKE 'discord_%'
    OR u.email LIKE 'github_%'
    OR u.email LIKE 'facebook_%'
    OR u.email LIKE 'twitter_%'
    OR u.email LIKE 'apple_%'
  );

-- Step 2: Log the fix
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % OAuth email records', v_updated_count;
END $$;
