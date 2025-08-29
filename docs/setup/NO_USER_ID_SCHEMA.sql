-- ========================================
-- NO USER_ID SCHEMA - ALTERNATIVE APPROACH
-- This schema doesn't use user_id columns to test if that's the issue
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CORE TABLES WITHOUT USER_ID
-- ========================================

-- Games table (no user_id)
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    genre TEXT,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations (no user_id)
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages (no user_id)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'model')) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks (no user_id)
CREATE TABLE IF NOT EXISTS public.diary_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('user_created', 'ai_suggested')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'need_help')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites (no user_id)
CREATE TABLE IF NOT EXISTS public.diary_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ai_response', 'insight', 'lore')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- BASIC INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_games_title ON public.games(title);
CREATE INDEX IF NOT EXISTS idx_conversations_title ON public.conversations(title);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_diary_tasks_game ON public.diary_tasks(game_id);
CREATE INDEX IF NOT EXISTS idx_diary_favorites_game ON public.diary_favorites(game_id);

-- ========================================
-- VERIFICATION
-- ========================================

-- Check if tables were created
SELECT 
    'Tables Created' as info,
    table_name,
    '✅ Success' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('games', 'conversations', 'chat_messages', 'diary_tasks', 'diary_favorites')
ORDER BY table_name;

-- Final status
SELECT 
    'No user_id schema completed' as status,
    'If this works, the issue is with auth.users references' as note,
    'If this fails, there is a deeper Supabase issue' as conclusion;
