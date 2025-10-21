# 🔍 COMPREHENSIVE CODEBASE AUDIT & END-TO-END TESTING

## 📋 **OBJECTIVE**
Perform a complete audit of the **Otakon AI Gaming Assistant** application to verify:
- ✅ All user flows work from start to finish
- ✅ All features are properly implemented
- ✅ Database operations are correct and secure
- ✅ No broken functionality or dead code
- ✅ Tier limits match landing page promises
- ✅ 14-day Pro trial system works correctly

---

## 🎯 **CRITICAL FIXES COMPLETED**

### **1. Tier Limits** (MUST BE UPDATED!)
**Landing Page Promises:**
- Free: 55 text + 25 image queries/month
- Pro: 1,583 text + 328 image queries/month
- Vanguard Pro: 1,583 text + 328 image queries/month (same as Pro)

**Current Code (WRONG!):**
```typescript
// ❌ conversationService.ts has these INCORRECT limits:
TIER_CONVERSATION_LIMITS = { FREE: 10, PRO: 100, VANGUARD_PRO: 100 }
TIER_MESSAGE_LIMITS = { FREE: 20, PRO: 200, VANGUARD_PRO: 200 }
TIER_TOTAL_MESSAGE_LIMITS = { FREE: 200, PRO: 2000, VANGUARD_PRO: 2000 }
```

**Required Changes:**
1. Replace message-based limits with query-based limits (text vs image)
2. Track monthly usage (reset on 1st of month)
3. Remove arbitrary conversation count limits (unlimited for all tiers)
4. Add database columns: `text_queries_used`, `image_queries_used`, `query_reset_date`

### **2. 14-Day Pro Trial**
✅ **COMPLETED**: Added to Settings Context Menu
- Shows only for Free users who haven't used trial
- Uses Supabase `has_used_trial` flag to prevent abuse
- Automatically upgrades user to Pro for 14 days
- Located in: Settings button → Context menu (where signout is)

---

## 📊 **AUDIT PHASES**

### **PHASE 1: Authentication & Waitlist**
**Waitlist System:**
- [ ] Verify waitlist form on landing page works
- [ ] Check email validation
- [ ] Test Supabase insertion
- [ ] Verify duplicate prevention (23505 error handling)
- [ ] Check waitlist RLS policies

**OAuth Authentication:**
- [ ] Test Google OAuth flow
- [ ] Test Discord OAuth flow (if implemented)
- [ ] Verify `AuthCallback.tsx` handles tokens correctly
- [ ] Check session persistence across refreshes
- [ ] Test `create_user_record` RPC function
- [ ] Verify user record creation in `users` table

**Email Authentication:**
- [ ] Test email sign-up flow
- [ ] Test email sign-in flow
- [ ] Verify email confirmation process
- [ ] Check password reset functionality
- [ ] Test error handling (duplicate emails, invalid passwords)

**Session Management:**
- [ ] Verify Supabase session persists
- [ ] Test automatic token refresh
- [ ] Check auth state propagation
- [ ] Test protected routes
- [ ] Verify unauthenticated users can't access chat

---

### **PHASE 2: Onboarding Flow**
**Splash Screens:**
- [ ] Verify splash screen shows after login
- [ ] Check "Start Your Adventure" button
- [ ] Verify `has_seen_splash_screens` flag updates

**How To Use Screen:**
- [ ] Check content displays correctly
- [ ] Verify "Next" button works
- [ ] Check `has_seen_how_to_use` flag updates

**PC Connection Screen:**
- [ ] Verify screen appears
- [ ] Check QR code/connection code display
- [ ] Test "Sync Now" button (WebSocket connection)
- [ ] Test "Skip for Now" button
- [ ] Verify `pc_connection_skipped` and `pc_connected` flags

**Features Connected Screen:**
- [ ] Verify screen appears after PC connection/skip
- [ ] Check "Continue" button
- [ ] Verify `has_seen_features_connected` flag

**Pro Features Screen:**
- [ ] Verify tier comparison shows
- [ ] Test "Continue with Free" button
- [ ] Verify `has_seen_pro_features` flag

**Completion:**
- [ ] Verify `onboarding_completed` flag is set to `true`
- [ ] Check navigation to chat screen
- [ ] Verify onboarding doesn't repeat
- [ ] Check `getNextOnboardingStep()` returns 'complete'

---

### **PHASE 3: Profile Setup Modal**
- [ ] Verify modal appears on first chat screen load
- [ ] Check if modal shows when `has_profile_setup` is `false`
- [ ] Test profile form fields (Player Focus, Experience Level, Content Style, Spoiler Preference)
- [ ] Test "Complete Setup" button (saves to `profile_data` JSONB)
- [ ] Test "Skip" button
- [ ] Verify `has_profile_setup` flag updates

