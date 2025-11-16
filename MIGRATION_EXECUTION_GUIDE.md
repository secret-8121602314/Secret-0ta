# Database Migration Execution Guide

**Migration**: Add `auth_user_id` to messages table for RLS optimization  
**Expected Impact**: 10x faster message queries  
**Risk Level**: 🔴 HIGH (production database)

---

## 📋 Prerequisites Checklist

Before running ANY commands:

- [ ] Read `DATABASE_MIGRATION_VALIDATION.md` completely
- [ ] Docker Desktop running (for local Supabase)
- [ ] Supabase CLI installed and linked to project
- [ ] All team members notified of migration
- [ ] Low-traffic time window scheduled
- [ ] Database backup available

---

## Phase 1: Validation (READ-ONLY)

### Step 1.1: Connect to production database

```powershell
# Connect to production (read-only)
supabase db remote connect
```

This opens a PostgreSQL shell connected to production.

### Step 1.2: Run validation queries

Inside the `psql` shell:

```sql
-- Load and execute validation queries
\i supabase/migrations/validation_queries.sql
```

**Expected output:**
```
Check 1: null_conversation_id_count = 0   ✅ PASS
Check 2: orphaned_messages_count = 0      ✅ PASS
Check 3: total_messages = <some number>   (e.g., 1234)
Check 4: null_auth_user_id_count = 0      ✅ PASS
Check 5: invalid_references = 0           ✅ PASS
Check 6: Lists 4 current RLS policies
Check 7: Shows add_message function signature
Check 8: Shows 5 sample messages
```

**⚠️ STOP IF ANY CHECK FAILS**

If any check shows ❌ FAIL:
1. Investigate the data issue
2. Fix data integrity problems
3. Re-run validation
4. Do NOT proceed until all checks PASS

### Step 1.3: Exit production connection

```sql
-- In psql shell
\q
```

---

## Phase 2: Local Testing (SAFE ENVIRONMENT)

### Step 2.1: Start local Supabase

```powershell
# Start local Supabase instance
supabase start
```

This starts a local database for testing.

### Step 2.2: Apply migrations to local

```powershell
# Apply BOTH migration files to local
supabase db push
```

This will:
1. Add auth_user_id column
2. Backfill from conversations
3. Add constraints and indexes
4. Update RLS policies
5. Update add_message function

### Step 2.3: Verify local migration succeeded

```powershell
# Connect to local database
supabase db remote connect --local
```

Inside `psql`:

```sql
-- Verify auth_user_id column exists and has data
SELECT 
  COUNT(*) as total_messages,
  COUNT(auth_user_id) as messages_with_auth_user_id
FROM messages;

-- Should show: total_messages = messages_with_auth_user_id

-- Verify RLS policies changed
SELECT policyname FROM pg_policies WHERE tablename = 'messages';

-- Should show 4 policies: "Users can view/insert/update/delete own messages"

-- Exit
\q
```

### Step 2.4: Test application locally

```powershell
# Start dev server
npm run dev
```

Open browser to `http://localhost:5173`:

1. **Login** to the app
2. **Create** a new conversation
3. **Send** a message (this calls `add_message` function)
4. **Verify** message appears in chat
5. **Check** browser console for errors (should be clean)

**⚠️ STOP IF ANYTHING FAILS**

If local testing fails:
1. Check browser console for errors
2. Check Supabase logs
3. Review migration scripts
4. Fix issues before production

### Step 2.5: Test rollback locally

```powershell
# Connect to local database
supabase db remote connect --local
```

Inside `psql`:

```sql
-- Test rollback script
\i supabase/migrations/rollback_migration.sql

-- Verify old policies restored
SELECT policyname FROM pg_policies WHERE tablename = 'messages';

-- Should show 4 policies with old names (contains "from their conversations")

-- Exit
\q
```

Test app again - should still work with old policies.

**If rollback works locally, re-apply migration:**

```powershell
supabase db push
```

---

## Phase 3: Production Deployment (CAREFUL!)

### Step 3.1: Final production validation

```powershell
# One more validation check
supabase db remote connect
```

Inside `psql`:

```sql
-- Quick validation
SELECT COUNT(*) FROM messages WHERE conversation_id IS NULL;
SELECT COUNT(*) FROM conversations WHERE auth_user_id IS NULL;

-- Both should return 0
\q
```

