-- Optimize RLS policies to prevent auth.uid() re-evaluation per row
-- Wrap auth.uid() in subquery for better performance at scale

-- ============================================================================
-- user_sessions table - Optimize auth.uid() calls
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;

-- Create optimized policies with (select auth.uid())
CREATE POLICY "Users can view own sessions" 
  ON public.user_sessions 
  FOR SELECT 
  TO authenticated 
  USING (user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
  ));

CREATE POLICY "Users can insert own sessions" 
  ON public.user_sessions 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
  ));

CREATE POLICY "Users can update own sessions" 
  ON public.user_sessions 
  FOR UPDATE 
  TO authenticated 
  USING (user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
  ));

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Optimized policies for user_sessions:';
  FOR r IN (
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies 
    WHERE tablename = 'user_sessions' 
    AND schemaname = 'public'
    ORDER BY cmd, policyname
  ) LOOP
    RAISE NOTICE '  % - %', r.cmd, r.policyname;
  END LOOP;
END $$;
