-- ========================================
-- ADD MIGRATION TABLES FOR LOCALSTORAGE MIGRATION
-- Safe migration without breaking existing functionality
-- ========================================

-- 1. USER ANALYTICS TABLE (for feedback, PWA, daily goals, etc.)
CREATE TABLE IF NOT EXISTS public.user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'feedback', 'pwa', 'daily_goals', 'api_costs', 'usage'
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own analytics" ON public.user_analytics
    FOR ALL USING ((select auth.uid()) = user_id);

-- 2. USER PREFERENCES TABLE (for TTS, PWA, general settings)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'tts', 'pwa', 'general', 'onboarding'
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, key)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING ((select auth.uid()) = user_id);

-- 3. USER SESSIONS TABLE (for daily goals, streaks, check-ins)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    data JSONB NOT NULL, -- goals, streaks, check-ins, session time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, session_date)
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own sessions" ON public.user_sessions
    FOR ALL USING ((select auth.uid()) = user_id);

-- 4. APP STATE TABLE (for onboarding, connection history, etc.)
CREATE TABLE IF NOT EXISTS public.app_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL, -- 'onboarding_complete', 'has_connected_before', etc.
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- Enable RLS
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own app state" ON public.app_state
    FOR ALL USING ((select auth.uid()) = user_id);

-- 5. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_category ON public.user_analytics(user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_category ON public.user_preferences(user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_date ON public.user_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_app_state_user_key ON public.app_state(user_id, key);

-- 6. ADD UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_user_analytics_updated_at 
    BEFORE UPDATE ON public.user_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON public.user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_state_updated_at 
    BEFORE UPDATE ON public.app_state 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. VERIFY CREATION
SELECT 
    'Migration tables created successfully!' as status,
    'user_analytics' as table1,
    'user_preferences' as table2,
    'user_sessions' as table3,
    'app_state' as table4,
    'All tables have RLS and triggers' as security_status;
