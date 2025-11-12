-- ============================================================================
-- FIX: Make game_id nullable to allow conversation_id-only subtabs
-- ============================================================================
-- Current issue: game_id is NOT NULL but code is only setting conversation_id
-- This causes INSERT failures with error 23502
-- ============================================================================

-- Option 1: Make game_id nullable (safer, allows gradual migration)
ALTER TABLE public.subtabs 
ALTER COLUMN game_id DROP NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subtabs' 
AND table_schema = 'public'
ORDER BY ordinal_position;
