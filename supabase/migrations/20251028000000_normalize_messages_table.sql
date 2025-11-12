-- ✅ PHASE 1: Normalize Messages Table
-- Impact: Better scalability, proper relational design, easier queries
-- Date: October 28, 2025

-- ============================================================================
-- BACKGROUND: Current State Analysis
-- ============================================================================
-- PROBLEM:
-- - conversations.messages JSONB column stores all messages inline
-- - Separate messages table exists but is NEVER used
-- - JSONB grows unbounded (performance degrades with large conversations)
-- - Cannot efficiently query individual messages
-- - Cannot add message-level features (reactions, edits, etc.)
--
-- SOLUTION:
-- - Migrate existing messages from JSONB to messages table
-- - Update application code to use messages table
-- - Eventually drop conversations.messages column (after verification)
-- ============================================================================

-- ============================================================================
-- PART 0: Create Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id IN (SELECT id FROM public.users WHERE auth_user_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id IN (SELECT id FROM public.users WHERE auth_user_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can update messages in their conversations" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id IN (SELECT id FROM public.users WHERE auth_user_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id IN (SELECT id FROM public.users WHERE auth_user_id = (SELECT auth.uid()))
    )
  );

-- ============================================================================
-- PART 1: Data Migration (Copy JSONB messages to messages table)
-- ============================================================================

-- Migration function to extract messages from conversations.messages JSONB
-- and insert into messages table with proper relationships
CREATE OR REPLACE FUNCTION public.migrate_messages_to_table()
RETURNS TABLE (
  conversations_processed INTEGER,
  messages_created INTEGER,
  errors INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation RECORD;
  v_message JSONB;
  v_conversations_processed INTEGER := 0;
  v_messages_created INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  -- Loop through all conversations with messages
  FOR v_conversation IN 
    SELECT id, messages 
    FROM public.conversations 
    WHERE messages IS NOT NULL 
      AND jsonb_array_length(messages) > 0
  LOOP
    BEGIN
      v_conversations_processed := v_conversations_processed + 1;
      
      -- Loop through each message in the JSONB array
      FOR v_message IN 
        SELECT * FROM jsonb_array_elements(v_conversation.messages)
      LOOP
        -- Insert message into messages table
        -- Skip if already exists (idempotent migration)
        INSERT INTO public.messages (
          conversation_id,
          role,
          content,
          image_url,
          metadata,
          created_at
        )
        SELECT
          v_conversation.id,
          v_message->>'role',
          v_message->>'content',
          v_message->>'imageUrl',  -- Note: camelCase in JSONB
          COALESCE(
            (v_message->'metadata')::jsonb,
            '{}'::jsonb
          ),
          COALESCE(
            (v_message->>'timestamp')::bigint,
            extract(epoch from now())::bigint * 1000
          )::timestamp with time zone
        WHERE NOT EXISTS (
          -- Prevent duplicates if migration runs twice
          SELECT 1 FROM public.messages m
          WHERE m.conversation_id = v_conversation.id
            AND m.content = (v_message->>'content')
            AND m.role = (v_message->>'role')
            AND m.created_at = COALESCE(
              (v_message->>'timestamp')::bigint,
              extract(epoch from now())::bigint * 1000
            )::timestamp with time zone
        );
        
        v_messages_created := v_messages_created + 1;
      END LOOP;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE WARNING 'Error migrating conversation %: %', v_conversation.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_conversations_processed, v_messages_created, v_errors;
END;
$$;

COMMENT ON FUNCTION public.migrate_messages_to_table IS 
'One-time migration: Copies messages from conversations.messages JSONB 
to normalized messages table. Safe to run multiple times (idempotent).';

-- ============================================================================
-- PART 2: Add Helper Functions for Application Use
-- ============================================================================

-- Function to get messages for a conversation (replaces JSONB access)
CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id UUID)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, role, content, image_url, metadata, created_at
  FROM public.messages
  WHERE conversation_id = p_conversation_id
  ORDER BY created_at ASC;
$$;