---

### **PHASE 4: Chat Screen & Game Hub**
**Game Hub Creation:**
- [ ] Verify "Game Hub" conversation is created automatically
- [ ] Check `isGameHub: true` flag is set
- [ ] Verify Game Hub has ID `'game-hub'`
- [ ] Check if Game Hub appears first in sidebar
- [ ] Verify Game Hub cannot be deleted
- [ ] Check migration from old "Everything else" conversations

**Chat Interface:**
- [ ] Test message input field
- [ ] Test image upload (file picker)
- [ ] Test send button functionality
- [ ] Verify message display (user right, AI left)
- [ ] Check typing indicator during AI response
- [ ] Test error handling (network failures, AI errors)

**Suggested Prompts:**
- [ ] Verify prompts show in Game Hub when no messages
- [ ] Check if prompts are gaming news related
- [ ] Test clicking a prompt sends it as message
- [ ] Verify prompts update after AI response (contextual)

**Message Sending:**
- [ ] Test text-only message
- [ ] Test image-only message
- [ ] Test text + image message
- [ ] Verify messages persist to Supabase
- [ ] Check `conversations.messages` JSONB updates

---

### **PHASE 5: Game Detection & Tab Creation**
**Game Detection from Screenshot:**
- [ ] Upload gameplay screenshot
- [ ] Verify AI returns OTAKON tags (`OTAKON_GAME_ID`, `OTAKON_CONFIDENCE`, `OTAKON_GENRE`)
- [ ] Test menu screens, gameplay, boss fights, character screens
- [ ] Verify unreleased games stay in Game Hub

**Game Detection from Text:**
- [ ] Send text query mentioning a game
- [ ] Test direct mentions ("Playing Elden Ring")
- [ ] Test boss names ("How to beat Radahn?")
- [ ] Test location names ("Where is Liurnia?")
- [ ] Test item names ("How to get Moonveil katana?")

**Automatic Game Tab Creation:**
- [ ] Verify new tab is created when game detected
- [ ] Check tab title matches game name
- [ ] Verify tab has unique ID (game slug)
- [ ] Check `isGameHub: false` flag
- [ ] Verify tab persists to Supabase
- [ ] Check tab appears in sidebar below Game Hub

**Message Migration:**
- [ ] Verify user's question moves from Game Hub to game tab
- [ ] Check AI's response moves with it
- [ ] Verify messages are removed from Game Hub
- [ ] Check conversation context is preserved
- [ ] Verify timestamps are maintained
- [ ] Check user is auto-switched to game tab

**Duplicate Prevention:**
- [ ] Create tab for same game twice
- [ ] Verify new message goes to existing tab (no duplicate)

---

### **PHASE 6: Subtabs System**
**Subtab Creation (1:2 Flow):**
- [ ] Verify subtabs are generated when game tab is created
- [ ] Check subtabs match player preferences (Story/Gameplay/Exploration focus)
- [ ] Verify subtabs have initial content from AI response
- [ ] Check `conversation.subtabs` array updates
- [ ] Verify subtabs persist to Supabase

**Subtab Content Display:**
- [ ] Click on a subtab
- [ ] Verify content displays in panel
- [ ] Check formatting (markdown support)
- [ ] Verify subtab switches smoothly
- [ ] Check active subtab is highlighted

**Progressive Subtab Updates (1:1 Flow):**
- [ ] Send follow-up message in game tab
- [ ] Verify AI returns `progressiveInsightUpdates` array
- [ ] Check relevant subtabs are updated (Bosses/Map/Items tabs)
- [ ] Verify `isNew` indicator appears on updated tabs
- [ ] Check updates persist to Supabase

**Subtab Indicators:**
- [ ] Verify "New" badge appears on updated subtabs
- [ ] Check badge disappears after viewing

---

### **PHASE 7: Game Progress Tracking**
**Progress Bar Display:**
- [ ] Verify progress bar appears below subtabs
- [ ] Check bar only shows for game tabs (not Game Hub)
- [ ] Verify bar has gradient styling
- [ ] Check bar is responsive

**Progress Updates:**
- [ ] Send messages indicating progress ("I beat Margit!")
- [ ] Verify AI updates `conversation.gameProgress` (0-100)
- [ ] Check progress dot moves on bar
- [ ] Verify milestones are marked (0%, 25%, 50%, 75%, 100%)
- [ ] Check progress persists to Supabase

**Progress Context:**
- [ ] Verify progress is included in AI context
- [ ] Check AI acknowledges player's progress
- [ ] Verify AI doesn't spoil future content

