# Otagon Stress Test Suite

A comprehensive Playwright-based stress test suite for the Otagon gaming companion PWA. This test suite covers all core features, services, and user interactions.

## 📋 Test Categories

### 1. **PWA Stress Tests** (`pwa-stress.spec.ts`)
- PWA installability detection
- Service worker registration
- Offline mode functionality
- Cache performance
- App update handling

### 2. **Onboarding Stress Tests** (`onboarding-stress.spec.ts`)
- First-time user flow (splash screens)
- Returning user experience
- User switching scenarios
- localStorage persistence
- Onboarding completion

### 3. **Chat Stress Tests** (`chat-stress.spec.ts`)
- First query handling
- Follow-up queries
- Rapid successive queries
- Context memory across messages
- Long conversation handling
- AI response streaming

### 4. **Game Hub Stress Tests** (`game-hub-stress.spec.ts`)
- Game hub loading
- Game search functionality
- Tab creation and deletion
- Tab switching performance
- Bulk operations
- Navigation patterns

### 5. **SubTabs Stress Tests** (`subtabs-stress.spec.ts`)
- All 7 subtab types (story, strategies, tips, walkthrough, items, characters, chat)
- Subtab creation/modification/deletion
- Color-coded styling verification
- Content persistence
- Bulk subtab operations

### 6. **Modal Stress Tests** (`modal-stress.spec.ts`)
- Settings modal
- Credit modal
- Connection modal
- Game info modal
- Add game modal
- Modal animations
- Keyboard handling (Escape)
- Backdrop click

### 7. **UI Components Stress Tests** (`ui-components-stress.spec.ts`)
- Button interactions
- Toggle switches
- Context menu (right-click)
- Credit indicator
- TTS controls
- Loading states
- Error states

### 8. **User Session Stress Tests** (`user-session-stress.spec.ts`)
- Logout flow
- Login flow (OAuth, email)
- Session persistence
- User switching
- Session timeout handling
- Multi-tab sessions
- Token management

### 9. **Context & Memory Stress Tests** (`context-memory-stress.spec.ts`)
- AI context memory
- Conversation history
- Context window management
- Follow-up query handling
- SubTab context integration
- Error recovery

### 10. **Progress Tracking Stress Tests** (`progress-tracking-stress.spec.ts`)
- Story progress
- Walkthrough progress
- Progress persistence
- Multi-game progress
- Progress analytics
- Export/import

### 11. **Backend Services Stress Tests** (`backend-services-stress.spec.ts`)
- Supabase integration
- WebSocket connections
- AI service reliability
- TTS service
- Network error handling
- Rate limiting
- Credit system
- Session/conversation services

### 12. **Performance Stress Tests** (`performance-stress.spec.ts`)
- Initial load time
- First Contentful Paint
- Component render times
- Memory usage
- Animation performance (60fps)
- Bundle sizes
- Concurrent operations
- Long session stability

### 13. **Keyboard Shortcuts Stress Tests** (`keyboard-shortcuts-stress.spec.ts`)
- Tab navigation
- Keyboard shortcuts (Escape, Enter, etc.)
- Focus management
- Accessibility keyboard support
- Hotkey combinations
- Multi-key sequences

### 14. **Responsive/Mobile Stress Tests** (`responsive-mobile-stress.spec.ts`)
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Touch interactions
- Orientation changes
- Mobile navigation
- Mobile input handling
- Safe area support

### 15. **Accessibility Stress Tests** (`accessibility-stress.spec.ts`)
- ARIA attributes
- Screen reader support
- Contrast and visual
- Form accessibility
- Semantic HTML
- Color independence
- Motion/animation preferences

### 16. **Message Migration Stress Tests** (`message-migration-stress.spec.ts`)
- JSONB to normalized table migration
- Atomic migration with locking
- Migration rollback scenarios
- Concurrent migration handling
- Data integrity during migration
- Performance under migration load

### 17. **Game Detection Stress Tests** (`game-detection-stress.spec.ts`)
- OTAKON_GAME_ID tag parsing
- OTAKON_CONFIDENCE level detection
- OTAKON_GENRE extraction
- OTAKON_IS_FULLSCREEN detection
- Invalid game detection handling
- Detection with partial context
- Rapid game switches

### 18. **Game Tab Creation Stress Tests** (`game-tab-creation-stress.spec.ts`)
- Idempotent tab creation
- Duplicate prevention
- Genre-based subtab generation
- Insight extraction from AI
- Tab state persistence
- Bulk tab creation
- Tab deletion cleanup

### 19. **Data Sync Stress Tests** (`data-sync-stress.spec.ts`)
- Real-time message sync
- Multi-tab synchronization
- Offline/online sync recovery
- Conflict resolution
- Data integrity across sessions
- Cache invalidation
- Supabase connection handling

### 20. **Error Handling Stress Tests** (`error-handling-stress.spec.ts`)
- Network failure recovery
- API timeout handling
- 500 server error graceful handling
- 429 rate limiting response
- Invalid input rejection
- XSS sanitization
- Authentication error flows
- AI service unavailability
- Storage quota exceeded handling
- Race condition prevention
- Recovery mechanisms

