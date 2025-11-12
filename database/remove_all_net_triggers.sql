-- COMPREHENSIVE FIX: Remove ALL triggers and functions that reference pg_net/net schema
-- This will completely clean up any leftover database triggers

-- Step 1: Drop ALL triggers on waitlist table (there shouldn't be any for webhook approach)
DO $$ 
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN 
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'public.waitlist'::regclass 
      AND tgisinternal = false
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.waitlist CASCADE', trigger_record.tgname);
    RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
  END LOOP;
END $$;

-- Step 2: Drop any functions that reference 'net' schema
DO $$ 
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT 
      n.nspname, 
      p.proname,
      p.oid::regprocedure::text as full_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE (pg_get_functiondef(p.oid) ILIKE '%net.%' 
           OR pg_get_functiondef(p.oid) ILIKE '%pg_net%')
      AND n.nspname = 'public'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', func_record.full_signature);
    RAISE NOTICE 'Dropped function: %', func_record.full_signature;
  END LOOP;
END $$;

-- Step 3: Specifically drop known problematic triggers/functions
DROP TRIGGER IF EXISTS on_waitlist_insert ON public.waitlist CASCADE;
DROP TRIGGER IF EXISTS waitlist_email_trigger ON public.waitlist CASCADE;
DROP TRIGGER IF EXISTS trigger_waitlist_email ON public.waitlist CASCADE;

DROP FUNCTION IF EXISTS public.trigger_waitlist_email() CASCADE;
DROP FUNCTION IF EXISTS public.send_waitlist_email() CASCADE;
DROP FUNCTION IF EXISTS public.notify_waitlist_email() CASCADE;

-- Step 4: Verify cleanup
SELECT 
  'Remaining triggers on waitlist:' as info,
  COUNT(*) as count
FROM pg_trigger
WHERE tgrelid = 'public.waitlist'::regclass
  AND tgisinternal = false;

SELECT 
  'Functions referencing net schema:' as info,
  COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE (pg_get_functiondef(p.oid) ILIKE '%net.%' 
       OR pg_get_functiondef(p.oid) ILIKE '%pg_net%')
  AND n.nspname = 'public';
