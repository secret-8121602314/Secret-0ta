-- ============================================================================
-- SUPABASE LINTER FIXES
-- ============================================================================
-- This script fixes all database linter warnings reported by Supabase
-- 
-- Run this in your Supabase SQL Editor:
-- Dashboard > SQL Editor > New Query > Paste this script > Run
--
-- Fixes:
-- 1. Function search_path warnings (6 functions)
-- 2. RLS auth.uid() performance warnings (12 policies)
-- ============================================================================

-- ============================================================================
-- PART 1: Fix function_search_path_mutable warnings
-- Add SET search_path to prevent SQL injection vulnerabilities
-- ============================================================================

-- 1. update_subtabs_updated_at
CREATE OR REPLACE FUNCTION public.update_subtabs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. get_conversation_messages
-- Drop first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_conversation_messages(uuid);

CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id uuid)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  role text,
  content text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.conversation_id, m.role, m.content, m.created_at, m.updated_at
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$;

-- 3. migrate_messages_to_table
DROP FUNCTION IF EXISTS public.migrate_messages_to_table();

CREATE OR REPLACE FUNCTION public.migrate_messages_to_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  conv_record RECORD;
  msg_record jsonb;
BEGIN
  FOR conv_record IN 
    SELECT id, messages 
    FROM conversations 
    WHERE messages IS NOT NULL 
      AND jsonb_array_length(messages) > 0
      AND NOT EXISTS (
        SELECT 1 FROM messages m WHERE m.conversation_id = conversations.id
      )
  LOOP
    FOR msg_record IN 
      SELECT * FROM jsonb_array_elements(conv_record.messages)
    LOOP
      INSERT INTO messages (conversation_id, role, content, created_at)
      VALUES (
        conv_record.id,
        msg_record->>'role',
        msg_record->>'content',
        COALESCE(
          (msg_record->>'timestamp')::timestamptz,
          (msg_record->>'created_at')::timestamptz,
          now()
        )
      );
    END LOOP;
  END LOOP;
END;
$$;

-- 4. add_message
DROP FUNCTION IF EXISTS public.add_message(uuid, text, text);
DROP FUNCTION IF EXISTS public.add_message(uuid, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.add_message(
  p_conversation_id uuid,
  p_role text,
  p_content text,
  p_image_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_message_id uuid;
BEGIN
  -- Insert message
  INSERT INTO messages (
    conversation_id,
    role,
    content,
    image_url,
    metadata
  ) VALUES (
    p_conversation_id,
    p_role,
    p_content,
    p_image_url,
    p_metadata
  )
  RETURNING id INTO v_message_id;
  
  -- Update conversation updated_at timestamp
  UPDATE conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$;

-- 5. rollback_messages_to_jsonb
DROP FUNCTION IF EXISTS public.rollback_messages_to_jsonb();

CREATE OR REPLACE FUNCTION public.rollback_messages_to_jsonb()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE conversations c
  SET messages = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'role', m.role,
        'content', m.content,
        'timestamp', m.created_at
      )
      ORDER BY m.created_at
    )
    FROM messages m
    WHERE m.conversation_id = c.id
  )
  WHERE EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.id
  );
END;
$$;

-- 6. get_user_id_from_auth_id
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(uuid);

CREATE OR REPLACE FUNCTION public.get_user_id_from_auth_id(p_auth_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_id = p_auth_id;
  
  RETURN v_user_id;
END;
$$;

-- ============================================================================
-- PART 2: Fix auth_rls_initplan performance warnings
-- Wrap auth.uid() with SELECT to prevent re-evaluation on each row
-- ============================================================================

-- Fix games table RLS policies
DROP POLICY IF EXISTS "games_select_own" ON games;
DROP POLICY IF EXISTS "games_insert_own" ON games;
DROP POLICY IF EXISTS "games_update_own" ON games;
DROP POLICY IF EXISTS "games_delete_own" ON games;

CREATE POLICY "games_select_own" ON games
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "games_insert_own" ON games
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "games_update_own" ON games
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "games_delete_own" ON games
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix subtabs table RLS policies
DROP POLICY IF EXISTS "Users can insert subtabs to their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can view subtabs from their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can update subtabs in their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs from their conversations" ON subtabs;

CREATE POLICY "Users can insert subtabs to their conversations" ON subtabs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view subtabs from their conversations" ON subtabs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update subtabs in their conversations" ON subtabs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete subtabs from their conversations" ON subtabs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.user_id = (SELECT auth.uid())
    )
  );

-- Fix conversations table RLS policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, verify the fixes by running the linter again
-- in the Supabase Dashboard or via CLI: supabase db lint
-- 
-- All function_search_path_mutable and auth_rls_initplan warnings should be resolved
-- ============================================================================

-- ============================================================================
-- ADDITIONAL SECURITY CONFIGURATION
-- ============================================================================
-- Note: The "auth_leaked_password_protection" warning requires configuration
-- in the Supabase Dashboard, not SQL.
--
-- To enable leaked password protection:
-- 1. Go to Dashboard > Authentication > Providers > Email
-- 2. Scroll to "Password Protection"
-- 3. Enable "Check against HaveIBeenPwned database"
-- 
-- This will protect against users choosing compromised passwords.
-- ============================================================================
