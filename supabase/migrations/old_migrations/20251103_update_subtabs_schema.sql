-- Migration: Update subtabs table to use conversation_id instead of game_id
-- This aligns with the app's architecture where subtabs are conversation-specific
-- Date: 2025-11-03

-- Step 1: Add conversation_id column (nullable initially for data migration)
ALTER TABLE public.subtabs 
ADD COLUMN conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Step 2: Create index for conversation_id queries
CREATE INDEX IF NOT EXISTS idx_subtabs_conversation_id 
ON public.subtabs(conversation_id);

-- Step 3: Create index for ordering
CREATE INDEX IF NOT EXISTS idx_subtabs_conversation_order 
ON public.subtabs(conversation_id, order_index);

-- Step 4: Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subtabs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subtabs_timestamp ON public.subtabs;
CREATE TRIGGER trigger_update_subtabs_timestamp
  BEFORE UPDATE ON public.subtabs
  FOR EACH ROW
  EXECUTE FUNCTION update_subtabs_updated_at();

-- Step 5: Make conversation_id NOT NULL after data migration is complete
-- (Run this manually after migrating existing data)
-- ALTER TABLE public.subtabs ALTER COLUMN conversation_id SET NOT NULL;

-- Step 6: Drop game_id column and constraint after migration
-- (Run this manually after confirming subtabs work with conversation_id)
-- ALTER TABLE public.subtabs DROP CONSTRAINT IF EXISTS subtabs_game_id_fkey;
-- ALTER TABLE public.subtabs DROP COLUMN IF EXISTS game_id;

-- Note: The migration is designed to be safe and reversible
-- Run steps 5 and 6 manually after confirming the new schema works
