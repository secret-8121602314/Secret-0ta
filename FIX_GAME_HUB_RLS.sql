-- ========================================
-- FIX: Game Hub RLS Policy Issue
-- ========================================
-- Problem: Game Hub creation failing with RLS policy violation
-- Error: "new row violates row-level security policy (USING expression)"
-- 
-- Root Cause: When using UPSERT (INSERT ... ON CONFLICT), PostgreSQL checks:
--   1. INSERT policy's WITH CHECK clause (for new rows)
--   2. UPDATE policy's USING clause (if conflict exists and update happens)
--   3. UPDATE policy's WITH CHECK clause (for updated values)
--
-- The current UPDATE policy only has USING but no WITH CHECK.
-- When upserting, this causes issues because the new values aren't validated.
--
-- Solution: Add WITH CHECK clause to UPDATE policy
-- This ensures upserts can validate both existing and new row data
-- ========================================

-- Fix the UPDATE policy to include WITH CHECK
-- Note: Using (select auth.uid()) for performance - prevents re-evaluation per row
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;

CREATE POLICY "Users can update own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));


-- ========================================
-- Verification Queries
-- ========================================
-- Run these to verify the policies are correct:

-- Check all conversations policies
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'conversations' 
-- ORDER BY policyname;

-- Test if current user can insert/upsert Game Hub
-- INSERT INTO conversations (id, title, auth_user_id, is_game_hub)
-- VALUES ('game-hub', 'Game Hub', auth.uid(), true)
-- ON CONFLICT (id) DO UPDATE SET updated_at = now()
-- RETURNING id;
