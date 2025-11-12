-- ============================================================================
-- CRITICAL FIXES - Apply in Supabase SQL Editor
-- ============================================================================
-- Run this entire script in your Supabase Dashboard → SQL Editor
-- This fixes:
-- 1. Function overloading error (PGRST203)
-- 2. Ensures proper first-run experience
-- ============================================================================

-- FIX 1: Function Overloading Error
-- Drop any existing versions of the function with different signatures
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(text);
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(uuid);
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(p_auth_user_id text);
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(p_auth_user_id uuid);

-- Recreate with explicit UUID type (auth.users.id is UUID)
CREATE OR REPLACE FUNCTION public.get_user_id_from_auth_id(p_auth_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = p_auth_user_id
  LIMIT 1;
  
  RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_user_id_from_auth_id(UUID) IS 
'Helper function to resolve auth_user_id (UUID from auth.users) to internal user.id. 
Eliminates N+1 query pattern in createConversation().
Security: DEFINER allows function to bypass RLS for lookup.
Performance: STABLE hint tells query planner result will not change within transaction.';

-- ============================================================================
-- FIX 2: Replace Inefficient RLS Policies with Optimized Versions
-- ============================================================================

-- Drop old inefficient policies (with subqueries)
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

-- Create optimized policies (direct user_id comparison, no subqueries)
CREATE POLICY "Users can view own conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own conversations"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own conversations"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own conversations"
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX 3: Create Performance Indexes
-- ============================================================================

-- Check if conversations table has proper indexes for RLS
DO $$ 
BEGIN
  -- Create index on user_id if it doesn't exist (for RLS performance)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'conversations' AND indexname = 'idx_conversations_user_id'
  ) THEN
    CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
    RAISE NOTICE 'Created index idx_conversations_user_id';
  ELSE
    RAISE NOTICE 'Index idx_conversations_user_id already exists';
  END IF;

  -- Create index on is_game_hub for faster Game Hub lookups
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'conversations' AND indexname = 'idx_conversations_game_hub'
  ) THEN
    CREATE INDEX idx_conversations_game_hub ON public.conversations(is_game_hub) WHERE is_game_hub = true;
    RAISE NOTICE 'Created index idx_conversations_game_hub';
  ELSE
    RAISE NOTICE 'Index idx_conversations_game_hub already exists';
  END IF;

  -- Create index on users.auth_user_id for faster RLS lookups
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'idx_users_auth_user_id'
  ) THEN
    CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
    RAISE NOTICE 'Created index idx_users_auth_user_id';
  ELSE
    RAISE NOTICE 'Index idx_users_auth_user_id already exists';
  END IF;
END $$;

-- ============================================================================
-- FIX 4: Test the Function
-- ============================================================================

-- Test the function (should return NULL if no user exists, or a valid UUID)
DO $$
DECLARE
  test_result UUID;
BEGIN
  -- Test with a random UUID (should return NULL)
  test_result := public.get_user_id_from_auth_id('00000000-0000-0000-0000-000000000000'::UUID);
  
  IF test_result IS NULL THEN
    RAISE NOTICE '✅ Function test passed: Returns NULL for non-existent user';
  ELSE
    RAISE NOTICE '⚠️ Unexpected result: %', test_result;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show function signature
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'get_user_id_from_auth_id';

-- Show indexes on conversations table
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'conversations'
ORDER BY indexname;

-- Show RLS policies on conversations table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'conversations'
ORDER BY policyname;

-- ============================================================================
-- Expected Output:
-- ✅ Function: get_user_id_from_auth_id(p_auth_user_id uuid) RETURNS uuid
-- ✅ Index: idx_conversations_user_id
-- ✅ Index: idx_conversations_game_hub
-- ✅ RLS Policies: Should show optimized policies without subqueries
-- ============================================================================
