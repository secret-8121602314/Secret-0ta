-- SIMPLE FIX: Drop all triggers and net-related functions
-- No complex loops, just direct drops

-- Drop all known trigger names
DROP TRIGGER IF EXISTS on_waitlist_insert ON public.waitlist CASCADE;
DROP TRIGGER IF EXISTS waitlist_email_trigger ON public.waitlist CASCADE;
DROP TRIGGER IF EXISTS trigger_waitlist_email ON public.waitlist CASCADE;
DROP TRIGGER IF EXISTS send_waitlist_email_trigger ON public.waitlist CASCADE;
DROP TRIGGER IF EXISTS notify_waitlist_trigger ON public.waitlist CASCADE;

-- Drop all known function names that might reference net
DROP FUNCTION IF EXISTS public.trigger_waitlist_email() CASCADE;
DROP FUNCTION IF EXISTS public.send_waitlist_email() CASCADE;
DROP FUNCTION IF EXISTS public.notify_waitlist_email() CASCADE;
DROP FUNCTION IF EXISTS public.handle_waitlist_insert() CASCADE;
DROP FUNCTION IF EXISTS public.process_waitlist_email() CASCADE;

-- Verify cleanup
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgrelid = 'public.waitlist'::regclass
  AND tgisinternal = false;

-- If the above returns any rows, we need to drop them manually
-- Check if any functions still reference 'net'
SELECT 
  p.proname as function_name,
  n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) ILIKE '%net.http_post%'
    OR pg_get_functiondef(p.oid) ILIKE '%pg_net%'
    OR pg_get_functiondef(p.oid) ILIKE '%schema "net"%'
  );
