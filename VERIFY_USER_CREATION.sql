-- 🔍 VERIFY USER CREATION FIX
-- Run this to check if users are being created properly

-- 1. Check if trigger exists and is working
SELECT 'Trigger Status:' as status;
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check recent auth users
SELECT 'Recent Auth Users:' as status;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check public users table
SELECT 'Public Users:' as status;
SELECT auth_user_id, email, tier, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check for missing users (auth users without public users)
SELECT 'Missing Users:' as status;
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL
ORDER BY au.created_at DESC;

-- 5. Check function exists
SELECT 'Function Status:' as status;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
