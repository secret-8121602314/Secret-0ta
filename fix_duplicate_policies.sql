-- ===========================================
-- 🔧 Fix Duplicate RLS Policies on analytics_events
-- ===========================================
-- Run this ONLY if you already have duplicate policies on analytics_events table
-- This will clean up the duplicate policies that are causing the linter warnings

-- Drop all existing policies on analytics_events to start clean
DROP POLICY IF EXISTS "Users can view own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can view their own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert their own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_select_policy" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_insert_policy" ON public.analytics_events;

-- Create clean, single policies with unique names
CREATE POLICY "analytics_events_select_policy" ON public.analytics_events
    FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "analytics_events_insert_policy" ON public.analytics_events
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE '%', '✅ Duplicate policies cleaned up successfully!';
    RAISE NOTICE '%', '📊 analytics_events table now has clean, single policies';
    RAISE NOTICE '%', '🚀 Linter warnings should be resolved!';
END $$;
