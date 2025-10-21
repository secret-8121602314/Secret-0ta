-- Add is_game_hub flag to conversations table
-- This identifies the default "Game Hub" conversation that can't be deleted

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS is_game_hub BOOLEAN DEFAULT FALSE;

-- Create unique constraint: each user can only have ONE game hub conversation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_game_hub'
  ) THEN
    CREATE UNIQUE INDEX idx_user_game_hub 
    ON public.conversations(user_id) 
    WHERE is_game_hub = TRUE;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.conversations.is_game_hub IS 'Identifies the default Game Hub conversation - only one per user, cannot be deleted';

-- Add RLS policy for game hub conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' 
    AND policyname = 'Users can view their game hub'
  ) THEN
    CREATE POLICY "Users can view their game hub"
    ON public.conversations FOR SELECT
    USING (auth.uid() IN (
      SELECT auth_user_id FROM public.users WHERE id = user_id
    ));
  END IF;
END $$;

-- Add RLS policy for inserting conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' 
    AND policyname = 'Users can insert their own conversations'
  ) THEN
    CREATE POLICY "Users can insert their own conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() IN (
      SELECT auth_user_id FROM public.users WHERE id = user_id
    ));
  END IF;
END $$;

-- Add RLS policy for updating conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' 
    AND policyname = 'Users can update their own conversations'
  ) THEN
    CREATE POLICY "Users can update their own conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() IN (
      SELECT auth_user_id FROM public.users WHERE id = user_id
    ));
  END IF;
END $$;

-- Add RLS policy for deleting conversations (but not game hub)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' 
    AND policyname = 'Users can delete their own conversations except game hub'
  ) THEN
    CREATE POLICY "Users can delete their own conversations except game hub"
    ON public.conversations FOR DELETE
    USING (
      auth.uid() IN (
        SELECT auth_user_id FROM public.users WHERE id = user_id
      )
      AND is_game_hub = FALSE
    );
  END IF;
END $$;
