-- CHECK FOR ALL MISSING USER RECORDS
-- This will find all authenticated users who don't have records in public.users

-- Find all auth.users that don't have corresponding public.users records
SELECT 
    au.id as auth_user_id,
    au.email,
    au.created_at as auth_created_at,
    'MISSING FROM PUBLIC.USERS' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL
ORDER BY au.created_at DESC;

-- Count of missing users
SELECT 
    COUNT(*) as missing_user_count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL;

-- Find all public.users that don't have corresponding auth.users records (orphaned)
SELECT 
    pu.auth_user_id,
    pu.email,
    pu.created_at as public_created_at,
    'ORPHANED IN PUBLIC.USERS' as status
FROM public.users pu
LEFT JOIN auth.users au ON pu.auth_user_id = au.id
WHERE au.id IS NULL
ORDER BY pu.created_at DESC;

-- Summary
SELECT 
    'SUMMARY' as report_type,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.users) as total_public_users,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users pu ON au.id = pu.auth_user_id WHERE pu.auth_user_id IS NULL) as missing_users,
    (SELECT COUNT(*) FROM public.users pu LEFT JOIN auth.users au ON pu.auth_user_id = au.id WHERE au.id IS NULL) as orphaned_users;
