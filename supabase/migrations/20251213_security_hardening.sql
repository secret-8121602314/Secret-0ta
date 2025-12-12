-- Security Hardening: Credit Limits and Tier Protection
-- Created: December 13, 2025
-- Purpose: Add CHECK constraints and RLS policy to prevent credit/tier manipulation

-- ============================================================================
-- RECOMMENDATION #1: Add CHECK constraints for credit limits
-- Prevents database-level bypass where usage exceeds limits
-- ============================================================================

ALTER TABLE public.users
ADD CONSTRAINT check_text_count_within_limit 
CHECK (text_count <= text_limit);

ALTER TABLE public.users
ADD CONSTRAINT check_image_count_within_limit 
CHECK (image_count <= image_limit);

COMMENT ON CONSTRAINT check_text_count_within_limit ON public.users IS 
'Ensures text_count never exceeds text_limit at database level';

COMMENT ON CONSTRAINT check_image_count_within_limit ON public.users IS 
'Ensures image_count never exceeds image_limit at database level';

-- ============================================================================
-- RECOMMENDATION #2: Restrict tier column updates via RLS
-- Ensures users cannot modify their own tier (only service_role can)
-- 
-- IMPORTANT: This policy blocks authenticated users from changing tier.
-- Legitimate tier changes (webhooks, trials) use service_role which BYPASSES RLS.
-- 
-- How tier changes work:
-- 1. LemonSqueezy webhook → uses SUPABASE_SERVICE_ROLE_KEY → bypasses RLS ✅
-- 2. Trial activation → Edge Function with service_role → bypasses RLS ✅
-- 3. Trial expiration → Edge Function with service_role → bypasses RLS ✅
-- 4. Manual user update → uses auth.uid() → BLOCKED by this policy ❌
-- ============================================================================

-- Drop existing generic UPDATE policy if it allows tier changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create new UPDATE policy that prevents tier modification for authenticated users
-- Note: service_role bypasses RLS entirely, so webhooks/trials still work
CREATE POLICY "Users can update own profile (tier protected)" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth_user_id = auth.uid())
WITH CHECK (
  auth_user_id = auth.uid() 
  AND tier = (SELECT tier FROM public.users WHERE auth_user_id = auth.uid())
);

COMMENT ON POLICY "Users can update own profile (tier protected)" ON public.users IS 
'Users can update their profile but CANNOT change tier. Service_role (webhooks, Edge Functions) bypasses this policy for legitimate tier changes.';

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the constraints work
-- ============================================================================

-- Test 1: Try to set text_count above limit (should fail)
-- UPDATE users SET text_count = text_limit + 1 WHERE auth_user_id = auth.uid();
-- Expected: ERROR: new row violates check constraint "check_text_count_within_limit"

-- Test 2: Try to change tier as authenticated user (should fail)
-- UPDATE users SET tier = 'pro' WHERE auth_user_id = auth.uid();
-- Expected: ERROR: new row violates row-level security policy

-- Test 3: Verify normal updates still work (should succeed)
-- UPDATE users SET full_name = 'New Name' WHERE auth_user_id = auth.uid();
-- Expected: SUCCESS

-- ============================================================================
-- HOW LEGITIMATE TIER CHANGES WORK
-- ============================================================================

-- Service role (webhooks, Edge Functions) bypasses RLS entirely:
-- 
-- Example: LemonSqueezy webhook updating tier to 'pro'
-- const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
-- await supabase.from('users').update({ tier: 'pro' }).eq('auth_user_id', userId);
-- ✅ SUCCESS - service_role bypasses the RLS policy
--
-- Example: User trying to update their own tier via client
-- const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
-- await supabase.from('users').update({ tier: 'pro' }).eq('auth_user_id', auth.uid());
-- ❌ BLOCKED - authenticated role is restricted by RLS policy
--
-- Verified working paths for tier changes:
-- 1. supabase/functions/handle-lemonsqueezy-webhook → uses service_role ✅
-- 2. Trial activation via Edge Functions → uses service_role ✅
-- 3. Trial expiration via Edge Functions → uses service_role ✅
