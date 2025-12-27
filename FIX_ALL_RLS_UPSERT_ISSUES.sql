-- ========================================
-- COMPREHENSIVE FIX: All RLS UPDATE Policies Missing WITH CHECK
-- ========================================
-- Problem: Multiple UPDATE policies only have USING but no WITH CHECK
-- This causes UPSERT operations to fail with RLS violations
--
-- Root Cause Analysis:
-- 1. When using UPSERT (INSERT ... ON CONFLICT DO UPDATE):
--    - INSERT checks: INSERT policy's WITH CHECK
--    - UPDATE checks: UPDATE policy's USING (can I see this row?)
--    - UPDATE checks: UPDATE policy's WITH CHECK (is new data valid?)
--
-- 2. If UPDATE policy has no WITH CHECK, PostgreSQL cannot validate
--    the new data being written during UPSERT
--
-- Why This Happened:
-- - The `game-hub` row was created by user a62fcd26-b906-4057-b7af-4ec19358b1b5
-- - You logged in as aef006b1-5360-4837-b371-c25e1e0017b7
-- - When your app tried to UPSERT game-hub, it:
--   1. Found existing row with different auth_user_id
--   2. Tried to UPDATE it (because of ON CONFLICT)
--   3. UPDATE USING failed because auth_user_id doesn't match
--
-- ========================================
-- FIX ALL AFFECTED POLICIES
-- ========================================

-- 1. conversations (CRITICAL - this is your main issue)
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));

-- 2. messages
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" 
ON public.messages 
FOR UPDATE 
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));

-- 3. subtabs
DROP POLICY IF EXISTS "Users can update own subtabs" ON public.subtabs;
CREATE POLICY "Users can update own subtabs" 
ON public.subtabs 
FOR UPDATE 
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));

-- 4. ai_feedback
DROP POLICY IF EXISTS "Users can update own feedback" ON public.ai_feedback;
CREATE POLICY "Users can update own feedback" 
ON public.ai_feedback 
FOR UPDATE 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- 5. game_hub_interactions
DROP POLICY IF EXISTS "Users can update own game hub interactions" ON public.game_hub_interactions;
CREATE POLICY "Users can update own game hub interactions" 
ON public.game_hub_interactions 
FOR UPDATE 
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));

-- 6. user_screenshots
DROP POLICY IF EXISTS "Users can update own screenshots" ON public.user_screenshots;
CREATE POLICY "Users can update own screenshots" 
ON public.user_screenshots 
FOR UPDATE 
TO authenticated
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));

-- 7. ai_shown_prompts
DROP POLICY IF EXISTS "Users can update own shown prompts" ON public.ai_shown_prompts;
CREATE POLICY "Users can update own shown prompts" 
ON public.ai_shown_prompts 
FOR UPDATE 
TO authenticated
USING ((select auth.uid()) = auth_user_id)
WITH CHECK ((select auth.uid()) = auth_user_id);

-- 8. user_timeline
DROP POLICY IF EXISTS "Users can update own timeline" ON public.user_timeline;
CREATE POLICY "Users can update own timeline" 
ON public.user_timeline 
FOR UPDATE 
TO authenticated
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));

-- 9. gaming_knowledge
DROP POLICY IF EXISTS "Users can update their own gaming knowledge" ON public.gaming_knowledge;
CREATE POLICY "Users can update their own gaming knowledge" 
ON public.gaming_knowledge 
FOR UPDATE 
USING ((select auth.uid()) = auth_user_id)
WITH CHECK ((select auth.uid()) = auth_user_id);

-- 10. gaming_profiles
DROP POLICY IF EXISTS "Users can update their own gaming profile" ON public.gaming_profiles;
CREATE POLICY "Users can update their own gaming profile" 
ON public.gaming_profiles 
FOR UPDATE 
USING ((select auth.uid()) = auth_user_id)
WITH CHECK ((select auth.uid()) = auth_user_id);

-- 11. gaming_search_history
DROP POLICY IF EXISTS "Users can update their own search history" ON public.gaming_search_history;
CREATE POLICY "Users can update their own search history" 
ON public.gaming_search_history 
FOR UPDATE 
USING ((select auth.uid()) = auth_user_id)
WITH CHECK ((select auth.uid()) = auth_user_id);

-- ========================================
-- NOTES: These policies already have WITH CHECK (no fix needed)
-- ========================================
-- ✅ user_grounding_usage - already has WITH CHECK
-- ✅ user_library - already has WITH CHECK
-- ✅ users (profile) - already has WITH CHECK
-- ✅ subtab_refresh_usage - already has WITH CHECK
-- ✅ user_sessions - needs review (uses user_id not auth_user_id)

-- ========================================
-- VERIFICATION
-- ========================================
-- Run this to check all UPDATE policies have WITH CHECK:
/*
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND cmd = 'UPDATE'
ORDER BY tablename, policyname;
*/
