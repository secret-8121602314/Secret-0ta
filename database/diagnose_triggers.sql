-- Quick diagnostic query - paste this in Supabase SQL Editor
-- This will show all triggers and functions

-- 1. Show all triggers on waitlist table
SELECT 
  tgname AS trigger_name,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'public.waitlist'::regclass
  AND tgisinternal = false;

-- 2. Show all functions in public schema
SELECT 
  proname AS function_name,
  prosrc AS source_code
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;
