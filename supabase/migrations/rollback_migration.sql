-- rollback_migration.sql
-- Emergency rollback script if migration causes issues
-- WARNING: Only run this if migration breaks the application

-- ============================================================
-- ROLLBACK STEP 1: Restore old RLS policies
-- ============================================================
\echo 'Step 1: Dropping new simple RLS policies...'

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

\echo 'Step 2: Recreating old complex RLS policies...'

-- Restore old SELECT policy (with JOIN)
CREATE POLICY "Users can view messages from their conversations"
ON public.messages FOR SELECT
USING (conversation_id IN (
  SELECT c.id FROM conversations c
  JOIN users u ON c.user_id = u.id
  WHERE u.auth_user_id = auth.uid()
));

-- Restore old INSERT policy
CREATE POLICY "Users can insert messages to their conversations"
ON public.messages FOR INSERT
WITH CHECK (conversation_id IN (
  SELECT c.id FROM conversations c
  JOIN users u ON c.user_id = u.id
  WHERE u.auth_user_id = auth.uid()
));

-- Restore old UPDATE policy
CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
USING (conversation_id IN (
  SELECT c.id FROM conversations c
  JOIN users u ON c.user_id = u.id
  WHERE u.auth_user_id = auth.uid()
));

-- Restore old DELETE policy
CREATE POLICY "Users can delete messages from their conversations"
ON public.messages FOR DELETE
USING (conversation_id IN (
  SELECT c.id FROM conversations c
  JOIN users u ON c.user_id = u.id
  WHERE u.auth_user_id = auth.uid()
));

-- ============================================================
-- ROLLBACK STEP 2: Restore old add_message function
-- ============================================================
\echo 'Step 3: Restoring old add_message function...'

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
BEGIN
  -- Insert message WITHOUT auth_user_id
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
  
  -- Update conversation timestamp
  UPDATE conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$;

-- ============================================================
-- ROLLBACK STEP 3: Remove auth_user_id column constraints
-- ============================================================
\echo 'Step 4: Removing NOT NULL constraint...'

-- Make auth_user_id nullable again
ALTER TABLE public.messages 
ALTER COLUMN auth_user_id DROP NOT NULL;

\echo 'Step 5: Dropping foreign key constraint...'

-- Drop FK constraint
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_auth_user_id_fkey;

\echo 'Step 6: Dropping index...'

-- Drop index
DROP INDEX IF EXISTS idx_messages_auth_user_id;

-- ============================================================
-- OPTIONAL: Remove auth_user_id column entirely
-- ============================================================
-- Uncomment ONLY if you want to fully revert (loses data)
-- \echo 'Step 7: Dropping auth_user_id column...'
-- ALTER TABLE public.messages DROP COLUMN IF EXISTS auth_user_id;

-- ============================================================
-- ROLLBACK COMPLETE
-- ============================================================
\echo ''
\echo '=================================================='
\echo '           ROLLBACK COMPLETE'
\echo '=================================================='
\echo ''
\echo 'Restored:'
\echo '  ✅ Old RLS policies (with JOINs)'
\echo '  ✅ Old add_message function'
\echo '  ✅ Removed NOT NULL constraint'
\echo '  ✅ Removed FK constraint'
\echo '  ✅ Removed index'
\echo ''
\echo 'NOTE: auth_user_id column still exists but is nullable.'
\echo 'To fully remove it, uncomment Step 7 in this script.'
\echo ''
\echo 'Application should now work as before migration.'
\echo ''
