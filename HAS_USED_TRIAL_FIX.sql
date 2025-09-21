-- ========================================
-- QUICK FIX: Add missing has_used_trial column
-- ========================================
-- Run this to add the missing has_used_trial column to the users table

-- Add the missing has_used_trial column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS has_used_trial boolean DEFAULT false;

-- Update completion message
DO $$
BEGIN
  RAISE NOTICE '✅ Added has_used_trial column to users table';
  RAISE NOTICE '🚀 Tier service should now work without errors!';
END $$;
