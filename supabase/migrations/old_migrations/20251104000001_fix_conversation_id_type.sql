-- ============================================================================
-- Fix conversation_id type mismatch - Change all to TEXT
-- ============================================================================
-- Currently: conversations.id, subtabs.conversation_id, messages.conversation_id are ALL UUID
-- Need: All to be TEXT to support custom IDs like 'game-hub', 'game-cyberpunk-2077'
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Save existing RLS policies for recreation
DO $$ 
DECLARE
    policy_record RECORD;
    policy_definitions TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Store all policy definitions
    FOR policy_record IN 
        SELECT 
            polname as policy_name,
            pg_get_expr(polqual, polrelid) as using_expr,
            pg_get_expr(polwithcheck, polrelid) as check_expr,
            CASE polcmd
                WHEN 'r' THEN 'SELECT'
                WHEN 'a' THEN 'INSERT'
                WHEN 'w' THEN 'UPDATE'
                WHEN 'd' THEN 'DELETE'
                WHEN '*' THEN 'ALL'
            END as command,
            CASE polpermissive
                WHEN true THEN 'PERMISSIVE'
                WHEN false THEN 'RESTRICTIVE'
            END as permissive
        FROM pg_policy
        WHERE polrelid = 'public.subtabs'::regclass
    LOOP
        RAISE NOTICE 'Saving policy: %', policy_record.policy_name;
        
        -- Store policy definition for later recreation
        policy_definitions := array_append(policy_definitions, 
            format('CREATE POLICY %I ON public.subtabs AS %s FOR %s USING (%s)',
                policy_record.policy_name,
                policy_record.permissive,
                policy_record.command,
                policy_record.using_expr
            )
        );
        
        IF policy_record.check_expr IS NOT NULL THEN
            policy_definitions[array_length(policy_definitions, 1)] := 
                policy_definitions[array_length(policy_definitions, 1)] || 
                format(' WITH CHECK (%s)', policy_record.check_expr);
        END IF;
    END LOOP;
    
    -- Store in a temporary table for later use
    CREATE TEMP TABLE IF NOT EXISTS temp_subtabs_policies (policy_def TEXT);
    TRUNCATE temp_subtabs_policies;
    
    FOREACH policy_record.policy_name IN ARRAY policy_definitions
    LOOP
        INSERT INTO temp_subtabs_policies VALUES (policy_record.policy_name);
    END LOOP;
END $$;

-- Step 2: Drop all RLS policies on subtabs table (try all possible names)
DROP POLICY IF EXISTS "Users can view subtabs of their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can view subtabs from their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can insert subtabs to their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can insert subtabs for their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can update subtabs of their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can update subtabs in their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs of their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs from their conversations" ON public.subtabs;

-- Drop any other policies that might exist
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT polname 
        FROM pg_policy 
        WHERE polrelid = 'public.subtabs'::regclass
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.subtabs', policy_name);
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

-- Step 3: Drop the foreign key constraint temporarily
ALTER TABLE public.subtabs 
DROP CONSTRAINT IF EXISTS subtabs_conversation_id_fkey;

-- Step 4: Drop indexes that reference the columns
DROP INDEX IF EXISTS idx_subtabs_conversation_id;
DROP INDEX IF EXISTS idx_subtabs_conversation_order;
DROP INDEX IF EXISTS idx_conversations_user_id;

-- Step 5: Drop RLS policies on messages table (they reference conversations.id)
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT polname 
        FROM pg_policy 
        WHERE polrelid = 'public.messages'::regclass
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', policy_name);
        RAISE NOTICE 'Dropped messages policy: %', policy_name;
    END LOOP;
END $$;

-- Step 6: Drop RLS policies on conversations table that reference the id column
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT polname 
        FROM pg_policy 
        WHERE polrelid = 'public.conversations'::regclass
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversations', policy_name);
        RAISE NOTICE 'Dropped conversations policy: %', policy_name;
    END LOOP;
END $$;

-- Step 7: Drop FK constraint from messages to conversations
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

-- Step 8: Change conversations.id from UUID to TEXT
ALTER TABLE public.conversations 
ALTER COLUMN id TYPE text USING id::text;

