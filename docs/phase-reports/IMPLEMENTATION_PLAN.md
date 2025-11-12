# Implementation Plan - Welcome Screen Access & New Features

## Overview
This document outlines the implementation plan for four major feature additions:
1. Re-access welcome screen from settings
2. Redirect to login page on logout (not landing page)
3. Add "Add Game" functionality with modal
4. Change auto-upload default to OFF

---

## Feature 1: Re-access Welcome Screen from Settings

### Objective
Allow users to view the welcome screen again after dismissing it, accessible via settings context menu.

### Changes Required

#### 1.1 Update WelcomeScreen Component
**File**: `src/components/welcome/WelcomeScreen.tsx`

**Changes**:
- Add prop `isRevisit?: boolean` to detect if user is revisiting
- Change CTA button text based on context:
  - First visit: "Start Chatting" (current)
  - Revisit: "Continue Chatting"
- Update button handler to use conditional text

**Code Location**: Line 467 (CTA button)

**Implementation**:
```typescript
interface WelcomeScreenProps {
  onStartChat: () => void;
  isRevisit?: boolean; // NEW
}

// Update button text
{isRevisit ? 'Continue Chatting' : 'Start Chatting'}
```

**Estimated Time**: 5 minutes

---

#### 1.2 Add Guide Option to Settings Context Menu
**File**: `src/components/ui/SettingsContextMenu.tsx`

**Changes**:
- Add `onOpenGuide?: () => void` prop to interface (line 13)
- Add new menu item between "Settings" and "Start Free Trial"
- Use book/guide icon
- Otagon brand colors on hover

**Code Location**: After line 129 (after Settings button)

**Implementation**:
```typescript
interface SettingsContextMenuProps {
  // ... existing props
  onOpenGuide?: () => void; // NEW
}

// New menu item
<button
  onClick={() => {
    onOpenGuide?.();
    onClose();
  }}
  className="w-full px-4 py-2 text-left text-text-primary hover:bg-gradient-to-r hover:from-[#FF4D4D]/10 hover:to-[#FFAB40]/10 transition-colors duration-200 flex items-center space-x-3"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
  <span>Guide</span>
</button>
```

**Estimated Time**: 10 minutes

---

#### 1.3 Update MainApp to Handle Guide Opening
**File**: `src/components/MainApp.tsx`

**Changes**:
1. Add handler function `handleOpenGuide` (around line 580)
2. Pass `isRevisit` prop to WelcomeScreen based on `showWelcomeScreen` state
3. Pass `onOpenGuide` prop to SettingsContextMenu
4. Update WelcomeScreen render to include `isRevisit` prop

**Code Locations**:
- Handler: Line ~580 (after `handleStartChat`)
- SettingsContextMenu props: Line ~1600
- WelcomeScreen render: Line ~1398

**Implementation**:
```typescript
// Handler function
const handleOpenGuide = () => {
  setShowWelcomeScreen(true);
};

// Update WelcomeScreen render (line 1398)
if (showWelcomeScreen && !activeConversation) {
  return <WelcomeScreen onStartChat={handleStartChat} isRevisit={true} />;
}

// Or better - track if it's first time
const isFirstTimeWelcome = !localStorage.getItem('otakon_welcome_shown');

if (showWelcomeScreen) {
  return <WelcomeScreen onStartChat={handleStartChat} isRevisit={!isFirstTimeWelcome} />;
}

// Pass to SettingsContextMenu
<SettingsContextMenu
  // ... existing props
  onOpenGuide={handleOpenGuide}
/>
```

**Estimated Time**: 15 minutes

**Testing**:
- [ ] Click "Guide" in settings menu
- [ ] Verify welcome screen shows with "Continue Chatting" button
- [ ] Click "Continue Chatting" and verify chat returns
- [ ] Verify all tabs still work correctly
- [ ] Test on mobile/tablet/desktop

---

## Feature 2: Logout Redirects to Login Page

### Objective
When users sign out, take them directly to the login page instead of landing page.

### Changes Required

#### 2.1 Update Logout Handler
**File**: `src/App.tsx`

**Changes**:
- Modify `confirmLogout` function (line 216)
- Change view from `'landing'` to keep `'login'`
- Update onboardingStatus to `'login'` (already correct)
- Remove landing page redirect logic

**Code Location**: Lines 216-227

**Current Code**:
```typescript
const confirmLogout = async () => {
  console.log('🎯 [App] Starting logout process...');
  setShowLogoutConfirm(false);
  await authService.signOut();
  setAppState((prev: AppState) => ({
    ...prev,
    view: 'landing', // CHANGE THIS
    onboardingStatus: 'login'
  }));
  isProcessingAuthRef.current = false;
  console.log('🎯 [App] Logout completed, showing login page (user has logged in before)');
};
```

