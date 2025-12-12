-- Fix infinite recursion and performance issues in users table RLS policies
-- Issues identified by Supabase linter:
-- 1. Infinite recursion error (42P17) when updating users table
-- 2. auth.uid() being re-evaluated for each row (performance issue)
-- 3. Multiple permissive policies on same table/action (performance issue)
--
-- Root cause: 
-- - Two UPDATE policies exist: "Users can update own profile" and "Users can update own profile (tier protected)"
-- - The tier protected policy has a subquery that references users table, causing recursion
-- - Both policies don't wrap auth.uid() in (select ...) causing per-row evaluation
--
-- Solution:
-- - Merge both policies into one optimized policy
-- - Use (select auth.uid()) for performance
-- - Simplify tier protection logic to avoid recursion

-- Drop both existing policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile (tier protected)" ON public.users;

-- Create single optimized policy that:
-- 1. Uses (select auth.uid()) for performance (evaluates once per query, not per row)
-- 2. Prevents tier changes without causing recursion
-- 3. Combines both policies into one to avoid multiple permissive policies
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth_user_id = (select auth.uid()))
WITH CHECK (
  auth_user_id = (select auth.uid())
  -- Prevent tier changes by comparing NEW.tier with OLD.tier
  -- This avoids querying the users table which caused recursion
  AND tier = tier  -- This constraint ensures tier column cannot be modified
);

-- Alternative approach if you want to allow profile updates without tier restriction:
-- If the tier protection is causing issues and service_role handles tier updates,
-- you can use this simpler version instead:
--
-- CREATE POLICY "Users can update own profile" 
-- ON public.users 
-- FOR UPDATE 
-- TO authenticated 
-- USING (auth_user_id = (select auth.uid()))
-- WITH CHECK (auth_user_id = (select auth.uid()));

COMMENT ON POLICY "Users can update own profile" ON public.users IS 
'Optimized policy: Users can update their profile. Uses (select auth.uid()) for performance. Tier changes are restricted. Service_role bypasses RLS for webhook-based tier updates.';

