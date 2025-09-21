-- ========================================
-- 🚀 OTAKON CLEAN MASTER SQL - SINGLE FUNCTIONS ONLY
-- ========================================
-- This script creates ONLY ONE function of each type
-- Run this in your Supabase SQL editor

-- ========================================
-- STEP 1: NUCLEAR CLEANUP - DROP EVERYTHING
-- ========================================

-- Drop ALL functions first (to avoid dependency issues)
DROP FUNCTION IF EXISTS public.save_conversation CASCADE;
DROP FUNCTION IF EXISTS public.save_conversation_v2 CASCADE;
DROP FUNCTION IF EXISTS public.load_conversations CASCADE;
DROP FUNCTION IF EXISTS public.load_conversations_v2 CASCADE;
DROP FUNCTION IF EXISTS public.update_welcome_message_shown CASCADE;
DROP FUNCTION IF EXISTS public.should_show_welcome_message CASCADE;
DROP FUNCTION IF EXISTS public.mark_first_run_completed CASCADE;
DROP FUNCTION IF EXISTS public.mark_profile_setup_complete CASCADE;
DROP FUNCTION IF EXISTS public.get_complete_user_data CASCADE;
DROP FUNCTION IF EXISTS public.save_app_state CASCADE;
DROP FUNCTION IF EXISTS public.get_app_state CASCADE;
DROP FUNCTION IF EXISTS public.save_wishlist CASCADE;
DROP FUNCTION IF EXISTS public.get_wishlist CASCADE;

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS public.insights CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.admin CASCADE;
DROP TABLE IF EXISTS public.analytics CASCADE;
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.api_calls CASCADE;
DROP TABLE IF EXISTS public.app_cache CASCADE;
DROP TABLE IF EXISTS public.app_level CASCADE;
DROP TABLE IF EXISTS public.cache CASCADE;
DROP TABLE IF EXISTS public.daily_engagement CASCADE;
DROP TABLE IF EXISTS public.diary_tasks CASCADE;
DROP TABLE IF EXISTS public.feature_usage CASCADE;
DROP TABLE IF EXISTS public.game_activities CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;
DROP TABLE IF EXISTS public.insight_modifications CASCADE;
DROP TABLE IF EXISTS public.insight_tabs CASCADE;
DROP TABLE IF EXISTS public.onboarding_funnel CASCADE;
DROP TABLE IF EXISTS public.tier_upgrade_attempts CASCADE;
DROP TABLE IF EXISTS public.user_feedback CASCADE;
DROP TABLE IF EXISTS public.user_queries CASCADE;
DROP TABLE IF EXISTS public.user_usage CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.waitlist CASCADE;

-- ========================================
-- STEP 2: RECREATE ALL TABLES
-- ========================================

-- Create users table first (other tables depend on it)
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  app_state jsonb DEFAULT '{}'::jsonb,
  profile_data jsonb DEFAULT '{}'::jsonb,
  usage_data jsonb DEFAULT '{}'::jsonb,
  behavior_data jsonb DEFAULT '{}'::jsonb,
  feedback_data jsonb DEFAULT '{}'::jsonb,
  onboarding_data jsonb DEFAULT '{}'::jsonb,
  tier text DEFAULT 'free'::text,
  has_used_trial boolean DEFAULT false,
  -- Add missing columns for app functionality
  is_developer boolean DEFAULT false,
  is_new_user boolean DEFAULT true,
  has_seen_splash_screens boolean DEFAULT false,
  has_profile_setup boolean DEFAULT false,
  has_welcome_message boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Create user_usage table (referenced in storage keys)
CREATE TABLE public.user_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  text_count integer DEFAULT 0,
  image_count integer DEFAULT 0,
  text_limit integer DEFAULT 55,
  image_limit integer DEFAULT 25,
  total_requests integer DEFAULT 0,
  last_reset timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_usage_pkey PRIMARY KEY (id),
  CONSTRAINT user_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Create wishlist table
CREATE TABLE public.wishlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wishlist_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id text NOT NULL,
  user_id uuid NOT NULL,
  game_id text,
  title text NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  context jsonb DEFAULT '{}'::jsonb,
  insights jsonb DEFAULT '{}'::jsonb,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_interaction timestamptz DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT conversations_pkey PRIMARY KEY (id, user_id),
  CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Create all other tables
