-- Add missing onboarding fields to users table
-- These fields track the user's progress through the onboarding flow

DO $$ 
BEGIN
    -- Add has_seen_how_to_use field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'has_seen_how_to_use'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN has_seen_how_to_use BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN public.users.has_seen_how_to_use IS 'Tracks whether user has seen the how-to-use (PC connection) screen';
        
        RAISE NOTICE 'Added has_seen_how_to_use field to users table';
    ELSE
        RAISE NOTICE 'has_seen_how_to_use field already exists in users table';
    END IF;

    -- Add has_seen_features_connected field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'has_seen_features_connected'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN has_seen_features_connected BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN public.users.has_seen_features_connected IS 'Tracks whether user has seen the features-connected screen';
        
        RAISE NOTICE 'Added has_seen_features_connected field to users table';
    ELSE
        RAISE NOTICE 'has_seen_features_connected field already exists in users table';
    END IF;

    -- Add has_seen_pro_features field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'has_seen_pro_features'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN has_seen_pro_features BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN public.users.has_seen_pro_features IS 'Tracks whether user has seen the pro features screen';
        
        RAISE NOTICE 'Added has_seen_pro_features field to users table';
    ELSE
        RAISE NOTICE 'has_seen_pro_features field already exists in users table';
    END IF;

    -- Add pc_connected field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'pc_connected'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN pc_connected BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN public.users.pc_connected IS 'Tracks whether user has successfully connected their PC';
        
        RAISE NOTICE 'Added pc_connected field to users table';
    ELSE
        RAISE NOTICE 'pc_connected field already exists in users table';
    END IF;

    -- Add onboarding_completed field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'onboarding_completed'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN public.users.onboarding_completed IS 'Tracks whether user has completed the full onboarding flow';
        
        RAISE NOTICE 'Added onboarding_completed field to users table';
    ELSE
        RAISE NOTICE 'onboarding_completed field already exists in users table';
    END IF;
END $$;
