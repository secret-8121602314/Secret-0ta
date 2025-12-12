-- APPLY THIS IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/sql

-- This migration splits grounding usage into two separate pools:
-- 1. Game Knowledge: 20 searches/month for new games (post Jan 2025)
-- 2. AI Messages: 30 searches/month for chat queries (news, patches, meta)

-- Add new columns to track usage types separately
ALTER TABLE public.user_grounding_usage
ADD COLUMN IF NOT EXISTS game_knowledge_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_message_count INTEGER NOT NULL DEFAULT 0;

-- Migrate existing usage_count to ai_message_count (most usage is from chat)
UPDATE public.user_grounding_usage
SET ai_message_count = usage_count
WHERE ai_message_count = 0;

-- Update the increment function to support usage type
CREATE OR REPLACE FUNCTION public.increment_grounding_usage(
    p_auth_user_id UUID,
    p_month_year VARCHAR(7),
    p_usage_type VARCHAR(20) DEFAULT 'ai_message' -- 'game_knowledge' or 'ai_message'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_usage_type = 'game_knowledge' THEN
        INSERT INTO public.user_grounding_usage (auth_user_id, month_year, game_knowledge_count, usage_count)
        VALUES (p_auth_user_id, p_month_year, 1, 1)
        ON CONFLICT (auth_user_id, month_year)
        DO UPDATE SET 
            game_knowledge_count = public.user_grounding_usage.game_knowledge_count + 1,
            usage_count = public.user_grounding_usage.usage_count + 1,
            updated_at = NOW();
    ELSE -- ai_message
        INSERT INTO public.user_grounding_usage (auth_user_id, month_year, ai_message_count, usage_count)
        VALUES (p_auth_user_id, p_month_year, 1, 1)
        ON CONFLICT (auth_user_id, month_year)
        DO UPDATE SET 
            ai_message_count = public.user_grounding_usage.ai_message_count + 1,
            usage_count = public.user_grounding_usage.usage_count + 1,
            updated_at = NOW();
    END IF;
END;
$$;

-- Grant execute permission (with new signature)
GRANT EXECUTE ON FUNCTION public.increment_grounding_usage(UUID, VARCHAR, VARCHAR) TO authenticated;

-- Update comments
COMMENT ON TABLE public.user_grounding_usage IS 'Tracks monthly Google Search grounding usage per user. Split into two pools: Game Knowledge (20/mo) and AI Messages (30/mo) for Pro/Vanguard tiers.';
COMMENT ON COLUMN public.user_grounding_usage.usage_count IS 'DEPRECATED: Total grounding searches (kept for backward compatibility). Use game_knowledge_count + ai_message_count instead.';
COMMENT ON COLUMN public.user_grounding_usage.game_knowledge_count IS 'Number of game knowledge grounding searches used this month (limit: 20 for Pro/Vanguard)';
COMMENT ON COLUMN public.user_grounding_usage.ai_message_count IS 'Number of AI message grounding searches used this month (limit: 30 for Pro/Vanguard)';

-- Verify the migration
SELECT 
  'Migration complete' as status,
  COUNT(*) as total_records,
  SUM(game_knowledge_count) as total_game_knowledge,
  SUM(ai_message_count) as total_ai_messages
FROM public.user_grounding_usage;
