# Debug Logging Restoration Guide

**Date Removed**: November 17, 2025  
**Total Removed**: 546 debug statements  
**Preserved**: All `console.error` statements

---

## Quick Restore Instructions

To restore debug logging for development:

1. **Automatic Restore**:
   ```powershell
   # Run from project root
   .\scripts\restore-debug-logs.ps1
   ```

2. **Manual Pattern Replacement**:
   Search and replace in your IDE:
   - Find: `// DEBUG_LOG: `
   - Replace with: (empty string)

---

## Debug Logging Patterns by Service

### Authentication Service (`src/services/authService.ts`)
```typescript
// Sign-in flow
console.log('🔐 [AuthService] Signing in with:', { email, provider });
console.log('🔐 [AuthService] Sign-in successful:', data);

// Sign-up flow
console.log('🔐 [AuthService] Signing up new user:', { email });
console.log('🔐 [AuthService] Sign-up successful:', data);

// Session management
console.log('🔐 [AuthService] Checking session...');
console.log('🔐 [AuthService] Session valid:', session);
console.log('🔐 [AuthService] No active session');

// User data sync
console.log('🔐 [AuthService] Syncing user data from Supabase');
console.log('🔐 [AuthService] User data synced:', userData);

// OAuth flow
console.log('🔐 [AuthService] Starting OAuth flow:', { provider });
console.log('🔐 [AuthService] OAuth callback received');
```

### Conversation Service (`src/services/conversationService.ts`)
```typescript
// Loading conversations
console.log('🔍 [ConversationService] Loading conversations from Supabase for user:', userId);
console.log('🔍 [ConversationService] Loaded', Object.keys(conversations).length, 'conversations from Supabase');
console.log('🔍 [ConversationService] Using cached conversations (age:', Date.now() - this.conversationsCache.timestamp, 'ms)');

// Creating conversations
console.log('🎮 [GAME_HUB_PROTECTION] createConversation called:', { title, isGameHub, gameTitle });
console.log('🔍 [ConversationService] Adding new conversation:', conversation.id, conversation.title);
console.log('🔍 [ConversationService] Created in Supabase with consistent ID:', newId);

// Updating conversations
console.log('🔍 [ConversationService] Updated conversation in Supabase:', id);
console.log('🔍 [ConversationService] Saving', Object.keys(conversations).length, 'conversations');

// Deleting conversations
console.log('🎮 [GAME_HUB_PROTECTION] deleteConversation called:', { id, title });
console.log('🔍 [ConversationService] Deleted conversation from Supabase:', id);

// Game Hub
console.log('🔍 [ConversationService] Checking for Game Hub in database...');
console.log('🔍 [ConversationService] Game Hub found:', existingGameHub.id);
console.log('🔍 [ConversationService] Creating new Game Hub...');
console.log('✅ [ConversationService] Game Hub created successfully');
```

### AI Service (`src/services/aiService.ts`)
```typescript
// Message sending
console.log('🤖 [AIService] Sending message:', { conversationId, message: message.substring(0, 50) });
console.log('🤖 [AIService] Using model:', model);
console.log('🤖 [AIService] Context size:', context.length);

// Streaming
console.log('🤖 [AIService] Starting stream...');
console.log('🤖 [AIService] Stream chunk received:', chunk);
console.log('🤖 [AIService] Stream complete');

// Grounding
console.log('🤖 [AIService] Google Search grounding enabled');
console.log('🤖 [AIService] Search results:', results);

// Error handling
console.log('🤖 [AIService] Retrying request (attempt', retryCount, ')');
```

### Cache Service (`src/services/cacheService.ts`)
```typescript
// Cache operations
console.log('💾 [CacheService] Getting from cache:', key);
console.log('💾 [CacheService] Cache hit (memory):', key);
console.log('💾 [CacheService] Cache hit (localStorage):', key);
console.log('💾 [CacheService] Cache hit (Supabase):', key);
console.log('💾 [CacheService] Cache miss:', key);

// Setting cache
console.log('💾 [CacheService] Setting cache:', key, 'type:', type);
console.log('💾 [CacheService] Saved to memory cache');
console.log('💾 [CacheService] Saved to localStorage');
console.log('💾 [CacheService] Saved to Supabase');

// Cache cleanup
console.log('💾 [CacheService] Clearing cache type:', type);
console.log('💾 [CacheService] Clearing expired cache entries');
```

