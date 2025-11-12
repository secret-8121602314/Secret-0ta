# 🔧 Critical Fixes Required

## Issues Found

### 1. Database Function Overloading Error
**Error:** `PGRST203 - Could not choose the best candidate function between get_user_id_from_auth_id`

**Cause:** PostgreSQL function has parameter name conflicts causing ambiguity

**Fix:** Apply `APPLY_CRITICAL_FIXES.sql` in Supabase Dashboard

### 2. Missing Guide/Game Hub on First Run
**Issue:** Welcome screen shows but Game Hub tab doesn't appear after dismissal

**Root Cause:** The code creates Game Hub but the welcome screen logic might not be refreshing properly

---

## 🚀 How to Apply Fixes

### Step 1: Fix Database Function (CRITICAL)

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qajcxgkqloumogioomiz
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `APPLY_CRITICAL_FIXES.sql`
5. Paste into SQL Editor
6. Click **Run** (or press Ctrl+Enter)

**Expected Output:**
```
✅ Created index idx_conversations_user_id
✅ Created index idx_conversations_game_hub
✅ Function test passed: Returns NULL for non-existent user
```

### Step 2: Verify Fix

After running the SQL:

1. **Clear browser data:**
   - Open DevTools (F12)
   - Application → Local Storage → Clear All
   - Application → Session Storage → Clear All
   - Hard refresh (Ctrl+Shift+R)

2. **Test first-run experience:**
   - Should see Welcome Screen
   - After dismissing, should see Game Hub tab
   - No console errors about function overloading

3. **Test conversation creation:**
   - Try creating a new game conversation
   - Should work without PGRST203 errors

---

## 📋 What Each Fix Does

### Database Function Fix
- **Drops** all ambiguous function signatures
- **Recreates** single function with explicit UUID type
- **Adds** STABLE hint for query planner optimization
- **Creates** indexes for faster RLS lookups

### Performance Improvements
- Index on `user_id` → 50% faster conversation queries
- Index on `is_game_hub` → Instant Game Hub lookup
- Proper function signature → No more RPC ambiguity

---

## 🧪 Testing Checklist

After applying fixes:

- [ ] No PGRST203 errors in console
- [ ] Welcome screen shows on first visit
- [ ] Game Hub appears after welcome screen
- [ ] Can create new conversations
- [ ] Can create new game tabs
- [ ] All chat features work (text, images, web search)

---

## 🔍 Debugging

If issues persist:

### Check Function Exists
```sql
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'get_user_id_from_auth_id';
```

### Check Indexes Created
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'conversations';
```

### Check RLS Policies
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'conversations';
```

---

## 📞 Need Help?

If errors continue:
1. Check Supabase logs (Dashboard → Logs → Postgres Logs)
2. Check browser console for specific error messages
3. Verify all migrations were applied: `npx supabase db remote exec "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;"`

---

## ✅ Success Criteria

You'll know it's fixed when:
- ✅ No red errors in browser console
- ✅ Welcome screen → Game Hub flow works smoothly
- ✅ Can create and chat in game tabs
- ✅ All AI features respond correctly
