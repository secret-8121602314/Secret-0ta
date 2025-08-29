-- Otaku Diary Database Schema for Supabase
-- This schema provides persistent storage for tasks, favorites, and user progress

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CORE TABLES
-- ========================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    genre TEXT,
    progress INTEGER DEFAULT 0,
    playthrough_count INTEGER DEFAULT 1,
    last_session_date TIMESTAMP WITH TIME ZONE,
    total_play_time INTEGER DEFAULT 0, -- in minutes
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, title)
);

-- Otaku Diary Tasks table
CREATE TABLE IF NOT EXISTS public.diary_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('user_created', 'ai_suggested')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'need_help')),
    category TEXT NOT NULL CHECK (category IN ('quest', 'boss', 'exploration', 'item', 'character', 'custom')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    source TEXT,
    source_message_id TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Otaku Diary Favorites table
CREATE TABLE IF NOT EXISTS public.diary_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ai_response', 'insight', 'lore')),
    context TEXT,
    source_message_id TEXT,
    source_insight_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Progress table
CREATE TABLE IF NOT EXISTS public.game_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    session_date DATE NOT NULL,
    duration INTEGER DEFAULT 0, -- in minutes
    objectives_completed TEXT[],
    discoveries TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_title ON public.games(title);
CREATE INDEX IF NOT EXISTS idx_games_user_title ON public.games(user_id, title);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_diary_tasks_user_id ON public.diary_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_tasks_game_id ON public.diary_tasks(game_id);
CREATE INDEX IF NOT EXISTS idx_diary_tasks_status ON public.diary_tasks(status);
CREATE INDEX IF NOT EXISTS idx_diary_tasks_type ON public.diary_tasks(type);
CREATE INDEX IF NOT EXISTS idx_diary_tasks_category ON public.diary_tasks(category);
CREATE INDEX IF NOT EXISTS idx_diary_tasks_created_at ON public.diary_tasks(created_at);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_diary_favorites_user_id ON public.diary_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_favorites_game_id ON public.diary_favorites(game_id);
CREATE INDEX IF NOT EXISTS idx_diary_favorites_type ON public.diary_favorites(type);
CREATE INDEX IF NOT EXISTS idx_diary_favorites_created_at ON public.diary_favorites(created_at);

-- Progress indexes
CREATE INDEX IF NOT EXISTS idx_game_progress_user_id ON public.game_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_game_progress_game_id ON public.game_progress(game_id);
CREATE INDEX IF NOT EXISTS idx_game_progress_session_date ON public.game_progress(session_date);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Games policies
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own games" ON public.games
    FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.diary_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.diary_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.diary_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.diary_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON public.diary_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.diary_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites" ON public.diary_favorites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.diary_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Progress policies
CREATE POLICY "Users can view own progress" ON public.game_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.game_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.game_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON public.game_progress
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diary_tasks_updated_at
    BEFORE UPDATE ON public.diary_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to get user's game progress summary
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's recent favorites
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- INITIAL DATA (Optional)
-- ========================================

-- Insert default user preferences if needed
-- This can be customized based on your needs

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profile information beyond Supabase auth';
COMMENT ON TABLE public.games IS 'User games with progress tracking';
COMMENT ON TABLE public.diary_tasks IS 'User-created and AI-suggested tasks for games';
COMMENT ON TABLE public.diary_favorites IS 'User favorited content from AI responses and insights';
COMMENT ON TABLE public.game_progress IS 'Daily progress tracking for games';

COMMENT ON COLUMN public.diary_tasks.type IS 'Whether task was user-created or AI-suggested';
COMMENT ON COLUMN public.diary_tasks.status IS 'Current status: pending, completed, or need_help';
COMMENT ON COLUMN public.diary_tasks.category IS 'Task category for organization';
COMMENT ON COLUMN public.diary_tasks.priority IS 'Task priority level';
COMMENT ON COLUMN public.diary_tasks.source IS 'Source of the task (AI response, user input, etc.)';
COMMENT ON COLUMN public.diary_tasks.source_message_id IS 'ID of the message that generated this task';

COMMENT ON COLUMN public.diary_favorites.type IS 'Type of favorited content';
COMMENT ON COLUMN public.diary_favorites.context IS 'Additional context about the favorited content';
COMMENT ON COLUMN public.diary_favorites.source_message_id IS 'ID of the message that was favorited';
COMMENT ON COLUMN public.diary_favorites.source_insight_id IS 'ID of the insight that was favorited';