**Updated Code**:
```typescript
const confirmLogout = async () => {
  console.log('🎯 [App] Starting logout process...');
  setShowLogoutConfirm(false);
  await authService.signOut();
  setAppState((prev: AppState) => ({
    ...prev,
    view: 'login', // CHANGED: Go directly to login
    onboardingStatus: 'login'
  }));
  isProcessingAuthRef.current = false;
  console.log('🎯 [App] Logout completed, showing login page');
};
```

**Estimated Time**: 2 minutes

**Testing**:
- [ ] Click logout in settings
- [ ] Confirm logout
- [ ] Verify login page shows (not landing page)
- [ ] Verify "Back to Landing Page" button still works on login page
- [ ] Verify can log back in successfully

**Note**: Users can still access landing page via "Back to Landing Page" button on login screen.

---

## Feature 3: Add Game Functionality

### Objective
Allow users to quickly create a new game-specific chat tab with an initial query.

### Changes Required

#### 3.1 Create AddGameModal Component
**File**: `src/components/modals/AddGameModal.tsx` (NEW FILE)

**Structure**:
- Modal overlay with backdrop
- Title: "Add New Game"
- Input 1: Game name (required)
- Input 2: Current situation / What help do you need? (required, multiline textarea)
- Buttons: Cancel, Create (with Otagon gradient)
- Form validation
- Loading state during creation
- Mobile responsive

**Implementation**:
```typescript
interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGame: (gameName: string, query: string) => Promise<void>;
}

const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onCreateGame,
}) => {
  const [gameName, setGameName] = useState('');
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    // Validation
    if (!gameName.trim()) {
      setError('Please enter a game name');
      return;
    }
    if (!query.trim()) {
      setError('Please describe your situation or question');
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      await onCreateGame(gameName.trim(), query.trim());
      // Reset and close
      setGameName('');
      setQuery('');
      onClose();
    } catch (err) {
      setError('Failed to create game tab. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setGameName('');
      setQuery('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface border border-surface-light/20 rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light/20">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent">
            Add New Game
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Game Name Input */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Game Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="e.g., Elden Ring, The Witcher 3, Cyberpunk 2077"
              className="w-full px-4 py-2 bg-background border border-surface-light/20 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-[#FF4D4D] transition-colors"
              disabled={isCreating}
            />
          </div>

          {/* Query Input */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Where are you in the game? What help do you need? <span className="text-red-400">*</span>
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., I'm stuck at the Margit boss fight. I'm level 25 with a strength build. What strategies should I use?"
              rows={4}
              className="w-full px-4 py-2 bg-background border border-surface-light/20 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-[#FF4D4D] transition-colors resize-none"
              disabled={isCreating}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-light/20">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-6 py-2 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-6 py-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Game Tab'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGameModal;
```

**Estimated Time**: 45 minutes

---

#### 3.2 Add "Add Game" Button to Sidebar
**File**: `src/components/layout/Sidebar.tsx`

**Changes**:
- Add `onAddGame?: () => void` prop to interface (line 14)
- Add button above conversation list
- Use game controller icon
- Otagon gradient styling

**Code Location**: Line ~140 (before conversation list mapping)

**Implementation**:
```typescript
interface SidebarProps {
  // ... existing props
  onAddGame?: () => void; // NEW
}

// Add button in render (before conversation list)
{/* Add Game Button */}
<button
  onClick={() => {
    onAddGame?.();
    onClose(); // Close sidebar on mobile
  }}
  className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  <span className="font-medium">Add Game</span>
</button>
```

**Estimated Time**: 10 minutes

---

#### 3.3 Add "Add Game" Button to Welcome Screen
**File**: `src/components/welcome/WelcomeScreen.tsx`

**Changes**:
- Add `onAddGame?: () => void` prop to interface
- Add button next to "Start/Continue Chatting" button
- Otagon gradient styling but secondary style

**Code Location**: Line ~467 (CTA section)

**Implementation**:
```typescript
interface WelcomeScreenProps {
  onStartChat: () => void;
  isRevisit?: boolean;
  onAddGame?: () => void; // NEW
}

// Update CTA section
<div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
  <button
    onClick={onStartChat}
    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
  >
    <span className="font-semibold">{isRevisit ? 'Continue Chatting' : 'Start Chatting'}</span>
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </button>
  
  {/* Add Game Button */}
  {onAddGame && (
    <button
      onClick={onAddGame}
      className="w-full sm:w-auto px-8 py-3 bg-surface hover:bg-surface-light border border-surface-light/20 hover:border-[#FF4D4D] text-text-primary rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="font-semibold">Add Game</span>
    </button>
  )}
</div>
```

