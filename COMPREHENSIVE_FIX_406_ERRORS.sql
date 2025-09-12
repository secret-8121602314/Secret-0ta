-- COMPREHENSIVE FIX FOR 406 ERRORS AND MISSING USER RECORDS
-- Run this in the Supabase SQL Editor

-- 1. Check current user status
SELECT 
    'AUTH USERS' as table_name,
    id,
    email,
    created_at
FROM auth.users 
WHERE id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30'

UNION ALL

SELECT 
    'PUBLIC USERS' as table_name,
    auth_user_id as id,
    email,
    created_at::text
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 2. Create missing user record
INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    user_type,
    tier,
    app_state,
    preferences,
    created_at,
    updated_at
) VALUES (
    '996d53ca-3a2c-40d4-9a9d-23f224bd4c30',
    'mdamkhan@gmail.com',
    'Amaan',
    'user',
    'free',
    '{
        "onboardingComplete": false,
        "profileSetupCompleted": false,
        "hasSeenSplashScreens": false,
        "welcomeMessageShown": false,
        "firstWelcomeShown": false,
        "hasConversations": false,
        "hasInteractedWithChat": false,
        "lastSessionDate": "",
        "lastWelcomeTime": "",
        "appClosedTime": "",
        "firstRunCompleted": false,
        "hasConnectedBefore": false,
        "installDismissed": false,
        "showSplashAfterLogin": false,
        "lastSuggestedPromptsShown": "",
        "conversations": [],
        "conversationsOrder": [],
        "activeConversation": ""
    }'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

-- 3. Fix onboarding_funnel table
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

-- 4. Ensure RLS policies are correct
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS 'Users can view own data' ON public.users;
DROP POLICY IF EXISTS 'Users can insert own data' ON public.users;
DROP POLICY IF EXISTS 'Users can update own data' ON public.users;
DROP POLICY IF EXISTS 'Users can delete own data' ON public.users;

-- Create new RLS policies
CREATE POLICY 'Users can view own data' ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY 'Users can insert own data' ON public.users
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY 'Users can update own data' ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY 'Users can delete own data' ON public.users
    FOR DELETE USING (auth_user_id = auth.uid());

-- 5. Test the fix
SELECT 
    'SUCCESS: User record created' as status,
    auth_user_id,
    email,
    name,
    user_type,
    tier
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 6. Verify RLS policies
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