### 21. **TTS & Hands-Free Stress Tests** (`tts-hands-free-stress.spec.ts`)
- TTS toggle functionality
- TTS with streaming responses
- Hands-free mode activation
- Voice settings configuration
- TTS audio queue management
- Pause/resume/cancel TTS
- Voice recognition input
- Microphone permissions
- TTS error handling

### 22. **WebSocket Stress Tests** (`websocket-stress.spec.ts`)
- WebSocket connection establishment
- Message streaming in chunks
- Reconnection after failure
- Connection state management
- Screen sharing via WebSocket
- High-frequency message handling
- Large payload handling
- WebSocket latency measurement
- Multi-tab WebSocket coordination

### 23. **Credits & Subscription Stress Tests** (`credits-subscription-stress.spec.ts`)
- Credit indicator display
- Credit consumption tracking
- Free tier limitations
- Pro tier features
- Vanguard Pro features
- Subscription modal flows
- Payment flow availability
- Credit refill options
- Low credit warnings
- Subscription status management

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run All Stress Tests

```bash
npx playwright test e2e/*-stress.spec.ts
```

### Run Specific Test File

```bash
# Run PWA tests
npx playwright test e2e/pwa-stress.spec.ts

# Run chat tests
npx playwright test e2e/chat-stress.spec.ts

# Run mobile tests
npx playwright test e2e/responsive-mobile-stress.spec.ts
```

### Run Tests with UI

```bash
npx playwright test e2e/*-stress.spec.ts --ui
```

### Run Tests in Debug Mode

```bash
npx playwright test e2e/*-stress.spec.ts --debug
```

### Run Tests with Specific Browser

```bash
# Chrome only
npx playwright test e2e/*-stress.spec.ts --project=chromium

# Mobile Safari
npx playwright test e2e/*-stress.spec.ts --project="Mobile Safari"
```

### Generate HTML Report

```bash
npx playwright test e2e/*-stress.spec.ts --reporter=html
npx playwright show-report
```

## 📊 Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:5173`
- **Test Environment**: Uses `npm run dev:test` for the web server
- **Authentication**: Uses stored auth state from `.playwright/.auth/user.json`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

## 🔧 Helper Utilities

Located in `e2e/utils/helpers.ts`:

### Selectors
```typescript
selectors.sidebar           // Sidebar element
selectors.gameHub          // Game hub container
selectors.gameTab          // Game tabs
selectors.subtab           // Subtabs
selectors.chatInput        // Chat input field
selectors.chatContainer    // Chat messages container
selectors.sendButton       // Send message button
selectors.settingsButton   // Settings button
selectors.settingsModal    // Settings modal
selectors.creditIndicator  // Credit display
// ... and more
```

### Helper Functions
```typescript
waitForAppReady(page)           // Wait for app to fully load
goToGameHub(page)               // Navigate to game hub
createGameTab(page, gameName)   // Create a new game tab
createSubTab(page, type)        // Create a subtab
sendMessage(page, message)      // Send a chat message
waitForChatResponse(page)       // Wait for AI response
openModal(page, modalName)      // Open a modal
closeModal(page)                // Close current modal
measurePerformance(page, name, fn)  // Measure operation time
// ... and more
```

## 📝 Test Structure

Each test file follows this structure:

```typescript
test.describe('Feature Category', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should do something specific', async ({ page }) => {
    // Test implementation
  });
});
```

## ⚠️ Notes

1. **Authentication**: Most tests require authenticated user state. Run auth setup first:
   ```bash
   npx playwright test e2e/auth.setup.ts
   ```

2. **Test Mode**: The app should run with `npm run dev:test` which may enable test-specific features.

3. **Timeouts**: Some tests (especially AI-related) have longer timeouts to account for response times.

4. **Network**: Some tests simulate offline conditions. Ensure your network setup allows this.

5. **Mobile Tests**: Mobile tests use specific viewports and touch emulation.

## 📈 Coverage Summary

| Area | Coverage |
|------|----------|
| PWA Features | ✅ Full |
| Onboarding | ✅ Full |
| Chat/AI | ✅ Full |
| Game Hub | ✅ Full |
| SubTabs (all 7 types) | ✅ Full |
| Modals (all 5+) | ✅ Full |
| UI Components | ✅ Full |
| User Sessions | ✅ Full |
| Context/Memory | ✅ Full |
| Progress Tracking | ✅ Full |
| Backend Services | ✅ Full |
| Performance | ✅ Full |
| Keyboard Navigation | ✅ Full |
| Mobile/Responsive | ✅ Full |
| Accessibility | ✅ Full |
| Message Migration | ✅ Full |
| Game Detection | ✅ Full |
| Game Tab Creation | ✅ Full |
| Data Sync | ✅ Full |
| Error Handling | ✅ Full |
| TTS/Hands-Free | ✅ Full |
| WebSocket/Real-time | ✅ Full |
| Credits/Subscription | ✅ Full |

## 🐛 Reporting Issues

When a test fails, Playwright generates:
- Screenshots in `test-results/`
- Videos in `test-results/`
- Traces viewable with `npx playwright show-trace`

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Otagon App Documentation](./documentation/)
- [WebSocket Debug Guide](./WEBSOCKET_DEBUG_GUIDE.md)
