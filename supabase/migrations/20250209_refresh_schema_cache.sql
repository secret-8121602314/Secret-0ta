-- Force PostgREST schema cache refresh by notifying the reload channel
-- This fixes 404 errors for tables that exist but aren't visible to PostgREST

-- Ensure all tables have proper grants
GRANT ALL ON TABLE public.user_library TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_timeline TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_grounding_usage TO anon, authenticated, service_role;

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Add a comment to trigger schema cache reload
COMMENT ON TABLE public.user_library IS 'User game library (own, wishlist, favorites, disliked). Replaces localStorage for cross-device sync. [CACHE REFRESH 2025-12-09]';
COMMENT ON TABLE public.user_timeline IS 'User gaming journey timeline for HQ interface. Replaces LocalStorage. [CACHE REFRESH 2025-12-09]';
COMMENT ON TABLE public.user_grounding_usage IS 'Tracks monthly Google Search grounding usage per user to enforce tier limits (Free: 8/mo, Pro: 30/mo, Vanguard: 100/mo). [CACHE REFRESH 2025-12-09]';
