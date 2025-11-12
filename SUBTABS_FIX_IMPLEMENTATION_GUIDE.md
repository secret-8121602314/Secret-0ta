# Subtabs Fix - Step-by-Step Implementation Guide

## Prerequisites

Before starting, ensure you have:
- [ ] Access to Supabase dashboard (https://qajcxgkqloumogioomiz.supabase.co)
- [ ] `EMERGENCY_FIX.sql` file ready
- [ ] Code editor open with project loaded
- [ ] Git commit of current state (for rollback if needed)

---

## Phase 1: Emergency Database Fix (5 minutes)

### Step 1.1: Apply SQL Fix to Supabase

1. **Open Supabase SQL Editor**:
   - Go to: https://qajcxgkqloumogioomiz.supabase.co/project/qajcxgkqloumogioomiz/sql/new
   - Or: Dashboard → SQL Editor → New Query

2. **Copy EMERGENCY_FIX.sql**:
   - Open `EMERGENCY_FIX.sql` in your editor
   - Select all (Ctrl+A)
   - Copy (Ctrl+C)

3. **Paste and Run**:
   - Paste into SQL Editor
   - Click "Run" button (or Ctrl+Enter)
   - Wait for "Success" message

4. **Verify Fix Applied**:
   Run these verification queries in SQL Editor:

   ```sql
   -- Check 1: RPC function parameter name
   SELECT 
     routine_name, 
     parameter_name, 
     data_type
   FROM information_schema.parameters 
   WHERE routine_name = 'get_user_id_from_auth_id';
   
   -- Expected result: parameter_name = 'p_auth_user_id'
   ```

   ```sql
   -- Check 2: game_id is nullable
   SELECT 
     column_name, 
     is_nullable, 
     data_type
   FROM information_schema.columns 
   WHERE table_name = 'subtabs' 
     AND column_name = 'game_id';
   
   -- Expected result: is_nullable = 'YES'
   ```

   ```sql
   -- Check 3: conversation_id exists
   SELECT 
     column_name, 
     is_nullable, 
     data_type
   FROM information_schema.columns 
   WHERE table_name = 'subtabs' 
     AND column_name = 'conversation_id';
   
   -- Expected result: conversation_id | YES | uuid
   ```

✅ **Checkpoint**: All 3 queries should return expected results

---

## Phase 2: Disable Normalized Subtabs (2 minutes)

### Step 2.1: Update Feature Flag

1. **Open constants file**:
   ```
   src/constants/index.ts
   ```

2. **Find FEATURE_FLAGS**:
   ```typescript
   export const FEATURE_FLAGS = {
     USE_NORMALIZED_MESSAGES: true,
     USE_NORMALIZED_SUBTABS: true,  // ← Find this line
     // ...
   }
   ```

3. **Change to false**:
   ```typescript
   export const FEATURE_FLAGS = {
     USE_NORMALIZED_MESSAGES: true,
     USE_NORMALIZED_SUBTABS: false,  // ✅ Changed to false
     // ...
   }
   ```

4. **Save file** (Ctrl+S)

✅ **Checkpoint**: Feature flag set to `false`

---

## Phase 3: Test the Fix (10 minutes)

### Step 3.1: Clear Local Storage

1. **Open browser DevTools** (F12)
2. **Go to Application tab** → Storage → Local Storage
3. **Click "Clear" button** or run in Console:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

This ensures you're testing with fresh data from Supabase, not cached data.

### Step 3.2: Login and Test Game Creation

1. **Login to app** (if logged out)

2. **Create a new game tab**:
   - Click "Add Game" or similar button
   - Upload a game screenshot (e.g., Elden Ring)
   - Ask: "What game is this?"
   - Wait for AI response

3. **Watch console logs** (F12 → Console):
   
   ✅ **SHOULD SEE**:
   ```
   🔍 [ConversationService] Loaded N conversations from Supabase (N > 0)
   🎮 [GameTabService] Creating game tab for: [Game Name]
   🎮 [GameTabService] Created X subtabs
   🔄 [SubtabsService] Writing X subtabs to BOTH table AND JSONB
   ✅ Table write: SUCCESS
   ✅ JSONB write: SUCCESS
   ```
   
   ❌ **SHOULD NOT SEE**:
   ```
   Loaded 0 conversations from Supabase
   Error inserting subtabs
   function get_user_id_from_auth_id does not exist
   invalid input syntax for type uuid
   null value in column game_id violates not-null constraint
   ```

4. **Verify subtabs appear**:
   - Game tab should show in sidebar
   - Click on game tab
   - Subtabs should be visible (e.g., "Story", "Tips", "Walkthrough")
   - Click on subtabs to verify content

### Step 3.3: Test Persistence

1. **Reload the page** (F5 or Ctrl+R)

2. **Check if game tab persists**:
   - Game should still be in sidebar
   - Click on game → subtabs should still be there
   - Content should match what was there before reload

3. **Check console logs**:
   ```
   🔍 [ConversationService] Loaded N conversations from Supabase (N > 0)
   ```
   (N should be > 0 now that conversations are saving)

✅ **Checkpoint**: Game tabs and subtabs persist across page reloads

---

## Phase 4: Verify in Database (Optional)

### Step 4.1: Check Supabase Data

1. **Go to Table Editor**:
   - Supabase Dashboard → Table Editor → `conversations`

2. **Find your conversation**:
   - Look for row with your game title
   - Check `subtabs` column → should have JSON data

3. **Verify subtabs data**:
   ```json
   [
     {
       "id": "uuid-here",
       "title": "Story",
       "type": "story",
       "content": "...",
       "status": "loaded"
     },
     {
       "id": "uuid-here",
       "title": "Tips",
       "type": "tips",
       "content": "...",
       "status": "loaded"
     }
   ]
   ```

✅ **Checkpoint**: Subtabs visible in database

---

## Phase 5: (Optional) Switch to V2 Service

### Step 5.1: Replace Subtabs Service

If you want to use the cleaner V2 service:

1. **Update gameTabService.ts**:
   ```typescript
   // OLD:
   import { subtabsService } from './subtabsService';
   
   // NEW:
   import { subtabsServiceV2 as subtabsService } from './subtabsService.v2';
   ```

2. **Update any other files** that import subtabsService:
   ```bash
   # Search for imports:
   grep -r "from './subtabsService'" src/
   ```

3. **No other code changes needed** - API is identical!

4. **Test again** following Phase 3 steps

✅ **Checkpoint**: V2 service works identically to old service

---

## Rollback Plan

If anything goes wrong:

### Rollback Code Changes

```bash
# Revert feature flag change
git checkout src/constants/index.ts

# If you switched to V2, revert that too
git checkout src/services/gameTabService.ts

# Reload browser
# Clear localStorage
# Test again
```

### Rollback Database Changes (If Needed)

**WARNING**: Only do this if absolutely necessary!

```sql
-- Revert RPC function (if needed)
DROP FUNCTION IF EXISTS get_user_id_from_auth_id(uuid);
-- (Note: This will break other things! Only as last resort)

-- Revert game_id nullable (probably don't need to)
-- ALTER TABLE public.subtabs ALTER COLUMN game_id SET NOT NULL;
-- (Note: Will fail if any rows have NULL game_id)
```

**Better approach**: Keep database changes, just fix code issues instead.

---

## Troubleshooting

### Issue: Still seeing "Loaded 0 conversations from Supabase"

**Possible causes**:
1. RPC function not fixed → Rerun EMERGENCY_FIX.sql
2. Browser cache → Clear cache and localStorage
3. Different Supabase project → Check project ID in `.env`

**Debug steps**:
```javascript
// Run in browser console:
console.log(import.meta.env.VITE_SUPABASE_URL);
// Should match dashboard URL
```

### Issue: "Error inserting subtabs"

**Possible causes**:
1. Feature flag still `true` → Check constants/index.ts
2. game_id not nullable → Rerun EMERGENCY_FIX.sql Step 2
3. conversation_id missing → Rerun EMERGENCY_FIX.sql Step 3

**Debug steps**:
Open browser console and check the actual error:
```
Error inserting subtabs: {code: 'XXXXX', message: '...'}
```
- Code `22P02` → Type mismatch (check game_id nullable)
- Code `23502` → NOT NULL violation (check game_id nullable)
- Code `42703` → Column doesn't exist (check conversation_id exists)

### Issue: Subtabs disappear on reload

**Possible causes**:
1. Not saving to Supabase → Check console for save success messages
2. RPC function still broken → Check "Loaded N conversations" message
3. Reading from wrong place → Check USE_NORMALIZED_SUBTABS = false

**Debug steps**:
```javascript
// Check localStorage vs Supabase:
JSON.parse(localStorage.getItem('otakon_conversations'))
// If this has data but Supabase doesn't, RPC function is broken
```

---

## Success Criteria

✅ **Phase 1 Complete**: SQL queries return expected results
✅ **Phase 2 Complete**: Feature flag is `false`
✅ **Phase 3 Complete**: Game tabs created, subtabs visible, persist on reload
✅ **Phase 4 Complete**: Data visible in Supabase database
✅ **Phase 5 Complete**: (Optional) V2 service working

**Final Verification**:
1. Create 2-3 different game tabs
2. Each should have subtabs
3. Reload page
4. All game tabs and subtabs still there
5. Console shows `Loaded N conversations from Supabase` where N ≥ number of games

---

## Next Steps (Future Improvements)

### Short-term (This Week)
- [ ] Apply remaining migrations with `npx supabase db push`
- [ ] Regenerate TypeScript types
- [ ] Remove `as any` casts from subtabsService.ts

### Long-term (Next Sprint)
- [ ] Decide: Keep JSONB or migrate to normalized table
- [ ] If normalized: Refactor ConversationService to read from table
- [ ] If JSONB: Remove subtabs table and simplify architecture
- [ ] Add automated tests for subtabs operations

### Documentation
- [ ] Update architecture docs with final decision
- [ ] Document why JSONB was chosen (or why normalized)
- [ ] Add subtabs usage examples to README

---

## Getting Help

If you encounter issues not covered here:

1. **Check analysis document**: `SUBTABS_ANALYSIS_AND_FIX.md`
2. **Search console logs**: Look for `[SubtabsService]` or `[SubtabsV2]` prefixed messages
3. **Check Supabase logs**: Dashboard → Logs → API Logs
4. **Verify schema**: Run verification queries from Step 1.1

**Common Error Codes**:
- `42883` - Function not found (RPC parameter mismatch)
- `22P02` - Invalid UUID format
- `23502` - NOT NULL violation
- `42703` - Column doesn't exist
- `23503` - Foreign key violation

---

## Completion Checklist

Before marking this issue as complete:

- [ ] EMERGENCY_FIX.sql applied to Supabase
- [ ] Feature flag set to `false`
- [ ] Game tabs can be created
- [ ] Subtabs are visible
- [ ] Data persists across reloads
- [ ] Console logs show successful Supabase loads
- [ ] No error messages in console
- [ ] Tested with 2-3 different games
- [ ] Verified data in Supabase database

**Estimated Time**: 15-20 minutes total

**Status**: Ready to implement ✅
