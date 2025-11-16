-- Fix auth_rls_initplan performance warnings
-- Wrap auth.uid() in SELECT subquery to prevent re-evaluation for each row

-- 1. Fix games table RLS policies
DROP POLICY IF EXISTS "games_select_own" ON games;
DROP POLICY IF EXISTS "games_insert_own" ON games;
DROP POLICY IF EXISTS "games_update_own" ON games;
DROP POLICY IF EXISTS "games_delete_own" ON games;

CREATE POLICY "games_select_own" ON games
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "games_insert_own" ON games
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "games_update_own" ON games
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "games_delete_own" ON games
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- 2. Fix subtabs table RLS policies
DROP POLICY IF EXISTS "Users can insert subtabs to their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can view subtabs from their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can update subtabs in their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs from their conversations" ON subtabs;

CREATE POLICY "Users can insert subtabs to their conversations" ON subtabs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view subtabs from their conversations" ON subtabs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update subtabs in their conversations" ON subtabs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete subtabs from their conversations" ON subtabs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.user_id = (SELECT auth.uid())
    )
  );

-- 3. Fix conversations table RLS policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (user_id = (SELECT auth.uid()));
