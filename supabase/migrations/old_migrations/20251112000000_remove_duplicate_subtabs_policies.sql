-- ============================================================================
-- Remove Duplicate RLS Policies on subtabs table
-- ============================================================================
-- Issue: Multiple permissive policies exist for the same role and action
-- This causes performance issues as each policy is executed for every query
-- Solution: Drop all duplicate policies and create single optimized policies
-- ============================================================================

-- Step 1: Drop ALL existing subtabs policies (all variations)
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

-- Drop any remaining policies programmatically
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT polname 
        FROM pg_policy 
        WHERE polrelid = 'public.subtabs'::regclass
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.subtabs', policy_name);
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

-- Step 2: Create single optimized policy for each action
-- Using proper auth lookup through users table

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

-- Step 3: Verify RLS is enabled
ALTER TABLE public.subtabs ENABLE ROW LEVEL SECURITY;

-- Step 4: Add comment
COMMENT ON TABLE public.subtabs IS 'Subtabs for conversations. RLS ensures users can only access subtabs from their own conversations. Optimized with single policy per action.';

-- Step 5: Verify the changes
DO $$
DECLARE
    policy_count INTEGER;
    select_policy_count INTEGER;
    insert_policy_count INTEGER;
    update_policy_count INTEGER;
    delete_policy_count INTEGER;
BEGIN
    -- Count total policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policy
    WHERE polrelid = 'public.subtabs'::regclass;
    
    -- Count policies per command
    SELECT COUNT(*) INTO select_policy_count
    FROM pg_policy
    WHERE polrelid = 'public.subtabs'::regclass
    AND polcmd = 'r';  -- SELECT
    
    SELECT COUNT(*) INTO insert_policy_count
    FROM pg_policy
    WHERE polrelid = 'public.subtabs'::regclass
    AND polcmd = 'a';  -- INSERT
    
    SELECT COUNT(*) INTO update_policy_count
    FROM pg_policy
    WHERE polrelid = 'public.subtabs'::regclass
    AND polcmd = 'w';  -- UPDATE
    
    SELECT COUNT(*) INTO delete_policy_count
    FROM pg_policy
    WHERE polrelid = 'public.subtabs'::regclass
    AND polcmd = 'd';  -- DELETE
    
    RAISE NOTICE '📊 Total subtabs policies: %', policy_count;
    RAISE NOTICE '📊 SELECT policies: % (should be 1)', select_policy_count;
    RAISE NOTICE '📊 INSERT policies: % (should be 1)', insert_policy_count;
    RAISE NOTICE '📊 UPDATE policies: % (should be 1)', update_policy_count;
    RAISE NOTICE '📊 DELETE policies: % (should be 1)', delete_policy_count;
    
    IF select_policy_count != 1 OR insert_policy_count != 1 OR 
       update_policy_count != 1 OR delete_policy_count != 1 THEN
        RAISE EXCEPTION 'Migration failed - duplicate policies still exist';
    END IF;
    
    RAISE NOTICE '✅ Migration completed successfully - one policy per action';
END $$;
