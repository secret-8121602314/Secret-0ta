-- COMPREHENSIVE FIX FOR GAMES TABLE 406 ERRORS
-- This will fix the RLS policies for the games table

-- 1. Check current games table status
SELECT 
    'GAMES TABLE STATUS' as check_type,
    COUNT(*) as total_games,
    COUNT(CASE WHEN user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' THEN 1 END) as user_games
FROM public.games;

-- 2. Enable RLS on games table
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own games" ON public.games;
DROP POLICY IF EXISTS "Users can insert own games" ON public.games;
DROP POLICY IF EXISTS "Users can update own games" ON public.games;
DROP POLICY IF EXISTS "Users can delete own games" ON public.games;

-- 4. Create RLS policies for games table
-- Use the users.id (not auth.uid()) for the foreign key relationship
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own games" ON public.games
    FOR DELETE USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- 5. Create a default "everything-else" game for the user if it doesn't exist
-- Use the actual users.id (not auth_user_id) for the foreign key
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

-- 6. Test the fix
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

-- 7. Verify RLS policies
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'games'
ORDER BY policyname;