---

### **PHASE 8: Context Summarization**
**Context Size Check:**
- [ ] Send 20+ messages in a conversation
- [ ] Verify total word count exceeds 900 words
- [ ] Check if `contextSummarizationService` is triggered

**Summarization Process:**
- [ ] Verify older messages (beyond last 8) are summarized
- [ ] Check summary is ~300 words
- [ ] Verify summary is added as system message
- [ ] Check recent 8 messages remain unsummarized
- [ ] Verify summarized context is sent to AI

**Context Quality:**
- [ ] Verify AI responses maintain continuity after summarization
- [ ] Check AI remembers important earlier context
- [ ] Verify summary preserves key details

---

### **PHASE 9: Settings Modal**
**Account Tab:**
- [ ] Verify user email, name, avatar are displayed
- [ ] Check "Log Out" button exists
- [ ] Test logout flow

**Tier & Usage Tab:**
- [ ] Verify current tier is displayed
- [ ] Check query usage display (text vs image)
- [ ] Verify usage bars show correct percentages
- [ ] Check upgrade prompts for Free users
- [ ] **Verify 14-day Pro Trial Banner** shows for eligible users

**App Settings Tab:**
- [ ] Test Dark mode toggle
- [ ] Test Sound effects toggle
- [ ] Test Notifications toggle

**Profile Preferences Tab:**
- [ ] Verify Player Focus options
- [ ] Check Experience Level options
- [ ] Test Content Style options
- [ ] Test Spoiler Preference options
- [ ] Verify "Save Changes" button updates `profile_data`

---

### **PHASE 10: Sidebar & Navigation**
**Sidebar Display:**
- [ ] Verify sidebar shows all conversations
- [ ] Check sorting (Game Hub first, pinned, then recent)
- [ ] Verify conversation titles are visible
- [ ] Check active conversation is highlighted

