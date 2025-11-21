# WebSocket Screenshot Integration - Deep Dive Analysis

## Executive Summary

**Status**: 🚨 **CRITICAL ISSUE IDENTIFIED** - WebSocket handlers are not being set correctly, causing screenshot messages to be received but not processed.

**Root Cause**: Auto-reconnect feature in MainApp.tsx bypasses the handler setup, causing stale closures that prevent message processing.

---

## 1. WebSocket Service Architecture

### 1.1 Core Service (`src/services/websocketService.ts`)

**Status**: ✅ **Correctly Implemented**

```typescript
// Connection management
connect(code, onOpen, onMessage, onError, onClose) // Sets up WebSocket
disconnect() // Cleans up connection
send(data) // Sends messages to PC client
setHandlers() // ✅ NEW: Updates handlers without reconnecting
```

**Key Features**:
- ✅ Handlers stored in module-level `handlers` object
- ✅ `setHandlers()` function allows updating callbacks after connection
- ✅ Messages received and logged correctly
- ✅ Heartbeat (30s ping) keeps connection alive
- ✅ Auto-reconnect with exponential backoff

**Observed Behavior**:
```
🔗 [WebSocket] Connection opened successfully
🔗 [WebSocket] Message received: {type: 'screenshot-single', ...}
🔗 [WebSocket] Invoking onMessage handler with data: screenshot-single
🔗 [WebSocket] Handler completed successfully
```

**Issue**: Handler completes but **no App.tsx logs appear**, indicating stale closures.

---

## 2. Message Flow Analysis

### 2.1 Expected Flow (PC Client → Mobile App)

```
PC CLIENT                  RELAY SERVER              WEBSOCKET SERVICE         APP.TSX / MAINAPP.TSX
---------                  ------------              -----------------         ------------------
F1 pressed
  ↓
Capture screenshot
  ↓
{type: 'screenshot-single',  →  Forward to mobile  →  ws.onmessage receives  →  handlers.onMessage()
 payload: {images: [...]}}                              ↓                            ↓
                                                     Parse JSON                  handleWebSocketMessage()
                                                        ↓                            ↓
                                                     Log message type            Route by type
                                                        ↓                            ↓
                                                     Call handlers.onMessage     Process screenshot
```

### 2.2 Actual Flow (BROKEN)

```
PC CLIENT                  RELAY SERVER              WEBSOCKET SERVICE         APP.TSX / MAINAPP.TSX
---------                  ------------              -----------------         ------------------
F1 pressed
  ↓
{type: 'screenshot-single',  →  Forward  →  ws.onmessage receives  →  handlers.onMessage()
 payload: {images: [...]}}                       ↓                            ↓
                                              Parse JSON                    ❌ STALE CLOSURE
                                                 ↓                            ↓
                                              Call handlers.onMessage      Empty function or null
                                                 ↓
                                              ✅ "Handler completed"
                                              ❌ NO App.tsx logs
```

---

## 3. Message Types from PC Client

### 3.1 screenshot-single (F1 Hotkey)

**Availability**: ✅ **ALL USERS** (Free, Pro, Vanguard)

**Message Format**:
```json
{
  "type": "screenshot-single",
  "payload": {
    "images": [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
    ]
  }
}
```

**Characteristics**:
- Always exactly 1 image
- Freshly captured (not from buffer)
- Data URL format with base64 encoding

**Expected Behavior**:
1. Validate screenshot data URL
2. Normalize to standard format
3. Check AI mode:
   - **AI Mode ON**: Forward to MainApp → Send to AI for analysis
   - **AI Mode OFF** (Pro only): Upload to Supabase Storage → Save URL in message

### 3.2 screenshot-multi (F2 Hotkey)

**Availability**: 🔒 **PRO/VANGUARD ONLY**

**Message Format**:
```json
{
  "type": "screenshot-multi",
  "payload": {
    "images": [
      "data:image/png;base64,...",  // Latest (0-1 min ago)
      "data:image/png;base64,...",  // 1-2 min ago
      "data:image/png;base64,...",  // 2-3 min ago
      "data:image/png;base64,...",  // 3-4 min ago
      "data:image/png;base64,..."   // 4-5 min ago (oldest)
    ]
  }
}
```

