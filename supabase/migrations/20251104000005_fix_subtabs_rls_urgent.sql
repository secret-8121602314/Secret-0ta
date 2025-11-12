-- URGENT FIX: Subtabs RLS policies are blocking inserts
-- The existing policies check conversations.user_id, but the query fails
-- This migration ensures RLS policies work correctly

-- Drop all existing subtabs policies
DROP POLICY IF EXISTS "Users can insert subtabs to their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can view subtabs from their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can update subtabs in their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs from their conversations" ON subtabs;

-- Create new policies that properly handle the user_id lookup
-- The issue: conversations.user_id is the internal UUID, not auth.uid()
-- We need to join through the users table to match auth_user_id

CREATE POLICY "Users can insert subtabs to their conversations" ON subtabs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view subtabs from their conversations" ON subtabs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update subtabs in their conversations" ON subtabs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete subtabs from their conversations" ON subtabs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

-- Verify RLS is enabled
ALTER TABLE subtabs ENABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON TABLE subtabs IS 'Subtabs for game conversations. RLS policies ensure users can only access subtabs from their own conversations.';