**Estimated Time**: 10 minutes

---

#### 3.4 Integrate Add Game Modal in MainApp
**File**: `src/components/MainApp.tsx`

**Changes**:
1. Import AddGameModal component
2. Add state for modal: `const [addGameModalOpen, setAddGameModalOpen] = useState(false);`
3. Create handler: `handleAddGameModalOpen`, `handleAddGameModalClose`
4. Create handler: `handleCreateGame(gameName: string, query: string)` - **FOLLOWS EXISTING PATTERN**
5. Pass `onAddGame` prop to Sidebar
6. Pass `onAddGame` prop to WelcomeScreen
7. Render AddGameModal

**Code Locations**:
- State: Line ~90 (with other modal states)
- Handlers: Line ~600 (after handleStartChat)
- Sidebar prop: Line ~1430
- WelcomeScreen prop: Line ~1398
- Modal render: Line ~1580 (with other modals)

**Implementation** (Following Existing Game Tab Creation Pattern):
```typescript
// Import
import AddGameModal from './modals/AddGameModal';

// State
const [addGameModalOpen, setAddGameModalOpen] = useState(false);

// Handlers
const handleAddGameModalOpen = () => {
  setAddGameModalOpen(true);
};

const handleAddGameModalClose = () => {
  setAddGameModalOpen(false);
};

/**
 * Handle game tab creation from Add Game modal
 * IMPORTANT: Follows existing game tab creation flow:
 * 1. Ensure we're in Game Hub (switch if not)
 * 2. Send user query to Game Hub
 * 3. Get AI response (which includes GAME_ID tag with game name)
 * 4. Let existing game tab detection logic create the tab
 * 5. Automatically migrate user query + AI response to new game tab
 * 6. Generate subtabs from AI response
 * 7. Switch to new game tab
 */
const handleCreateGame = async (gameName: string, query: string) => {
  try {
    console.log('🎮 [MainApp] Add Game Modal - Creating game tab:', { gameName, query });
    
    // Step 1: Switch to Game Hub if not already there
    const gameHub = conversations[GAME_HUB_ID];
    if (!gameHub) {
      throw new Error('Game Hub not found');
    }
    
    if (activeConversation?.id !== GAME_HUB_ID) {
      console.log('🎮 [MainApp] Switching to Game Hub for game creation');
      await ConversationService.setActiveConversation(GAME_HUB_ID);
      setActiveConversation(gameHub);
    }
    
    // Step 2: Construct query with game name to help AI identify the game
    // This ensures AI returns GAME_ID tag which triggers existing tab creation logic
    const enhancedQuery = `I'm playing ${gameName}. ${query}`;
    
    console.log('🎮 [MainApp] Sending query to Game Hub:', enhancedQuery);
    
    // Step 3: Send message to Game Hub
    // The existing handleSendMessage flow will:
    // - Add user message to Game Hub
    // - Get AI response with GAME_ID tag
    // - Detect game from AI response (existing logic at line ~1223)
    // - Create game tab via handleCreateGameTab (existing logic at line ~1260)
    // - Migrate messages from Game Hub to game tab (existing logic at line ~1266)
    // - Generate subtabs from AI response (existing gameTabService logic)
    // - Switch to new game tab automatically (existing logic at line ~1315)
    await handleSendMessage(enhancedQuery);
    
    console.log('🎮 [MainApp] Game tab creation initiated via existing flow');
    
    // Note: No need to manually create tab, migrate messages, or switch tabs
    // The existing handleSendMessage flow handles all of that automatically
    // when AI returns GAME_ID tag with the game name
    
  } catch (error) {
    console.error('🎮 [MainApp] Error in Add Game Modal flow:', error);
    toastService.error('Failed to create game tab. Please try again.');
    throw error; // Re-throw for modal to handle
  }
};

// Pass to Sidebar
<Sidebar
  // ... existing props
  onAddGame={handleAddGameModalOpen}
/>

// Pass to WelcomeScreen
<WelcomeScreen
  onStartChat={handleStartChat}
  isRevisit={!isFirstTimeWelcome}
  onAddGame={handleAddGameModalOpen}
/>

// Render modal
<AddGameModal
  isOpen={addGameModalOpen}
  onClose={handleAddGameModalClose}
  onCreateGame={handleCreateGame}
