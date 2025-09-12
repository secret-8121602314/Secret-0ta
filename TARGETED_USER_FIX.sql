-- TARGETED FIX FOR MISSING USER RECORD
-- This works with your existing schema

-- 1. Check current status
SELECT 
    'AUTH USERS' as source,
    id::text,
    email,
    created_at::text
FROM auth.users 
WHERE id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30'

UNION ALL

SELECT 
    'PUBLIC USERS' as source,
    auth_user_id::text,
    email,
    created_at::text
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 2. Insert missing user record with correct schema structure
INSERT INTO public.users (
    auth_user_id,
    email,
    tier,
    is_active,
    profile_data,
    preferences,
    usage_data,
    app_state,
    behavior_data,
    feedback_data,
    onboarding_data,
    created_at,
    updated_at,
    last_activity
) VALUES (
    '996d53ca-3a2c-40d4-9a9d-23f224bd4c30',
    'mdamkhan@gmail.com',
    'free',
    true,
    '{"name": "Amaan"}'::jsonb,
    '{}'::jsonb,
    '{"textCount": 0, "imageCount": 0, "textLimit": 10, "imageLimit": 5}'::jsonb,
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
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    profile_data = EXCLUDED.profile_data,
    updated_at = NOW(),
    last_activity = NOW();

-- 3. Skip onboarding_funnel fix (it's a view, not a table)
-- Note: onboarding_funnel is a view, so we can't add columns to it
-- The 400 error for missing drop_off_reason column will need to be fixed in the application code

-- 4. Ensure RLS is enabled and policies exist
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Users can delete own data" ON public.users
    FOR DELETE USING (auth_user_id = auth.uid());

-- 5. Test the fix
SELECT 
    'SUCCESS: User record created' as status,
    id,
    auth_user_id,
    email,
    tier,
    is_active,
    created_at
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 6. Test the specific query that was failing
SELECT 
    'SUCCESS: Profile data accessible' as status,
    profile_data
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 7. Verify RLS policies
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
