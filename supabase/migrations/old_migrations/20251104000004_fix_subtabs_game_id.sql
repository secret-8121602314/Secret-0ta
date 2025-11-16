-- Migration: Make game_id nullable in subtabs table
-- This allows us to use conversation_id instead of game_id
-- Date: 2025-11-04

-- Make game_id nullable so we can use conversation_id
ALTER TABLE public.subtabs 
ALTER COLUMN game_id DROP NOT NULL;

-- Add comment explaining the migration path
COMMENT ON COLUMN public.subtabs.game_id IS 'Deprecated: Use conversation_id instead. This column is kept for backward compatibility but is now nullable.';
COMMENT ON COLUMN public.subtabs.conversation_id IS 'References conversations.id - the conversation this subtab belongs to.';
