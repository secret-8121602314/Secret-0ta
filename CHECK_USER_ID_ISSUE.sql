-- CHECK USER IDS AND FIX GAMES TABLE FOREIGN KEY ISSUE
-- This will help us understand the foreign key constraint issue

-- 1. Check the users table structure
SELECT 
    'USERS TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check the actual user record we created
SELECT 
    'USER RECORD CHECK' as check_type,
    id,
    auth_user_id,
    email,
    created_at
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 3. Check foreign key constraints on games table
SELECT 
    'FOREIGN KEY CONSTRAINTS' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'games';

-- 4. Check if there are any existing games
SELECT 
    'EXISTING GAMES CHECK' as check_type,
    COUNT(*) as total_games,
    COUNT(CASE WHEN user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' THEN 1 END) as user_games_by_auth_id,
    COUNT(CASE WHEN user_id = (SELECT id FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30') THEN 1 END) as user_games_by_user_id
FROM public.games;
