-- ========================================
-- DIAGNOSE AND FIX: Game Hub Issue
-- ========================================
-- Step 1: Check if game-hub exists and what auth_user_id it has
-- ========================================

-- Check existing game-hub rows
SELECT 
    id, 
    title, 
    auth_user_id,
    user_id,
    is_game_hub,
    created_at
FROM conversations 
WHERE id = 'game-hub';

-- ========================================
-- Step 2: Fix the UPDATE policy (if not already done)
-- ========================================

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;

CREATE POLICY "Users can update own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));

-- ========================================
-- Step 3: Delete orphaned game-hub (if it exists with wrong owner)
-- ========================================
-- Current situation: game-hub exists with auth_user_id = a62fcd26-b906-4057-b7af-4ec19358b1b5
-- But you're logged in as: aef006b1-5360-4837-b371-c25e1e0017b7

-- Option A: Delete the specific orphaned game-hub
DELETE FROM conversations 
WHERE id = 'game-hub' 
AND auth_user_id = 'a62fcd26-b906-4057-b7af-4ec19358b1b5';

-- Option B: Delete ANY game-hub that doesn't belong to you
-- DELETE FROM conversations WHERE id = 'game-hub' AND auth_user_id != auth.uid();

-- Option C: Delete ALL game-hub rows (use with caution - affects all users)
-- DELETE FROM conversations WHERE id = 'game-hub';

-- ========================================
-- Step 4: Manual Game Hub Creation (if needed)
-- ========================================
-- If the above DELETE removed the game-hub, create a new one:

-- INSERT INTO conversations (
--     id, 
--     title, 
--     auth_user_id, 
--     is_game_hub,
--     is_active
-- ) VALUES (
--     'game-hub',
--     'Game Hub',
--     auth.uid(),
--     true,
--     true
-- );

-- ========================================
-- Step 5: Verify the fix
-- ========================================

-- Should now show your game-hub with correct auth_user_id
SELECT 
    id, 
    title, 
    auth_user_id,
    is_game_hub,
    auth_user_id = auth.uid() as "is_mine"
FROM conversations 
WHERE id = 'game-hub';
