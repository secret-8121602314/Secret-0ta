-- 🔧 SIMPLE NULL INSERT FIX
-- This script fixes the NULL insert problem in user creation

-- 1. Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create simple function that handles NULLs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user record with NULL handling
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
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create user record: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Test
SELECT 'Trigger created successfully' as status;
