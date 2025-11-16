# Quick Action Checklist - Otagon App Fixes

**Generated:** 2025-11-16  
**Full Plan:** See [COMPREHENSIVE_FIX_PLAN.md](./COMPREHENSIVE_FIX_PLAN.md)

---

## 🚀 Phase 0: Security Fixes (DAY 1 - START NOW)
**Total Time:** 4-6 hours | **Risk:** 🟢 Low | **Priority:** 🔴 CRITICAL

### Morning (2-3 hours)
- [ ] **[30 min]** Remove hardcoded credentials from `src/lib/supabase.ts`
  - Remove fallback values for URL and anon key
  - Add validation that throws error if env vars missing
  - Add helpful error messages for developers
- [ ] **[15 min]** Create/update `.env.example` with clear instructions
- [ ] **[15 min]** Create `src/vite-env.d.ts` for typed environment variables
- [ ] **[10 min]** Verify `.env` is in `.gitignore`
- [ ] **[15 min]** Test locally (delete `.env`, verify error, restore, verify works)
- [ ] **[30 min]** Update all `(import.meta as any).env` to `import.meta.env`

### Afternoon (2 hours)
- [ ] **[5 min]** Change ESLint rule `no-explicit-any` from `'off'` to `'warn'`
- [ ] **[10 min]** Run `npm run lint` and document current `any` count (~50)
- [ ] **[30 min]** Commit changes: "fix(security): remove hardcoded credentials, add env validation"
- [ ] **[15 min]** Create PR for team review
- [ ] **[30 min]** Deploy to staging and verify
- [ ] **[30 min]** Monitor for issues, prepare rollback if needed

**Success Check:**
- ✅ App throws clear error when `.env` missing
- ✅ No hardcoded URLs in source code
- ✅ TypeScript autocomplete works for env vars
- ✅ ESLint warns on new `: any` usage

---

## 🏗️ Phase 1: React Router (DAYS 2-4)
**Total Time:** 2-3 days | **Risk:** 🔴 High | **Priority:** 🔴 CRITICAL

### Day 2: Router Setup (8 hours)
**Morning (4 hours)**
- [ ] Create `src/router.tsx` with `createBrowserRouter` config
- [ ] Define all routes (landing, login, app, onboarding, settings)
- [ ] Create loader functions (rootLoader, authLoader, authCallbackLoader)
- [ ] Add ErrorBoundary component for route errors

**Afternoon (4 hours)**
- [ ] Update `src/main.tsx` to use `<RouterProvider>`
- [ ] Add Suspense boundaries for lazy-loaded routes
- [ ] Create `src/hooks/useAppNavigation.ts` navigation hook
- [ ] Test basic navigation (landing → login → app)

### Day 3: Component Migration (8 hours)
**Morning (4 hours)**
- [ ] Update all components to use `useAppNavigation()` hook
- [ ] Remove manual `setAppState({ view: '...' })` calls
- [ ] Update buttons to use `navigate()` instead of state updates
- [ ] Convert settings modal to route (`/app/settings`)

**Afternoon (4 hours)**
- [ ] Replace `<AppRouter>` prop drilling with router context
- [ ] Update components to use `useOutletContext()` for shared state
- [ ] Remove hardcoded auth callback check (`window.location.pathname`)
- [ ] Test onboarding flow with URL navigation

### Day 4: Testing & Cleanup (6-8 hours)
**Morning (4 hours)**
- [ ] Test all navigation flows end-to-end
- [ ] Test browser back/forward buttons
- [ ] Test page refresh behavior
- [ ] Test direct URL access (bookmarks)
- [ ] Test auth redirects

**Afternoon (3-4 hours)**
- [ ] Add loading states for route transitions
- [ ] Clean up legacy state management code
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Monitor and fix edge cases

**Success Check:**
- ✅ All routes accessible via URL
- ✅ Browser back/forward work correctly
- ✅ Bookmarking works
- ✅ No prop drilling (< 5 props per component)
- ✅ Auth redirects work

---

