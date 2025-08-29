-- ========================================
-- ADD MISSING FUNCTIONS AND TRIGGERS
-- This adds the missing pieces from the full schema
-- ========================================

-- ========================================
-- SECURE FUNCTIONS (FIXED SEARCH PATH)
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
-- TRIGGERS FOR UPDATED_AT
-- ========================================

-- Triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_contexts_updated_at
    BEFORE UPDATE ON public.game_contexts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diary_tasks_updated_at
    BEFORE UPDATE ON public.diary_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- ADDITIONAL RLS POLICIES (IF MISSING)
-- ========================================

-- Check if RLS policies exist and add missing ones
DO $$
BEGIN
    -- Add missing RLS policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can manage own profile'
    ) THEN
        CREATE POLICY "Users can manage own profile" ON public.user_profiles
            FOR ALL USING ((select auth.uid()) = id);
        RAISE NOTICE '✅ Added missing user_profiles RLS policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_preferences' 
        AND policyname = 'Users can manage own preferences'
    ) THEN
        CREATE POLICY "Users can manage own preferences" ON public.user_preferences
            FOR ALL USING ((select auth.uid()) = user_id);
        RAISE NOTICE '✅ Added missing user_preferences RLS policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'games' 
        AND policyname = 'Users can manage own games'
    ) THEN
        CREATE POLICY "Users can manage own games" ON public.games
            FOR ALL USING ((select auth.uid()) = user_id);
        RAISE NOTICE '✅ Added missing games RLS policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversations' 
        AND policyname = 'Users can manage own conversations'
    ) THEN
        CREATE POLICY "Users can manage own conversations" ON public.conversations
            FOR ALL USING ((select auth.uid()) = user_id);
        RAISE NOTICE '✅ Added missing conversations RLS policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can manage own chat messages'
    ) THEN
        CREATE POLICY "Users can manage own chat messages" ON public.chat_messages
            FOR ALL USING ((select auth.uid()) = user_id);
        RAISE NOTICE '✅ Added missing chat_messages RLS policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diary_tasks' 
        AND policyname = 'Users can manage own tasks'
    ) THEN
        CREATE POLICY "Users can manage own tasks" ON public.diary_tasks
            FOR ALL USING ((select auth.uid()) = user_id);
        RAISE NOTICE '✅ Added missing diary_tasks RLS policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diary_favorites' 
        AND policyname = 'Users can manage own favorites'
    ) THEN
        CREATE POLICY "Users can manage own favorites" ON public.diary_favorites
            FOR ALL USING ((select auth.uid()) = user_id);
        RAISE NOTICE '✅ Added missing diary_favorites RLS policy';
    END IF;

    RAISE NOTICE '✅ All missing RLS policies added';
END $$;

-- ========================================
-- VERIFICATION
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

-- Check if triggers were created
SELECT 
    'Trigger Check' as check_type,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    '✅ Created' as status
FROM pg_trigger 
WHERE tgname LIKE 'update_%_updated_at'
AND tgrelid::regclass::text LIKE 'public.%';

-- Final status
SELECT 
    'Missing functions and triggers added successfully' as status,
    'All security issues should now be resolved' as note,
    'Run the linter again to verify' as next_step;
