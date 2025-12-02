-- ============================================================================
-- AI Behavior System Migration
-- ============================================================================
-- This migration adds support for non-repetitive AI responses and 
-- feedback-driven behavior corrections.
--
-- Changes:
-- 1. Creates ai_shown_prompts table for tracking displayed prompts
-- 2. Extends ai_feedback table with correction fields
-- 3. Adds indexes and RLS policies
--
-- Created: 2025-12-02
-- ============================================================================

-- ============================================================================
-- 1. CREATE AI_SHOWN_PROMPTS TABLE
-- ============================================================================
-- Tracks prompts shown to users to avoid repetition

CREATE TABLE IF NOT EXISTS public.ai_shown_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE SET NULL,
    prompt_text TEXT NOT NULL,
    prompt_type TEXT NOT NULL CHECK (prompt_type IN ('inline', 'news', 'suggested', 'exploration', 'help', 'followup')),
    game_title TEXT,
    shown_at TIMESTAMPTZ DEFAULT NOW(),
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMPTZ
);

-- Comments
COMMENT ON TABLE public.ai_shown_prompts IS 'Tracks prompts shown to users to prevent repetition';
COMMENT ON COLUMN public.ai_shown_prompts.auth_user_id IS 'References auth.users(id) for RLS';
COMMENT ON COLUMN public.ai_shown_prompts.prompt_type IS 'Type: inline, news, suggested, exploration, help';
COMMENT ON COLUMN public.ai_shown_prompts.game_title IS 'Game context for game-specific prompt tracking';
COMMENT ON COLUMN public.ai_shown_prompts.clicked IS 'Whether the user clicked/used this prompt';

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_shown_prompts_auth_user_type 
    ON public.ai_shown_prompts(auth_user_id, prompt_type);
CREATE INDEX IF NOT EXISTS idx_shown_prompts_conversation 
    ON public.ai_shown_prompts(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shown_prompts_game 
    ON public.ai_shown_prompts(auth_user_id, game_title) WHERE game_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shown_prompts_shown_at 
    ON public.ai_shown_prompts(auth_user_id, shown_at DESC);

-- RLS Policies
ALTER TABLE public.ai_shown_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shown prompts" 
    ON public.ai_shown_prompts 
    FOR SELECT 
    USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own shown prompts" 
    ON public.ai_shown_prompts 
    FOR INSERT 
    WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own shown prompts" 
    ON public.ai_shown_prompts 
    FOR UPDATE 
    USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own shown prompts" 
    ON public.ai_shown_prompts 
    FOR DELETE 
    USING (auth_user_id = (SELECT auth.uid()));

-- Grant permissions
GRANT ALL ON TABLE public.ai_shown_prompts TO authenticated;
GRANT ALL ON TABLE public.ai_shown_prompts TO service_role;

-- ============================================================================
-- 2. EXTEND AI_FEEDBACK TABLE WITH CORRECTION FIELDS
-- ============================================================================
-- Add columns for user corrections to AI behavior

-- Add correction_text column (what AI should have said)
ALTER TABLE public.ai_feedback 
    ADD COLUMN IF NOT EXISTS correction_text TEXT;

-- Add correction_type column (category of correction)
ALTER TABLE public.ai_feedback 
    ADD COLUMN IF NOT EXISTS correction_type TEXT;

-- Add correction_scope column (game-specific or global)
ALTER TABLE public.ai_feedback 
    ADD COLUMN IF NOT EXISTS correction_scope TEXT DEFAULT 'game';

-- Add is_validated column (whether AI validated the correction)
ALTER TABLE public.ai_feedback 
    ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT FALSE;

-- Add validation_reason column (why AI validated/rejected)
ALTER TABLE public.ai_feedback 
    ADD COLUMN IF NOT EXISTS validation_reason TEXT;

-- Add game_title column for context
ALTER TABLE public.ai_feedback 
    ADD COLUMN IF NOT EXISTS game_title TEXT;

-- Add constraints for new columns
DO $$
BEGIN
    -- Add check constraint for correction_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ai_feedback_correction_type_check'
    ) THEN
        ALTER TABLE public.ai_feedback 
            ADD CONSTRAINT ai_feedback_correction_type_check 
            CHECK (correction_type IS NULL OR correction_type IN ('factual', 'style', 'terminology', 'behavior'));
    END IF;

    -- Add check constraint for correction_scope if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ai_feedback_correction_scope_check'
    ) THEN
        ALTER TABLE public.ai_feedback 
            ADD CONSTRAINT ai_feedback_correction_scope_check 
            CHECK (correction_scope IS NULL OR correction_scope IN ('game', 'global'));
    END IF;
