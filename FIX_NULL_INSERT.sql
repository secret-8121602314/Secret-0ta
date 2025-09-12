-- 🔧 FIX NULL INSERT ISSUE
-- This script fixes the NULL insert problem in user creation

-- 1. Check table structure first
SELECT 'Table Structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Drop and recreate the trigger with proper NULL handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create improved function with better NULL handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if NEW.id is NULL
    IF NEW.id IS NULL THEN
        RAISE WARNING 'User ID is NULL, skipping user creation';
        RETURN NEW;
    END IF;
    
    -- Insert user record with comprehensive data
    INSERT INTO public.users (auth_user_id, email, tier, profile_data, preferences, app_state, created_at, updated_at)
    VALUES (
        NEW.id::uuid,  -- Explicitly cast to UUID
        COALESCE(NEW.email, 'no-email@example.com'),  -- Provide default email
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
    RAISE NOTICE 'User created successfully: ID=%, Email=%', NEW.id, NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log detailed error
        RAISE WARNING 'Failed to create user record: ID=%, Email=%, Error=%', NEW.id, NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Test the trigger
SELECT 'Trigger created successfully' as status;

-- 6. Check if trigger exists
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 7. Check for any existing NULL auth_user_id records
SELECT 'NULL auth_user_id records:' as status;
SELECT COUNT(*) as null_count
FROM public.users 
WHERE auth_user_id IS NULL;

-- 8. Check recent auth users to see what data is available
SELECT 'Recent Auth Users:' as status;
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 3;