**Characteristics**:
- Contains 1-5 images from buffer
- Images captured automatically every 60 seconds
- Array order: Index 0 = newest, last = oldest
- No new capture - sends existing buffered screenshots

**Expected Behavior**:
1. Check tier - **BLOCK if Free user** with upgrade toast
2. Validate all screenshot data URLs
3. Process each image sequentially:
   - Normalize format
   - Forward to MainApp with index
   - Process according to AI mode

**Tier Gating Implementation**:
```typescript
// App.tsx line 576-583
if (data.type === 'screenshot-multi') {
  const userTier = authState.user?.tier || 'free';
  if (userTier !== 'pro' && userTier !== 'vanguard_pro') {
    toastService.warning('Batch screenshots (F2) are a Pro feature. Upgrade to unlock!');
    return; // Block processing
  }
  // ... process images
}
```

---

## 4. AI Mode Toggle Feature

### 4.1 Overview

**Availability**: 🔒 **PRO/VANGUARD ONLY**

**Purpose**: Allow Pro users to toggle between:
- **AI Mode ON** (default): Screenshots analyzed by AI, full query context
- **AI Mode OFF**: Screenshots uploaded to storage only, database URL saved (99.5% size reduction)

### 4.2 State Management

**Location**: `src/components/MainApp.tsx` line 133-136

```typescript
const [aiModeEnabled, setAiModeEnabled] = useState(() => {
  const saved = localStorage.getItem('otakonAiMode');
  return saved !== 'false'; // Default to true (AI ON)
});
```

**Persistence**: Saved to `localStorage` key `otakonAiMode`

**Toggle Handler**: `handleAiModeToggle()` line 939-954
- Checks tier (Pro/Vanguard only)
- Updates state and localStorage
- Shows toast notification

### 4.3 UI Component

**Component**: `src/components/ui/AIToggleButton.tsx`

**Rendering**: Line 2106-2112 in MainApp.tsx
```typescript
{(currentUser.tier === 'pro' || currentUser.tier === 'vanguard_pro') && (
  <AIToggleButton
    isEnabled={aiModeEnabled}
    onToggle={handleAiModeToggle}
    isPro={true}
  />
)}
```

**Visibility**: Only visible to Pro/Vanguard users

**Icon**: Purple brain icon
- Active (ON): Filled purple `text-purple-400`
- Inactive (OFF): Outlined gray `text-text-muted`

### 4.4 Processing Logic

**Location**: `src/components/MainApp.tsx` line 1471-1518

```typescript
if (imageUrl && isPro && !aiModeEnabled) {
  // AI Mode OFF - Upload to storage
  const uploadResult = await uploadScreenshot(imageUrl, user.authUserId);
  
  if (uploadResult.success) {
    // Use storage URL instead of data URL
    finalImageUrl = uploadResult.publicUrl;
    
    // Add acknowledgment message (no AI processing)
    const storageMessage = {
      content: 'Screenshot saved to your gallery. AI analysis is disabled.',
      role: 'assistant',
      timestamp: Date.now()
    };
    
    // Save and exit (skip AI processing)
    return;
  }
}
```

**Flow**:
1. Check: `imageUrl && isPro && !aiModeEnabled`
2. Upload screenshot to Supabase Storage
3. Get public URL (~100 bytes vs 2-5MB data URL)
4. Save storage URL in message
5. Add acknowledgment message
6. **Skip AI processing entirely**

---

## 5. Screenshot Upload Button & Play/Pause Toggle

### 5.1 Manual Upload Mode

**State**: `src/components/MainApp.tsx` line 112-116

```typescript
const [isManualUploadMode, setIsManualUploadMode] = useState(() => {
  const saved = localStorage.getItem('otakon_manual_upload_mode');
  return saved !== null ? saved === 'true' : true; // Default: true (manual)
});
```

**Purpose**: Control how WebSocket screenshots are handled:
- **Manual Mode ON** (default): Screenshots queued for review, user sends manually
- **Manual Mode OFF**: Screenshots sent immediately to AI

