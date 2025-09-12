-- Fix missing user record for authenticated user
-- This will create the missing user record in public.users table

-- First, check if the user exists in auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- Insert the missing user record into public.users
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

-- Verify the user was created
SELECT 
    auth_user_id,
    email,
    name,
    user_type,
    tier,
    created_at
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Test the query that was failing
SELECT profile_data 
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';
