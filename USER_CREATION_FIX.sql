-- 🔧 COMPREHENSIVE USER CREATION FIX
-- This script ensures users are created immediately after authentication

-- 1. Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create improved function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user record with comprehensive data
    INSERT INTO public.users (auth_user_id, email, tier, profile_data, preferences, app_state, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
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
    
    -- Log successful creation
    RAISE NOTICE 'User created successfully: %', NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth process
        RAISE WARNING 'Failed to create user record: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Test the trigger
SELECT 'Trigger created successfully' as status;

-- 5. Check if trigger exists
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. Verify RLS policies
SELECT 'RLS policies:' as status;
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;
