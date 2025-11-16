-- Cleanup duplicate Game Hubs before applying unique constraint
-- This script identifies and removes duplicate Game Hub conversations
-- Date: November 15, 2025

-- Step 1: Identify duplicate Game Hubs per user
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT auth_user_id, COUNT(*) as hub_count
    FROM public.conversations
    WHERE is_game_hub = TRUE
    AND auth_user_id IS NOT NULL
    GROUP BY auth_user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE 'Found % users with duplicate Game Hubs', dup_count;
END $$;

-- Step 2: Keep only the OLDEST Game Hub per user, delete the rest
-- (Oldest = lowest created_at timestamp, likely the original)
WITH ranked_hubs AS (
  SELECT 
    id,
    auth_user_id,
    title,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY auth_user_id 
      ORDER BY created_at ASC  -- Keep oldest (first created)
    ) as rn
  FROM public.conversations
  WHERE is_game_hub = TRUE
  AND auth_user_id IS NOT NULL
),
hubs_to_delete AS (
  SELECT id, title, auth_user_id, created_at
  FROM ranked_hubs
  WHERE rn > 1  -- Delete all except the oldest
)
DELETE FROM public.conversations
WHERE id IN (SELECT id FROM hubs_to_delete)
RETURNING id, title, created_at;

-- Step 3: Verify cleanup
DO $$
DECLARE
  remaining_dups INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_dups
  FROM (
    SELECT auth_user_id, COUNT(*) as hub_count
    FROM public.conversations
    WHERE is_game_hub = TRUE
    AND auth_user_id IS NOT NULL
    GROUP BY auth_user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF remaining_dups > 0 THEN
    RAISE WARNING 'Still have % users with duplicate Game Hubs!', remaining_dups;
  ELSE
    RAISE NOTICE 'Cleanup complete! All users have at most one Game Hub.';
  END IF;
END $$;
