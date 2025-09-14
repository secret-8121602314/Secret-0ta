-- Database Trigger Fix Script
-- Run this in your Supabase SQL Editor to fix the user creation trigger

-- First, let's check if the trigger exists and is working
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Check if the function exists
SELECT 
    routine_name, 
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Add error handling
    BEGIN
        INSERT INTO public.users (auth_user_id, email, tier, profile_data, preferences, usage_data, app_state, behavior_data, feedback_data, onboarding_data)
        VALUES (
            NEW.id,
            NEW.email,
            'free',
            '{}',
            '{}',
            '{"textCount": 0, "imageCount": 0, "textLimit": 55, "imageLimit": 25, "totalRequests": 0, "lastReset": 0}',
            '{"onboardingComplete": false, "profileSetupCompleted": false, "hasSeenSplashScreens": false, "welcomeMessageShown": false, "firstWelcomeShown": false, "hasConversations": false, "hasInteractedWithChat": false, "lastSessionDate": "", "lastWelcomeTime": "", "appClosedTime": "", "firstRunCompleted": false, "hasConnectedBefore": false, "installDismissed": false, "showSplashAfterLogin": false, "lastSuggestedPromptsShown": "", "conversations": [], "conversationsOrder": [], "activeConversation": ""}',
            '{"sessionCount": 0, "totalTimeSpent": 0, "lastActivity": 0, "featureUsage": {}}',
            '{"ratings": [], "suggestions": [], "bugReports": []}',
            '{"stepsCompleted": [], "currentStep": "initial", "completedAt": null}'
        );
        
        -- Log successful insertion
        RAISE NOTICE 'User record created successfully for user: %', NEW.email;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth user creation
            RAISE WARNING 'Failed to create user record for %: %', NEW.email, SQLERRM;
            -- Return NEW to allow auth user creation to succeed
    END;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test the trigger by checking if it can insert a test user
-- (This is just for testing - don't run in production)
/*
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Create a test auth user
    INSERT INTO auth.users (id, email, created_at, updated_at)
    VALUES (gen_random_uuid(), 'test@example.com', NOW(), NOW())
    RETURNING id INTO test_user_id;
    
    -- Check if the trigger created the user record
    IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = test_user_id) THEN
        RAISE NOTICE 'Trigger test PASSED: User record created successfully';
    ELSE
        RAISE NOTICE 'Trigger test FAILED: User record not created';
    END IF;
    
    -- Clean up test data
    DELETE FROM auth.users WHERE id = test_user_id;
    DELETE FROM public.users WHERE auth_user_id = test_user_id;
END $$;
*/

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
WHERE tablename = 'users' 
AND schemaname = 'public';