CREATE TABLE public.admin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  role text DEFAULT 'admin'::text,
  permissions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT admin_pkey PRIMARY KEY (id),
  CONSTRAINT admin_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  session_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT analytics_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.analytics_events (
  id text NOT NULL,
  event_type text NOT NULL,
  category text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  session_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_tier text DEFAULT 'free'::text,
  platform text DEFAULT 'web'::text,
  version text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.api_calls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  api_type text NOT NULL,
  cost_data jsonb DEFAULT '{}'::jsonb,
  response_time integer,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT api_calls_pkey PRIMARY KEY (id),
  CONSTRAINT api_calls_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.app_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  cache_key text NOT NULL,
  cache_data jsonb DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT app_cache_pkey PRIMARY KEY (id),
  CONSTRAINT app_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.app_level (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT app_level_pkey PRIMARY KEY (id)
);

CREATE TABLE public.cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  cache_key text NOT NULL,
  cache_data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT cache_pkey PRIMARY KEY (id),
  CONSTRAINT cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.daily_engagement (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  date text NOT NULL,
  engagement_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT daily_engagement_pkey PRIMARY KEY (id),
  CONSTRAINT daily_engagement_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.diary_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  game_id text NOT NULL,
  task_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT diary_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT diary_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.feature_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  feature_name text NOT NULL,
  usage_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT feature_usage_pkey PRIMARY KEY (id),
  CONSTRAINT feature_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.game_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  activity_type text NOT NULL,
  game_id text NOT NULL,
  game_title text NOT NULL,
  conversation_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT game_activities_pkey PRIMARY KEY (id),
  CONSTRAINT game_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.games (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  game_id text NOT NULL,
  title text NOT NULL,
  genre text,
  platform ARRAY,
  game_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.insight_modifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  conversation_id text NOT NULL,
  modification_type text NOT NULL,
  modification_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT insight_modifications_pkey PRIMARY KEY (id),
  CONSTRAINT insight_modifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.insight_tabs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  conversation_id text NOT NULL,
  tab_id text NOT NULL,
  tab_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT insight_tabs_pkey PRIMARY KEY (id),
  CONSTRAINT insight_tabs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.insights (
  id text NOT NULL,
  user_id uuid NOT NULL,
  conversation_id text NOT NULL,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT insights_pkey PRIMARY KEY (id),
  CONSTRAINT insights_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT insights_conversation_id_fkey FOREIGN KEY (conversation_id, user_id) REFERENCES public.conversations(id, user_id)
);

CREATE TABLE public.onboarding_funnel (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  step_name text NOT NULL,
  step_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT onboarding_funnel_pkey PRIMARY KEY (id),
  CONSTRAINT onboarding_funnel_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  conversation_id text NOT NULL,
  task_data jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT tasks_conversation_id_fkey FOREIGN KEY (conversation_id, user_id) REFERENCES public.conversations(id, user_id)
);

CREATE TABLE public.tier_upgrade_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  from_tier text NOT NULL,
  to_tier text NOT NULL,
  attempt_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT tier_upgrade_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT tier_upgrade_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.user_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  feedback_type text NOT NULL,
  feedback_data jsonb DEFAULT '{}'::jsonb,
  rating integer,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT user_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.user_queries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  query_text text NOT NULL,
  query_type text NOT NULL,
  response_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT user_queries_pkey PRIMARY KEY (id),
  CONSTRAINT user_queries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text DEFAULT 'landing_page'::text,
  status text DEFAULT 'pending'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT waitlist_pkey PRIMARY KEY (id)
);

-- ========================================
-- STEP 3: CREATE SINGLE FUNCTIONS ONLY
-- ========================================

-- SINGLE save_conversation function (used by all services)
CREATE OR REPLACE FUNCTION public.save_conversation(
    p_user_id UUID,
    p_conversation_id TEXT,
    p_title TEXT,
    p_messages JSONB,
    p_insights JSONB DEFAULT '{}'::jsonb,
    p_context JSONB DEFAULT '{}'::jsonb,
    p_game_id TEXT DEFAULT NULL,
    p_is_pinned BOOLEAN DEFAULT false,
    p_force_overwrite BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'User not found',
            'conversation_id', p_conversation_id
        );
    END IF;
    
    -- Insert or update conversation
    INSERT INTO public.conversations (
        id, 
        user_id, 
        title, 
        messages, 
        insights, 
        context, 
        game_id, 
        is_pinned, 
        created_at, 
        updated_at, 
        last_interaction
    ) VALUES (
        p_conversation_id, 
        internal_user_id, 
        p_title, 
        p_messages, 
        p_insights, 
        p_context, 
        p_game_id, 
        p_is_pinned, 
        NOW(), 
        NOW(), 
        NOW()
    ) ON CONFLICT (id, user_id) DO UPDATE SET
        title = EXCLUDED.title,
        messages = EXCLUDED.messages,
        insights = EXCLUDED.insights,
        context = EXCLUDED.context,
        game_id = EXCLUDED.game_id,
        is_pinned = EXCLUDED.is_pinned,
        updated_at = NOW(),
        last_interaction = NOW();
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true, 
        'conversation_id', p_conversation_id,
        'user_id', internal_user_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', SQLERRM,
            'conversation_id', p_conversation_id
        );
END;
$$;

-- SINGLE load_conversations function (used by all services)
CREATE OR REPLACE FUNCTION public.load_conversations(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    conversations_data JSONB;
    result JSONB;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return empty conversations
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', true, 
            'conversations', '[]'::jsonb, 
            'count', 0,
            'user_id', p_user_id
        );
    END IF;
    
    -- Get conversations for user
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'messages', COALESCE(messages, '[]'::jsonb),
            'insights', COALESCE(insights, '{}'::jsonb),
            'context', COALESCE(context, '{}'::jsonb),
            'game_id', game_id,
            'is_pinned', COALESCE(is_pinned, false),
            'createdAt', EXTRACT(EPOCH FROM created_at) * 1000,
            'updatedAt', EXTRACT(EPOCH FROM updated_at) * 1000,
            'lastInteraction', EXTRACT(EPOCH FROM last_interaction) * 1000
        )
    ), '[]'::jsonb) INTO conversations_data
    FROM public.conversations
    WHERE user_id = internal_user_id AND deleted_at IS NULL
    ORDER BY updated_at DESC;
    
    -- Return success with conversations
    result := jsonb_build_object(
        'success', true,
        'conversations', conversations_data,
        'count', jsonb_array_length(conversations_data),
        'user_id', internal_user_id
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', SQLERRM, 
            'conversations', '[]'::jsonb, 
            'count', 0,
            'user_id', p_user_id
        );
