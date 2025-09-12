-- SIMPLE AUTHENTICATION DEBUG
-- Run this in Supabase Dashboard → SQL Editor to debug authentication issues

-- 1. Check if any users exist in auth.users table
SELECT 'Checking auth.users table...' as status;
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if any users exist in public.users table
SELECT 'Checking public.users table...' as status;
SELECT 
    auth_user_id,
    email,
    tier,
    created_at,
    updated_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if the trigger exists and is working
SELECT 'Checking trigger...' as status;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 4. Check RLS policies
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

-- 5. Check if RLS is enabled
SELECT 'Checking RLS status...' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 6. Test if we can query the users table (this should work if RLS is correct)
SELECT 'Testing user access...' as status;
SELECT COUNT(*) as total_users FROM public.users;

-- 7. Show all policies for reference
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
