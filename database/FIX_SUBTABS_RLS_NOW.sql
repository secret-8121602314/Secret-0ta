-- CRITICAL FIX: Subtabs RLS Policy Error
-- The subtabs INSERT policy is checking conversations.user_id = auth.uid()
-- But user_id is the internal UUID from users table, not auth_user_id
-- This causes all subtab inserts to fail with RLS violation

-- Fix the subtabs RLS policies to use auth_user_id instead of user_id
DROP POLICY IF EXISTS "Users can insert subtabs to their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can view subtabs from their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can update subtabs in their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs from their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs of their conversations" ON public.subtabs;

-- Create correct policies using auth_user_id
CREATE POLICY "Users can insert subtabs to their conversations" ON public.subtabs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view subtabs from their conversations" ON public.subtabs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update subtabs in their conversations" ON public.subtabs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete subtabs from their conversations" ON public.subtabs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.auth_user_id = (SELECT auth.uid())
    )
  );
