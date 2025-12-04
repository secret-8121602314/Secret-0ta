-- Cleanup duplicate policies and indexes
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Remove duplicate policies on ai_shown_prompts
-- ============================================
-- Keep only the optimized versions (with SELECT subquery)
DROP POLICY IF EXISTS "Users can view their own shown prompts" ON public.ai_shown_prompts;
DROP POLICY IF EXISTS "Users can insert their own shown prompts" ON public.ai_shown_prompts;
DROP POLICY IF EXISTS "Users can update their own shown prompts" ON public.ai_shown_prompts;

-- Also drop the old versions without "their"
DROP POLICY IF EXISTS "Users can view own shown prompts" ON public.ai_shown_prompts;
DROP POLICY IF EXISTS "Users can insert own shown prompts" ON public.ai_shown_prompts;
DROP POLICY IF EXISTS "Users can update own shown prompts" ON public.ai_shown_prompts;
DROP POLICY IF EXISTS "Users can delete own shown prompts" ON public.ai_shown_prompts;

-- ============================================
-- 2. Create optimized policies (using SELECT subquery for performance)
-- ============================================
CREATE POLICY "Users can select own shown prompts"
  ON public.ai_shown_prompts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert own shown prompts"
  ON public.ai_shown_prompts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY "Users can update own shown prompts"
  ON public.ai_shown_prompts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY "Users can delete own shown prompts"
  ON public.ai_shown_prompts FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id);

-- ============================================
-- 3. Remove duplicate policies on igdb_game_cache
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read game cache" ON public.igdb_game_cache;
DROP POLICY IF EXISTS "Authenticated users can read igdb_game_cache" ON public.igdb_game_cache;
DROP POLICY IF EXISTS "Authenticated users can insert game cache" ON public.igdb_game_cache;

-- Create single optimized policy
CREATE POLICY "Authenticated users can read igdb cache"
  ON public.igdb_game_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert igdb cache"
  ON public.igdb_game_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 4. Remove duplicate indexes on igdb_game_cache
-- ============================================
DROP INDEX IF EXISTS idx_igdb_cache_expires;
DROP INDEX IF EXISTS idx_igdb_cache_game_name;
-- Keep idx_igdb_game_cache_expires_at and idx_igdb_game_cache_game_name_key

-- ============================================
-- 5. Fix user_feedback policy (performance optimization)
-- ============================================
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.user_feedback;

CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = auth_user_id);

-- ============================================
-- 6. Refresh schema cache
-- ============================================
NOTIFY pgrst, 'reload schema';

-- Verify cleanup
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('ai_shown_prompts', 'igdb_game_cache')
ORDER BY tablename, cmd;
