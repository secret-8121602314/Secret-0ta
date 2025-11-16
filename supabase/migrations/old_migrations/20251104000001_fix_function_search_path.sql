-- Fix function_search_path_mutable security warnings
-- Add SET search_path to all functions to prevent SQL injection

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
CREATE OR REPLACE FUNCTION public.add_message(
  p_conversation_id uuid,
  p_role text,
  p_content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_message_id uuid;
BEGIN
  INSERT INTO messages (conversation_id, role, content)
  VALUES (p_conversation_id, p_role, p_content)
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$;

-- 5. rollback_messages_to_jsonb
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