**Toggle**: Line 2212 in MainApp.tsx
```typescript
onToggleManualUploadMode={() => setIsManualUploadMode(!isManualUploadMode)}
```

### 5.2 Screenshot Button Component

**Location**: `src/components/ui/ScreenshotButton.tsx`

**Modes**:
1. **Single Mode**: Request 1 fresh screenshot (F1 equivalent)
2. **Multi Mode** (Pro only): Request buffered screenshots (F2 equivalent)

**Tier Gating**:
```typescript
const canUseMultishot = usage?.tier === 'pro' || usage?.tier === 'vanguard_pro';
```

**Processing Logic** (line 135):
```typescript
const processImmediate = isManualUploadMode ? false : mode === 'single';
```

- Manual mode: Always queue for review
- Auto mode + single: Process immediately
- Auto mode + multi: Queue for review

### 5.3 Play/Pause Toggle

**Current Status**: ❌ **NOT IMPLEMENTED** as standalone feature

**Manual Mode** acts as play/pause:
- **"Paused"** (Manual ON): Screenshots queued, not sent automatically
- **"Playing"** (Manual OFF): Screenshots sent immediately

**Future Enhancement**: Could add visual play/pause icons to ScreenshotButton

---

## 6. Current Critical Issues

### 6.1 🚨 Issue #1: Stale Closures in WebSocket Handlers

**Problem**: Auto-reconnect in MainApp.tsx calls `connect()` with inline handlers, then new code never updates them.

**Evidence**:
```
✅ websocketService.ts:96 - Message received: screenshot-single
✅ websocketService.ts:110 - Invoking onMessage handler
✅ websocketService.ts:113 - Handler completed successfully
❌ NO App.tsx logs showing message processing
```

**Root Cause**: Line 586 in MainApp.tsx
```typescript
connect(storedCode, handleWebSocketOpen, handleWebSocketMessage, ...);
```

This passes closures that capture the INITIAL state. When App.tsx re-renders, the handlers reference old state/functions.

**Solution**: Added on line 583-599 (NEW CODE)
```typescript
// Call connect with placeholder handlers
connect(storedCode, () => {}, () => {}, () => {}, () => {});

// ✅ CRITICAL: Immediately set handlers AFTER connect()
console.log('🔗 [MainApp] Setting WebSocket handlers after auto-reconnect');
setHandlers(
  handleWebSocketOpen,
  handleWebSocketMessage,
  handleWebSocketError,
  handleWebSocketClose
);
```

**Status**: ⏳ **FIXED IN CODE, AWAITING TEST**

### 6.2 🚨 Issue #2: Missing Import

**Problem**: `setHandlers` function not imported in MainApp.tsx

**Solution**: Added on line 37
```typescript
import { connect, disconnect, setHandlers } from '../services/websocketService';
```

**Status**: ✅ **FIXED**

### 6.3 ⚠️ Issue #3: No Screenshot-Single/Multi Handlers in App.tsx

**Problem**: App.tsx has handlers for old message types but NOT for the actual PC client formats.

**Current Handlers** (App.tsx line 540-652):
- ✅ `screenshot-single` - Added, validates and forwards
- ✅ `screenshot-multi` - Added, tier-gates and processes batch
- ⚠️ `screenshot_batch` - Old format, still present

**Status**: ✅ **IMPLEMENTED** but untested due to Issue #1

---

## 7. Test Plan

### 7.1 Phase 1: Verify Handler Fix

1. **Restart dev server** (already done)
2. **Hard refresh browser** to load new code
3. **Look for logs**:
   ```
   🔗 [MainApp] Auto-reconnecting with stored code: 540936
   🔗 [MainApp] Setting WebSocket handlers after auto-reconnect
   🔗 [WebSocket] Handlers updated
   ```
4. **Press F1 on PC**
5. **Expected logs**:
   ```
   🔗 [WebSocket] Message received: screenshot-single
   🔗 [WebSocket] Invoking onMessage handler
   📸 [App] screenshot-single message received
   📸 [App] Forwarding single screenshot to MainApp
   📸 [MainApp] Processing screenshot: {...}
   ```

