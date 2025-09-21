-- ========================================
-- QUICK FIX: Add missing source column to waitlist table
-- ========================================
-- Run this if you already have a waitlist table without the source column

-- Add the missing source column
ALTER TABLE public.waitlist 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'landing_page'::text;

-- Update completion message
DO $$
BEGIN
  RAISE NOTICE '✅ Added source column to waitlist table';
  RAISE NOTICE '🚀 Waitlist functionality should now work!';
END $$;
