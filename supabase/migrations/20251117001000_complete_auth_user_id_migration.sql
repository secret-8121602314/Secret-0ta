-- Migration: Complete auth_user_id migration for remaining tables
-- Date: 2025-11-17
-- Purpose: Add auth_user_id column to onboarding_progress, user_analytics, user_sessions
--          This completes the migration from 3-table JOIN (auth.users -> public.users -> table)
--          to 2-table JOIN (auth.users -> table) for 10-100x performance improvement

-- Set search path for security
SET search_path TO public, pg_catalog;

-- ============================================================================
-- PART 1: Add auth_user_id to onboarding_progress
-- ============================================================================

-- Add auth_user_id column (nullable initially for backfill)
ALTER TABLE public.onboarding_progress 
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill auth_user_id from users table
UPDATE public.onboarding_progress op
SET auth_user_id = u.auth_user_id
FROM public.users u
WHERE op.user_id = u.id
AND op.auth_user_id IS NULL;

-- Create index for RLS performance
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_auth_user_id 
ON public.onboarding_progress(auth_user_id);

-- Update RLS policies to use auth_user_id directly
-- Drop old policies first
DROP POLICY IF EXISTS "Users can view own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can insert own onboarding progress" ON public.onboarding_progress;

-- Create new policies using auth_user_id
CREATE POLICY "Users can view own onboarding progress" 
ON public.onboarding_progress 
FOR SELECT 
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own onboarding progress" 
ON public.onboarding_progress 
FOR INSERT 
WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own onboarding progress" 
ON public.onboarding_progress 
FOR UPDATE 
USING (auth_user_id = (SELECT auth.uid()))
WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 2: Add auth_user_id to user_analytics
-- ============================================================================

-- Add auth_user_id column (nullable initially for backfill)
ALTER TABLE public.user_analytics 
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill auth_user_id from users table
UPDATE public.user_analytics ua
SET auth_user_id = u.auth_user_id
FROM public.users u
WHERE ua.user_id = u.id
AND ua.auth_user_id IS NULL;

-- Create index for RLS performance
CREATE INDEX IF NOT EXISTS idx_user_analytics_auth_user_id 
ON public.user_analytics(auth_user_id);

-- Update RLS policies to use auth_user_id directly
-- Drop old policies first
DROP POLICY IF EXISTS "Users can view own analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.user_analytics;

-- Create new policies using auth_user_id
CREATE POLICY "Users can view own analytics" 
ON public.user_analytics 
FOR SELECT 
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own analytics" 
ON public.user_analytics 
FOR INSERT 
WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 3: Add auth_user_id to user_sessions
-- ============================================================================

-- Add auth_user_id column (nullable initially for backfill)
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill auth_user_id from users table
UPDATE public.user_sessions us
SET auth_user_id = u.auth_user_id
FROM public.users u
WHERE us.user_id = u.id
AND us.auth_user_id IS NULL;

-- Create index for RLS performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_auth_user_id 
ON public.user_sessions(auth_user_id);

-- Update RLS policies to use auth_user_id directly
-- Drop old policies first
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;

-- Create new policies using auth_user_id
CREATE POLICY "Users can view own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth_user_id = (SELECT auth.uid()))
WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 4: Update RPC functions to use auth_user_id
-- ============================================================================

-- Update save_onboarding_step function to use auth_user_id
CREATE OR REPLACE FUNCTION public.save_onboarding_step(
  p_user_id uuid,
  p_step text,
  p_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  -- Get auth_user_id from users table
  SELECT auth_user_id INTO v_auth_user_id
  FROM public.users
  WHERE id = p_user_id;

  -- If not found, use p_user_id directly (assuming it's auth_user_id)
  IF v_auth_user_id IS NULL THEN
    v_auth_user_id := p_user_id;
  END IF;

  -- Insert or update onboarding progress using auth_user_id
  INSERT INTO public.onboarding_progress (user_id, auth_user_id, step, data, completed, created_at, updated_at)
  VALUES (p_user_id, v_auth_user_id, p_step, p_data, false, NOW(), NOW())
  ON CONFLICT (user_id, step) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = NOW();
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES (Comment out for production)
-- ============================================================================

-- Verify all rows have auth_user_id populated
DO $$
DECLARE
  v_onboarding_null_count integer;
  v_analytics_null_count integer;
  v_sessions_null_count integer;
BEGIN
  SELECT COUNT(*) INTO v_onboarding_null_count 
  FROM public.onboarding_progress 
  WHERE auth_user_id IS NULL;

  SELECT COUNT(*) INTO v_analytics_null_count 
  FROM public.user_analytics 
  WHERE auth_user_id IS NULL;

  SELECT COUNT(*) INTO v_sessions_null_count 
  FROM public.user_sessions 
  WHERE auth_user_id IS NULL;

  IF v_onboarding_null_count > 0 THEN
    RAISE WARNING 'onboarding_progress has % rows with NULL auth_user_id', v_onboarding_null_count;
  END IF;

  IF v_analytics_null_count > 0 THEN
    RAISE WARNING 'user_analytics has % rows with NULL auth_user_id', v_analytics_null_count;
  END IF;

  IF v_sessions_null_count > 0 THEN
    RAISE WARNING 'user_sessions has % rows with NULL auth_user_id', v_sessions_null_count;
  END IF;

  IF v_onboarding_null_count = 0 AND v_analytics_null_count = 0 AND v_sessions_null_count = 0 THEN
    RAISE NOTICE '✅ All tables successfully migrated to auth_user_id';
  END IF;
END $$;
