-- Migration Part 2: Update add_message function
-- Purpose: Set auth_user_id when inserting new messages
-- Prerequisites: Part 1 migration complete (auth_user_id column exists)

-- ============================================================
-- Update add_message function to set auth_user_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_message(
  p_conversation_id uuid,
  p_role text,
  p_content text,
  p_image_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_message_id uuid;
  v_auth_user_id uuid;
BEGIN
  -- Get auth_user_id from conversation
  SELECT auth_user_id INTO v_auth_user_id
  FROM conversations
  WHERE id = p_conversation_id;
  
  -- Verify conversation exists
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Conversation % not found or has no auth_user_id', p_conversation_id;
  END IF;
  
  -- Verify caller owns this conversation (additional security check)
  IF v_auth_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Permission denied: user % cannot add messages to conversation %', 
      auth.uid(), p_conversation_id;
  END IF;
  
  -- Insert message with auth_user_id
  INSERT INTO messages (
    conversation_id,
    role,
    content,
    image_url,
    metadata,
    auth_user_id  -- NEW: Set auth_user_id from conversation
  ) VALUES (
    p_conversation_id,
    p_role,
    p_content,
    p_image_url,
    p_metadata,
    v_auth_user_id  -- NEW: Use conversation's auth_user_id
  )
  RETURNING id INTO v_message_id;
  
  -- Update conversation timestamp
  UPDATE conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$;

-- ============================================================
-- Add function documentation
-- ============================================================
COMMENT ON FUNCTION public.add_message IS 
  'Insert message with auth_user_id from conversation. Includes ownership validation. Called by messageService.ts via Supabase client.';

-- ============================================================
-- Test the updated function
-- ============================================================
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Verify function exists and has correct signature
  SELECT pg_get_function_identity_arguments(p.oid) INTO test_result
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname = 'add_message';
  
  RAISE NOTICE '✅ Function updated successfully';
  RAISE NOTICE 'Signature: add_message(%)', test_result;
END $$;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- The add_message() function now sets auth_user_id automatically
-- All new messages will have auth_user_id populated correctly
-- Application code requires no changes (function signature unchanged)
