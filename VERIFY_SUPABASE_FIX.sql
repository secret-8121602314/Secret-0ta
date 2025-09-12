-- VERIFICATION SCRIPT - Test if Supabase fix worked
-- Run this in Supabase Dashboard → SQL Editor to verify the fix

-- 1. Check if user record exists
SELECT 'Checking user record...' as status;
SELECT 
    auth_user_id, 
    email, 
    tier, 
    created_at,
    app_state->>'onboardingComplete' as onboarding_complete,
    app_state->>'profileSetupCompleted' as profile_setup_complete
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 2. Check RLS policies
SELECT 'Checking RLS policies...' as status;
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- 3. Check if trigger exists
SELECT 'Checking auto-user creation trigger...' as status;
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 4. Test RLS access (this should work now)
SELECT 'Testing RLS access...' as status;
-- This query should return data if RLS is working properly
SELECT COUNT(*) as user_count FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 5. Check if RLS is enabled
SELECT 'Checking RLS status...' as status;
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 6. Show all policies for reference
SELECT 'All policies on users table:' as status;
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Can view own data'
        WHEN cmd = 'UPDATE' THEN 'Can update own data'
        WHEN cmd = 'INSERT' THEN 'Can insert own data'
        WHEN cmd = 'DELETE' THEN 'Can delete own data'
    END as policy_description
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd;