/>
```

**Flow Diagram**:
```
User fills modal (game name + query)
  ↓
handleCreateGame() called
  ↓
Switch to Game Hub (if not already there)
  ↓
Send enhanced query: "I'm playing [GAME]. [USER_QUERY]"
  ↓
handleSendMessage() processes query
  ↓
AI responds with GAME_ID tag + game help
  ↓
EXISTING LOGIC detects GAME_ID tag (line ~1223)
  ↓
EXISTING LOGIC creates game tab (line ~1260)
  ↓
EXISTING LOGIC migrates messages (line ~1266-1310)
  ↓
EXISTING LOGIC switches to game tab (line ~1315)
  ↓
EXISTING LOGIC generates subtabs (gameTabService)
  ↓
User sees new game tab with their query + AI response
```

**Benefits of This Approach**:
1. ✅ Reuses ALL existing game detection logic
2. ✅ Reuses ALL existing tab creation logic
3. ✅ Reuses ALL existing message migration logic
4. ✅ Reuses ALL existing subtab generation logic
5. ✅ No duplicate code
6. ✅ Consistent behavior between manual and automatic game detection
7. ✅ AI can correct misspelled game names naturally
8. ✅ Full context available for better AI responses

**Estimated Time**: 20 minutes (reduced from 30 due to reusing existing logic)

**Testing**:
- [ ] Click "Add Game" in sidebar
- [ ] Verify modal opens
- [ ] Test form validation (empty fields)
- [ ] Enter game name and query
- [ ] Click "Create Game Tab"
- [ ] Verify new tab created with correct name
- [ ] Verify AI response generated for initial query
- [ ] Verify tab becomes active
- [ ] Verify can continue conversation
- [ ] Test "Add Game" from welcome screen
- [ ] Test on mobile/tablet/desktop

---

## Feature 4: Auto-Upload Default to OFF

### Objective
Change the default state of auto-upload toggle to OFF, requiring users to manually enable it.

### Changes Required

#### 4.1 Update Initial State
**File**: `src/components/MainApp.tsx`

**Changes**:
- Change `isManualUploadMode` initial state from `false` to `true`
- This means "manual mode" is ON by default, so auto-upload is OFF

**Code Location**: Line 79

**Current Code**:
```typescript
const [isManualUploadMode, setIsManualUploadMode] = useState(false);
```

**Updated Code**:
```typescript
const [isManualUploadMode, setIsManualUploadMode] = useState(true); // Default to manual mode (auto-upload OFF)
```

**Estimated Time**: 1 minute

**Impact Analysis**:
- When `isManualUploadMode = true`:
  - Auto-upload is OFF
  - Screenshots queue in input area for review
  - User can add text context before sending
  - User must click send button manually
  
- When `isManualUploadMode = false`:
  - Auto-upload is ON
  - Screenshots sent automatically to AI
  - No text context added
  - Immediate AI response

**Testing**:
- [ ] Fresh login - verify auto-upload toggle is OFF
- [ ] Capture screenshot with PC Client
- [ ] Verify screenshot appears in input area (not sent automatically)
- [ ] Add text context
- [ ] Click send
- [ ] Verify AI receives both image and text
- [ ] Toggle auto-upload ON
- [ ] Capture screenshot
- [ ] Verify screenshot sends automatically
- [ ] Toggle back to OFF
- [ ] Verify setting persists

**Note**: This is a better UX because:
1. Users can provide context with screenshots for more accurate responses
2. Users have control over what gets sent
3. Prevents accidental queries from random screenshots
4. Still allows toggling to auto mode for rapid-fire queries

---

## Implementation Order

### Phase 1: Quick Wins (30 minutes)
1. ✅ Feature 4: Auto-upload default to OFF (1 min)
2. ✅ Feature 2: Logout to login page (2 min)
3. ✅ Feature 1.1: WelcomeScreen CTA text change (5 min)
4. ✅ Feature 1.2: Settings menu "Guide" option (10 min)
5. ✅ Feature 1.3: MainApp guide handler (15 min)

### Phase 2: Add Game Feature (1.5 hours)
6. ✅ Feature 3.1: Create AddGameModal component (45 min)
7. ✅ Feature 3.2: Add button to Sidebar (10 min)
8. ✅ Feature 3.3: Add button to WelcomeScreen (10 min)
9. ✅ Feature 3.4: Integrate in MainApp (30 min)

### Phase 3: Testing & Polish (30 minutes)
10. ✅ Test all features individually
11. ✅ Test integration between features
12. ✅ Test on mobile, tablet, desktop
13. ✅ Fix any bugs or UX issues
14. ✅ Update documentation

---

## Total Estimated Time
- **Phase 1**: 30 minutes
- **Phase 2**: 1.5 hours
- **Phase 3**: 30 minutes
- **Total**: ~2.5 hours

---

## Risk Assessment

### Low Risk
- Feature 2 (Logout redirect): One-line change
- Feature 4 (Auto-upload default): One-line change
- Feature 1.1 (CTA text): Simple conditional

### Medium Risk
- Feature 1.2 & 1.3 (Settings guide): New feature, needs testing
- Feature 3.2 & 3.3 (Add Game buttons): UI additions

### Higher Risk
- Feature 3.1 (AddGameModal): New component with form validation
- Feature 3.4 (Game creation logic): Complex state management and AI integration

### Mitigation Strategies
1. Implement in phases (quick wins first)
2. Test each feature independently
3. Use existing patterns (modal structure, conversation creation)
4. Add error handling for all async operations
5. Include loading states for user feedback

---

## Dependencies

### External Dependencies
None - all changes use existing services and patterns

### Internal Dependencies
- `ConversationService` for game tab creation
- `aiService` for initial AI response
- `toastService` for user notifications
- `authService` for logout handling
- Existing modal patterns for AddGameModal

---

## Backward Compatibility

### Breaking Changes
None - all changes are additive or improve existing behavior

### User Impact
- **Positive**: Better UX with guide access, game creation, manual upload default
- **Neutral**: Logout to login (still can access landing page)
- **No Negative Impact**: All existing functionality preserved

---

## Success Criteria

### Feature 1: Welcome Screen Access
- [ ] "Guide" appears in settings menu
- [ ] Clicking "Guide" shows welcome screen
- [ ] CTA button shows correct text based on context
- [ ] All tabs work when revisiting
- [ ] Welcome screen can be closed and reopened

### Feature 2: Logout Redirect
- [ ] Logout takes user to login page (not landing)
- [ ] "Back to Landing Page" still works from login
- [ ] Login flow works normally

### Feature 3: Add Game
- [ ] "Add Game" buttons appear in sidebar and welcome screen
- [ ] Modal opens when clicked
- [ ] Form validation works correctly
- [ ] Game tab created with correct name
- [ ] Initial query sent and AI responds
- [ ] New tab becomes active
- [ ] Error handling works

### Feature 4: Auto-Upload Default
- [ ] New sessions start with auto-upload OFF
- [ ] Screenshots queue in input area
- [ ] User can add text before sending
- [ ] Toggle works to enable auto-upload
- [ ] Setting change persists during session

---

## Post-Implementation Tasks

1. Update WELCOME_SCREEN_IMPLEMENTATION.md with new features
2. Add entry to CHANGELOG.md
3. Update user documentation if any
4. Monitor for user feedback
5. Consider adding analytics for feature usage

---

## Questions for Review - ANSWERS ✅

1. **Add Game Modal**: ~~Should we add genre selection dropdown or keep it simple with just name and query?~~
   - ✅ **APPROVED**: Keep it simple - just name and query
   - Note: Users may misspell game names or use poor English - accept input and let AI correct after response

2. **Add Game Modal**: ~~Should initial query be optional or required?~~
   - ✅ **APPROVED**: Query field is REQUIRED

3. **Welcome Screen**: ~~Should "Add Game" button always show, or only on revisit?~~
   - ✅ **APPROVED**: Show on BOTH first visit and revisit

4. **Auto-Upload**: ~~Should we persist this setting across sessions in localStorage?~~
   - ✅ **APPROVED**: YES - persist in localStorage

5. **Settings Guide**: Should we track how many times users access the guide?
   - ⏳ Not critical for initial implementation

---

## Additional Requirements - Session Persistence & Returning User Experience

### New Requirement: Session Persistence & Return User Flow

#### Objective
Users should seamlessly continue where they left off, with proper session management and no unnecessary re-authentication.

#### User Experience Requirements

**Scenario 1: Returning User (Previous Login)**
```
User logs out → User closes app/browser → User returns → User logs in
Expected: Skip ALL onboarding, skip welcome screen, restore last active conversation
```

**Scenario 2: Page Refresh (Active Session)**
```
User is logged in → User refreshes page (F5 or Ctrl+R)
Expected: Stay logged in, restore last active conversation, no logout
```

**Scenario 3: New User (First Time)**
```
User signs up → Complete onboarding flow → See welcome screen once
Expected: Full onboarding → Welcome screen → Start chatting
```

**Scenario 4: Logout**
```
User clicks logout → Only then should session end
Expected: Clear session, redirect to login page
```

---

### Implementation Changes Required

#### 5.1 Auth Session Persistence
**File**: `src/services/authService.ts`

**Objective**: Ensure Supabase session persists across page refreshes

**Current Behavior**: 
- Supabase already handles session persistence via localStorage
- Need to ensure we're not clearing it unintentionally

**Verification Needed**:
```typescript
// Check that session is properly restored on app load
const { data: { session } } = await supabase.auth.getSession();
```

**No changes needed** - Supabase handles this automatically. Just ensure we're not calling `signOut()` on refresh.

**Estimated Time**: 5 minutes (verification only)

---

#### 5.2 Onboarding Skip for Returning Users
**File**: `src/App.tsx`

**Current Logic** (Line ~90-120):
```typescript
const processAuthState = async (session: Session | null) => {
  // ... auth logic
  if (user) {
    // Check onboarding status
    const onboardingStatus = await onboardingService.getNextOnboardingStep(user.authUserId);
    // ... set app state
  }
}
```

**Required Changes**:
Need to detect if user has completed onboarding previously and skip to main app.

**Implementation**:
```typescript
const processAuthState = async (session: Session | null) => {
  if (!session?.user) {
    // No session - show login
    setAppState((prev: AppState) => ({
      ...prev,
      view: 'login',
      onboardingStatus: 'login'
    }));
    return;
  }

  try {
    const currentUser = await authService.getUserData(session.user.id);
    
    if (currentUser) {
      setAuthState({ isAuthenticated: true, user: currentUser });
      
      // Check if user has completed onboarding before
      const onboardingStatus = await onboardingService.getNextOnboardingStep(currentUser.authUserId);
      
      // If onboarding is complete, go directly to main app
      if (onboardingStatus === 'complete') {
        console.log('🎯 [App] Returning user - skipping onboarding and welcome screen');
        setAppState((prev: AppState) => ({
          ...prev,
          view: 'main',
          onboardingStatus: 'complete'
        }));
      } else {
        // New user or incomplete onboarding - continue onboarding
        console.log('🎯 [App] New user or incomplete onboarding:', onboardingStatus);
        setAppState((prev: AppState) => ({
          ...prev,
          view: 'onboarding',
          onboardingStatus
        }));
      }
    }
  } catch (error) {
    console.error('Error processing auth state:', error);
  }
};
```

**Estimated Time**: 15 minutes

---

#### 5.3 Welcome Screen Skip for Returning Users
**File**: `src/components/MainApp.tsx`

**Current Logic** (Line ~205-211):
```typescript
// Check if this is a new user and show welcome screen
const isNewUser = Object.keys(userConversations).length === 0 || 
  (Object.keys(userConversations).length === 1 && userConversations[GAME_HUB_ID]);

