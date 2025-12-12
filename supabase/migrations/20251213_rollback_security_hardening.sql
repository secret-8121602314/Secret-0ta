-- Rollback Security Hardening Migration
-- Created: December 13, 2025
-- Purpose: Undo changes from 20251213_security_hardening.sql

-- ============================================================================
-- ROLLBACK STEP 1: Drop CHECK constraints
-- ============================================================================

ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS check_text_count_within_limit;

ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS check_image_count_within_limit;

-- ============================================================================
-- ROLLBACK STEP 2: Restore original RLS policy
-- ============================================================================

-- Drop the tier-protected policy
DROP POLICY IF EXISTS "Users can update own profile (tier protected)" ON public.users;

-- Restore the original policy (allows all updates including tier)
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

COMMENT ON POLICY "Users can update own profile" ON public.users IS 
'Users can update their own profile data (original policy restored)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that constraints are removed
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
  AND conname IN ('check_text_count_within_limit', 'check_image_count_within_limit');
-- Expected: 0 rows (constraints removed)

-- Check that policy is restored
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'users' 
  AND policyname = 'Users can update own profile';
-- Expected: 1 row showing the original policy
