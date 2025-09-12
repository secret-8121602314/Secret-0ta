-- COMPREHENSIVE FIX FOR ALL 406 AND 400 ERRORS
-- This will fix all the database issues causing console flooding

-- 1. Verify user record exists
SELECT 
    'USER RECORD CHECK' as check_type,
    id,
    auth_user_id,
    email,
    created_at
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 2. Fix users table RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

-- Create new RLS policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Users can delete own data" ON public.users
    FOR DELETE USING (auth_user_id = auth.uid());

-- 3. Fix games table RLS policies
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own games" ON public.games;
DROP POLICY IF EXISTS "Users can insert own games" ON public.games;
DROP POLICY IF EXISTS "Users can update own games" ON public.games;
DROP POLICY IF EXISTS "Users can delete own games" ON public.games;

-- Create new RLS policies using correct user ID mapping
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own games" ON public.games
    FOR DELETE USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- 4. Create default "everything-else" game for the user
INSERT INTO public.games (
    user_id,
    game_id,
    title,
    genre,
    platform,
    game_data,
    progress_data,
    session_data,
    solutions_data,
    context_data,
    is_active,
    created_at,
    updated_at,
    last_played
) 
SELECT 
    u.id,  -- Use the actual users.id, not auth_user_id
    'everything-else',
    'everything-else',
    'general',
    ARRAY['general'],
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    true,
    NOW(),
    NOW(),
    NOW()
FROM public.users u
WHERE u.auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30'
ON CONFLICT (user_id, game_id) DO UPDATE SET
    updated_at = NOW(),
    last_played = NOW();

-- 5. Test the fixes
SELECT 
    'SUCCESS: Users query works' as status,
    id,
    auth_user_id,
    email
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

SELECT 
    'SUCCESS: Games query works' as status,
    g.id,
    g.title,
    g.user_id,
    u.auth_user_id
FROM public.games g
JOIN public.users u ON g.user_id = u.id
WHERE u.auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' 
AND g.title = 'everything-else';

-- 6. Verify RLS policies
SELECT 
    'USERS RLS POLICIES' as policy_type,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

SELECT 
    'GAMES RLS POLICIES' as policy_type,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'games'
ORDER BY policyname;
