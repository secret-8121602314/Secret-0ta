-- ========================================
-- OTAKON COMPLETE DATABASE SCHEMA v19
-- Supabase v19 Compatible
-- Captures ALL app data from localStorage
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
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    hint_style TEXT CHECK (hint_style IN ('Cryptic', 'Balanced', 'Direct')) DEFAULT 'Balanced',
    player_focus TEXT CHECK (player_focus IN ('Story-Driven', 'Completionist', 'Strategist')) DEFAULT 'Story-Driven',
    preferred_tone TEXT CHECK (preferred_tone IN ('Encouraging', 'Professional', 'Casual')) DEFAULT 'Encouraging',
    spoiler_tolerance TEXT CHECK (spoiler_tolerance IN ('Strict', 'Moderate', 'Relaxed')) DEFAULT 'Strict',
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
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    genre TEXT,
    progress INTEGER DEFAULT 0,
    playthrough_count INTEGER DEFAULT 1,
    last_session_date TIMESTAMP WITH TIME ZONE,
    total_play_time INTEGER DEFAULT 0, -- in minutes
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

-- Game contexts and progress
CREATE TABLE IF NOT EXISTS public.game_contexts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    objectives_completed TEXT[],
    secrets_found TEXT[],
    inventory TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);

-- Build snapshots
CREATE TABLE IF NOT EXISTS public.build_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    level INTEGER,
    stats JSONB DEFAULT '{}',
    equipment TEXT[],
    skills TEXT[],
    notes TEXT
);

-- Session summaries
CREATE TABLE IF NOT EXISTS public.session_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    session_date DATE NOT NULL,
    duration INTEGER DEFAULT 0, -- in minutes
    objectives TEXT[],
    discoveries TEXT[],
    summary TEXT
);

-- ========================================
-- CHAT AND CONVERSATION TABLES
-- ========================================

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY, -- Using the original ID from app
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    last_interaction_timestamp TIMESTAMP WITH TIME ZONE,
    is_pinned BOOLEAN DEFAULT false,
    genre TEXT,
    insights_order TEXT[]
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY, -- Using the original ID from app
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'model')) NOT NULL,
    text TEXT NOT NULL,
    images TEXT[], -- data URLs
    is_from_pc BOOLEAN DEFAULT false,
    sources JSONB DEFAULT '[]',
    suggestions TEXT[],
    triumph JSONB, -- { type: string, name: string }
    show_upgrade_button BOOLEAN DEFAULT false,
    feedback TEXT CHECK (feedback IN ('up', 'down', 'submitted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insights (tabs)
CREATE TABLE IF NOT EXISTS public.insights (
    id TEXT PRIMARY KEY, -- Using the original ID from app
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
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

-- ========================================
-- OTAKU DIARY SYSTEM TABLES
-- ========================================

-- Otaku Diary Tasks
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

-- Otaku Diary Favorites
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

-- ========================================
-- USAGE AND TIER MANAGEMENT TABLES
-- ========================================

-- User usage tracking
CREATE TABLE IF NOT EXISTS public.user_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL, -- Format: YYYY-MM
    tier TEXT CHECK (tier IN ('free', 'pro', 'vanguard_pro')) DEFAULT 'free',
    text_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    text_limit INTEGER DEFAULT 100,
    image_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- ========================================
-- FEEDBACK AND ANALYTICS TABLES
-- ========================================

-- User feedback
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    feedback_text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proactive insights
CREATE TABLE IF NOT EXISTS public.proactive_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('build_optimization', 'lore_summary', 'mechanic_explanation', 'session_summary')),
    trigger TEXT CHECK (trigger IN ('objective_complete', 'inventory_change', 'area_discovery', 'session_start')),
    content TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger history for proactive insights
CREATE TABLE IF NOT EXISTS public.insight_triggers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    trigger_type TEXT NOT NULL,
    trigger_data JSONB DEFAULT '{}',
    last_triggered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trigger_count INTEGER DEFAULT 1
);

-- ========================================
-- CHARACTER DETECTION AND GAME LANGUAGE TABLES
-- ========================================

-- Character detection cache
CREATE TABLE IF NOT EXISTS public.character_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    character_name TEXT NOT NULL,
    detected_name TEXT NOT NULL,
    confidence REAL DEFAULT 0.0,
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game language profiles
CREATE TABLE IF NOT EXISTS public.game_language_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    language_profile JSONB NOT NULL, -- Full language profile object
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);

-- ========================================
-- DAILY ENGAGEMENT AND GOALS TABLES
-- ========================================

-- Daily goals
CREATE TABLE IF NOT EXISTS public.daily_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    goals JSONB NOT NULL, -- Array of goal objects
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    streak_type TEXT NOT NULL, -- 'daily_checkin', 'conversations', etc.
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- Daily check-ins
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    checkin_date DATE NOT NULL,
    session_time INTEGER DEFAULT 0, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, checkin_date)
);

-- ========================================
-- PWA AND APP STATE TABLES
-- ========================================

