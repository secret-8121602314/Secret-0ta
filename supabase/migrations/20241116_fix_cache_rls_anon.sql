-- Fix RLS policies for app_cache to allow anonymous rate limiting
-- This fixes the 7-8 second delay on login buttons

-- Only apply if table exists (may run before schema dump migration)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'app_cache') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Users can access own cache" ON "public"."app_cache";

    -- Create new policies with separate rules for authenticated and anonymous users
    CREATE POLICY "Authenticated users can access own cache" 
    ON "public"."app_cache" 
    TO "authenticated" 
    USING (("user_id" = auth.uid()) OR ("user_id" IS NULL))
    WITH CHECK (("user_id" = auth.uid()) OR ("user_id" IS NULL));

    -- Allow anonymous users to store rate limit cache entries
    CREATE POLICY "Anonymous users can store rate limits" 
    ON "public"."app_cache" 
    TO "anon" 
    USING ("cache_type" = 'rate_limit' AND "user_id" IS NULL)
    WITH CHECK ("cache_type" = 'rate_limit' AND "user_id" IS NULL);
  END IF;
END $$;