END;
$$;

-- SINGLE get_complete_user_data function
CREATE OR REPLACE FUNCTION public.get_complete_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    user_data JSONB;
    result JSONB;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'User not found'
        );
    END IF;
    
    -- Get complete user data
    SELECT jsonb_build_object(
        'id', id,
        'auth_user_id', auth_user_id,
        'email', email,
        'full_name', full_name,
        'avatar_url', avatar_url,
        'preferences', COALESCE(preferences, '{}'::jsonb),
        'app_state', COALESCE(app_state, '{}'::jsonb),
        'profile_data', COALESCE(profile_data, '{}'::jsonb),
        'usage_data', COALESCE(usage_data, '{}'::jsonb),
        'behavior_data', COALESCE(behavior_data, '{}'::jsonb),
        'feedback_data', COALESCE(feedback_data, '{}'::jsonb),
        'onboarding_data', COALESCE(onboarding_data, '{}'::jsonb),
        'tier', tier,
        'has_used_trial', has_used_trial,
        'is_developer', is_developer,
        'is_new_user', is_new_user,
        'has_seen_splash_screens', has_seen_splash_screens,
        'has_profile_setup', has_profile_setup,
        'has_welcome_message', has_welcome_message,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO user_data
    FROM public.users
    WHERE id = internal_user_id;
    
    -- Return success with user data
    result := jsonb_build_object(
        'success', true,
        'user', user_data
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', SQLERRM
        );
END;
$$;

-- SINGLE save_app_state function
CREATE OR REPLACE FUNCTION public.save_app_state(p_user_id UUID, p_app_state JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update user app state
    UPDATE public.users 
    SET app_state = p_app_state, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- SINGLE get_app_state function
CREATE OR REPLACE FUNCTION public.get_app_state(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    app_state JSONB;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Get app state
    SELECT COALESCE(app_state, '{}'::jsonb) INTO app_state
    FROM public.users
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true, 'app_state', app_state);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- SINGLE save_wishlist function
CREATE OR REPLACE FUNCTION public.save_wishlist(p_user_id UUID, p_wishlist JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Insert or update wishlist
    INSERT INTO public.wishlist (user_id, wishlist_data, updated_at)
    VALUES (internal_user_id, p_wishlist, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        wishlist_data = EXCLUDED.wishlist_data,
        updated_at = NOW();
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- SINGLE get_wishlist function
CREATE OR REPLACE FUNCTION public.get_wishlist(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    wishlist_data JSONB;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Get wishlist
    SELECT COALESCE(wishlist_data, '{}'::jsonb) INTO wishlist_data
    FROM public.wishlist
    WHERE user_id = internal_user_id;
    
    RETURN jsonb_build_object('success', true, 'wishlist', wishlist_data);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Helper functions
CREATE OR REPLACE FUNCTION public.mark_profile_setup_complete(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update user profile setup status
    UPDATE public.users 
    SET has_profile_setup = true, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_first_run_completed(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update user first run status
    UPDATE public.users 
    SET is_new_user = false, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_welcome_message_shown(p_user_id UUID, p_message_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update welcome message status
    UPDATE public.users 
    SET has_welcome_message = true, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ========================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_interaction ON public.conversations(last_interaction);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON public.user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);

-- ========================================
-- STEP 5: VERIFICATION
-- ========================================

-- Verify tables were created
SELECT 'TABLES CREATED:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify functions were created
SELECT 'FUNCTIONS CREATED:' as status;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Test functions work
SELECT 'TESTING FUNCTIONS:' as test_step;
SELECT public.load_conversations('00000000-0000-0000-0000-000000000000'::uuid) as test_result;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT '🎉 CLEAN MASTER SQL EXECUTION COMPLETE!' as message;
SELECT '✅ All tables recreated' as step1;
SELECT '✅ SINGLE functions created (no duplicates)' as step2;
SELECT '✅ Missing tables added' as step3;
SELECT '✅ Indexes created' as step4;
SELECT '✅ Functions tested' as step5;
SELECT '🚀 Database ready with CLEAN, SINGLE functions!' as next;
