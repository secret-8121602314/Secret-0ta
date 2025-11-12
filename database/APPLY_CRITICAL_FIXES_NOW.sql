-- ============================================================================
-- CRITICAL FIXES - Apply these immediately to fix the app
-- ============================================================================
-- Run this in Supabase SQL Editor: https://qajcxgkqloumogioomiz.supabase.co
-- ============================================================================

-- Fix 1: Make subtabs.game_id nullable (so we can use conversation_id instead)
-- ============================================================================
ALTER TABLE public.subtabs ALTER COLUMN game_id DROP NOT NULL;
COMMENT ON COLUMN public.subtabs.game_id IS 'Deprecated: Use conversation_id instead. Kept for backward compatibility but now nullable.';

-- Fix 2: Create the missing get_user_id_from_auth_id function
-- ============================================================================
-- Drop all possible variations to ensure clean slate
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(uuid);
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(p_auth_user_id uuid);

-- Create function with the EXACT parameter name the code uses
CREATE OR REPLACE FUNCTION public.get_user_id_from_auth_id(p_auth_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  internal_user_id uuid;
BEGIN
  -- Look up the internal user_id from the users table
  SELECT id INTO internal_user_id
  FROM public.users
  WHERE auth_user_id = p_auth_user_id;
  
  -- Return the internal user_id (will be NULL if not found)
  RETURN internal_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_id_from_auth_id(p_auth_user_id uuid) TO authenticated;
COMMENT ON FUNCTION public.get_user_id_from_auth_id IS 'Resolves internal user_id from auth.users.id';

-- Fix 3: Ensure conversation_id column exists in subtabs and add indexes
-- ============================================================================
-- Add conversation_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subtabs' 
    AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.subtabs 
    ADD COLUMN conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes (IF NOT EXISTS makes these safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_subtabs_conversation_id 
ON public.subtabs(conversation_id);

CREATE INDEX IF NOT EXISTS idx_subtabs_conversation_order 
ON public.subtabs(conversation_id, order_index);

-- Add helpful comments
COMMENT ON COLUMN public.subtabs.conversation_id IS 'References conversations.id - the conversation this subtab belongs to.';

-- ============================================================================
-- Verification queries (optional - run these to check the fixes)
-- ============================================================================
-- Check subtabs table structure:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'subtabs' AND table_schema = 'public';

-- Check if function exists:
-- SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_user_id_from_auth_id';
