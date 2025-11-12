-- Check for any triggers on the waitlist table
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'public.waitlist'::regclass
  AND tgisinternal = false;

-- Check for any functions that reference 'net' schema
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%net.%'
   OR pg_get_functiondef(p.oid) ILIKE '%pg_net%';

-- Check waitlist table structure
\d public.waitlist
