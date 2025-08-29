-- ========================================
-- FIX MISSING USER_ID COLUMNS AND ADD RLS POLICIES
-- Based on your actual table structure
-- ========================================

-- ========================================
-- STEP 1: ADD MISSING USER_ID COLUMNS
-- ========================================

-- Add user_id to diary_tasks table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'diary_tasks' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.diary_tasks ADD COLUMN user_id UUID;
        RAISE NOTICE '✅ Added user_id column to diary_tasks';
    ELSE
        RAISE NOTICE 'ℹ️ user_id column already exists in diary_tasks';
    END IF;
END $$;

-- Add user_id to diary_favorites table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'diary_favorites' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.diary_favorites ADD COLUMN user_id UUID;
        RAISE NOTICE '✅ Added user_id column to diary_favorites';
    ELSE
        RAISE NOTICE 'ℹ️ user_id column already exists in diary_favorites';
    END IF;
END $$;

-- Add user_id to games table (since it doesn't have one)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'games' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.games ADD COLUMN user_id UUID;
        RAISE NOTICE '✅ Added user_id column to games';
    ELSE
        RAISE NOTICE 'ℹ️ user_id column already exists in games';
    END IF;
END $$;

-- ========================================
-- STEP 2: CREATE RLS POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can manage own profile" ON public.user_profiles
    FOR ALL USING ((select auth.uid()) = id);

-- Create RLS policies for user_preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING ((select auth.uid()) = user_id);

-- Create RLS policies for games
CREATE POLICY "Users can manage own games" ON public.games
    FOR ALL USING ((select auth.uid()) = user_id);

-- Create RLS policies for game_contexts
CREATE POLICY "Users can manage own game contexts" ON public.game_contexts
    FOR ALL USING ((select auth.uid()) = user_id);

-- Create RLS policies for conversations
CREATE POLICY "Users can manage own conversations" ON public.conversations
    FOR ALL USING ((select auth.uid()) = user_id);

-- Create RLS policies for chat_messages
CREATE POLICY "Users can manage own chat messages" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = chat_messages.conversation_id 
            AND c.user_id = (select auth.uid())
        )
    );

-- Create RLS policies for diary_tasks
CREATE POLICY "Users can manage own tasks" ON public.diary_tasks
    FOR ALL USING ((select auth.uid()) = user_id);

-- Create RLS policies for diary_favorites
CREATE POLICY "Users can manage own favorites" ON public.diary_favorites
    FOR ALL USING ((select auth.uid()) = user_id);

-- ========================================
-- STEP 3: VERIFICATION
-- ========================================

-- Check if user_id columns were added
SELECT 
    'Column Check' as check_type,
    table_name,
    column_name,
    '✅ Added' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('diary_tasks', 'diary_favorites', 'games')
AND column_name = 'user_id';

-- Check RLS status
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles', 'user_preferences', 'games', 'game_contexts',
    'conversations', 'chat_messages', 'diary_tasks', 'diary_favorites'
);

-- Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    '✅ Created' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles', 'user_preferences', 'games', 'game_contexts',
    'conversations', 'chat_messages', 'diary_tasks', 'diary_favorites'
);

-- Final status
SELECT 
    'Database security setup complete' as status,
    'All tables now have proper user_id columns and RLS policies' as note,
    'Run the linter again to verify all warnings are gone' as next_step;
