-- Otagon App - Master Schema
-- Enhanced Authentication & Onboarding System
-- This schema will grow as we add more pages and features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CORE TABLES
-- ========================================

-- Users table (enhanced with onboarding tracking)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_user_id uuid NOT NULL UNIQUE,
    email text NOT NULL UNIQUE,
    full_name text,
    avatar_url text,
    tier text DEFAULT 'free',
    
    -- Onboarding tracking (exact from old build)
    is_new_user boolean DEFAULT true,
    has_seen_splash_screens boolean DEFAULT false,
    has_profile_setup boolean DEFAULT false,
    has_welcome_message boolean DEFAULT false,
    onboarding_completed boolean DEFAULT false,
    
    -- Developer mode
    is_developer boolean DEFAULT false,
    developer_tier text DEFAULT 'free',
    
    -- Consolidated data (JSONB for flexibility)
    profile_data jsonb DEFAULT '{}'::jsonb,
    preferences jsonb DEFAULT '{}'::jsonb,
    usage_data jsonb DEFAULT '{"textCount": 0, "imageCount": 0, "textLimit": 100, "imageLimit": 10, "totalRequests": 0, "lastReset": 0}'::jsonb,
    app_state jsonb DEFAULT '{}'::jsonb,
    onboarding_data jsonb DEFAULT '{}'::jsonb,
    behavior_data jsonb DEFAULT '{}'::jsonb,
    feedback_data jsonb DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_login timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Onboarding progress tracking
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    step text NOT NULL,
    completed_at timestamptz DEFAULT now(),
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- User sessions (for session management)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    device_info jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    last_activity timestamptz DEFAULT now()
);

-- Waitlist table (for landing page)
CREATE TABLE IF NOT EXISTS public.waitlist (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    source text DEFAULT 'landing_page',
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ========================================
-- GAMING & CONTENT TABLES
-- ========================================

-- Games table
CREATE TABLE IF NOT EXISTS public.games (
    id text NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    genre text,
    platform text,
    release_date date,
    rating numeric(3,1),
    image_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Conversations table (chat history)
CREATE TABLE IF NOT EXISTS public.conversations (
    id text NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    game_id text REFERENCES public.games(id),
    title text,
    messages jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_activity timestamptz DEFAULT now()
);

-- ========================================
-- ANALYTICS & TRACKING TABLES
-- ========================================

-- User analytics
CREATE TABLE IF NOT EXISTS public.user_analytics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS public.api_usage (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    api_type text NOT NULL, -- 'text', 'image', 'voice'
    tokens_used integer DEFAULT 0,
    cost_usd numeric(10,4) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- ========================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ========================================

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add onboarding tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_new_user') THEN
        ALTER TABLE public.users ADD COLUMN is_new_user boolean DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'has_seen_splash_screens') THEN
        ALTER TABLE public.users ADD COLUMN has_seen_splash_screens boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'has_profile_setup') THEN
        ALTER TABLE public.users ADD COLUMN has_profile_setup boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'has_welcome_message') THEN
        ALTER TABLE public.users ADD COLUMN has_welcome_message boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.users ADD COLUMN onboarding_completed boolean DEFAULT false;
    END IF;
    
    -- Add developer mode columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_developer') THEN
        ALTER TABLE public.users ADD COLUMN is_developer boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'developer_tier') THEN
        ALTER TABLE public.users ADD COLUMN developer_tier text DEFAULT 'free';
    END IF;
    
    -- Add JSONB data columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_data') THEN
        ALTER TABLE public.users ADD COLUMN profile_data jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferences') THEN
        ALTER TABLE public.users ADD COLUMN preferences jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'usage_data') THEN
        ALTER TABLE public.users ADD COLUMN usage_data jsonb DEFAULT '{"textCount": 0, "imageCount": 0, "textLimit": 100, "imageLimit": 10, "totalRequests": 0, "lastReset": 0}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'app_state') THEN
        ALTER TABLE public.users ADD COLUMN app_state jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_data') THEN
        ALTER TABLE public.users ADD COLUMN onboarding_data jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'behavior_data') THEN
        ALTER TABLE public.users ADD COLUMN behavior_data jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'feedback_data') THEN
        ALTER TABLE public.users ADD COLUMN feedback_data jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add timestamp columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
        ALTER TABLE public.users ADD COLUMN last_login timestamptz DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.users ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES
-- ========================================

-- Users table policies
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own data" ON public.users;
    DROP POLICY IF EXISTS "Users can update own data" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
    
    -- Create new policies
    CREATE POLICY "Users can view own data" ON public.users
        FOR SELECT USING (auth.uid() = auth_user_id);

    CREATE POLICY "Users can update own data" ON public.users
        FOR UPDATE USING (auth.uid() = auth_user_id);

    CREATE POLICY "Users can insert own data" ON public.users
        FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