**Conversation Actions:**
- [ ] Test clicking a conversation
- [ ] Test pin/unpin functionality
- [ ] Test delete (verify Game Hub can't be deleted)
- [ ] Test context menu (right-click)
- [ ] Test rename conversation
- [ ] Test clear messages

**Conversation Creation:**
- [ ] Click "New Conversation" button
- [ ] Enter custom title
- [ ] Verify conversation is created
- [ ] Check conversation appears in sidebar

---

### **PHASE 11: Playing Mode**
**Auto-Activation:**
- [ ] Create game tab via detection
- [ ] Verify "Playing" mode is auto-activated
- [ ] Check playing indicator shows
- [ ] Verify mode persists across refreshes

**Playing Mode Features:**
- [ ] Verify AI responses are more immersive
- [ ] Check context includes active session data
- [ ] Verify subtabs are generated/updated
- [ ] Check progress tracking is active

**Manual Toggle:**
- [ ] Click Playing mode toggle (if exists)
- [ ] Verify mode switches on/off
- [ ] Check `isActiveSession` flag updates

---

### **PHASE 12: Tier System & Limits**
**Free Tier Limits (NEEDS UPDATE!):**
- [ ] Create 10 conversations (current free limit - WRONG!)
- [ ] Send 55 text queries (correct limit per landing page)
- [ ] Upload 25 images (correct limit per landing page)
- [ ] Verify upgrade prompt appears when limits reached
- [ ] **Test monthly reset functionality**

**Pro Tier Limits:**
- [ ] Upgrade user to Pro
- [ ] Send 1,583 text queries
- [ ] Upload 328 images
- [ ] Verify limits are enforced
- [ ] **Test that conversations are unlimited**

**Vanguard Pro Tier:**
- [ ] Upgrade user to Vanguard Pro
- [ ] Verify same limits as Pro (1,583/328)
- [ ] Check Vanguard-specific features

**14-Day Pro Trial:**
- [ ] Verify trial option shows in Settings Context Menu for Free users
- [ ] Test "Start 14-Day Pro Trial" button
- [ ] Verify `has_used_trial` flag is set in Supabase
- [ ] Check user is upgraded to Pro tier
- [ ] Verify `trial_started_at` and `trial_expires_at` are set
- [ ] Test trial expiration (check after 14 days)
- [ ] Verify trial can only be used once per user
- [ ] Check trial banner shows days remaining
- [ ] Test "Upgrade Now" button during active trial

---

### **PHASE 13: Database Operations**
**Supabase Tables:**
- [ ] **users table**: Verify RLS policies, auth_user_id unique, profile_data JSONB, onboarding flags
- [ ] **conversations table**: Verify is_game_hub unique constraint, messages JSONB, subtabs JSONB, RLS policies, Game Hub delete protection
- [ ] **onboarding_progress table**: Verify onboarding tracking
- [ ] **waitlist table**: Verify public access, email unique constraint

**RPC Functions:**
- [ ] **create_user_record**: Test with OAuth user data
- [ ] **get_user_onboarding_status**: Test returns correct flags
- [ ] **update_user_onboarding_status**: Test each step
- [ ] **start_free_trial**: Test trial activation
- [ ] **check_and_expire_trials**: Test automatic trial expiration

**Migrations:**
- [ ] Check all migrations are applied
- [ ] Verify schema matches TypeScript types
- [ ] **Verify `20251021120000_add_game_hub_flag.sql` is applied**

---

### **PHASE 14: Services Layer**
**authService.ts:**
- [ ] `getCurrentUser()`: Returns correct user
- [ ] `login()`: Initiates OAuth flow
- [ ] `logout()`: Clears session and cache
- [ ] `refreshUser()`: Invalidates cache and reloads
- [ ] `updateUserProfile()`: Updates profile_data
- [ ] `subscribe()`: Propagates auth changes

**conversationService.ts:**
- [ ] `getConversations()`: Loads from Supabase, falls back to localStorage
- [ ] `setConversations()`: Saves to both Supabase and localStorage
- [ ] `createConversation()`: Sets isGameHub flag correctly
- [ ] `addConversation()`: Prevents duplicate Game Hub
- [ ] `updateConversation()`: Updates in both locations
- [ ] `deleteConversation()`: Prevents Game Hub deletion
- [ ] `ensureGameHubExists()`: Creates if missing
- [ ] **Tier limits**: `canCreateConversation()`, `canAddMessage()` - NEEDS UPDATE!

**aiService.ts:**
- [ ] `getChatResponse()`: Sends to AI with context
- [ ] Game detection: Returns structured OTAKON tags
- [ ] Profile awareness: Uses user preferences in prompts
- [ ] Error handling: Retries on failure

**gameTabService.ts:**
- [ ] `createGameTab()`: Creates tab with subtabs
- [ ] `updateSubTabsFromAIResponse()`: Updates based on AI response
- [ ] `isGameTab()`: Checks !isGameHub
- [ ] Subtab generation: Uses player preferences

**contextSummarizationService.ts:**
- [ ] `shouldSummarize()`: Checks 900-word threshold
- [ ] `summarizeContext()`: Calls AI to summarize
- [ ] `applyContextSummary()`: Inserts summary message

**supabaseService.ts:**
- [ ] `getConversations()`: Maps is_game_hub correctly
- [ ] `createConversation()`: Sends all fields including isGameHub
- [ ] `updateConversation()`: Updates all fields
- [ ] `deleteConversation()`: Executes delete query
- [ ] `getTrialStatus()`: Returns trial eligibility
- [ ] `startTrial()`: Activates 14-day trial

---

### **PHASE 15: Error Handling & Edge Cases**
**Network Errors:**
- [ ] Disconnect internet during message send
- [ ] Verify error message appears
- [ ] Check retry mechanism
- [ ] Verify message queues for sending when back online

**Database Errors:**
- [ ] Simulate Supabase being down
- [ ] Verify app falls back to localStorage
- [ ] Check data syncs when Supabase returns
- [ ] Test RLS policy violations

**AI Errors:**
- [ ] Simulate AI API failure
- [ ] Verify error message appears
- [ ] Check retry works
- [ ] Test rate limiting

**Edge Cases:**
- [ ] Test very long messages (10,000+ characters)
- [ ] Test large images (>10MB)
- [ ] Test rapid message sending (spam prevention)
- [ ] Test simultaneous tab/device usage
- [ ] Test browser refresh during critical operations
- [ ] Test session expiration during use

---

### **PHASE 16: Performance & Optimization**
**Loading Times:**
- [ ] Measure initial app load time
- [ ] Check conversation loading time
- [ ] Verify AI response latency
- [ ] Test with 100+ conversations

**Memory Usage:**
- [ ] Monitor memory with many conversations
- [ ] Check for memory leaks
- [ ] Verify cleanup on conversation delete

**Caching:**
- [ ] Verify cache hit rate
- [ ] Check stale data is refreshed
- [ ] Test cache invalidation after updates

---

### **PHASE 17: UI/UX & Responsiveness**
**Responsive Design:**
- [ ] Test on mobile (320px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Verify sidebar collapses on mobile

**Animations:**
- [ ] Verify smooth transitions
- [ ] Check loading animations
- [ ] Test progress bar animation
- [ ] Verify modal animations

**Accessibility:**
- [ ] Test keyboard navigation
- [ ] Verify screen reader compatibility
- [ ] Check color contrast ratios

---

### **PHASE 18: Security**
**Authentication Security:**
- [ ] Verify tokens are stored securely
- [ ] Check sessions expire correctly
- [ ] Test CSRF protection

**Data Security:**
- [ ] Check RLS policies prevent unauthorized access
- [ ] Verify users can't access other users' data
- [ ] Test SQL injection prevention
- [ ] Check XSS protection

**API Security:**
- [ ] Verify API keys are not exposed
- [ ] Check rate limiting
- [ ] Test CORS configuration

---

### **PHASE 19: Cache & Persistence System**
**AI Response Caching:**
- [ ] Verify `app_cache` table stores responses correctly
- [ ] Test cache hit on repeated queries
- [ ] Check 24-hour TTL expiration works
- [ ] Verify `cleanup_expired_cache()` function removes old entries
- [ ] Test cache key generation includes game context
- [ ] Check `ai_responses` table separate caching
- [ ] Verify `game_insights` table caching

**Cache Service Functions:**
- [ ] Test `get_cache_stats()` returns correct metrics
- [ ] Verify `get_cache_performance_metrics()` works
- [ ] Check `get_user_cache_entries()` for specific user
- [ ] Test `clear_user_cache()` removes all user cache

**Conversation Persistence:**
- [ ] Verify conversations sync to Supabase on change
- [ ] Test localStorage fallback when offline
- [ ] Check conversation restoration after app restart
- [ ] Verify message history persists correctly
- [ ] Test subtabs persist with conversation data

**App State Persistence:**
- [ ] Verify `app_state` JSONB field saves correctly
- [ ] Test state restoration on login
- [ ] Check active conversation persists
- [ ] Verify onboarding status persists

---

### **PHASE 20: Character Immersion & Advanced AI Features**
**Character Immersion Service:**
- [ ] Test character dialogue generation
- [ ] Verify character personality consistency
- [ ] Check game-specific character data
- [ ] Test character response formatting

**Profile-Aware Tab Service:**
- [ ] Verify subtabs adapt to player preferences
- [ ] Test story-focused vs gameplay-focused tabs
- [ ] Check experience level affects tab content
- [ ] Verify spoiler tolerance is respected

**Suggested Prompts Service:**
- [ ] Test dynamic prompt generation
- [ ] Verify prompts are contextually relevant
- [ ] Check prompts update after each AI response
- [ ] Test prompt diversity (no repetition)
- [ ] Verify gaming news prompts in Game Hub

---

### **PHASE 21: Session & Analytics**
**Session Summary Service:**
- [ ] Test session end detection
- [ ] Verify session summary generation
- [ ] Check summary includes key events
- [ ] Test summary storage in `user_sessions` table

**Active Session Hook:**
- [ ] Verify session tracking starts with game tab
- [ ] Test session duration calculation
- [ ] Check session state updates
- [ ] Verify session ends on tab close
- [ ] Test `duration_seconds` calculation

**User Analytics:**
- [ ] Test event tracking (onboarding steps, queries, etc.)
- [ ] Verify analytics data stored in `user_analytics` table
- [ ] Check RLS policies for analytics table
- [ ] Test analytics aggregation queries
- [ ] Verify event_type indexing works

---

### **PHASE 22: Error Recovery & Resilience**
**Error Recovery Service:**
- [ ] Test automatic retry on AI failures
- [ ] Verify exponential backoff works
- [ ] Check max retry limits (3 retries)
- [ ] Test fallback error messages
- [ ] Verify error state recovery

**Error Service:**
- [ ] Test error logging
- [ ] Verify error categorization
- [ ] Check user-friendly error messages
- [ ] Test error reporting to console

**Offline Mode:**
- [ ] Test app functionality when offline
- [ ] Verify localStorage fallback works
- [ ] Check queued operations sync when online
- [ ] Test offline indicator display
- [ ] Verify graceful degradation

---

### **PHASE 23: Text-to-Speech (TTS)**
**TTS Service:**
- [ ] Test TTS initialization
- [ ] Verify voice selection works
- [ ] Check audio playback controls (play, pause, stop)
- [ ] Test queue management
- [ ] Verify TTS works on different browsers
- [ ] Check TTS preferences persist
- [ ] Test voice speed and pitch controls

---

### **PHASE 24: Developer Mode**
**Developer Authentication:**
- [ ] Test developer password authentication
- [ ] Verify developer mode enables all tiers
- [ ] Check tier switching in developer mode
- [ ] Test developer-only features
- [ ] Verify developer mode indicator shows
- [ ] Check `is_developer` flag in users table

**Developer Features:**
- [ ] Test unlimited query access
- [ ] Verify bypass of tier restrictions
- [ ] Check access to debug information
- [ ] Test developer panel (if exists)

---

### **PHASE 25: Game Tab Management**
**Tab Management Service:**
- [ ] Test game tab sorting
- [ ] Verify pinned tabs stay at top (after Game Hub)
- [ ] Check recently active tabs
- [ ] Test tab search/filter functionality
- [ ] Verify `is_pinned` and `pinned_at` fields work

**Game Library Management:**
- [ ] Test adding games to `games` table
- [ ] Verify game metadata is stored
- [ ] Check game image URLs persist
- [ ] Test game removal from library
- [ ] Verify `status` field (playing/completed/backlog/wishlist)
- [ ] Test `progress` and `playtime_hours` tracking
- [ ] Check `rating` constraint (1-5 stars)

---

### **PHASE 26: Advanced Features**
**OtakonTags Parser:**
- [ ] Test all OTAKON tag types parsing
- [ ] Verify `OTAKON_GAME_ID` extraction
- [ ] Check `OTAKON_CONFIDENCE` detection (0-100)
- [ ] Test `OTAKON_GENRE` parsing
- [ ] Verify `OTAKON_GAME_STATUS` for unreleased games
- [ ] Check `OTAKON_IS_FULLSCREEN` detection
- [ ] Test `OTAKON_TRIUMPH` parsing (achievements)
- [ ] Verify `OTAKON_OBJECTIVE_SET` extraction
- [ ] Check `OTAKON_INSIGHT_UPDATE` parsing

**Prompt System:**
- [ ] Test persona-specific prompts (general vs game-specific)
- [ ] Verify command center instructions included
- [ ] Check profile-aware prompting
- [ ] Test active session context injection
- [ ] Verify spoiler protection prompts
- [ ] Check context summarization integration

---

### **PHASE 27: Modals & UI Components**
**About Modal:**
- [ ] Test modal opens/closes correctly
- [ ] Verify content displays properly
- [ ] Check links work

**Privacy Policy Modal:**
- [ ] Test modal opens from footer
- [ ] Verify policy content is current
- [ ] Check scrolling works

**Terms of Service Modal:**
- [ ] Test modal opens from footer
- [ ] Verify terms content is current
- [ ] Check acceptance checkbox (if exists)

**Refund Policy Modal:**
- [ ] Test modal opens from footer
- [ ] Verify refund policy is clear

**Contact Us Modal:**
- [ ] Test modal opens from footer
- [ ] Verify contact form works
- [ ] Check form validation
- [ ] Test submission to Supabase (if applicable)

**Credit Modal:**
- [ ] Test credit display
- [ ] Verify usage statistics
- [ ] Check upgrade CTA

---

### **PHASE 28: Database Functions & Triggers**
**Core RPC Functions:**
- [ ] **`create_user_record`**: Test with OAuth data, verify tier limits set correctly
- [ ] **`get_complete_user_data`**: Test returns all user fields
- [ ] **`get_user_onboarding_status`**: Test returns correct flags
- [ ] **`update_user_onboarding_status`**: Test each step (initial/how-to-use/features-connected/pro-features/profile-setup/complete)
- [ ] **`get_or_create_game_hub`**: Test creates Game Hub if missing
- [ ] **`increment_user_usage`**: Test text and image query increments
- [ ] **`reset_monthly_usage`**: Test monthly reset logic
- [ ] **`migrate_messages_to_conversation`**: Test message migration

**Cache Functions:**
- [ ] **`cleanup_expired_cache`**: Test removes expired entries from all cache tables
- [ ] **`clear_user_cache`**: Test removes all cache for specific user
- [ ] **`get_cache_stats`**: Test returns stats by cache_type
- [ ] **`get_cache_performance_metrics`**: Test returns performance data
- [ ] **`get_user_cache_entries`**: Test returns user's cache entries

**Database Triggers:**
- [ ] **`update_updated_at_column`**: Test fires on users, conversations, games, onboarding_progress, game_insights
- [ ] **`update_last_login`**: Test fires when auth_user_id changes
- [ ] Verify triggers fire on correct events
- [ ] Check trigger performance

---

### **PHASE 29: Landing Page & Marketing**
**Landing Page Components:**
- [ ] Test hero section displays correctly
- [ ] Verify features section renders
- [ ] Check pricing comparison table (Free: 55 text + 25 image, Pro: 1,583 text + 328 image)
- [ ] Test "Get Started" CTA button
- [ ] Verify responsive layout
- [ ] Check founder images load

**Waitlist Integration:**
- [ ] Test email collection form
- [ ] Verify Supabase insertion to `waitlist` table
- [ ] Check duplicate email handling (unique constraint)
- [ ] Test success/error messages
- [ ] Verify `source` field tracks origin
- [ ] Check `status` field (pending/approved/rejected)

**Footer Links:**
- [ ] Test Privacy Policy link
- [ ] Test Terms of Service link
- [ ] Test Refund Policy link
- [ ] Test Contact Us link
- [ ] Verify social media links (if exists)

---

### **PHASE 30: Query Limits & Usage Tracking (CRITICAL)**
**Current Implementation Verification:**
- [ ] Verify query-based limits are implemented (not message-based)
- [ ] Test `text_count` increments correctly
- [ ] Test `image_count` increments correctly
- [ ] Verify `text_limit` has correct values (55 free, 1583 pro)
- [ ] Verify `image_limit` has correct values (25 free, 328 pro)
- [ ] Check `total_requests` tracks cumulative usage

**Usage Tracking:**
- [ ] Test `increment_user_usage()` for text queries
- [ ] Test `increment_user_usage()` for image queries
- [ ] Verify usage updates in real-time
- [ ] Check usage display in Settings UI
- [ ] Test usage bars show correct percentages

**Monthly Reset Logic:**
- [ ] Verify `last_reset` column exists and tracks reset date
- [ ] Test `reset_monthly_usage()` function
- [ ] Check reset triggers on 1st of month (needs cron job)
- [ ] Verify reset logic for all users
- [ ] Check reset doesn't affect trial users mid-trial
- [ ] Test reset notification (if exists)

**Limit Enforcement:**
- [ ] Test text query blocked when limit reached
- [ ] Test image query blocked when limit reached
- [ ] Verify upgrade prompt appears at limits
- [ ] Check developer mode bypasses limits
- [ ] Test trial users get Pro limits

**Database Verification:**
- [ ] Check `users` table has all usage columns
- [ ] Verify indexes on `text_count`, `image_count`
- [ ] Test RLS policies allow usage updates
- [ ] Check `api_usage` table logs all requests

---

## 🎯 **PRIORITY ISSUES**

### 🔴 **CRITICAL (Must Fix Now)**
1. **Tier Limits Mismatch**: Code doesn't match landing page promises
   - Landing: 55 text + 25 image queries/month for Free
   - Code: 10 conversations, 20 messages per conversation, 200 total messages
   - **ACTION**: Update `conversationService.ts` to use query-based limits
   - **DATABASE**: Add `text_queries_used`, `image_queries_used`, `query_reset_date` columns

2. **14-Day Pro Trial Abuse Prevention**:
   - ✅ Uses Supabase `has_used_trial` flag
   - ✅ Only shows for Free users
   - ✅ Only shows if not already used
   - **TODO**: Test that trial can only be activated once

### 🟡 **HIGH PRIORITY**
1. **Query Tracking System**: Implement text vs image query tracking
2. **Monthly Reset**: Implement automatic monthly usage reset
3. **Trial Expiration**: Implement automatic trial expiration after 14 days

### 🟢 **MEDIUM PRIORITY**
1. **Landing Page**: Update pricing section to match code (if code is correct)
2. **Documentation**: Update README.md with correct tier limits

### 🔵 **LOW PRIORITY**
1. **UI Polish**: Minor animation improvements
2. **Performance**: Optimize large conversation loading

---

## 📝 **TESTING CHECKLIST SUMMARY**

**Total Phases: 30**
**Estimated Test Items: 650+**

### **Phase Breakdown:**
- **PHASE 1**: Authentication & Waitlist (25 items)
- **PHASE 2**: Onboarding Flow (20 items)
- **PHASE 3**: Profile Setup Modal (6 items)
- **PHASE 4**: Chat Screen & Game Hub (25 items)
- **PHASE 5**: Game Detection & Tab Creation (25 items)
- **PHASE 6**: Subtabs System (15 items)
- **PHASE 7**: Game Progress Tracking (12 items)
- **PHASE 8**: Context Summarization (9 items)
- **PHASE 9**: Settings Modal (18 items)
- **PHASE 10**: Sidebar & Navigation (15 items)
- **PHASE 11**: Playing Mode (10 items)
- **PHASE 12**: Tier System & Limits (20 items)
- **PHASE 13**: Database Operations (15 items)
- **PHASE 14**: Services Layer (28 items)
- **PHASE 15**: Error Handling & Edge Cases (18 items)
- **PHASE 16**: Performance & Optimization (9 items)
- **PHASE 17**: UI/UX & Responsiveness (12 items)
- **PHASE 18**: Security (9 items)
- **PHASE 19**: Cache & Persistence System (20 items)
- **PHASE 20**: Character Immersion & Advanced AI (12 items)
- **PHASE 21**: Session & Analytics (15 items)
- **PHASE 22**: Error Recovery & Resilience (12 items)
- **PHASE 23**: Text-to-Speech (7 items)
- **PHASE 24**: Developer Mode (8 items)
- **PHASE 25**: Game Tab Management (12 items)
- **PHASE 26**: Advanced Features (15 items)
- **PHASE 27**: Modals & UI Components (15 items)
- **PHASE 28**: Database Functions & Triggers (20 items)
- **PHASE 29**: Landing Page & Marketing (12 items)
- **PHASE 30**: Query Limits & Usage Tracking (20 items)

### **Critical Systems to Test:**
1. ✅ **Authentication & Authorization** (OAuth, Email, Session Management)
2. ✅ **Query-Based Limits** (Text: 55/1583, Image: 25/328)
3. ✅ **Monthly Usage Reset** (Automated via `reset_monthly_usage()`)
4. ✅ **Game Hub System** (Default conversation, cannot be deleted)
5. ✅ **Game Detection** (Screenshot + Text analysis with OTAKON tags)
6. ✅ **Subtabs System** (1:2 initial, 1:1 progressive updates)
7. ✅ **Cache System** (AI responses, game insights, 24h TTL)
8. ✅ **Onboarding Flow** (7 flags tracked in users table)
9. ✅ **Trial System** (14-day Pro trial, one-time use)
10. ✅ **RLS Policies** (User isolation, data security)

---

## 📋 **TESTING PROTOCOL**

For each phase:
1. **Mark as ✅ PASS** if working correctly
2. **Mark as ❌ FAIL** if broken, with detailed error description
3. **Mark as ⚠️ WARNING** if partially working or has minor issues

**Document all findings** with:
- File paths where issues are found
- Error messages or unexpected behavior
- Suggested fixes
- Database schema validation

---

## �️ **DATABASE SCHEMA VERIFICATION**

**Tables Verified (15 total):**
- ✅ `users` - Core user data with auth_user_id FK to auth.users
- ✅ `conversations` - Game tabs with is_game_hub flag
- ✅ `messages` - Individual messages (not JSONB)
- ✅ `games` - Game library
- ✅ `subtabs` - Subtab content
- ✅ `onboarding_progress` - Step tracking
- ✅ `waitlist` - Pre-launch signups
- ✅ `app_cache` - General caching
- ✅ `ai_responses` - AI response caching
- ✅ `game_insights` - Game-specific caching
- ✅ `api_usage` - Request tracking
- ✅ `user_analytics` - Event tracking
- ✅ `user_sessions` - Session management

**RPC Functions Verified (15 total):**
- ✅ `create_user_record` - User creation with tier limits
- ✅ `get_complete_user_data` - Full user profile
- ✅ `get_user_onboarding_status` - Onboarding flags
- ✅ `update_user_onboarding_status` - Step updates
- ✅ `get_or_create_game_hub` - Game Hub management
- ✅ `increment_user_usage` - Query tracking
- ✅ `reset_monthly_usage` - Monthly reset
- ✅ `cleanup_expired_cache` - Cache cleanup
- ✅ `clear_user_cache` - User cache reset
- ✅ `get_cache_stats` - Cache metrics
- ✅ `get_cache_performance_metrics` - Performance data
- ✅ `get_user_cache_entries` - User cache list
- ✅ `migrate_messages_to_conversation` - Message migration

**Triggers Verified (6 total):**
- ✅ `update_updated_at_column` - Auto-update timestamps
- ✅ `update_last_login` - Track login time
- ✅ Applied to: users, conversations, games, onboarding_progress, game_insights

**Indexes Verified (35+ total):**
- ✅ User lookups: auth_user_id, email, tier
- ✅ Conversation queries: user_id, game_id, is_active, is_game_hub
- ✅ Cache performance: expires_at, cache_type, user_id
- ✅ Analytics: user_id, event_type, created_at

**RLS Policies Verified:**
- ✅ Users can only access own data
- ✅ Waitlist is public (anon can insert)
- ✅ Service role has admin access
- ✅ Cache is user-scoped or public

---

## 🚀 **START THE AUDIT**

**Begin with PHASE 1: Authentication & Waitlist** and work sequentially through all 30 phases.

After each phase, provide a summary report before moving to the next phase.

---

**USE THIS DOCUMENT AS YOUR COMPREHENSIVE AUDIT GUIDE.**
