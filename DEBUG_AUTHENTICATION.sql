-- DEBUG AUTHENTICATION FLOW
-- Run this in Supabase Dashboard → SQL Editor to debug the authentication issues

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

-- 5. Test if we can insert a user manually (this should work)
SELECT 'Testing manual user creation...' as status;
-- This will only work if there's a corresponding auth.users record
-- We'll test with a dummy user first

-- 6. Check if RLS is enabled
SELECT 'Checking RLS status...' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 7. Check recent authentication events (if available)
SELECT 'Checking auth events...' as status;
-- Note: This table might not exist in all Supabase versions
-- If it fails, that's okay - we can check other ways
SELECT 
    'auth.audit_log_entries table not available' as note;
