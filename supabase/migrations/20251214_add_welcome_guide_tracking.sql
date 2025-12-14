-- Add welcome guide tracking to users table
-- This replaces localStorage tracking for better persistence across devices

-- Add column to track if user has seen the welcome guide/screen
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS has_seen_welcome_guide boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.users.has_seen_welcome_guide IS 
'Tracks whether user has seen the welcome guide/screen. Set to true after first view. Persists across devices and logout/login cycles.';

-- No need to update existing users - they will default to false and see the welcome guide once
-- If you want existing users to skip it (they've already seen it via localStorage):
-- UPDATE public.users SET has_seen_welcome_guide = true WHERE created_at < NOW();
