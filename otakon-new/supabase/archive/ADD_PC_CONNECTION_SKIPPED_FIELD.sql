-- Add pc_connection_skipped field to users table
-- This field tracks whether the user explicitly skipped PC connection during onboarding

DO $$ 
BEGIN
    -- Add the field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'pc_connection_skipped'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN pc_connection_skipped BOOLEAN DEFAULT FALSE;
        
        -- Add comment
        COMMENT ON COLUMN public.users.pc_connection_skipped IS 'Tracks whether user explicitly skipped PC connection during onboarding';
        
        RAISE NOTICE 'Added pc_connection_skipped field to users table';
    ELSE
        RAISE NOTICE 'pc_connection_skipped field already exists in users table';
    END IF;
END $$;
