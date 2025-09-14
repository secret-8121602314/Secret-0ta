-- Analytics Table Fix Script
-- Run this in your Supabase SQL Editor to ensure analytics tables exist

-- Create analytics_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    category TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_id TEXT,
    step_name TEXT,
    step_order INTEGER,
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_tier TEXT,
    platform TEXT,
    version TEXT,
    behavior_type TEXT,
    skipped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on analytics tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics_events
DROP POLICY IF EXISTS "analytics_events_select_policy" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_insert_policy" ON public.analytics_events;

CREATE POLICY "analytics_events_select_policy" ON public.analytics_events
    FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "analytics_events_insert_policy" ON public.analytics_events
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- Create RLS policies for analytics
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics;

CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR SELECT USING (user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = (select auth.uid()) AND deleted_at IS NULL
    ));

CREATE POLICY "Users can insert own analytics" ON public.analytics
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = (select auth.uid()) AND deleted_at IS NULL
    ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON public.analytics_events(category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON public.analytics(session_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT SELECT, INSERT ON public.analytics TO authenticated;

-- Test the tables
SELECT 'analytics_events table created successfully' as status;
SELECT 'analytics table created successfully' as status;