END $$;

-- Update category constraint to include 'correction'
ALTER TABLE public.ai_feedback DROP CONSTRAINT IF EXISTS ai_feedback_category_check;
ALTER TABLE public.ai_feedback ADD CONSTRAINT ai_feedback_category_check 
    CHECK (category IS NULL OR category IN ('not_helpful', 'incorrect', 'off_topic', 'inappropriate', 'correction', 'other'));

-- Add comments for new columns
COMMENT ON COLUMN public.ai_feedback.correction_text IS 'User-provided correction text (what AI should have said)';
COMMENT ON COLUMN public.ai_feedback.correction_type IS 'Type of correction: factual, style, terminology, behavior';
COMMENT ON COLUMN public.ai_feedback.correction_scope IS 'Scope: game (per-game) or global (all conversations)';
COMMENT ON COLUMN public.ai_feedback.is_validated IS 'Whether the correction passed AI validation';
COMMENT ON COLUMN public.ai_feedback.validation_reason IS 'Reason for validation success/failure';
COMMENT ON COLUMN public.ai_feedback.game_title IS 'Game title for game-specific corrections';

-- Add index for correction queries
CREATE INDEX IF NOT EXISTS idx_ai_feedback_corrections 
    ON public.ai_feedback(user_id, is_validated, correction_scope) 
    WHERE correction_text IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_feedback_game_corrections 
    ON public.ai_feedback(user_id, game_title, is_validated) 
    WHERE correction_text IS NOT NULL AND game_title IS NOT NULL;

-- ============================================================================
-- 3. HELPER FUNCTION: Get User Corrections
-- ============================================================================
-- Returns active corrections for a user, optionally filtered by game

CREATE OR REPLACE FUNCTION public.get_user_corrections(
    p_auth_user_id UUID,
    p_game_title TEXT DEFAULT NULL,
    p_include_global BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id UUID,
    correction_text TEXT,
    correction_type TEXT,
    correction_scope TEXT,
    game_title TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.correction_text,
        f.correction_type,
        f.correction_scope,
        f.game_title,
        f.created_at
    FROM public.ai_feedback f
    WHERE f.user_id = p_auth_user_id
      AND f.correction_text IS NOT NULL
      AND f.is_validated = TRUE
      AND f.category = 'correction'
      AND (
          -- Game-specific corrections for this game
          (f.correction_scope = 'game' AND f.game_title = p_game_title)
          OR
          -- Global corrections (if requested)
          (p_include_global AND f.correction_scope = 'global')
      )
    ORDER BY f.created_at DESC
    LIMIT 10;
END;
$$;

COMMENT ON FUNCTION public.get_user_corrections IS 'Returns active validated corrections for a user, optionally filtered by game';

GRANT EXECUTE ON FUNCTION public.get_user_corrections TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_corrections TO service_role;

-- ============================================================================
-- 4. HELPER FUNCTION: Get Recent Shown Prompts
-- ============================================================================
-- Returns recently shown prompts to filter duplicates

CREATE OR REPLACE FUNCTION public.get_recent_shown_prompts(
    p_auth_user_id UUID,
    p_prompt_type TEXT,
    p_game_title TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    prompt_text TEXT,
    shown_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.prompt_text,
        sp.shown_at
    FROM public.ai_shown_prompts sp
    WHERE sp.auth_user_id = p_auth_user_id
      AND sp.prompt_type = p_prompt_type
      AND (p_game_title IS NULL OR sp.game_title = p_game_title OR sp.game_title IS NULL)
      AND sp.shown_at > NOW() - INTERVAL '7 days'
    ORDER BY sp.shown_at DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_recent_shown_prompts IS 'Returns recently shown prompts for deduplication';

GRANT EXECUTE ON FUNCTION public.get_recent_shown_prompts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_shown_prompts TO service_role;

-- ============================================================================
-- 5. CLEANUP FUNCTION: Remove Old Shown Prompts
-- ============================================================================
-- Removes prompts older than 7 days to keep table size manageable

CREATE OR REPLACE FUNCTION public.cleanup_old_shown_prompts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.ai_shown_prompts
    WHERE shown_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_shown_prompts IS 'Removes shown prompts older than 7 days';

GRANT EXECUTE ON FUNCTION public.cleanup_old_shown_prompts TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