-- Step 9: Change messages.conversation_id from UUID to TEXT
ALTER TABLE public.messages
ALTER COLUMN conversation_id TYPE text USING conversation_id::text;

-- Step 10: Change subtabs.conversation_id from UUID to TEXT
ALTER TABLE public.subtabs 
ALTER COLUMN conversation_id TYPE text USING conversation_id::text;

-- Step 11: Re-add foreign key constraints with TEXT type
ALTER TABLE public.subtabs
ADD CONSTRAINT subtabs_conversation_id_fkey 
FOREIGN KEY (conversation_id) 
REFERENCES public.conversations(id) 
ON DELETE CASCADE;

ALTER TABLE public.messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES public.conversations(id)
ON DELETE CASCADE;

-- Step 12: Recreate indexes
CREATE INDEX idx_subtabs_conversation_id 
ON public.subtabs(conversation_id);

CREATE INDEX idx_subtabs_conversation_order 
ON public.subtabs(conversation_id, order_index);

CREATE INDEX idx_conversations_user_id 
ON public.conversations(user_id);

-- Step 13: Recreate RLS policies on conversations table (optimized with SELECT wrapper)
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own conversations"
ON public.conversations
FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.conversations
FOR DELETE
USING ((select auth.uid()) = user_id);

-- Step 14: Recreate RLS policies on messages table (optimized with SELECT wrapper)
CREATE POLICY "Users can view messages from their conversations"
ON public.messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT c.id
    FROM public.conversations c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can insert messages to their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT c.id
    FROM public.conversations c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
  conversation_id IN (
    SELECT c.id
    FROM public.conversations c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can delete messages from their conversations"
ON public.messages
FOR DELETE
USING (
  conversation_id IN (
    SELECT c.id
    FROM public.conversations c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = (select auth.uid())
  )
);

-- Step 15: Recreate RLS policies on subtabs table (optimized with SELECT wrapper)
CREATE POLICY "Users can view subtabs of their conversations"
ON public.subtabs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = subtabs.conversation_id
    AND conversations.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can insert subtabs to their conversations"
ON public.subtabs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = subtabs.conversation_id
    AND conversations.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can update subtabs of their conversations"
ON public.subtabs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = subtabs.conversation_id
    AND conversations.user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = subtabs.conversation_id
    AND conversations.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can delete subtabs of their conversations"
ON public.subtabs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = subtabs.conversation_id
    AND conversations.user_id = (select auth.uid())
  )
);

-- Step 16: Add comments
COMMENT ON COLUMN public.conversations.id IS 'Primary key - TEXT type to support custom IDs like game-hub';
COMMENT ON COLUMN public.subtabs.conversation_id IS 'Foreign key to conversations.id (TEXT type to support custom IDs)';
COMMENT ON COLUMN public.messages.conversation_id IS 'Foreign key to conversations.id (TEXT type to support custom IDs)';

-- Step 17: Verify the changes
DO $$
DECLARE
    conversations_id_type TEXT;
    subtabs_conv_id_type TEXT;
    messages_conv_id_type TEXT;
BEGIN
    -- Check conversations.id
    SELECT data_type INTO conversations_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'id';
    
    -- Check subtabs.conversation_id
    SELECT data_type INTO subtabs_conv_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subtabs'
    AND column_name = 'conversation_id';
    
    -- Check messages.conversation_id
    SELECT data_type INTO messages_conv_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'messages'
    AND column_name = 'conversation_id';
    
    RAISE NOTICE '✅ conversations.id type: %', conversations_id_type;
    RAISE NOTICE '✅ subtabs.conversation_id type: %', subtabs_conv_id_type;
    RAISE NOTICE '✅ messages.conversation_id type: %', messages_conv_id_type;
    
    IF conversations_id_type != 'text' OR subtabs_conv_id_type != 'text' OR messages_conv_id_type != 'text' THEN
        RAISE EXCEPTION 'Migration failed - not all columns are TEXT type';
    END IF;
    
    RAISE NOTICE '🎉 Migration completed successfully - all conversation IDs are now TEXT';
END $$;