if (isNewUser && !localStorage.getItem('otakon_welcome_shown')) {
  setShowWelcomeScreen(true);
  localStorage.setItem('otakon_welcome_shown', 'true');
}
```

**Issue**: This logic is already correct! If `otakon_welcome_shown` exists in localStorage, welcome screen won't show.

**Verification**: Just ensure localStorage is not being cleared on logout.

**Required Change**:
Update logout logic to NOT clear `otakon_welcome_shown` flag.

**File**: `src/App.tsx` (Line ~216)

```typescript
const confirmLogout = async () => {
  console.log('🎯 [App] Starting logout process...');
  setShowLogoutConfirm(false);
  
  // Store welcome screen flag before clearing
  const welcomeShown = localStorage.getItem('otakon_welcome_shown');
  
  await authService.signOut();
  
  // Restore welcome screen flag (user has seen it once, don't show again)
  if (welcomeShown) {
    localStorage.setItem('otakon_welcome_shown', welcomeShown);
  }
  
  setAppState((prev: AppState) => ({
    ...prev,
    view: 'login',
    onboardingStatus: 'login'
  }));
  isProcessingAuthRef.current = false;
  console.log('🎯 [App] Logout completed, showing login page');
};
```

**Estimated Time**: 10 minutes

---

#### 5.4 Auto-Upload Setting Persistence
**File**: `src/components/MainApp.tsx`

**Current** (Line 79):
```typescript
const [isManualUploadMode, setIsManualUploadMode] = useState(true);
```

**Updated with localStorage**:
```typescript
// Load from localStorage on mount, default to true (manual mode)
const [isManualUploadMode, setIsManualUploadMode] = useState(() => {
  const saved = localStorage.getItem('otakon_manual_upload_mode');
  return saved !== null ? saved === 'true' : true; // Default true (auto-upload OFF)
});

