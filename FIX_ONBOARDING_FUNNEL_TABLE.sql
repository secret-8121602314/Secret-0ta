-- Fix onboarding_funnel table missing column
-- Add the missing drop_off_reason column

-- Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'onboarding_funnel' 
ORDER BY ordinal_position;

-- Add the missing column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'onboarding_funnel' 
        AND column_name = 'drop_off_reason'
    ) THEN
        ALTER TABLE public.onboarding_funnel 
        ADD COLUMN drop_off_reason TEXT;
        
        RAISE NOTICE 'Added drop_off_reason column to onboarding_funnel table';
    ELSE
        RAISE NOTICE 'drop_off_reason column already exists in onboarding_funnel table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'onboarding_funnel' 
ORDER BY ordinal_position;