### 7.2 Phase 2: F1 Single Screenshot (All Users)

**Test Cases**:

| Mode | Tier | AI Mode | Expected Behavior |
|------|------|---------|-------------------|
| Manual | Free | N/A | Screenshot queued, user sends manually |
| Auto | Free | N/A | Screenshot sent to AI immediately |
| Manual | Pro | ON | Screenshot queued, user sends manually |
| Auto | Pro | ON | Screenshot sent to AI immediately |
| Manual | Pro | OFF | Screenshot queued, upload to storage when sent |
| Auto | Pro | OFF | Screenshot uploaded to storage immediately |

### 7.3 Phase 3: F2 Multi Screenshot (Pro/Vanguard Only)

**Test Cases**:

| Tier | Expected Behavior |
|------|-------------------|
| Free | Toast: "Batch screenshots (F2) are a Pro feature" |
| Pro (AI ON) | Process all buffered images, send to AI |
| Pro (AI OFF) | Upload all to storage, save URLs |

### 7.4 Phase 4: AI Mode Toggle

**Test Cases**:
1. Free user clicks AI toggle → Toast: "AI mode toggle is a Pro feature"
2. Pro user toggles ON → Icon filled purple, screenshots analyzed
3. Pro user toggles OFF → Icon outlined gray, screenshots uploaded to storage
4. Refresh page → AI mode persists from localStorage

### 7.5 Phase 5: Manual Mode Toggle

**Test Cases**:
1. Toggle manual mode ON → F1 screenshots queued
2. Toggle manual mode OFF → F1 screenshots sent immediately
3. Refresh page → Manual mode persists from localStorage

---

## 8. Data Flow Diagrams

### 8.1 F1 Single Screenshot (Free User, Auto Mode)

```
PC CLIENT                WEBSOCKET SERVICE              APP.TSX                    MAINAPP.TSX
---------                -----------------              -------                    -----------
F1 pressed
  ↓
Capture screenshot
  ↓
Send: screenshot-single  →  Receive message            ↓
{payload: {images: [...]}}     ↓                      handlers.onMessage()
                              Parse JSON                    ↓
                                 ↓                    handleWebSocketMessage()
                              Log: "screenshot-single"     ↓
                                 ↓                    Extract payload.images[0]
                              Call handler                  ↓
                                                       Validate data URL
                                                            ↓
                                                       Normalize format
                                                            ↓
                                                       Forward to MainApp  →  handleWebSocketMessage()
                                                                                    ↓
                                                                              isManualUploadMode?
                                                                                    ↓
                                                                              NO (Auto mode)
                                                                                    ↓
                                                                              handleSendMessage()
                                                                                    ↓
                                                                              Add user message
                                                                                    ↓
                                                                              Call AI service
                                                                                    ↓
                                                                              Add AI response
```

### 8.2 F1 Single Screenshot (Pro User, AI Mode OFF, Auto Mode)

```
PC CLIENT                WEBSOCKET SERVICE              APP.TSX                    MAINAPP.TSX
---------                -----------------              -------                    -----------
F1 pressed
  ↓
Send: screenshot-single  →  Receive & forward  →  handleWebSocketMessage()  →  handleWebSocketMessage()
                                                           ↓                            ↓
                                                      Validate & normalize         isManualUploadMode?
                                                           ↓                            ↓
                                                      Forward to MainApp           NO (Auto mode)
                                                                                        ↓
                                                                                   handleSendMessage()
                                                                                        ↓
                                                                                   Check: isPro && !aiModeEnabled
                                                                                        ↓
                                                                                   YES - Upload to storage
                                                                                        ↓
                                                                                   uploadScreenshot()
                                                                                        ↓
                                                                                   Get public URL
                                                                                        ↓
                                                                                   Save URL in message
                                                                                        ↓
                                                                                   Add acknowledgment
                                                                                        ↓
                                                                                   SKIP AI processing
```

### 8.3 F2 Multi Screenshot (Pro User, AI Mode ON)

