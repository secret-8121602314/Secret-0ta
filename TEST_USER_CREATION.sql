-- 🧪 TEST USER CREATION
-- Run this to see if the trigger is actually working

-- 1. Check current users count
SELECT 'Current Users Count:' as status;
SELECT COUNT(*) as auth_users_count FROM auth.users;
SELECT COUNT(*) as public_users_count FROM public.users;

-- 2. Check the most recent user in each table
SELECT 'Most Recent Auth User:' as status;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;

SELECT 'Most Recent Public User:' as status;
SELECT auth_user_id, email, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 1;

-- 3. Check if there are any users in auth.users that don't have corresponding public.users
SELECT 'Users Missing from Public Table:' as status;
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL
ORDER BY au.created_at DESC;

-- 4. Check trigger details
SELECT 'Trigger Details:' as status;
SELECT trigger_name, event_manipulation, action_timing, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