END $$;

-- Onboarding progress policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own onboarding progress" ON public.onboarding_progress;
    DROP POLICY IF EXISTS "Users can insert own onboarding progress" ON public.onboarding_progress;
    DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.onboarding_progress;
    
    CREATE POLICY "Users can view own onboarding progress" ON public.onboarding_progress
        FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

    CREATE POLICY "Users can insert own onboarding progress" ON public.onboarding_progress
        FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

    CREATE POLICY "Users can update own onboarding progress" ON public.onboarding_progress
        FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));
END $$;

-- User sessions policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage own sessions" ON public.user_sessions;
    CREATE POLICY "Users can manage own sessions" ON public.user_sessions
        FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));
END $$;

-- Waitlist policies (public access for signups)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public access to waitlist" ON public.waitlist;
    CREATE POLICY "Allow public access to waitlist" ON public.waitlist
        FOR ALL USING (true);
END $$;

-- Games policies (public read access)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view games" ON public.games;
    CREATE POLICY "Anyone can view games" ON public.games
        FOR SELECT USING (true);
END $$;

-- Conversations policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
    
    CREATE POLICY "Users can view own conversations" ON public.conversations
        FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

    CREATE POLICY "Users can insert own conversations" ON public.conversations
        FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

    CREATE POLICY "Users can update own conversations" ON public.conversations
        FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

    CREATE POLICY "Users can delete own conversations" ON public.conversations
        FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));
END $$;

-- Analytics policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own analytics" ON public.user_analytics;
    DROP POLICY IF EXISTS "Users can insert own analytics" ON public.user_analytics;
    
    CREATE POLICY "Users can view own analytics" ON public.user_analytics
        FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

    CREATE POLICY "Users can insert own analytics" ON public.user_analytics
        FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));
END $$;

-- API usage policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own API usage" ON public.api_usage;
    DROP POLICY IF EXISTS "Users can insert own API usage" ON public.api_usage;
    
    CREATE POLICY "Users can view own API usage" ON public.api_usage
        FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

    CREATE POLICY "Users can insert own API usage" ON public.api_usage
        FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));
END $$;

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to create user record after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;

