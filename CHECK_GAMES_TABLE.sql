-- CHECK GAMES TABLE AND RLS POLICIES
-- This will help us understand why we're getting 406 errors

-- 1. Check if games table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'games' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check RLS policies on games table
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'games'
ORDER BY policyname;

-- 3. Check if RLS is enabled on games table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'games' 
AND schemaname = 'public';

-- 4. Test the specific query that's failing
SELECT 
    'Testing games query' as test_type,
    COUNT(*) as game_count
FROM public.games 
WHERE user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' 
AND title = 'everything-else';

-- 5. Check if there are any games for this user
SELECT 
    'User games check' as test_type,
    id,
    title,
    user_id,
    created_at
FROM public.games 
WHERE user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30'
LIMIT 5;
