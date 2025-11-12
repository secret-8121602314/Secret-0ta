-- Drop the actual trigger that's causing the problem
-- The trigger name has quotes and spaces, so we need to handle it carefully

DROP TRIGGER IF EXISTS "Email Waitlist" ON public.waitlist CASCADE;

-- Verify it's gone
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgrelid = 'public.waitlist'::regclass
  AND tgisinternal = false;