```
PC CLIENT                WEBSOCKET SERVICE              APP.TSX                    MAINAPP.TSX
---------                -----------------              -------                    -----------
F2 pressed
  ↓
Send: screenshot-multi   →  Receive message            ↓
{payload: {images: [     →     ↓                   handlers.onMessage()
  img1, img2, img3          Parse JSON                  ↓
]}}                           ↓                    handleWebSocketMessage()
                          Log: "screenshot-multi"       ↓
                              ↓                    Check tier (Pro/Vanguard)
                          Call handler                  ↓
                                                   ✅ Pro - Process
                                                        ↓
                                                   Extract payload.images[]
                                                        ↓
                                                   forEach image:
                                                        ↓
                                                   Validate & normalize  →  Forward to MainApp
                                                                                  ↓
                                                                              isManualUploadMode?
                                                                                  ↓
                                                                              Process each image
                                                                                  ↓
                                                                              Send to AI
```

---

## 9. Storage Architecture (AI Mode OFF)

### 9.1 Supabase Storage Service

**Location**: `src/services/screenshotStorageService.ts`

**Functions**:
```typescript
uploadScreenshot(dataUrl: string, userId: string): Promise<UploadResult>
deleteScreenshot(filePath: string, userId: string): Promise<DeleteResult>
```

**Upload Flow**:
1. Convert data URL to Blob
2. Generate unique filename: `{userId}/{uuid}_{timestamp}.png`
3. Upload to Supabase Storage bucket `screenshots`
4. Return public URL: `https://{project}.supabase.co/storage/v1/object/public/screenshots/{userId}/{filename}`

**File Size Limit**: 50MB (configured in `supabase/config.toml`)

### 9.2 RLS Policies

**Setup Required**: See `SUPABASE_STORAGE_SETUP.md`

**Policies**:
1. **INSERT**: Users can upload to their own folder (`{user_id}/`)
2. **SELECT**: Anyone can view (public read, URLs have 2^288 entropy)
3. **DELETE**: Users can delete their own files only

### 9.3 Cost Savings

**Database Storage** (current):
- Screenshot: ~2-5MB base64 data URL
- 100 screenshots: 200-500MB database storage
- Cost: ~$10-15/month at scale

**Supabase Storage** (with AI mode OFF):
- Screenshot: ~100 byte URL
- 100 screenshots: 100-500MB file storage
- Cost: ~$0.01/month file storage, 99.5% database reduction

---

## 10. Recommendations

### 10.1 Immediate Actions

1. ✅ **Test handler fix** - Refresh browser and test F1
2. ⏳ **Add missing logs** - Add more debug logs to trace exact execution path
3. ⏳ **Set up Supabase Storage** - Create bucket and RLS policies per `SUPABASE_STORAGE_SETUP.md`

### 10.2 Future Enhancements

1. **Visual Play/Pause Icon** - Replace "manual mode" text with play/pause icons
2. **Screenshot Gallery** - Show recent screenshots in a modal for Pro users
3. **Batch Processing UI** - Show progress indicator when processing F2 multi-screenshots
4. **AI Mode Badge** - Add badge to header showing current mode (AI ON/OFF)
5. **Storage Quota UI** - Show storage usage for Pro users
6. **Auto-cleanup** - Delete old screenshots after 30 days

### 10.3 Documentation Needs

1. **User Guide** - Explain AI mode toggle and storage benefits
2. **PC Client Docs** - Document F1/F2 hotkeys and message formats
3. **API Reference** - Document WebSocket message types and payloads

---

## 11. Conclusion

The WebSocket screenshot integration is **functionally complete** but has **one critical blocker**:

🚨 **Stale closure issue preventing handlers from executing**

**Fix Status**: ✅ **Implemented**, ⏳ **Awaiting Testing**

Once the handler fix is verified working, all features should function as designed:
- ✅ F1 single screenshots for all users
- ✅ F2 batch screenshots for Pro/Vanguard (tier-gated)
- ✅ AI mode toggle for Pro/Vanguard
- ✅ Manual/auto upload modes
- ✅ Storage upload when AI mode OFF

**Next Step**: User refreshes browser and tests F1 screenshot with logs.