## 🗄️ Phase 2: Database Schema (DAYS 5-7)
**Total Time:** 2-3 days | **Risk:** 🟠 Medium | **Priority:** 🟠 High

### Day 5: Migration Scripts (8 hours)
**Morning (4 hours)**
- [ ] Create `20251116_add_auth_user_id_columns.sql` migration
- [ ] Add `auth_user_id` column to 7 tables
- [ ] Write backfill queries for each table
- [ ] Add NOT NULL constraints
- [ ] Create performance indexes

**Afternoon (4 hours)**
- [ ] Create `20251116_simplify_rls_policies.sql` migration
- [ ] Drop old complex RLS policies (30+ policies)
- [ ] Create new simplified policies (direct `auth_user_id` check)
- [ ] Test RLS locally with psql
- [ ] Create rollback script

### Day 6: Application Updates (8 hours)
**Morning (4 hours)**
- [ ] Update `src/services/supabaseService.ts` queries
- [ ] Remove `get_user_id_from_auth_id` RPC calls
- [ ] Add `auth_user_id` to all insert operations
- [ ] Simplify query logic (remove user table JOINs)

**Afternoon (4 hours)**
- [ ] Update all services (onboarding, websocket, etc.)
- [ ] Test CRUD operations
- [ ] Test with multiple users
- [ ] Verify RLS blocks unauthorized access

### Day 7: Validation & Deploy (6-8 hours)
**Morning (3-4 hours)**
- [ ] Run performance tests (EXPLAIN ANALYZE)
- [ ] Verify 60-80% query speed improvement
- [ ] Test data integrity (no orphaned records)
- [ ] Load testing (100+ concurrent users)

**Afternoon (3-4 hours)**
- [ ] Apply migrations to staging
- [ ] Monitor for issues (24 hours)
- [ ] Apply to production (with backup)
- [ ] Document changes in `docs/SCHEMA_MIGRATION_AUTH_USER_ID.md`

**Success Check:**
- ✅ All tables have `auth_user_id` column
- ✅ RLS policies use direct comparison (no JOINs)
- ✅ Query performance improved 60-80%
- ✅ Zero RLS violations
- ✅ Rollback tested

---

## 🎯 Phase 3: Type Safety (DAYS 8-13)
**Total Time:** 6-8 days | **Risk:** 🟢 Low | **Priority:** 🟡 Medium

### Days 8-9: Type Definitions (2 days)
- [ ] **[4 hours]** Create comprehensive types in `src/types/index.ts`
  - `ContextMenu`, `ContextMenuItem`, `ContextMenuPosition`
  - `Achievement` (full type)
  - `FeedbackModalState` (full type)
  - `WebSocketMessage` (discriminated union)
- [ ] **[4 hours]** Update `AppState` interface to use new types
- [ ] **[4 hours]** Create types for service responses
- [ ] **[4 hours]** Create types for API payloads

### Days 10-11: Service Updates (2 days)
- [ ] **[8 hours]** Update all service method signatures
  - Cache service: proper generic types
  - Auth service: typed responses
  - Onboarding service: typed state
  - WebSocket service: typed messages
- [ ] **[8 hours]** Update component props (remove `: any`)

### Days 12-13: Final Cleanup (2 days)
- [ ] **[8 hours]** Update event handlers with proper types
- [ ] **[4 hours]** Fix remaining TypeScript errors
- [ ] **[2 hours]** Run full type check (`tsc --noEmit`)
- [ ] **[2 hours]** Verify `any` count reduced to < 5

**Success Check:**
- ✅ Reduced `: any` from 50+ to < 5
- ✅ Zero TypeScript errors
- ✅ Full autocomplete in IDE
- ✅ No runtime type errors

---

## ✨ Phase 4: Polish (DAYS 14-16)
**Total Time:** 2 days | **Risk:** 🟢 Low | **Priority:** 🟢 Low

### Quick Wins (4 hours total)
- [ ] **[1 hour]** Add security attributes to React Markdown links
  - Add custom `a` component with `target="_blank" rel="noopener noreferrer"`
