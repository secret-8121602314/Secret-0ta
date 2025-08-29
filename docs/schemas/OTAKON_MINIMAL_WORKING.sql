-- ========================================
-- OTAKON MINIMAL WORKING SCHEMA
-- This is a minimal test to isolate the issue
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CORE USER MANAGEMENT TABLES
-- ========================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    hint_style TEXT DEFAULT 'Balanced',
    player_focus TEXT DEFAULT 'Story-Driven',
    is_first_time BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ========================================
-- GAME MANAGEMENT TABLES
-- ========================================

-- Games table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    genre TEXT,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, title)
);

-- ========================================
-- CHAT AND CONVERSATION TABLES
-- ========================================

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'model')) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- OTAKU DIARY SYSTEM TABLES
-- ========================================

-- Otaku Diary Tasks
CREATE TABLE IF NOT EXISTS public.diary_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('user_created', 'ai_suggested')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'need_help')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Otaku Diary Favorites
CREATE TABLE IF NOT EXISTS public.diary_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ai_response', 'insight', 'lore')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- BASIC INDEXES
-- ========================================

-- User relationships
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_tasks_user_id ON public.diary_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_favorites_user_id ON public.diary_favorites(user_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_favorites ENABLE ROW LEVEL SECURITY;

-- ========================================
-- BASIC RLS POLICIES
-- ========================================

-- User profiles policies
CREATE POLICY "Users can manage own profile" ON public.user_profiles
    FOR ALL USING ((select auth.uid()) = id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING ((select auth.uid()) = user_id);

-- Games policies
CREATE POLICY "Users can manage own games" ON public.games
    FOR ALL USING ((select auth.uid()) = user_id);

-- Conversations policies
CREATE POLICY "Users can manage own conversations" ON public.conversations
    FOR ALL USING ((select auth.uid()) = user_id);

-- Chat messages policies
CREATE POLICY "Users can manage own chat messages" ON public.chat_messages
    FOR ALL USING ((select auth.uid()) = user_id);

-- Tasks policies
CREATE POLICY "Users can manage own tasks" ON public.diary_tasks
    FOR ALL USING ((select auth.uid()) = user_id);

-- Favorites policies
CREATE POLICY "Users can manage own favorites" ON public.diary_favorites
    FOR ALL USING ((select auth.uid()) = user_id);

-- ========================================
-- VERIFICATION
-- ========================================

-- This should work without errors
SELECT 
    'Minimal schema created successfully' as status,
    'All tables reference auth.users(id) correctly' as note,
    'Ready for full schema deployment' as next_step;
