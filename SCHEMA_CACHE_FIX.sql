-- ====================================================================
-- COPY THIS ENTIRE SCRIPT AND RUN IT IN SUPABASE SQL EDITOR
-- This will fix the 404/406 errors for user_library, user_timeline, 
-- and user_grounding_usage tables
-- ====================================================================

-- 1. Ensure proper grants on all three tables
GRANT ALL ON TABLE public.user_library TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_timeline TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_grounding_usage TO anon, authenticated, service_role;

-- 2. Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- 3. Verify the tables are accessible (should return success)
SELECT 'user_library table OK' as status, COUNT(*) as row_count FROM public.user_library;
SELECT 'user_timeline table OK' as status, COUNT(*) as row_count FROM public.user_timeline;  
SELECT 'user_grounding_usage table OK' as status, COUNT(*) as row_count FROM public.user_grounding_usage;

-- Done! The 404 errors should be fixed within 10 seconds after running this.
-- Refresh your browser to see the changes.