-- Function to update user onboarding status
CREATE OR REPLACE FUNCTION public.update_user_onboarding_status(
    p_user_id uuid,
    p_status text,
    p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Update user onboarding data
    UPDATE public.users 
    SET 
        onboarding_data = onboarding_data || jsonb_build_object(p_status, p_data),
        updated_at = now()
    WHERE auth_user_id = p_user_id;
    
    -- Insert progress record
    INSERT INTO public.onboarding_progress (user_id, step, data)
    VALUES (
        (SELECT id FROM public.users WHERE auth_user_id = p_user_id),
        p_status,
        p_data
    );
END;
$$;

-- Function to get user onboarding status
CREATE OR REPLACE FUNCTION public.get_user_onboarding_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_record public.users%ROWTYPE;
    result jsonb;
BEGIN
    SELECT * INTO user_record 
    FROM public.users 
    WHERE auth_user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN '{"error": "User not found"}'::jsonb;
    END IF;
    
    result := jsonb_build_object(
        'is_new_user', user_record.is_new_user,
        'has_seen_splash_screens', user_record.has_seen_splash_screens,
        'has_profile_setup', user_record.has_profile_setup,
        'has_welcome_message', user_record.has_welcome_message,
        'onboarding_completed', user_record.onboarding_completed,
        'tier', user_record.tier,
        'is_developer', user_record.is_developer
    );
    
    RETURN result;
END;
$$;

-- Function to update user app state
CREATE OR REPLACE FUNCTION public.update_user_app_state(
    p_user_id uuid,
    p_field text,
    p_value jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.users 
    SET 
        app_state = app_state || jsonb_build_object(p_field, p_value),
        updated_at = now()
    WHERE auth_user_id = p_user_id;
END;
$$;

-- Function to update user profile data
CREATE OR REPLACE FUNCTION public.update_user_profile_data(
    p_user_id uuid,
    p_field text,
    p_value jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.users 
    SET 
        profile_data = profile_data || jsonb_build_object(p_field, p_value),
        updated_at = now()
    WHERE auth_user_id = p_user_id;
END;
$$;

-- Function to get user profile data
CREATE OR REPLACE FUNCTION public.get_user_profile_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_record public.users%ROWTYPE;
BEGIN
    SELECT * INTO user_record 
    FROM public.users 
    WHERE auth_user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN '{"error": "User not found"}'::jsonb;
    END IF;
    
    RETURN user_record.profile_data;
END;
$$;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger to create user record after auth signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- INDEXES
-- ========================================

-- Users table indexes
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_tier ON public.users(tier);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Onboarding progress indexes
CREATE INDEX idx_onboarding_progress_user_id ON public.onboarding_progress(user_id);
CREATE INDEX idx_onboarding_progress_step ON public.onboarding_progress(step);
CREATE INDEX idx_onboarding_progress_created_at ON public.onboarding_progress(created_at);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Waitlist indexes
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at);
CREATE INDEX idx_waitlist_status ON public.waitlist(status);

-- Games indexes
CREATE INDEX idx_games_title ON public.games(title);
CREATE INDEX idx_games_genre ON public.games(genre);
CREATE INDEX idx_games_platform ON public.games(platform);

-- Conversations indexes
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_game_id ON public.conversations(game_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX idx_conversations_last_activity ON public.conversations(last_activity);

-- Analytics indexes
CREATE INDEX idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX idx_user_analytics_event_type ON public.user_analytics(event_type);
CREATE INDEX idx_user_analytics_created_at ON public.user_analytics(created_at);

-- API usage indexes
CREATE INDEX idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX idx_api_usage_type ON public.api_usage(api_type);
CREATE INDEX idx_api_usage_created_at ON public.api_usage(created_at);

-- ========================================
-- SAMPLE DATA (for development)
-- ========================================

-- Insert sample games (only if they don't exist)
INSERT INTO public.games (id, title, description, genre, platform, release_date, rating) VALUES
('elden-ring', 'Elden Ring', 'An action RPG set in a fantasy world', 'RPG', 'PC', '2022-02-25', 9.5),
('zelda-totk', 'The Legend of Zelda: Tears of the Kingdom', 'An action-adventure game', 'Action-Adventure', 'Nintendo Switch', '2023-05-12', 9.0),
('baldurs-gate-3', 'Baldur''s Gate 3', 'A role-playing video game', 'RPG', 'PC', '2023-08-03', 9.5)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- GRANTS
-- ========================================

-- Note: If you get function signature conflicts, run these commands manually in Supabase SQL editor:
-- DROP FUNCTION IF EXISTS public.get_complete_user_data CASCADE;
-- DROP FUNCTION IF EXISTS public.create_user_record CASCADE;

-- Function to get complete user data
CREATE OR REPLACE FUNCTION public.get_complete_user_data(p_auth_user_id uuid)
RETURNS TABLE (
    user_id uuid,
    email text,
    tier text,
    is_developer boolean,
    has_profile_setup boolean,
    has_seen_splash_screens boolean,
    has_welcome_message boolean,
    is_new_user boolean,
    has_used_trial boolean,
    trial_expires_at timestamptz,
    text_count integer,
    image_count integer,
    text_limit integer,
    image_limit integer,
    preferences jsonb,
    app_state jsonb,
    profile_data jsonb,
    onboarding_data jsonb,
    behavior_data jsonb,
    feedback_data jsonb,
    usage_data jsonb,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        u.tier,
        u.is_developer,
        u.has_profile_setup,
        u.has_seen_splash_screens,
        u.has_welcome_message,
        u.is_new_user,
        u.has_used_trial,
        u.trial_expires_at,
        COALESCE((u.usage_data->>'textCount')::integer, 0) as text_count,
        COALESCE((u.usage_data->>'imageCount')::integer, 0) as image_count,
        COALESCE((u.usage_data->>'textLimit')::integer, 100) as text_limit,
        COALESCE((u.usage_data->>'imageLimit')::integer, 10) as image_limit,
        u.preferences,
        u.app_state,
        u.profile_data,
        u.onboarding_data,
        u.behavior_data,
        u.feedback_data,
        u.usage_data,
        u.created_at,
        u.updated_at
    FROM public.users u
    WHERE u.auth_user_id = p_auth_user_id;
END;
$$;

-- Function to create user record manually (for OAuth users)
CREATE OR REPLACE FUNCTION public.create_user_record(
    p_auth_user_id uuid,
    p_email text,
    p_full_name text DEFAULT NULL,
    p_avatar_url text DEFAULT NULL,
    p_is_developer boolean DEFAULT false,
    p_tier text DEFAULT 'free'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (
        auth_user_id,
        email,
        full_name,
        avatar_url,
        is_developer,
        tier
    ) VALUES (
        p_auth_user_id,
        p_email,
        p_full_name,
        p_avatar_url,
        p_is_developer,
        p_tier
    ) ON CONFLICT (auth_user_id) DO NOTHING;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;