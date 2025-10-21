-- Add missing columns to existing conversations table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'is_game_hub') THEN
        ALTER TABLE public.conversations ADD COLUMN is_game_hub BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create unique constraint: only one game hub per user (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_game_hub') THEN
        CREATE UNIQUE INDEX idx_user_game_hub ON public.conversations(user_id) WHERE is_game_hub = TRUE;
    END IF;
END $$;

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for messages (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_conversation') THEN
        CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_role') THEN
        CREATE INDEX idx_messages_role ON public.messages(role);
    END IF;
END $$;

-- Create subtabs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subtabs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  tab_type TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for subtabs (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subtabs_game') THEN
        CREATE INDEX idx_subtabs_game ON public.subtabs(game_id, order_index);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subtabs_type') THEN
        CREATE INDEX idx_subtabs_type ON public.subtabs(tab_type);
    END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtabs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
CREATE POLICY "Users can view messages from their conversations"
  ON public.messages FOR SELECT
  USING (conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;
CREATE POLICY "Users can insert messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
CREATE POLICY "Users can update messages in their conversations"
  ON public.messages FOR UPDATE
  USING (conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON public.messages;
CREATE POLICY "Users can delete messages from their conversations"
  ON public.messages FOR DELETE
  USING (conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  ));

-- RLS Policies for subtabs
DROP POLICY IF EXISTS "Users can view subtabs from their games" ON public.subtabs;
CREATE POLICY "Users can view subtabs from their games"
  ON public.subtabs FOR SELECT
  USING (game_id IN (
    SELECT g.id FROM games g
    JOIN users u ON g.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert subtabs to their games" ON public.subtabs;
CREATE POLICY "Users can insert subtabs to their games"
  ON public.subtabs FOR INSERT
  WITH CHECK (game_id IN (
    SELECT g.id FROM games g
    JOIN users u ON g.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update subtabs in their games" ON public.subtabs;
CREATE POLICY "Users can update subtabs in their games"
  ON public.subtabs FOR UPDATE
  USING (game_id IN (
    SELECT g.id FROM games g
    JOIN users u ON g.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete subtabs from their games" ON public.subtabs;
CREATE POLICY "Users can delete subtabs from their games"
  ON public.subtabs FOR DELETE
  USING (game_id IN (
    SELECT g.id FROM games g
    JOIN users u ON g.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  ));

-- Create helper function to get or create game hub for user
CREATE OR REPLACE FUNCTION get_or_create_game_hub(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE user_id = p_user_id AND is_game_hub = TRUE
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user_id, title, is_game_hub)
    VALUES (p_user_id, 'Game Hub', TRUE)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- Create function to migrate messages between conversations
CREATE OR REPLACE FUNCTION migrate_messages_to_conversation(
  p_message_ids UUID[],
  p_target_conversation_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_migrated_count INTEGER := 0;
BEGIN
  UPDATE messages
  SET conversation_id = p_target_conversation_id
  WHERE id = ANY(p_message_ids);
  
  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
  
  RETURN v_migrated_count;
END;
$$;
