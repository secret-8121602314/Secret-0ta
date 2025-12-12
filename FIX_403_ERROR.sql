-- FIX FOR 403 FORBIDDEN ERROR ON game_knowledge_cache
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/sql

-- Fix RLS policies for game_knowledge_cache table
-- Allow authenticated users to INSERT and UPDATE (upsert) game knowledge
-- This enables client-side caching for Pro/Vanguard users

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Service role can manage game knowledge" ON public.game_knowledge_cache;

-- Service role has full access
CREATE POLICY "Service role can manage game knowledge"
ON public.game_knowledge_cache FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can insert new cache entries (Pro/Vanguard users populating cache)
DROP POLICY IF EXISTS "Authenticated users can insert game knowledge" ON public.game_knowledge_cache;
CREATE POLICY "Authenticated users can insert game knowledge"
ON public.game_knowledge_cache FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update existing cache entries (refresh, access count)
DROP POLICY IF EXISTS "Authenticated users can update game knowledge" ON public.game_knowledge_cache;
CREATE POLICY "Authenticated users can update game knowledge"
ON public.game_knowledge_cache FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'game_knowledge_cache'
ORDER BY policyname;
