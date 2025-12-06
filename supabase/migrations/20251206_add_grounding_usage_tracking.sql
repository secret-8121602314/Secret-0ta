-- Migration: Add grounding usage tracking table
-- This tracks monthly Google Search grounding usage per user tier

-- Create the grounding usage table
CREATE TABLE IF NOT EXISTS user_grounding_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g., "2025-12")
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one record per user per month
    UNIQUE(auth_user_id, month_year)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_grounding_usage_user_month 
ON user_grounding_usage(auth_user_id, month_year);

-- Enable RLS
ALTER TABLE user_grounding_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own grounding usage
-- Using (select auth.uid()) for better performance (evaluated once, not per row)
CREATE POLICY "Users can view own grounding usage" ON user_grounding_usage
    FOR SELECT
    USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert own grounding usage" ON user_grounding_usage
    FOR INSERT
    WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update own grounding usage" ON user_grounding_usage
    FOR UPDATE
    USING ((select auth.uid()) = auth_user_id)
    WITH CHECK ((select auth.uid()) = auth_user_id);

-- Function to increment grounding usage
-- Set search_path for security
CREATE OR REPLACE FUNCTION public.increment_grounding_usage(
    p_auth_user_id UUID,
    p_month_year VARCHAR(7)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_grounding_usage (auth_user_id, month_year, usage_count)
    VALUES (p_auth_user_id, p_month_year, 1)
    ON CONFLICT (auth_user_id, month_year)
    DO UPDATE SET 
        usage_count = public.user_grounding_usage.usage_count + 1,
        updated_at = NOW();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_grounding_usage(UUID, VARCHAR) TO authenticated;

-- Comment for documentation
COMMENT ON TABLE user_grounding_usage IS 'Tracks monthly Google Search grounding usage per user to enforce tier limits (Free: 8/mo, Pro: 30/mo, Vanguard: 100/mo)';
COMMENT ON COLUMN user_grounding_usage.month_year IS 'Month in YYYY-MM format for monthly usage tracking';
COMMENT ON COLUMN user_grounding_usage.usage_count IS 'Number of grounding searches used this month';