// Save to localStorage when changed
useEffect(() => {
  localStorage.setItem('otakon_manual_upload_mode', String(isManualUploadMode));
}, [isManualUploadMode]);
```

**Code Location**: 
- State initialization: Line 79
- useEffect for persistence: Add after state declarations (~Line 115)

**Estimated Time**: 10 minutes

---

#### 5.5 Last Active Conversation Restoration
**File**: `src/components/MainApp.tsx`

**Current Behavior** (Line ~218-275):
Already restores last active conversation via `ConversationService.getActiveConversation()`

**Verification Needed**:
Ensure this works correctly on:
1. Page refresh
2. Logout + login
3. New session

**Current Code** (Line ~218):
```typescript
let active = await ConversationService.getActiveConversation();
console.log('🔍 [MainApp] Active conversation from service:', active);
```

**This already works correctly!** No changes needed.

**Estimated Time**: 5 minutes (verification only)

---

#### 5.6 Prevent Logout on Refresh
**File**: `src/App.tsx`

**Current Behavior**: Check if we're accidentally logging out on refresh

**Investigation Points**:
1. Check if `processAuthState` is properly handling existing sessions
2. Ensure `authService.signOut()` is ONLY called from explicit logout action
3. Verify Supabase auth state change listener doesn't clear session on refresh

**Verification**:
```typescript
// In useEffect for auth listener
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 [App] Auth event:', event, 'Session:', !!session);
    
    // Only process if not during manual operations
    if (!isProcessingAuthRef.current) {
      if (event === 'SIGNED_OUT') {
        // Only clear state on explicit signout, not on refresh
        console.log('🔐 [App] User signed out');
        setAppState((prev: AppState) => ({
          ...prev,
          view: 'login',
          onboardingStatus: 'login'
        }));
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Restore user session
        processAuthState(session);
      }
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

**Estimated Time**: 15 minutes

---

### Updated Implementation Order

#### Phase 1: Quick Wins (30 minutes)
1. ✅ Feature 4: Auto-upload default to OFF (1 min)
2. ✅ Feature 2: Logout to login page (2 min)
3. ✅ Feature 1.1: WelcomeScreen CTA text change (5 min)
4. ✅ Feature 1.2: Settings menu "Guide" option (10 min)
5. ✅ Feature 1.3: MainApp guide handler (15 min)

#### Phase 2: Session Persistence (45 minutes) - NEW
6. ✅ Feature 5.1: Verify auth session persistence (5 min)
7. ✅ Feature 5.2: Skip onboarding for returning users (15 min)
8. ✅ Feature 5.3: Preserve welcome screen flag on logout (10 min)
9. ✅ Feature 5.4: Persist auto-upload setting in localStorage (10 min)
10. ✅ Feature 5.5: Verify active conversation restoration (5 min)
11. ✅ Feature 5.6: Prevent logout on refresh (15 min)

#### Phase 3: Add Game Feature (1.5 hours)
12. ✅ Feature 3.1: Create AddGameModal component (45 min)
13. ✅ Feature 3.2: Add button to Sidebar (10 min)
14. ✅ Feature 3.3: Add button to WelcomeScreen (10 min)
15. ✅ Feature 3.4: Integrate in MainApp (30 min)

#### Phase 4: Testing & Polish (30 minutes)
16. ✅ Test all features individually
17. ✅ Test integration between features
18. ✅ Test session persistence scenarios
19. ✅ Test on mobile, tablet, desktop
20. ✅ Fix any bugs or UX issues
21. ✅ Update documentation

---

### Updated Total Estimated Time
- **Phase 1 (Quick Wins)**: 30 minutes
- **Phase 2 (Session Persistence)**: 45 minutes - NEW
- **Phase 3 (Add Game)**: 1.5 hours
- **Phase 4 (Testing)**: 30 minutes
- **Total**: ~3.25 hours (was 2.5 hours)

---

### Session Persistence Testing Scenarios

#### Scenario 1: New User First Login ✅
```
Steps:
1. Sign up new account
2. Complete onboarding (initial → how-to-use → features-connected → pro-features)
3. See welcome screen (once)
4. Click "Start Chatting"
5. See Game Hub

Expected:
- Full onboarding flow
- Welcome screen shown once
- otakon_welcome_shown flag set
- Active conversation saved
```

#### Scenario 2: Page Refresh (Logged In) ✅
```
Steps:
1. User is logged in with active conversation
2. Press F5 or Ctrl+R to refresh
3. Wait for page reload

Expected:
- NO logout
- NO onboarding
- NO welcome screen
- Restore last active conversation
- All user data intact
```

#### Scenario 3: Logout Then Login (Returning User) ✅
```
Steps:
1. User clicks logout
2. User closes browser/tab
3. User returns later
4. User logs in with credentials

Expected:
- Skip ALL onboarding screens
- Skip welcome screen (already shown once)
- Restore last active conversation or Game Hub
- All previous conversations intact
```

#### Scenario 4: Browser Close Without Logout ✅
```
Steps:
1. User is logged in
2. User closes browser completely (not just tab)
3. User opens browser later
4. User navigates to app

Expected:
- Session still active (Supabase default behavior)
- NO login required
- Restore last active conversation
- All data intact
```

#### Scenario 5: Long Inactivity ✅
```
Steps:
1. User logs in
2. User leaves app idle for extended period (hours/days)
3. User returns and interacts with app

Expected:
- Supabase auto-refreshes token if still valid
- If token expired: redirect to login (gracefully)
- After re-login: skip onboarding, restore conversation
```

---

### LocalStorage Keys Summary

| Key | Purpose | Set When | Cleared When | Persist After Logout? |
|-----|---------|----------|--------------|----------------------|
| `otakon_welcome_shown` | Track if user saw welcome screen | First time welcome screen shown | NEVER (intentional) | ✅ YES |
| `otakon_manual_upload_mode` | Auto-upload toggle preference | User toggles setting | On explicit logout | ❌ NO |
| `otakon_used_suggested_prompts` | Track used prompts | Prompt clicked | Daily reset | ❌ NO |
| `otakon_suggested_prompts_last_reset` | Last prompt reset time | Daily reset | On logout | ❌ NO |
| Supabase auth tokens | Session authentication | Login | On logout | ❌ NO |

**Updated Strategy**:
- `otakon_welcome_shown`: Persist after logout (user has seen it once, never show again)
- `otakon_manual_upload_mode`: Clear on logout (fresh preference for next session)
- Other keys: Clear on logout (session-specific data)

---

### Logout Cleanup Strategy

**File**: `src/App.tsx`

**Updated `confirmLogout` function**:
```typescript
const confirmLogout = async () => {
  console.log('🎯 [App] Starting logout process...');
  setShowLogoutConfirm(false);
  
  // 1. Preserve welcome screen flag (user has seen it, don't show again)
  const welcomeShown = localStorage.getItem('otakon_welcome_shown');
  
  // 2. Sign out (clears Supabase session)
  await authService.signOut();
  
  // 3. Clear session-specific data
  localStorage.removeItem('otakon_manual_upload_mode');
  localStorage.removeItem('otakon_used_suggested_prompts');
  localStorage.removeItem('otakon_suggested_prompts_last_reset');
  // Add any other session-specific keys here
  
  // 4. Restore welcome screen flag
  if (welcomeShown) {
    localStorage.setItem('otakon_welcome_shown', welcomeShown);
  }
  
  // 5. Reset app state
  setAppState((prev: AppState) => ({
    ...prev,
    view: 'login',
    onboardingStatus: 'login'
  }));
  setAuthState({ isAuthenticated: false, user: null });
  isProcessingAuthRef.current = false;
  
  console.log('🎯 [App] Logout completed, showing login page');
};
```

---

### Add Game Modal - Game Name Handling

**File**: `src/components/modals/AddGameModal.tsx`

**Note on Misspellings**:
Users may enter:
- "Eldin Ring" instead of "Elden Ring"
- "witcher 3" instead of "The Witcher 3"  
- "cp2077" instead of "Cyberpunk 2077"
- Poor English or abbreviations

**Strategy**: 
1. Accept whatever user types (no validation on spelling)
2. Use the exact input as tab name
3. AI will understand context from query and correct if needed
4. Consider showing suggested correction in AI response:
   - "I see you're playing *Elden Ring* (Margit boss fight)..."

**Implementation**: No special handling needed - just pass through as-is.

---

## Approval Checklist

- [x] Plan reviewed and approved
- [x] Estimated time acceptable  
- [x] Risk assessment reviewed
- [x] Implementation order confirmed
- [x] Success criteria clear
- [x] Session persistence requirements added
- [x] Answers to questions provided
- [x] Ready to begin implementation

---

**Status**: ✅ APPROVED & READY FOR IMPLEMENTATION
**Updated**: 2024-10-22
**Next Step**: Proceed with Phase 1 implementation
