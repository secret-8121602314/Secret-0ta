-- Fix Security Linter Warnings
-- Issue: Functions missing search_path security setting
-- Solution: Add SET search_path TO 'public', 'pg_temp' to all trigger functions

-- Fix messages_set_auth_user_id function
CREATE OR REPLACE FUNCTION messages_set_auth_user_id()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Get auth_user_id from the conversation
  SELECT auth_user_id INTO NEW.auth_user_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Fix subtabs_set_auth_user_id function
CREATE OR REPLACE FUNCTION subtabs_set_auth_user_id()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Get auth_user_id from the conversation
  SELECT auth_user_id INTO NEW.auth_user_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Fix validate_subtab_for_unreleased function
CREATE OR REPLACE FUNCTION validate_subtab_for_unreleased()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  is_unreleased_game boolean;
BEGIN
  -- Check if conversation is for unreleased game
  SELECT is_unreleased INTO is_unreleased_game
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  IF is_unreleased_game = true THEN
    RAISE EXCEPTION 'Subtabs cannot be created for unreleased games'
      USING HINT = 'Unreleased games do not support subtabs feature';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
