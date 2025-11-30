-- ============================================================================
-- AI Feedback Table Migration
-- ============================================================================
-- This migration creates the ai_feedback table for storing user feedback
-- on AI responses and subtab content.
-- 
-- Created: 2025-02-01
-- Purpose: Track user satisfaction with AI responses to improve quality
-- ============================================================================

-- Drop existing objects if they exist (for clean re-run)
DROP VIEW IF EXISTS public.ai_feedback_stats;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.ai_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.ai_feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON public.ai_feedback;
DROP POLICY IF EXISTS "Users can delete own feedback" ON public.ai_feedback;
DROP TABLE IF EXISTS public.ai_feedback;

-- Create the ai_feedback table
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE SET NULL,
    message_id TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('up', 'down')),
    content_type TEXT NOT NULL CHECK (content_type IN ('message', 'subtab')),
    category TEXT CHECK (category IN ('not_helpful', 'incorrect', 'off_topic', 'inappropriate', 'other')),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_conversation_id ON public.ai_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_message_id ON public.ai_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON public.ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at ON public.ai_feedback(created_at DESC);

-- Unique constraint to prevent duplicate feedback on the same message
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_feedback_unique_feedback 
    ON public.ai_feedback(user_id, message_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own feedback
-- Using (select auth.uid()) for better performance at scale
CREATE POLICY "Users can view own feedback" 
    ON public.ai_feedback 
    FOR SELECT 
    USING ((select auth.uid()) = user_id);

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" 
    ON public.ai_feedback 
    FOR INSERT 
    WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update own feedback" 
    ON public.ai_feedback 
    FOR UPDATE 
    USING ((select auth.uid()) = user_id);

-- Policy: Users can delete their own feedback
CREATE POLICY "Users can delete own feedback" 
    ON public.ai_feedback 
    FOR DELETE 
    USING ((select auth.uid()) = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_feedback TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- Analytics View (Optional - for admin dashboard)
-- ============================================================================
-- This view provides aggregated feedback statistics for monitoring
-- Using SECURITY INVOKER (default) to respect the querying user's permissions

CREATE OR REPLACE VIEW public.ai_feedback_stats 
WITH (security_invoker = true) AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE feedback_type = 'up') as positive_count,
    COUNT(*) FILTER (WHERE feedback_type = 'down') as negative_count,
    COUNT(*) FILTER (WHERE category = 'not_helpful') as not_helpful_count,
    COUNT(*) FILTER (WHERE category = 'incorrect') as incorrect_count,
    COUNT(*) FILTER (WHERE category = 'off_topic') as off_topic_count,
    COUNT(*) FILTER (WHERE category = 'inappropriate') as inappropriate_count,
    COUNT(*) FILTER (WHERE category = 'other') as other_count
FROM public.ai_feedback
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant read access to the stats view for admins
GRANT SELECT ON public.ai_feedback_stats TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.ai_feedback IS 'Stores user feedback (thumbs up/down) on AI responses and subtab content';
COMMENT ON COLUMN public.ai_feedback.feedback_type IS 'Type of feedback: up (positive) or down (negative)';
COMMENT ON COLUMN public.ai_feedback.content_type IS 'Whether feedback is for a message or subtab';
COMMENT ON COLUMN public.ai_feedback.category IS 'Category of negative feedback for analysis';
COMMENT ON COLUMN public.ai_feedback.comment IS 'Optional user comment explaining their feedback';
