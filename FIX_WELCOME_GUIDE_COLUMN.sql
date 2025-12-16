-- Fix missing has_seen_welcome_guide column error
-- Error: "Could not find the 'has_seen_welcome_guide' column of 'users' in the schema cache"
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/sql

-- Step 1: Add the column if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS has_seen_welcome_guide boolean DEFAULT false;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.users.has_seen_welcome_guide IS 
'Tracks whether user has seen the welcome guide/screen. Set to true after first view. Persists across devices and logout/login cycles.';

-- Step 3: CRITICAL - Refresh PostgREST schema cache
-- This makes the new column visible to the API immediately
NOTIFY pgrst, 'reload schema';

-- Step 4: Force a table comment update to trigger cache refresh
COMMENT ON TABLE public.users IS 'User accounts and preferences. [CACHE REFRESH 2025-12-16]';

-- Step 5: Verify the column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'users' 
AND column_name = 'has_seen_welcome_guide';

-- Expected output:
-- column_name              | data_type | column_default | is_nullable
-- has_seen_welcome_guide   | boolean   | false          | YES