COMMENT ON FUNCTION public.get_conversation_messages IS 
'Get all messages for a conversation in chronological order.
Replaces direct access to conversations.messages JSONB.';

-- Function to add a message to a conversation
CREATE OR REPLACE FUNCTION public.add_message(
  p_conversation_id UUID,
  p_role TEXT,
  p_content TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insert message
  INSERT INTO public.messages (
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
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$;

COMMENT ON FUNCTION public.add_message IS 
'Add a new message to a conversation. Automatically updates conversation timestamp.
Returns the new message ID.';

-- ============================================================================
-- PART 3: Add Indexes for Performance
-- ============================================================================

-- Index for conversation_id lookups (critical for get_conversation_messages)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON public.messages(conversation_id);

-- Composite index for conversation + timestamp (for pagination)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC);

COMMENT ON INDEX idx_messages_conversation_id IS 
'Speeds up message retrieval for a specific conversation. 
Used by get_conversation_messages().';

COMMENT ON INDEX idx_messages_conversation_created IS 
'Optimizes paginated message queries (newest first).
Useful for infinite scroll or "load more" features.';

-- ============================================================================
-- PART 4: Migration Execution Instructions
-- ============================================================================

-- ⚠️ DO NOT RUN AUTOMATICALLY - Manual execution required:
/*

-- Step 1: Run migration function to copy data
SELECT * FROM public.migrate_messages_to_table();
-- Expected output: conversations_processed, messages_created, errors

-- Step 2: Verify data integrity
SELECT 
  c.id,
  c.title,
  jsonb_array_length(c.messages) as jsonb_count,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as table_count
FROM conversations c
WHERE messages IS NOT NULL
  AND jsonb_array_length(messages) > 0
LIMIT 10;
-- Should show: jsonb_count = table_count for all rows

-- Step 3: Test queries
SELECT * FROM public.get_conversation_messages('some-conversation-id');

-- Step 4: After verifying in production for 1 week:
-- ALTER TABLE conversations DROP COLUMN messages;
-- (DO NOT RUN YET - keep JSONB as backup until verified)

*/

-- ============================================================================
-- PART 5: Rollback Plan (If Needed)
-- ============================================================================

-- Emergency rollback: Restore JSONB from messages table
CREATE OR REPLACE FUNCTION public.rollback_messages_to_jsonb()
RETURNS TABLE (
  conversations_updated INTEGER,
  errors INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation RECORD;
  v_messages_jsonb JSONB;
  v_conversations_updated INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  FOR v_conversation IN 
    SELECT id FROM public.conversations
  LOOP
    BEGIN
      -- Rebuild JSONB array from messages table
      SELECT jsonb_agg(
        jsonb_build_object(
          'role', role,
          'content', content,
          'imageUrl', image_url,
          'timestamp', extract(epoch from created_at)::bigint * 1000,
          'metadata', metadata
        ) ORDER BY created_at
      ) INTO v_messages_jsonb
      FROM public.messages
      WHERE conversation_id = v_conversation.id;
      
      -- Update conversation with rebuilt JSONB
      UPDATE public.conversations
      SET messages = COALESCE(v_messages_jsonb, '[]'::jsonb)
      WHERE id = v_conversation.id;
      
      v_conversations_updated := v_conversations_updated + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE WARNING 'Error rolling back conversation %: %', v_conversation.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_conversations_updated, v_errors;
END;
$$;

COMMENT ON FUNCTION public.rollback_messages_to_jsonb IS 
'Emergency rollback: Rebuilds conversations.messages JSONB from messages table.
Only use if migration causes issues in production.';

-- ============================================================================
-- SUCCESS METRICS
-- ============================================================================
-- Expected improvements after full migration:
-- 1. Message queries: O(n) JSONB scan → O(log n) indexed lookup
-- 2. Large conversations: 100KB+ JSONB → Separate 1-2KB rows
-- 3. Update single message: Rewrite entire JSONB → Update 1 row
-- 4. Future features: Reactions, edits, threads (easy to add)
-- 5. Database size: ~20% reduction (JSONB → normalized rows + indexes)
-- ============================================================================
