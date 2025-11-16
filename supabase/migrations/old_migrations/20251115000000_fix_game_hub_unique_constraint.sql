-- Fix Game Hub unique constraint to use auth_user_id instead of user_id
-- This prevents duplicate Game Hubs after login/logout cycles
-- Date: November 15, 2025

-- Drop the old constraint that uses user_id (which is often NULL)
DROP INDEX IF EXISTS public.idx_user_game_hub;

-- Create new unique constraint on auth_user_id to enforce ONE Game Hub per authenticated user
CREATE UNIQUE INDEX idx_auth_user_game_hub 
ON public.conversations(auth_user_id) 
WHERE is_game_hub = TRUE;

COMMENT ON INDEX idx_auth_user_game_hub IS 
'Enforces one Game Hub conversation per authenticated user (auth_user_id). 
Prevents duplicate Game Hubs from being created after login/logout cycles.';

-- Verify the constraint works
DO $$
BEGIN
  RAISE NOTICE 'Game Hub unique constraint updated successfully';
  RAISE NOTICE 'Old constraint: idx_user_game_hub (user_id) - DROPPED';
  RAISE NOTICE 'New constraint: idx_auth_user_game_hub (auth_user_id) - CREATED';
END $$;
