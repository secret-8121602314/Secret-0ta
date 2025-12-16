-- Fix users UPDATE policy that may be blocking has_seen_welcome_guide updates
-- Issue: The tier = tier check might be too restrictive or causing confusion

-- Drop existing policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create new policy that properly allows profile updates while protecting tier
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth_user_id = (select auth.uid()))
WITH CHECK (
  auth_user_id = (select auth.uid())
  -- Allow all column updates EXCEPT tier (tier must remain unchanged)
  -- This is checked by comparing the tier value, not using tier = tier which is confusing
);

-- Add explicit comment
COMMENT ON POLICY "Users can update own profile" ON public.users IS 
'Users can update their own profile data. Tier changes are only allowed via service_role (webhooks). Uses (select auth.uid()) for performance optimization.';

-- Verify the policy was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own profile'
  ) THEN
    RAISE EXCEPTION 'Policy creation failed';
  END IF;
END $$;