### Step 3.2: Backup production database

```powershell
# Create backup before migration
supabase db dump -f backup_before_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

This creates a full database backup.

### Step 3.3: Apply migration to production

**⚠️ POINT OF NO RETURN - Make sure you're ready**

```powershell
# Apply BOTH migrations to production
supabase db push
```

**Watch output carefully:**
- Should see "Backfill SUCCESS: All X messages now have auth_user_id"
- Should see "Function updated successfully"
- Should NOT see any ERROR messages

### Step 3.4: Immediate verification

```powershell
# Connect to production
supabase db remote connect
```

Inside `psql`:

```sql
-- Verify migration succeeded
SELECT 
  COUNT(*) as total,
  COUNT(auth_user_id) as with_auth_user_id,
  COUNT(*) FILTER (WHERE auth_user_id IS NULL) as null_count
FROM messages;

-- Should show: null_count = 0

-- Verify policies
SELECT policyname FROM pg_policies WHERE tablename = 'messages';

-- Should show 4 new simple policies

-- Exit
\q
```

### Step 3.5: Test production application

1. Open production URL: `https://readmet3xt.github.io/Otagon`
2. **Login** with test account
3. **Send a message** in existing conversation
4. **Create new conversation** and send message
5. **Verify messages appear** correctly
6. **Check browser console** for errors

**⚠️ IF ANYTHING FAILS - ROLLBACK IMMEDIATELY**

---

## Phase 4: Rollback (IF NEEDED)

**Only run this if production migration broke the app**

### Step 4.1: Connect to production

```powershell
supabase db remote connect
```

### Step 4.2: Execute rollback

Inside `psql`:

```sql
-- Restore old state
\i supabase/migrations/rollback_migration.sql

-- Verify rollback
SELECT policyname FROM pg_policies WHERE tablename = 'messages';

-- Should show old policy names
\q
```

### Step 4.3: Verify application works

Test production app - should work as before migration.

### Step 4.4: Investigate issue

Do NOT re-attempt migration until you understand what failed.

---

## Phase 5: Post-Migration (SUCCESS PATH)

### Step 5.1: Monitor for 1 hour

Watch for:
- User error reports
- Increased error rates
- Performance issues

### Step 5.2: Measure performance improvement

```powershell
# Connect to production
supabase db remote connect
```

Inside `psql`:

```sql
-- Test query performance
EXPLAIN ANALYZE
SELECT * FROM messages 
WHERE auth_user_id = auth.uid()
LIMIT 100;

-- Should show:
-- - Index scan on idx_messages_auth_user_id
-- - Fast execution time (<10ms)
-- - No JOIN operations
```

### Step 5.3: Document results

Update `DATABASE_MIGRATION_VALIDATION.md` with:
- Migration timestamp
- Backfill count (total messages)
- Performance improvement metrics
- Any issues encountered

---

## 🆘 Emergency Contacts

If something goes wrong:

1. **Immediate**: Run rollback script (Phase 4)
2. **Check logs**: Supabase dashboard → Logs
3. **Team notification**: Alert all developers
4. **User communication**: Post status update if needed

---

## ✅ Success Criteria

Migration is successful when:

- [ ] All validation checks passed
- [ ] Local testing passed
- [ ] Production migration executed without errors
- [ ] All messages have `auth_user_id` (null_count = 0)
- [ ] New messages can be created via app
- [ ] RLS policies show 4 simple policies
- [ ] `add_message` function updated
- [ ] Application works correctly in production
- [ ] No user-reported issues for 24 hours
- [ ] Query performance improved (measured)

---

## 📝 Commands Quick Reference

```powershell
# Validation (read-only)
supabase db remote connect
\i supabase/migrations/validation_queries.sql
\q

# Local testing
supabase start
supabase db push
supabase db remote connect --local

# Production deployment
supabase db dump -f backup.sql
supabase db push
supabase db remote connect

# Rollback
supabase db remote connect
\i supabase/migrations/rollback_migration.sql
\q
```

---

**Current Status**: ⏸️ READY FOR VALIDATION  
**Next Step**: Run Phase 1 validation queries on production  
**Risk**: 🔴 HIGH - Proceed with caution
