-- Fix RLS Performance Warnings
-- Issue: auth.uid() calls in RLS policies re-evaluated for each row causing poor performance
-- Solution: Wrap auth.uid() with (SELECT auth.uid()) to evaluate once per query

-- =============================================
-- FIX app_cache RLS POLICY
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can access own cache" ON app_cache;

CREATE POLICY "Authenticated users can access own cache" 
ON app_cache 
TO authenticated 
USING ((user_id = (SELECT auth.uid())) OR (user_id IS NULL)) 
WITH CHECK ((user_id = (SELECT auth.uid())) OR (user_id IS NULL));

-- =============================================
-- FIX game_hub_interactions RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own game hub interactions" ON game_hub_interactions;
DROP POLICY IF EXISTS "Users can insert own game hub interactions" ON game_hub_interactions;
DROP POLICY IF EXISTS "Users can update own game hub interactions" ON game_hub_interactions;

CREATE POLICY "Users can view own game hub interactions"
ON game_hub_interactions FOR SELECT
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own game hub interactions"
ON game_hub_interactions FOR INSERT
WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own game hub interactions"
ON game_hub_interactions FOR UPDATE
USING (auth_user_id = (SELECT auth.uid()));

-- =============================================
-- FIX messages RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own messages"
ON messages FOR INSERT
WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (auth_user_id = (SELECT auth.uid()));

-- =============================================
-- FIX subtabs RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own subtabs" ON subtabs;
DROP POLICY IF EXISTS "Users can insert own subtabs" ON subtabs;
DROP POLICY IF EXISTS "Users can update own subtabs" ON subtabs;
DROP POLICY IF EXISTS "Users can delete own subtabs" ON subtabs;

CREATE POLICY "Users can view own subtabs"
ON subtabs FOR SELECT
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own subtabs"
ON subtabs FOR INSERT
WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own subtabs"
ON subtabs FOR UPDATE
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own subtabs"
ON subtabs FOR DELETE
USING (auth_user_id = (SELECT auth.uid()));