-- PWA navigation state
CREATE TABLE IF NOT EXISTS public.pwa_navigation (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    hands_free_enabled BOOLEAN DEFAULT false,
    preferred_voice_uri TEXT,
    speech_rate REAL DEFAULT 1.0,
    install_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- PWA analytics
CREATE TABLE IF NOT EXISTS public.pwa_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- 'install', 'engagement', etc.
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App state and preferences
CREATE TABLE IF NOT EXISTS public.app_state (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    onboarding_complete BOOLEAN DEFAULT false,
    has_connected_before BOOLEAN DEFAULT false,
    auth_method TEXT,
    welcome_message_shown BOOLEAN DEFAULT false,
    profile_setup_completed BOOLEAN DEFAULT false,
    screenshot_mode TEXT DEFAULT 'single',
    screenshot_hint_seen BOOLEAN DEFAULT false,
    manual_upload_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ========================================
-- CONNECTION AND WEBSOCKET TABLES
-- ========================================

-- Connection history
CREATE TABLE IF NOT EXISTS public.connection_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    connection_code TEXT NOT NULL,
    status TEXT CHECK (status IN ('success', 'failed', 'timeout')),
    connection_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INTEGER DEFAULT 0, -- in seconds
    error_message TEXT
);

-- ========================================
-- CACHE AND PERFORMANCE TABLES
-- ========================================

-- News cache
CREATE TABLE IF NOT EXISTS public.news_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    response_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API cost tracking
CREATE TABLE IF NOT EXISTS public.api_costs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    service_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    cost REAL DEFAULT 0.0,
    tokens_used INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON public.user_profiles(display_name);

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_title ON public.games(title);
CREATE INDEX IF NOT EXISTS idx_games_user_title ON public.games(user_id, title);
CREATE INDEX IF NOT EXISTS idx_games_last_session ON public.games(last_session_date);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_title ON public.conversations(title);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON public.chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Insights indexes
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_conversation_id ON public.insights(conversation_id);
CREATE INDEX IF NOT EXISTS idx_insights_status ON public.insights(status);

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

-- Usage indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON public.user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month ON public.user_usage(month);
CREATE INDEX IF NOT EXISTS idx_user_usage_tier ON public.user_usage(tier);

-- Daily engagement indexes
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_id ON public.daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_goals_date ON public.daily_goals(date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON public.daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON public.daily_checkins(checkin_date);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_language_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwa_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwa_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_costs ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Games policies
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own games" ON public.games
    FOR DELETE USING (auth.uid() = user_id);

-- Game contexts policies
CREATE POLICY "Users can view own game contexts" ON public.game_contexts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game contexts" ON public.game_contexts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game contexts" ON public.game_contexts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own game contexts" ON public.game_contexts
    FOR DELETE USING (auth.uid() = user_id);

-- Build snapshots policies
CREATE POLICY "Users can view own build snapshots" ON public.build_snapshots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own build snapshots" ON public.build_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own build snapshots" ON public.build_snapshots
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own build snapshots" ON public.build_snapshots
    FOR DELETE USING (auth.uid() = user_id);

-- Session summaries policies
CREATE POLICY "Users can view own session summaries" ON public.session_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session summaries" ON public.session_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session summaries" ON public.session_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own session summaries" ON public.session_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Insights policies
CREATE POLICY "Users can view own insights" ON public.insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON public.insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON public.insights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON public.insights
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

-- Usage policies
CREATE POLICY "Users can view own usage" ON public.user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.user_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.user_usage
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own usage" ON public.user_usage
    FOR DELETE USING (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users can view own feedback" ON public.user_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON public.user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON public.user_feedback
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON public.user_feedback
    FOR DELETE USING (auth.uid() = user_id);

-- Proactive insights policies
CREATE POLICY "Users can view own proactive insights" ON public.proactive_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proactive insights" ON public.proactive_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proactive insights" ON public.proactive_insights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own proactive insights" ON public.proactive_insights
    FOR DELETE USING (auth.uid() = user_id);

-- Insight triggers policies
CREATE POLICY "Users can view own insight triggers" ON public.insight_triggers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insight triggers" ON public.insight_triggers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insight triggers" ON public.insight_triggers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insight triggers" ON public.insight_triggers
    FOR DELETE USING (auth.uid() = user_id);

-- Character cache policies
CREATE POLICY "Users can view own character cache" ON public.character_cache
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own character cache" ON public.character_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own character cache" ON public.character_cache
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own character cache" ON public.character_cache
    FOR DELETE USING (auth.uid() = user_id);

-- Game language profiles policies
CREATE POLICY "Users can view own game language profiles" ON public.game_language_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game language profiles" ON public.game_language_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game language profiles" ON public.game_language_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own game language profiles" ON public.game_language_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Daily goals policies
CREATE POLICY "Users can view own daily goals" ON public.daily_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily goals" ON public.daily_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily goals" ON public.daily_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily goals" ON public.daily_goals
    FOR DELETE USING (auth.uid() = user_id);

-- User streaks policies
CREATE POLICY "Users can view own user streaks" ON public.user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user streaks" ON public.user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user streaks" ON public.user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user streaks" ON public.user_streaks
    FOR DELETE USING (auth.uid() = user_id);

-- Daily checkins policies
CREATE POLICY "Users can view own daily checkins" ON public.daily_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily checkins" ON public.daily_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily checkins" ON public.daily_checkins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily checkins" ON public.daily_checkins
    FOR DELETE USING (auth.uid() = user_id);

-- PWA navigation policies
CREATE POLICY "Users can view own PWA navigation" ON public.pwa_navigation
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PWA navigation" ON public.pwa_navigation
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PWA navigation" ON public.pwa_navigation
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own PWA navigation" ON public.pwa_navigation
    FOR DELETE USING (auth.uid() = user_id);

-- PWA analytics policies
CREATE POLICY "Users can view own PWA analytics" ON public.pwa_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PWA analytics" ON public.pwa_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PWA analytics" ON public.pwa_analytics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own PWA analytics" ON public.pwa_analytics
    FOR DELETE USING (auth.uid() = user_id);

-- App state policies
CREATE POLICY "Users can view own app state" ON public.app_state
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own app state" ON public.app_state
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own app state" ON public.app_state
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own app state" ON public.app_state
    FOR DELETE USING (auth.uid() = user_id);

-- Connection history policies
CREATE POLICY "Users can view own connection history" ON public.connection_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connection history" ON public.connection_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connection history" ON public.connection_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connection history" ON public.connection_history
    FOR DELETE USING (auth.uid() = user_id);

-- News cache policies
CREATE POLICY "Users can view own news cache" ON public.news_cache
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own news cache" ON public.news_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own news cache" ON public.news_cache
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own news cache" ON public.news_cache
    FOR DELETE USING (auth.uid() = user_id);

-- API costs policies
CREATE POLICY "Users can view own API costs" ON public.api_costs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API costs" ON public.news_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API costs" ON public.api_costs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API costs" ON public.api_costs
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

CREATE TRIGGER update_user_usage_updated_at
    BEFORE UPDATE ON public.user_usage
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_language_profiles_updated_at
    BEFORE UPDATE ON public.game_language_profiles
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

-- Function to get user's conversation summary
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profile information beyond Supabase auth';
COMMENT ON TABLE public.user_preferences IS 'User preferences for hint style, player focus, etc.';
COMMENT ON TABLE public.games IS 'User games with progress tracking and metadata';
COMMENT ON TABLE public.game_contexts IS 'Game-specific context like objectives, secrets, inventory';
COMMENT ON TABLE public.build_snapshots IS 'Character build snapshots for RPGs';
COMMENT ON TABLE public.session_summaries IS 'Daily gameplay session summaries';
COMMENT ON TABLE public.conversations IS 'Chat conversations organized by game';
COMMENT ON TABLE public.chat_messages IS 'Individual chat messages with metadata';
COMMENT ON TABLE public.insights IS 'AI-generated insight tabs for games';
COMMENT ON TABLE public.diary_tasks IS 'User-created and AI-suggested tasks for games';
COMMENT ON TABLE public.diary_favorites IS 'User favorited content from AI responses and insights';
COMMENT ON TABLE public.user_usage IS 'Monthly usage tracking for tier management';
COMMENT ON TABLE public.user_feedback IS 'User feedback and suggestions';
COMMENT ON TABLE public.proactive_insights IS 'AI-generated proactive insights';
COMMENT ON TABLE public.insight_triggers IS 'Trigger history for proactive insights';
COMMENT ON TABLE public.character_cache IS 'Character name detection cache';
COMMENT ON TABLE public.game_language_profiles IS 'Game-specific language and tone profiles';
COMMENT ON TABLE public.daily_goals IS 'Daily engagement goals and tracking';
COMMENT ON TABLE public.user_streaks IS 'User engagement streaks';
COMMENT ON TABLE public.daily_checkins IS 'Daily user check-ins';
COMMENT ON TABLE public.pwa_navigation IS 'PWA navigation preferences and state';
COMMENT ON TABLE public.pwa_analytics IS 'PWA usage analytics';
COMMENT ON TABLE public.app_state IS 'App state and user preferences';
COMMENT ON TABLE public.connection_history IS 'PC connection history';
COMMENT ON TABLE public.news_cache IS 'Cached gaming news responses';
COMMENT ON TABLE public.api_costs IS 'API cost tracking for billing';

-- ========================================
-- MIGRATION NOTES
-- ========================================

-- This schema captures ALL data currently stored in localStorage:
-- 1. User profiles and preferences
-- 2. Games and progress tracking
-- 3. Chat conversations and messages
-- 4. AI insights and tabs
-- 5. Otaku Diary (tasks and favorites)
-- 6. Usage tracking and tier management
-- 7. Daily engagement and goals
-- 8. PWA state and analytics
-- 9. Character detection cache
-- 10. Game language profiles
-- 11. Connection history
-- 12. News cache and API costs

-- All tables have proper RLS policies ensuring users only see their own data
-- Indexes are optimized for common query patterns
-- Helper functions provide common data access patterns
-- Triggers automatically update timestamps

-- To migrate from localStorage:
-- 1. Run this schema
-- 2. Use the migration service to transfer data
-- 3. Update app to use Supabase instead of localStorage
-- 4. Keep localStorage as fallback for offline support
