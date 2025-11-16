-- Fix duplicate RLS policies causing performance warnings
-- Drop duplicate policies and keep only the consolidated ones

-- ============================================================================
-- onboarding_progress table - Remove old "manage own" policy, keep specific ones
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own onboarding" ON public.onboarding_progress;

-- Keep these specific policies (already exist from migration 20251117001000):
-- - "Users can view own onboarding progress" (SELECT)
-- - "Users can insert own onboarding progress" (INSERT)
-- - "Users can update own onboarding progress" (UPDATE)

-- ============================================================================
-- user_sessions table - Remove old "manage own" policy, create specific ones
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own sessions" ON public.user_sessions;

-- Drop existing specific policies first (they may already exist from previous migration)
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;

-- Create specific policies for user_sessions
CREATE POLICY "Users can view own sessions" 
  ON public.user_sessions 
  FOR SELECT 
  TO authenticated 
  USING (user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own sessions" 
  ON public.user_sessions 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update own sessions" 
  ON public.user_sessions 
  FOR UPDATE 
  TO authenticated 
  USING (user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  ));

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify policies for onboarding_progress
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Policies for onboarding_progress:';
  FOR r IN (
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE tablename = 'onboarding_progress' 
    AND schemaname = 'public'
    ORDER BY cmd, policyname
  ) LOOP
    RAISE NOTICE '  % - %', r.cmd, r.policyname;
  END LOOP;
END $$;

-- Verify policies for user_sessions
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Policies for user_sessions:';
  FOR r IN (
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE tablename = 'user_sessions' 
    AND schemaname = 'public'
    ORDER BY cmd, policyname
  ) LOOP
    RAISE NOTICE '  % - %', r.cmd, r.policyname;
  END LOOP;
END $$;
