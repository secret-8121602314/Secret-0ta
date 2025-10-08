-- ========================================
-- ADD MISSING ONBOARDING FIELDS
-- ========================================
-- This script adds the missing onboarding fields to the users table
-- Run this to fix the undefined field issue

-- Add missing onboarding fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS has_seen_how_to_use BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_seen_features_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_seen_pro_features BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pc_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pc_connection_skipped BOOLEAN DEFAULT FALSE;

-- Update existing users to have default values
UPDATE public.users 
SET 
    has_seen_how_to_use = FALSE,
    has_seen_features_connected = FALSE,
    has_seen_pro_features = FALSE,
    pc_connected = FALSE,
    pc_connection_skipped = FALSE
WHERE 
    has_seen_how_to_use IS NULL 
    OR has_seen_features_connected IS NULL 
    OR has_seen_pro_features IS NULL 
    OR pc_connected IS NULL 
    OR pc_connection_skipped IS NULL;

-- Verify the fields were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
    AND column_name IN (
        'has_seen_how_to_use',
        'has_seen_features_connected', 
        'has_seen_pro_features',
        'pc_connected',
        'pc_connection_skipped'
    )
ORDER BY column_name;
