-- Otagon App - Complete Database Schema
-- This schema includes all tables and functions needed for the app

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
    
    -- Onboarding tracking
    is_new_user boolean DEFAULT true,
    has_seen_splash_screens boolean DEFAULT false,
    has_profile_setup boolean DEFAULT false,
    has_welcome_message boolean DEFAULT false,
    onboarding_completed boolean DEFAULT false,
    
    -- Developer mode
    is_developer boolean DEFAULT false,
    developer_tier text DEFAULT 'free',
    
    -- Trial tracking
    has_used_trial boolean DEFAULT false,
    trial_started_at timestamptz,
    trial_expires_at timestamptz,
    
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

-- Waitlist table (for landing page)
CREATE TABLE IF NOT EXISTS public.waitlist (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    source text DEFAULT 'landing_page',
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
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
    title text NOT NULL,
    messages jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- User analytics table
CREATE TABLE IF NOT EXISTS public.user_analytics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

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
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID once
    current_user_id := (select auth.uid());
    
    -- Check if the requesting user is the same as the requested user
    IF current_user_id IS NULL OR current_user_id != p_auth_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
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
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID once
    current_user_id := (select auth.uid());
    
    -- Check if the requesting user is the same as the user being created
    IF current_user_id IS NULL OR current_user_id != p_auth_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
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
DECLARE
    current_user_id uuid;
BEGIN
    current_user_id := (select auth.uid());
    
    -- Check if user has access
    IF current_user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.users WHERE id = p_user_id AND auth_user_id = current_user_id
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Update onboarding status based on step
    CASE p_status
        WHEN 'initial' THEN
            UPDATE public.users 
            SET has_seen_splash_screens = true, updated_at = now()
            WHERE id = p_user_id;
        WHEN 'profile-setup' THEN
            UPDATE public.users 
            SET has_profile_setup = true, updated_at = now()
            WHERE id = p_user_id;
        WHEN 'complete' THEN
            UPDATE public.users 
            SET has_welcome_message = true, onboarding_completed = true, updated_at = now()
            WHERE id = p_user_id;
    END CASE;
    
    -- Insert progress record
    INSERT INTO public.onboarding_progress (user_id, step, data)
    VALUES (p_user_id, p_status, p_data);
END;
$$;

-- Function to get user onboarding status
CREATE OR REPLACE FUNCTION public.get_user_onboarding_status(p_user_id uuid)
RETURNS TABLE (
    is_new_user boolean,
    has_seen_splash_screens boolean,
    has_profile_setup boolean,
    has_welcome_message boolean,
    onboarding_completed boolean,
    tier text,
    is_developer boolean
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    current_user_id := (select auth.uid());
    
    -- Check if user has access
    IF current_user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.users WHERE id = p_user_id AND auth_user_id = current_user_id
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        u.is_new_user,
        u.has_seen_splash_screens,
        u.has_profile_setup,
        u.has_welcome_message,
        u.onboarding_completed,
        u.tier,
        u.is_developer
    FROM public.users u
    WHERE u.id = p_user_id;
END;
$$;

-- ========================================
-- TRIGGERS
-- ========================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_games_updated_at ON public.games;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;

-- Trigger to create user record after auth signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can insert own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Anyone can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.user_analytics;

-- RLS Policies for users table
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth_user_id = (select auth.uid()));

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth_user_id = (select auth.uid()));

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth_user_id = (select auth.uid()));

-- RLS Policies for onboarding_progress table
CREATE POLICY "Users can view own onboarding progress" ON public.onboarding_progress
    FOR SELECT USING (user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Users can insert own onboarding progress" ON public.onboarding_progress
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Users can update own onboarding progress" ON public.onboarding_progress
    FOR UPDATE USING (user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
    ));

-- RLS Policies for waitlist table (public access for signup)
-- Drop any existing waitlist policies first
DROP POLICY IF EXISTS "Allow anonymous access to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow authenticated access to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist;

CREATE POLICY "waitlist_select_policy" ON public.waitlist
    FOR SELECT USING (true);

CREATE POLICY "waitlist_insert_policy" ON public.waitlist
    FOR INSERT WITH CHECK (true);

-- RLS Policies for conversations table
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
    ));

-- RLS Policies for user_analytics table
CREATE POLICY "Users can view own analytics" ON public.user_analytics
    FOR SELECT USING (user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Users can insert own analytics" ON public.user_analytics
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = (select auth.uid())
    ));

-- ========================================
-- GRANTS
-- ========================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