- [ ] **[30 min]** Add ARIA attributes to Embla Carousel
  - `role="region"`, `aria-roledescription="carousel"`
  - Button labels: `aria-label="Previous slide"`
- [ ] **[30 min]** Document dark mode strategy
  - Option A: Remove toggle (5 minutes)
  - Option B: Implement light mode (2-3 days)
- [ ] **[2 hours]** Final testing and QA

**Success Check:**
- ✅ Markdown links secure
- ✅ Carousel accessible
- ✅ Dark mode decision documented

---

## 📊 Progress Tracking

### Overall Progress
```
[  ] Phase 0: Security (Day 1)              - 0/6 tasks
[  ] Phase 1: React Router (Days 2-4)       - 0/15 tasks
[  ] Phase 2: Database (Days 5-7)           - 0/12 tasks
[  ] Phase 3: Type Safety (Days 8-13)       - 0/8 tasks
[  ] Phase 4: Polish (Days 14-16)           - 0/4 tasks

Total: 0/45 tasks complete
```

### Priority Breakdown
- 🔴 **CRITICAL (P0):** 3 issues → 15 tasks → Days 1-4
- 🟠 **HIGH (P1):** 4 issues → 12 tasks → Days 5-7
- 🟡 **MEDIUM (P2):** 6 issues → 14 tasks → Days 8-16
- 🟢 **LOW (P3):** 3 issues → 4 tasks → Days 14-16

---

## ⚡ Quick Reference

### Files to Modify
**Phase 0:**
- `src/lib/supabase.ts` ← Remove hardcoded credentials
- `src/vite-env.d.ts` ← Create for typed env
- `.env.example` ← Update instructions
- `scripts/eslint.config.js` ← Change `any` rule

**Phase 1:**
- `src/main.tsx` ← Use RouterProvider
- `src/router.tsx` ← Create router config
- `src/App.tsx` ← Simplify (remove state management)
- `src/components/AppRouter.tsx` ← Delete (replaced by router)
- `src/hooks/useAppNavigation.ts` ← Create navigation hook
- All navigation components ← Update to use hooks

**Phase 2:**
- `supabase/migrations/20251116_add_auth_user_id_columns.sql` ← Create
- `supabase/migrations/20251116_simplify_rls_policies.sql` ← Create
- `supabase/migrations/20251116_rollback_auth_user_id.sql` ← Create
- `src/services/*.ts` ← Update queries

**Phase 3:**
- `src/types/index.ts` ← Add comprehensive types
- All service files ← Update signatures
- All components ← Remove `: any`

**Phase 4:**
- Component using ReactMarkdown ← Add link security
- `src/components/HowToUseSplashScreen.tsx` ← Add ARIA

### Commands to Run
```bash
# Phase 0
npm run lint                    # Check current issues
npm run dev                     # Test without .env
npm run dev                     # Test with .env

# Phase 1
npm run dev                     # Test routing locally
npm run build                   # Verify build succeeds

# Phase 2
npx supabase db reset           # Reset local DB
npx supabase migration up       # Apply migrations
npm test                        # Run test suite

# Phase 3
npx tsc --noEmit               # Type check
npm run lint                    # Verify ESLint

# Phase 4
npm run build                   # Final build
npm run preview                 # Preview production
```

### Emergency Contacts
- **Rollback Phase 1:** `git checkout <previous-commit> src/router.tsx src/main.tsx`
- **Rollback Phase 2:** `psql < supabase/migrations/20251116_rollback_auth_user_id.sql`
- **Rollback Phase 3:** Change ESLint back to `'off'`, fix gradually

---

## 📝 Daily Standup Template

### What I did yesterday:
- [ ] Completed tasks from checklist

### What I'm doing today:
- [ ] Next tasks from checklist

### Blockers:
- [ ] None / List blockers

### Need help with:
- [ ] Code review / Testing / Architecture decision

---

**Last Updated:** 2025-11-16  
**Status:** 🔴 Not Started  
**Next Action:** Start Phase 0 - Remove hardcoded credentials
