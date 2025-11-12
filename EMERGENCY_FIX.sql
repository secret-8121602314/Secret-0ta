-- ============================================================================
-- EMERGENCY FIX - Apply this in Supabase SQL Editor RIGHT NOW
-- ============================================================================
-- This fixes the "function does not exist" and subtabs errors
-- ============================================================================

-- Step 1: Fix the function parameter mismatch
-- The code calls: rpc('get_user_id_from_auth_id', { p_auth_user_id: userId })
-- But the function was created with parameter name: auth_id
-- This creates it with the CORRECT parameter name
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(uuid);
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(p_auth_user_id uuid);

CREATE FUNCTION public.get_user_id_from_auth_id(p_auth_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ Security: Prevents search_path attacks
AS $$
BEGIN
  RETURN (SELECT id FROM public.users WHERE auth_user_id = p_auth_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_id_from_auth_id(p_auth_user_id uuid) TO authenticated;

-- Step 2: Fix subtabs table
-- ============================================================================

-- Make game_id nullable
ALTER TABLE public.subtabs ALTER COLUMN game_id DROP NOT NULL;

-- Add conversation_id if it doesn't exist
ALTER TABLE public.subtabs 
ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subtabs_conversation_id ON public.subtabs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_subtabs_conversation_order ON public.subtabs(conversation_id, order_index);

-- Step 3: Fix conversations RLS policies to work with auth.uid() directly
-- ============================================================================
-- The issue: RLS policies check user_id = auth.uid(), but user_id is set via
-- the broken get_user_id_from_auth_id function. This creates a catch-22:
-- - Function is broken → user_id is NULL
-- - RLS checks user_id = auth.uid() → fails because NULL ≠ auth.uid()
-- 
-- Solution: Change conversations.user_id to reference auth.users.id directly
-- ============================================================================

-- Add auth_user_id column if it doesn't exist
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make old user_id nullable (it's being deprecated in favor of auth_user_id)
ALTER TABLE public.conversations 
ALTER COLUMN user_id DROP NOT NULL;

-- Copy existing user_id → auth_user_id (for any existing data)
UPDATE public.conversations
SET auth_user_id = (
  SELECT auth_user_id FROM public.users WHERE users.id = conversations.user_id
)
WHERE auth_user_id IS NULL AND user_id IS NOT NULL;

-- Update RLS policies to use auth_user_id instead
-- Drop ALL existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

-- Create new optimized policies
-- ✅ Performance: Using (SELECT auth.uid()) prevents re-evaluation per row
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth_user_id = (SELECT auth.uid()));

-- ============================================================================
-- Verification - Run this after to confirm fixes worked
-- ============================================================================

-- Check 1: Function exists with correct parameter
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_id_from_auth_id';
-- Expected: get_user_id_from_auth_id | FUNCTION | uuid

-- Check 2: Subtabs table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'subtabs' 
AND table_schema = 'public'
AND column_name IN ('game_id', 'conversation_id')
ORDER BY column_name;
-- Expected: 
-- conversation_id | uuid | YES | NULL
-- game_id         | uuid | YES | NULL

-- Check 3: Conversations has auth_user_id column
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversations' 
AND table_schema = 'public'
AND column_name IN ('user_id', 'auth_user_id')
ORDER BY column_name;
-- Expected: 
-- auth_user_id | uuid | YES
-- user_id      | uuid | YES (old column, kept for compatibility)

-- Check 4: RLS policies updated
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY policyname;
-- Expected: Should see policies with auth_user_id = auth.uid() in qual column

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This fix addresses the "403 Forbidden - RLS policy violation" error by:
--
-- 1. Fixed RPC function parameter name mismatch (p_auth_user_id)
-- 2. Made subtabs.game_id nullable
-- 3. Added subtabs.conversation_id column
-- 4. Added conversations.auth_user_id column
-- 5. Updated RLS policies to use auth_user_id = auth.uid()
--
-- After applying this fix:
-- - Conversations will save to Supabase (no more 403 errors)
-- - Subtabs will save without UUID errors
-- - Game tabs will persist across page reloads
-- - RLS policies will work correctly
--
-- NEXT STEPS:
-- 1. Apply this SQL in Supabase SQL Editor
-- 2. Verify all 4 checks above pass
-- 3. Code changes already made to src/services/supabaseService.ts
-- 4. Test by creating a new game tab
-- 5. Reload page to verify persistence
-- ============================================================================