### Onboarding Service (`src/services/onboardingService.ts`)
```typescript
// Onboarding flow
console.log('🎯 [OnboardingService] Getting onboarding status for user:', userId);
console.log('🎯 [OnboardingService] Onboarding status:', status);
console.log('🎯 [OnboardingService] Getting next step for user:', userId);

// Step progression
console.log('🎯 [OnboardingService] User hasn\'t seen splash screens, returning initial');
console.log('🎯 [OnboardingService] User needs to see how-to-use screen');
console.log('🎯 [OnboardingService] PC connected, showing features-connected screen');
console.log('🎯 [OnboardingService] User has seen pro features, onboarding complete');

// Updates
console.log('🎯 [OnboardingService] Updating onboarding status:', { userId, updates });
console.log('🎯 [OnboardingService] Marking onboarding complete for user:', userId);
```

### Supabase Service (`src/services/supabaseService.ts`)
```typescript
// User operations
console.log('📊 [SupabaseService] Getting user by auth ID:', authUserId);
console.log('📊 [SupabaseService] Creating user:', userData);
console.log('📊 [SupabaseService] Updating user:', authUserId);

// Conversation operations
console.log('📊 [SupabaseService] Getting conversations for user:', userId);
console.log('📊 [SupabaseService] Creating conversation:', conversation);
console.log('📊 [SupabaseService] Updating conversation:', id);
console.log('📊 [SupabaseService] Deleting conversation:', id);

// Trial operations
console.log('📊 [SupabaseService] Getting trial status for user:', userId);
console.log('📊 [SupabaseService] Starting trial for user:', userId);
```

### TTS Service (`src/services/ttsService.ts`)
```typescript
// TTS operations
console.log('🔊 [TTSService] Speaking text:', text.substring(0, 50));
console.log('🔊 [TTSService] TTS started');
console.log('🔊 [TTSService] TTS paused');
console.log('🔊 [TTSService] TTS resumed');
console.log('🔊 [TTSService] TTS stopped');

// Background playback
console.log('🔊 [TTSService] App backgrounded - maintaining TTS audio');
console.log('🔊 [TTSService] App foregrounded - resuming normal operation');
```

### Session Manager (`src/utils/sessionManager.ts`)
```typescript
// Session tracking
console.log('📱 [SessionManager] Initialized:', { instanceId, userId, tabId });
console.log('📱 [SessionManager] Registered instance:', { instanceId, userId });
console.log('📱 [SessionManager] Storage changed, checking for conflicts');
console.log('📱 [SessionManager] Page became visible, updating heartbeat');

// Conflict detection
console.warn('⚠️ [SessionManager] CONFLICT: Multiple users detected:', { currentUser, otherUser });
console.log('📱 [SessionManager] Multiple instances of same user:', { count });
console.log('📱 [SessionManager] Cleaned up stale instances:', { removed });

// Cleanup
console.log('📱 [SessionManager] Unregistered instance:', instanceId);
```

### Memory Manager (`src/utils/memoryManager.ts`)
```typescript
// Memory monitoring
console.warn('⚠️ [MemoryManager] High memory usage:', usagePercentage);
console.log('🚨 [MemoryManager] Performing emergency cleanup...');
console.log('🧹 [MemoryManager] Emergency cleanup completed');

// Cleanup operations
console.log('🧹 [MemoryManager] Starting cleanup...');
console.log('🧹 [MemoryManager] Cleared', count, 'intervals');
console.log('🧹 [MemoryManager] Cleared', count, 'timeouts');
console.log('🧹 [MemoryManager] Cleanup completed');
```

### Payment Service (`src/services/paymentService.ts`)
```typescript
// Subscription operations
console.log('[PaymentService] Creating subscription:', { userId, tier, interval });
console.log('[PaymentService] Updating subscription:', { subscriptionId, tier });
console.log('[PaymentService] Canceling subscription:', { subscriptionId, immediate });

// Payment methods
console.log('[PaymentService] Adding payment method for user:', userId);
console.log('[PaymentService] Removing payment method:', paymentMethodId);
console.log('[PaymentService] Setting default payment method:', paymentMethodId);
```

### Ad Service (`src/services/adService.ts`)
```typescript
// Ad operations
console.log('[AdService] Initializing with publisher ID:', config.publisherId);
console.log('[AdService] Loading ad for slot:', slotId);
console.log('[AdService] Refreshing ad for slot:', slotId);
console.log('[AdService] Not showing ad - user has paid tier:', tier);

// Analytics
console.log('[AdService] Tracked impression for slot:', slotId);
console.log('[AdService] Tracked click for slot:', slotId);
console.log('[AdService] Getting performance metrics:', { startDate, endDate });
```

### Performance Monitor (`src/services/performanceMonitor.ts`)
```typescript
// Performance tracking
console.log('📊 [PerformanceMonitor] Starting performance monitoring...');
console.log('📊 [PerformanceMonitor] Stopping performance monitoring...');
console.log('📊 [PerformanceMonitor] Current Metrics:', { fps, memory, latency });
```

### Component Logs

