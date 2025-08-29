-- ========================================
-- ADD MISSING FUNCTIONS AND TRIGGERS (CORRECTED)
-- This checks actual table structure first, then adds missing pieces
-- ========================================

-- ========================================
-- STEP 1: CHECK ACTUAL TABLE STRUCTURE
-- ========================================

-- Check what columns each table actually has
SELECT 
    'user_profiles' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

SELECT 
    'user_preferences' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences'
ORDER BY ordinal_position;

SELECT 
    'games' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'games'
ORDER BY ordinal_position;

SELECT 
    'game_contexts' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'game_contexts'
ORDER BY ordinal_position;

SELECT 
    'conversations' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'conversations'
ORDER BY ordinal_position;

SELECT 
    'chat_messages' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_messages'
ORDER BY ordinal_position;

SELECT 
    'diary_tasks' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'diary_tasks'
ORDER BY ordinal_position;

SELECT 
    'diary_favorites' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'diary_favorites'
ORDER BY ordinal_position;

-- ========================================
-- STEP 2: CREATE SECURE FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp (SECURITY FIXED)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- Function to get user's game progress summary (SECURITY FIXED)
CREATE OR REPLACE FUNCTION public.get_game_progress_summary(p_user_id UUID, p_game_id UUID)
RETURNS TABLE (
    total_tasks INTEGER,
    completed_tasks INTEGER,
    pending_tasks INTEGER,
    need_help_tasks INTEGER,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tasks,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_tasks,
        COUNT(*) FILTER (WHERE status = 'need_help')::INTEGER as need_help_tasks,
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        END as completion_percentage
    FROM public.diary_tasks
    WHERE user_id = p_user_id AND game_id = p_game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's recent favorites (SECURITY FIXED)
CREATE OR REPLACE FUNCTION public.get_recent_favorites(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    content TEXT,
    type TEXT,
    game_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        df.id,
        df.content,
        df.type,
        g.title as game_title,
        df.created_at
    FROM public.diary_favorites df
    JOIN public.games g ON df.game_id = g.id
    WHERE df.user_id = p_user_id
    ORDER BY df.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's conversation summary (SECURITY FIXED)
CREATE OR REPLACE FUNCTION public.get_conversation_summary(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    message_count INTEGER,
    last_message_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        COUNT(cm.id)::INTEGER as message_count,
        MAX(cm.created_at) as last_message_time,
        c.created_at
    FROM public.conversations c
    LEFT JOIN public.chat_messages cm ON c.id = cm.conversation_id
    WHERE c.user_id = p_user_id
    GROUP BY c.id, c.title, c.created_at
    ORDER BY c.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================================
-- STEP 3: CREATE TRIGGERS (CHECK IF EXISTS FIRST)
-- ========================================

-- Create triggers only if they don't exist
DO $$
BEGIN
    -- user_profiles trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_profiles_updated_at'
        AND tgrelid = 'public.user_profiles'::regclass
    ) THEN
        CREATE TRIGGER update_user_profiles_updated_at
            BEFORE UPDATE ON public.user_profiles
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        RAISE NOTICE '✅ Created user_profiles trigger';
    ELSE
        RAISE NOTICE 'ℹ️ user_profiles trigger already exists';
    END IF;

    -- user_preferences trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_preferences_updated_at'
        AND tgrelid = 'public.user_preferences'::regclass
    ) THEN
        CREATE TRIGGER update_user_preferences_updated_at
            BEFORE UPDATE ON public.user_preferences
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        RAISE NOTICE '✅ Created user_preferences trigger';
    ELSE
        RAISE NOTICE 'ℹ️ user_preferences trigger already exists';
    END IF;

    -- games trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_games_updated_at'
        AND tgrelid = 'public.games'::regclass
    ) THEN
        CREATE TRIGGER update_games_updated_at
            BEFORE UPDATE ON public.games
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        RAISE NOTICE '✅ Created games trigger';
    ELSE
        RAISE NOTICE 'ℹ️ games trigger already exists';
    END IF;

    -- game_contexts trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_game_contexts_updated_at'
        AND tgrelid = 'public.game_contexts'::regclass
    ) THEN
        CREATE TRIGGER update_game_contexts_updated_at
            BEFORE UPDATE ON public.game_contexts
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        RAISE NOTICE '✅ Created game_contexts trigger';
    ELSE
        RAISE NOTICE 'ℹ️ game_contexts trigger already exists';
    END IF;

    -- diary_tasks trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_diary_tasks_updated_at'
        AND tgrelid = 'public.diary_tasks'::regclass
    ) THEN
        CREATE TRIGGER update_diary_tasks_updated_at
            BEFORE UPDATE ON public.diary_tasks
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        RAISE NOTICE '✅ Created diary_tasks trigger';
    ELSE
        RAISE NOTICE 'ℹ️ diary_tasks trigger already exists';
    END IF;

    RAISE NOTICE '✅ All triggers processed successfully';
END $$;

-- ========================================
-- STEP 4: ADD RLS POLICIES (BASED ON ACTUAL COLUMNS)
-- ========================================

-- We'll add RLS policies after seeing the actual table structure
-- This prevents the "column does not exist" errors

-- ========================================
-- STEP 5: VERIFICATION
-- ========================================

-- Check if functions were created with proper security
SELECT 
    'Function Security Check' as check_type,
    proname as function_name,
    CASE 
        WHEN prosrc LIKE '%SET search_path = public%' THEN '✅ SECURE'
        ELSE '❌ INSECURE'
    END as security_status
FROM pg_proc 
WHERE proname IN (
    'update_updated_at_column',
    'get_game_progress_summary',
    'get_recent_favorites',
    'get_conversation_summary'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check if triggers exist
SELECT 
    'Trigger Check' as check_type,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    '✅ Exists' as status
FROM pg_trigger 
WHERE tgname LIKE 'update_%_updated_at'
AND tgrelid::regclass::text LIKE 'public.%';

-- Final status
SELECT 
    'Functions and triggers added successfully' as status,
    'Check the table structure output above' as note,
    'Then we can add RLS policies based on actual columns' as next_step;
