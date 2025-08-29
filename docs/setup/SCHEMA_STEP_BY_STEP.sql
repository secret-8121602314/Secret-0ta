-- ========================================
-- SCHEMA STEP BY STEP TEST
-- This will run your actual failing schema step by step
-- ========================================

-- Step 1: Enable extensions
DO $$
BEGIN
    RAISE NOTICE 'Step 1: Enabling extensions...';
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    RAISE NOTICE '✅ Extensions enabled successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 1 failed: %', SQLERRM;
        RETURN;
END $$;

-- Step 2: Create user_profiles table
DO $$
BEGIN
    RAISE NOTICE 'Step 2: Creating user_profiles table...';
    CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        display_name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✅ user_profiles table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 2 failed: %', SQLERRM;
        RETURN;
END $$;

-- Step 3: Create user_preferences table
DO $$
BEGIN
    RAISE NOTICE 'Step 3: Creating user_preferences table...';
    CREATE TABLE IF NOT EXISTS public.user_preferences (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        hint_style TEXT CHECK (hint_style IN ('Cryptic', 'Balanced', 'Direct')) DEFAULT 'Balanced',
        player_focus TEXT CHECK (player_focus IN ('Story-Driven', 'Completionist', 'Strategist')) DEFAULT 'Story-Driven',
        preferred_tone TEXT CHECK (preferred_tone IN ('Encouraging', 'Professional', 'Casual')) DEFAULT 'Encouraging',
        spoiler_tolerance TEXT CHECK (spoiler_tolerance IN ('Strict', 'Moderate', 'Relaxed')) DEFAULT 'Strict',
        is_first_time BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
    );
    RAISE NOTICE '✅ user_preferences table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 3 failed: %', SQLERRM;
        RETURN;
END $$;

-- Step 4: Create games table
DO $$
BEGIN
    RAISE NOTICE 'Step 4: Creating games table...';
    CREATE TABLE IF NOT EXISTS public.games (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        genre TEXT,
        progress INTEGER DEFAULT 0,
        playthrough_count INTEGER DEFAULT 1,
        last_session_date TIMESTAMP WITH TIME ZONE,
        total_play_time INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT false,
        active_objective_description TEXT,
        active_objective_completed BOOLEAN DEFAULT false,
        last_trailer_timestamp TIMESTAMP WITH TIME ZONE,
        last_interaction_timestamp TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, title)
    );
    RAISE NOTICE '✅ games table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 4 failed: %', SQLERRM;
        RETURN;
END $$;

-- Step 5: Create game_contexts table
DO $$
BEGIN
    RAISE NOTICE 'Step 5: Creating game_contexts table...';
    CREATE TABLE IF NOT EXISTS public.game_contexts (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
        objectives_completed TEXT[],
        secrets_found TEXT[],
        inventory TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, game_id)
    );
    RAISE NOTICE '✅ game_contexts table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 5 failed: %', SQLERRM;
        RETURN;
END $$;

-- Step 6: Create conversations table
DO $$
BEGIN
    RAISE NOTICE 'Step 6: Creating conversations table...';
    CREATE TABLE IF NOT EXISTS public.conversations (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        progress INTEGER DEFAULT 0,
        last_interaction_timestamp TIMESTAMP WITH TIME ZONE,
        is_pinned BOOLEAN DEFAULT false,
        genre TEXT,
        insights_order TEXT[]
    );
    RAISE NOTICE '✅ conversations table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 6 failed: %', SQLERRM;
        RETURN;
END $$;

-- Step 7: Create chat_messages table
DO $$
BEGIN
    RAISE NOTICE 'Step 7: Creating chat_messages table...';
    CREATE TABLE IF NOT EXISTS public.chat_messages (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
        role TEXT CHECK (role IN ('user', 'model')) NOT NULL,
        text TEXT NOT NULL,
        images TEXT[],
        is_from_pc BOOLEAN DEFAULT false,
        sources JSONB DEFAULT '[]',
        suggestions TEXT[],
        triumph JSONB,
        show_upgrade_button BOOLEAN DEFAULT false,
        feedback TEXT CHECK (feedback IN ('up', 'down', 'submitted')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✅ chat_messages table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 7 failed: %', SQLERRM;
        RETURN;
END $$;

-- Step 8: Create insights table
DO $$
BEGIN
    RAISE NOTICE 'Step 8: Creating insights table...';
    CREATE TABLE IF NOT EXISTS public.insights (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        status TEXT CHECK (status IN ('loading', 'streaming', 'loaded', 'error')) DEFAULT 'loading',
        is_new BOOLEAN DEFAULT false,
        feedback TEXT CHECK (feedback IN ('up', 'down', 'submitted')),
        is_placeholder BOOLEAN DEFAULT false,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        generation_attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✅ insights table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 8 failed: %', SQLERRM;
        RETURN;
END $$;

-- Step 9: Create diary_tasks table
DO $$
BEGIN
    RAISE NOTICE 'Step 9: Creating diary_tasks table...';
    CREATE TABLE IF NOT EXISTS public.diary_tasks (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    RAISE NOTICE '✅ diary_tasks table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 9 failed: %', SQLERRM;
        RETURN;
END $$;

-- Step 10: Create diary_favorites table
DO $$
BEGIN
    RAISE NOTICE 'Step 10: Creating diary_favorites table...';
    CREATE TABLE IF NOT EXISTS public.diary_favorites (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('ai_response', 'insight', 'lore')),
        context TEXT,
        source_message_id TEXT,
        source_insight_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✅ diary_favorites table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 10 failed: %', SQLERRM;
        RETURN;
END $$;

-- Final status
SELECT 
    'Step-by-step schema test completed' as status,
    'All tables should have been created successfully' as note,
    'If any step failed, check the error messages above' as troubleshooting;
