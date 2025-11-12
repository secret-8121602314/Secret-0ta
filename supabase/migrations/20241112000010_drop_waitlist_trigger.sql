-- Fix: Drop the trigger that's causing net schema error
-- The webhook approach is being used instead

-- Drop the trigger
DROP TRIGGER IF EXISTS on_waitlist_insert ON public.waitlist;

-- Drop the function
DROP FUNCTION IF EXISTS public.trigger_waitlist_email();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Waitlist trigger removed successfully. Using webhook approach instead.';
END $$;
