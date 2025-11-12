-- ============================================================================
-- FIX: Add conversation_id to subtabs table
-- ============================================================================
-- This migration adds conversation_id column and updates RLS policies
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add conversation_id column (nullable initially)
ALTER TABLE public.subtabs 
ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Step 2: Create indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_subtabs_conversation_id 
ON public.subtabs(conversation_id);

CREATE INDEX IF NOT EXISTS idx_subtabs_conversation_order 
ON public.subtabs(conversation_id, order_index);

-- Step 3: Add trigger to update updated_at timestamp
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

-- Step 4: Update RLS policies to use conversation_id
-- Drop old policies that use game_id
DROP POLICY IF EXISTS "Users can insert subtabs to their games" ON public.subtabs;
DROP POLICY IF EXISTS "Users can view subtabs from their games" ON public.subtabs;
DROP POLICY IF EXISTS "Users can update subtabs in their games" ON public.subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs from their games" ON public.subtabs;

-- Create new policies using conversation_id
CREATE POLICY "Users can insert subtabs to their conversations" 
ON public.subtabs FOR INSERT 
WITH CHECK (
  conversation_id IN (
    SELECT c.id 
    FROM public.conversations c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view subtabs from their conversations" 
ON public.subtabs FOR SELECT 
USING (
  conversation_id IN (
    SELECT c.id 
    FROM public.conversations c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update subtabs in their conversations" 
ON public.subtabs FOR UPDATE 
USING (
  conversation_id IN (
    SELECT c.id 
    FROM public.conversations c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete subtabs from their conversations" 
ON public.subtabs FOR DELETE 
USING (
  conversation_id IN (
    SELECT c.id 
    FROM public.conversations c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Step 5: Make conversation_id NOT NULL (OPTIONAL - only if you've migrated all data)
-- Uncomment this line ONLY after ensuring all existing subtabs have conversation_id values:
-- ALTER TABLE public.subtabs ALTER COLUMN conversation_id SET NOT NULL;

-- Step 6: Drop game_id column (OPTIONAL - only after confirming everything works)
-- Uncomment these lines ONLY after testing thoroughly:
-- DROP INDEX IF EXISTS idx_subtabs_game;
-- ALTER TABLE public.subtabs DROP CONSTRAINT IF EXISTS subtabs_game_id_fkey;
-- ALTER TABLE public.subtabs DROP COLUMN IF EXISTS game_id;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After applying, run these to verify:

-- 1. Check table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'subtabs' AND table_schema = 'public';

-- 2. Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'subtabs' AND schemaname = 'public';

-- 3. Check RLS policies
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'subtabs' AND schemaname = 'public';
