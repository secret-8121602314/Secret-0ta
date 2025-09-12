-- QUICK SUPABASE FIX SCRIPT
-- Run this in Supabase Dashboard → SQL Editor to fix the 406 errors

-- 1. Create user record for the current authenticated user
INSERT INTO public.users (
    auth_user_id, 
    email, 
    tier, 
    profile_data, 
    preferences, 
    app_state,
    created_at,
    updated_at
)
VALUES (
    '996d53ca-3a2c-40d4-9a9d-23f224bd4c30',
    'mdamkhan@gmail.com',
    'free',
    '{}',
    '{}',
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
    }',
    NOW(),
    NOW()
) ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- 2. Fix RLS policies for users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can delete own data" ON public.users
    FOR DELETE USING (auth.uid() = auth_user_id::uuid);

-- 3. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create auto-user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, tier, profile_data, preferences, app_state, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        '{}',
        '{}',
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
        }',
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Test the fix
SELECT 'Testing user access...' as status;
SELECT auth_user_id, email, tier FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 6. Show current RLS policies
SELECT 'Current RLS policies:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- 7. Verify trigger exists
SELECT 'Auto-user creation trigger:' as status;
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