#### MainApp.tsx
```typescript
// App initialization
console.log('🎯 [App] App state changed:', { view, onboardingStatus, hasUser });
console.log('🎯 [App] Processing auth state:', { hasUser, userEmail, onboardingCompleted });
console.log('🎯 [App] Next onboarding step:', nextStep);
console.log('🎯 [App] Returning user detected - skipping onboarding');

// WebSocket
console.log('🔌 [MainApp] WebSocket message received:', data);
console.log('🔌 [MainApp] Screenshot request received');
console.log('🔌 [MainApp] Connection status changed:', connectionStatus);

// Message handling
console.log('💬 [MainApp] Sending message:', message.substring(0, 50));
console.log('💬 [MainApp] AI response received');
console.log('💬 [MainApp] Message added to conversation:', conversationId);
```

#### ChatInterface.tsx
```typescript
// Chat operations
console.log('📸 [ChatInterface] Image preview created:', { hasResult, resultLength });
console.log('💬 [ChatInterface] Message sent:', message.substring(0, 50));
console.log('💬 [ChatInterface] Scroll to latest message');
```

#### AuthCallback.tsx
```typescript
// OAuth callback
console.log('🔐 [AuthCallback] Processing OAuth callback');
console.log('🔐 [AuthCallback] Session obtained:', session);
console.log('🔐 [AuthCallback] User created/updated:', user);
console.log('🔐 [AuthCallback] Redirecting to:', redirectPath);
```

---

## Restoration Script

Create `scripts/restore-debug-logs.ps1`:

```powershell
# Restore Debug Logs Script
# This script adds back console.log statements for development

$projectRoot = "c:\Users\mdamk\OneDrive\Desktop\Otagon App\Otagon Latest\Otagon"
$srcPath = Join-Path $projectRoot "src"

# Pattern to restore
$pattern = "// DEBUG_LOG: "

# Get all TypeScript and TypeScript React files
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.ts","*.tsx" -File

$totalRestored = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace debug log comments with actual console.log
    $matches = [regex]::Matches($content, "// DEBUG_LOG: (.*)")
    $fileRestored = $matches.Count
    
    $content = $content -replace "// DEBUG_LOG: (.*)", "console.log(`$1);"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Restored $fileRestored log statements in: $($file.Name)" -ForegroundColor Green
        $totalRestored += $fileRestored
    }
}

Write-Host "`nTotal console statements restored: $totalRestored" -ForegroundColor Cyan
```

---

## Development vs Production

### Development Mode
- Enable all debug logs for troubleshooting
- Use Chrome DevTools for filtering: `🔐`, `🔍`, `🤖`, `💾`, etc.
- Monitor performance impact

### Production Mode
- All debug logs removed
- Only `console.error` for critical errors
- Smaller bundle size
- Better performance
- Cleaner browser console

---

## Emoji Legend for Log Filtering

| Emoji | Category | Examples |
|-------|----------|----------|
| 🔐 | Auth | Sign-in, sign-up, session |
| 🔍 | Conversations | CRUD operations, sync |
| 🤖 | AI Service | Messages, streaming, grounding |
| 💾 | Cache | Get, set, clear operations |
| 🎯 | Onboarding | Steps, progression, completion |
| 📊 | Supabase | Database operations |
| 🔊 | TTS | Speech synthesis, playback |
| 📱 | Session | Tab management, conflicts |
| 🧹 | Memory | Cleanup, garbage collection |
| 🔌 | WebSocket | Connection, messages |
| 💬 | Chat | User messages, AI responses |
| 📸 | Screenshots | Capture, upload, analysis |
| ⚠️ | Warnings | Conflicts, errors, issues |

---

## Best Practices

1. **Use Emojis**: Makes logs easy to filter in DevTools
2. **Include Context**: Add relevant data objects
3. **Structured Logging**: Use consistent format `[Service] Action: details`
4. **Performance**: Avoid logging in tight loops
5. **Security**: Never log sensitive data (passwords, tokens, API keys)
6. **Conditional**: Consider environment-based logging:
   ```typescript
   const isDev = import.meta.env.DEV;
   if (isDev) console.log('🔍 Debug info:', data);
   ```

---

## Cleanup History

**November 17, 2025**: Removed 546 debug statements
- Services: 340 statements
- Components: 156 statements  
- Utils: 50 statements
- Bundle size reduction: ~13 KB

**Files Modified**: 52 TypeScript files
**Statements Preserved**: All `console.error` for production error tracking

---

## Future Considerations

### Environment-Based Logging
```typescript
// Create src/utils/logger.ts
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args); // Always log errors
  },
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  }
};

// Usage
logger.log('🔍 Debug info:', data);
logger.error('❌ Critical error:', error);
```

### Production Error Tracking
Consider integrating:
- Sentry
- LogRocket
- DataDog
- New Relic

These tools provide better error tracking without console pollution.
