-- 🚨 URGENT: FIX USER CREATION AND RLS ISSUES
-- This script fixes the critical issues causing 406 errors and console flooding

-- 1. Check current state
SELECT 'Current State Check:' as status;
SELECT COUNT(*) as auth_users FROM auth.users;
SELECT COUNT(*) as public_users FROM public.users;

-- 2. Check for missing users
SELECT 'Missing Users:' as status;
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL
ORDER BY au.created_at DESC;

-- 3. Drop and recreate trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Create robust function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id) THEN
        RAISE NOTICE 'User already exists: %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Insert user record
    INSERT INTO public.users (auth_user_id, email, tier, profile_data, preferences, app_state, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, 'no-email@example.com'),
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
    
    RAISE NOTICE 'User created successfully: ID=%, Email=%', NEW.id, NEW.email;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create user: ID=%, Email=%, Error=%', NEW.id, NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Fix RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

-- Create proper RLS policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can delete own data" ON public.users
    FOR DELETE USING (auth.uid() = auth_user_id::uuid);

-- 7. Manually create missing user for current session
INSERT INTO public.users (auth_user_id, email, tier, profile_data, preferences, app_state, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(au.email, 'no-email@example.com'),
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
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL
ON CONFLICT (auth_user_id) DO NOTHING;

-- 8. Verify fix
SELECT 'Fix Applied:' as status;
SELECT COUNT(*) as auth_users FROM auth.users;
SELECT COUNT(*) as public_users FROM public.users;
SELECT 'Missing users after fix:' as status;
SELECT COUNT(*) as missing_count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL;
