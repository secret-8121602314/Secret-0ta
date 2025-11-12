-- ============================================================================
-- Remove Duplicate RLS Policies on subtabs table - STANDALONE VERSION
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- Drop ALL existing subtabs policies (all variations)
DROP POLICY IF EXISTS "Users can view subtabs of their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can view subtabs from their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can view subtabs from their games" ON public.subtabs;

DROP POLICY IF EXISTS "Users can insert subtabs to their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can insert subtabs for their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can insert subtabs to their games" ON public.subtabs;

DROP POLICY IF EXISTS "Users can update subtabs of their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can update subtabs in their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can update subtabs in their games" ON public.subtabs;

DROP POLICY IF EXISTS "Users can delete subtabs of their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs from their conversations" ON public.subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs from their games" ON public.subtabs;

-- Create single optimized policy for each action
CREATE POLICY "subtabs_select_policy" ON public.subtabs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      INNER JOIN public.users u ON c.user_id = u.id
      WHERE c.id = subtabs.conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "subtabs_insert_policy" ON public.subtabs
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      INNER JOIN public.users u ON c.user_id = u.id
      WHERE c.id = conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "subtabs_update_policy" ON public.subtabs
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      INNER JOIN public.users u ON c.user_id = u.id
      WHERE c.id = subtabs.conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      INNER JOIN public.users u ON c.user_id = u.id
      WHERE c.id = subtabs.conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "subtabs_delete_policy" ON public.subtabs
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      INNER JOIN public.users u ON c.user_id = u.id
      WHERE c.id = subtabs.conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

-- Verify RLS is enabled
ALTER TABLE public.subtabs ENABLE ROW LEVEL SECURITY;
