# 🎬 Chat Screen Mobile/PWA - Interactive Scenario Walkthrough

> **Live Component Files:** `ChatInterface.tsx`, `ProfileSetupBanner.tsx`, `MainApp.tsx`

---

## 📺 SCENARIO 1: Fresh App Load (First Time User)

### What the User Sees

```
┌─────────────────────────────────────────────┐
│ Status Bar (0-20px safe area)               │
├─────────────────────────────────────────────┤
│ ┌─ PROFILE SETUP BANNER ─────────────────┐ │
│ │ Background: Red/Orange gradient        │ │
│ │ Border: 2px #FF4D4D/30                 │ │
│ │ Shadow: lg animate-slide-down          │ │
│ │                                        │ │
│ │ 👤 ┌────────────────────────────────┐ │ │
│ │    │ Personalize Your Experience    │ │ │
│ │    │ Set up gaming preferences...   │ │ │
│ │    └────────────────────────────────┘ │ │
│ │                           [Set Up] [✕]│ │
│ └────────────────────────────────────────┘ │
│                                             │
│ ┌─ MESSAGES AREA ────────────────────────┐ │
│ │                                        │ │
│ │          🎮 Mascot Image               │ │
│ │          (w-32 h-32 - 128px)           │ │
│ │                                        │ │
│ │  Start a conversation with Otagon      │ │
│ │  Ask me anything about gaming...       │ │
│ │                                        │ │
│ │              (Empty)                   │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ ┌─ CHAT INPUT ─────────────────────────┐   │
│ │ [📎] [📹] [Textarea] [🔊]           │   │
│ │ "Type your message..."               │   │
│ │ [━━━━ SEND ━━━━]                    │   │
│ └────────────────────────────────────┘   │
│                                             │
│ Home Bar Indicator (0-30px safe area)      │
└─────────────────────────────────────────────┘
```

### Code Path

1. **MainApp.tsx loads**
   ```tsx
   const [showProfileSetupBanner, setShowProfileSetupBanner] = 
     useState(true); // Default: show banner
   ```

2. **ProfileSetupBanner rendered (collapsed)**
   ```tsx
   <ProfileSetupBanner 
     onComplete={(profile) => {
       setShowProfileSetupBanner(false);
       handleProfileSetupComplete(profile);
     }}
     onDismiss={() => setShowProfileSetupBanner(false)}
   />
   ```

3. **ChatInterface shows empty state**
   ```tsx
   if (conversation.messages.length === 0) {
     return (
       <div className="flex items-center justify-center h-full">
         <img src="/images/mascot/4.png" /> {/* Mascot */}
       </div>
     );
   }
   ```

### User Interactions Available

| Action | Effect | Code |
|--------|--------|------|
| **Click [Dismiss ✕]** | Banner disappears permanently | `onDismiss()` → `setShowProfileSetupBanner(false)` |
| **Click [Set Up]** | Banner expands to wizard modal | `setIsExpanded(true)` |
| **Type in textarea** | Message appears in input | `handleValueChange()` |
| **Upload image 📎** | Opens file picker | `handleImageUpload()` |

---

## 📝 SCENARIO 2: Profile Banner Expansion (Mobile)

### Before Click

```
┌─────────────────────────┐
│ [Profile Banner]        │ (Collapsed)
│ ┌───────────────────┐   │
│ │ 👤 Personalize    │   │
│ │ [Set Up] [✕]     │   │
│ └───────────────────┘   │
│                         │
│ [Messages Area]         │
│                         │
│ [Chat Input]            │
└─────────────────────────┘
```

### After User Clicks [Set Up]

```
┌─────────────────────────────────────────┐
│           FIXED OVERLAY                 │ ← @media (display-mode: standalone)
│ ┌─────────────────────────────────────┐ │
│ │ bg-black/70 backdrop-blur-sm        │ │
│ │ fixed inset-0 z-50                  │ │
│ │                                     │ │
│ │  ┌─ PROFILE SETUP WIZARD ────────┐ │ │
│ │  │ animate-scale-in               │ │
│ │  │ ┌─ Header ────────────────────┐│ │
│ │  │ │ bg-gradient to-r from Red   ││ │
│ │  │ │ "Quick Setup"                ││ │
│ │  │ │ "Step 1 of 4"          [✕]  ││ │
│ │  │ │ ┌─ Progress Bar ────────┐   ││ │
│ │  │ │ │ bg-white/20           │   ││ │
│ │  │ │ │ █░░░░░░░░░ 25%       │   ││ │
│ │  │ │ └───────────────────────┘   ││ │
│ │  │ └───────────────────────────────┘│ │
│ │  │                                   │ │
│ │  │ ┌─ Content (Step 1) ─────────────┐│ │
│ │  │ │ "How do you like your hints?"  ││ │
│ │  │ │                                 ││ │
│ │  │ │ ☐ 🔮 Cryptic                  ││ │
│ │  │ │ ☑ ⚖️ Balanced (Selected)      ││ │
│ │  │ │ ☐ 🎯 Direct                   ││ │
│ │  │ │                                 ││ │
│ │  │ └─────────────────────────────────┘│ │
│ │  │                                   │ │
│ │  │ ┌─ Footer ────────────────────────┐│ │
│ │  │ │ [← Back] [Next →]              ││ │
│ │  │ └─────────────────────────────────┘│ │
│ │  └───────────────────────────────────┘ │
│ │                                        │ │
│ │  (Background darkened)                 │ │
│ │  (Body scroll disabled)                │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### State Changes

```tsx
// ProfileSetupBanner.tsx
const [isExpanded, setIsExpanded] = useState(false);      // false → true
const [isMobile, setIsMobile] = useState(true);           // Detected
const [currentStep, setCurrentStep] = useState(0);        // Tracks step
const [profile, setProfile] = useState({});               // Stores answers

// When isMobile && isExpanded
const shouldUseOverlay = isExpanded && isMobile;          // true

// Body scroll lock
useEffect(() => {
  if (!shouldUseOverlay) return;
  document.body.style.overflow = 'hidden'; // ← KEY
  return () => {
    document.body.style.overflow = originalOverflow;
  };
}, [shouldUseOverlay]);
```

### Animation Classes

| Class | Effect |
|-------|--------|
| `animate-scale-in` | Modal scales from 0 → 1 (300ms) |
| `backdrop-blur-sm` | Background blur effect |
| `fixed inset-0` | Covers entire viewport |
| `z-50` | On top of everything |

---

## 🖼️ SCENARIO 3: User Selects Profile Option

### Before Selection

```
┌─────────────────────────────┐
│ Step 1 of 4                 │
│                             │
│ "How do you like hints?"    │
│                             │
│ ☐ 🔮 Cryptic               │
│ ☑ ⚖️ Balanced              │  ← Already selected from load
│ ☐ 🎯 Direct                │
│                             │
│ Progress: ████░░░░░░ 25%    │
└─────────────────────────────┘
```

### User Clicks [🎯 Direct]

```tsx
const handleOptionSelect = (
  field: keyof PlayerProfile,  // 'hintStyle'
  value: string                 // 'Direct'
) => {
  // Update profile immediately
  const updatedProfile = { ...profile, [field]: value };
  setProfile(updatedProfile);

  // Highlight the selection for 300ms
  setTimeout(() => {
    if (currentStep < steps.length - 1) {
      // Auto-advance to next step
      setCurrentStep(currentStep + 1);
      // ← No user click needed!
    } else {
      // On final step: complete setup
      onComplete(updatedProfile as PlayerProfile);
    }
  }, 300);
};
```

### After Selection - Auto-Advance

```
Animation Duration: 300ms
┌─────────────────────────────┐
│ Step 2 of 4 (Auto-advanced) │
│                             │
│ "What's your gaming focus?" │
│                             │
│ ☐ 📖 Story-Driven           │
│ ☑ 💯 Completionist         │  ← Default loaded
│ ☐ 🧠 Strategist            │
│                             │
│ Progress: ████████░░░░░░░░ 50%
└─────────────────────────────┘
```

---

## ✅ SCENARIO 4: Profile Setup Complete

### Step 4 (Final Step)

```
┌─────────────────────────────────┐
│ Step 4 of 4                     │
│                                 │
│ "Spoiler protection?"           │
│                                 │
│ ☐ 🔒 Strict                    │
│ ☑ 🔓 Moderate                  │
│ ☐ 🔓 Relaxed                   │
│                                 │
│ Progress: ████████████████ 100% │
│                                 │
│ [← Back] [Complete]  ← Key text │
└─────────────────────────────────┘
```

### User Clicks [Complete]

```tsx
const handleNext = () => {
  if (currentStep < steps.length - 1) {
    setCurrentStep(currentStep + 1);
  } else {
    // Final step: complete setup
    onComplete(profile as PlayerProfile); ← Calls MainApp handler
  }
};
```

### MainApp Receives Completion

```tsx
// App.tsx
const handleProfileSetupComplete = async (profileData: PlayerProfile) => {
  // Update local state immediately
  setUser({
    ...user,
    hasProfileSetup: true,
    profileData: profileData as unknown as Record<string, unknown>
  });

  // Update backend
  try {
    await markProfileSetupComplete(profileData);
  } catch (error) {
    console.error('Failed to save profile:', error);
  }
};

// Also in MainApp.tsx
<ProfileSetupBanner
  onComplete={handleProfileSetupComplete}
  onDismiss={() => setShowProfileSetupBanner(false)}  ← Callback
/>
```

### UI Result

```
INSTANT TRANSITION:

┌──────────────────────────────┐
│ MODAL CLOSES                 │
│ Animation: fade-out (200ms)  │
└──────────────────────────────┘
                ↓
┌──────────────────────────────┐
│ FULL CHAT AREA VISIBLE       │
│ • Messages area               │
│ • Input area ready           │
│ • No banner in way           │
│ • Personalized AI responses  │
└──────────────────────────────┘
```

---

## 📸 SCENARIO 5: Screenshot Queued via WebSocket (Mobile PWA)

### PC Client Action

On desktop: User presses F1 → Screenshot captured → Sent via WebSocket

### Mobile PWA Receives Image

```
WebSocket Message:
{
  type: 'screenshot-single',
  data: 'data:image/png;base64,iVBORw0KG...'  ← Base64 data
}
```

### MainApp Handler

```tsx
// MainApp.tsx, Lines 250-290
const handleWebSocketMessage = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { type, data } = customEvent.detail;

  if (type === 'screenshot-single' && data) {
    console.log('📸 Received screenshot from WebSocket');
    
    // Validate and normalize
    if (validateScreenshotDataUrl(data)) {
      const normalizedUrl = normalizeDataUrl(data);
      setQueuedScreenshot(normalizedUrl);  ← Stored in state
    }
  }
};

// Listen for WebSocket events
window.addEventListener('screenshotData', handleWebSocketMessage);
```

### ChatInterface Receives Queued Image

```tsx
// ChatInterface.tsx, Lines 715-730
useEffect(() => {
  if (queuedImage && isManualUploadMode) {
    console.log('📸 Queued image received:', {
      imageLength: queuedImage.length,
      isManualMode: isManualUploadMode
    });
    setImagePreview(queuedImage);        ← Display in input
    onImageQueued?.();                    ← Notify parent
  }
}, [queuedImage, isManualUploadMode, onImageQueued]);
```

### Visual Result

```
BEFORE IMAGE QUEUED:
┌─────────────────────────────┐
│ [Messages Area]             │
├─────────────────────────────┤
│ [📎] [🎥] [Textarea] [🔊] │
│ "Type your message..."      │
│ [━━━ SEND ━━━]            │
└─────────────────────────────┘

AFTER IMAGE QUEUED:
┌─────────────────────────────┐
│ [Messages Area]             │
├─────────────────────────────┤
│ ┌─ Chat Input ────────────┐ │
│ │ ┌───────────────────┐   │ │
│ │ │ 📸 [Thumbnail]   │   │ │ ← NEW: Image preview
│ │ │ w-24 h-24  [✕]   │   │ │
│ │ │ "Image Ready"    │   │ │
│ │ └───────────────────┘   │ │
│ │                         │ │
│ │ [📎] [🎥] [Textarea]  │ │
│ │ "Add message..."        │ │
│ │ [━━━ SEND ━━━]        │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Key Code Points

| Line | Action |
|------|--------|
| `715-730` | Hook detects `queuedImage` prop |
| `639-655` | Image preview renders in form |
| `780-820` | User can edit message or send directly |

---

## ⏳ SCENARIO 6: User Sends Message + Image

### Initial State

```
┌─────────────────────────────┐
│ [Messages Area - Empty]     │
├─────────────────────────────┤
│ ┌───────────────────────┐   │
│ │ 📸 [Thumb]  [✕]      │   │
│ │ "Image Ready"         │   │
│ │                       │   │
│ │ [Textarea]            │   │ ← Message: "Analyze this!"
│ │ "Analyze this!"       │   │
│ │ [━━━ SEND ━━━]       │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

### User Clicks [SEND]

```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation: allow if either message OR image exists
  if (!message.trim() && !imageFile) {
    return; // Block empty submit
  }

  // Get image URL from preview
  const imageUrl = imagePreview || undefined;
  
  console.log('📤 Submitting:', { 
    message, 
    hasImage: !!imageUrl 
  });
  
  // Call parent handler
  onSendMessage(message, imageUrl);
  
  // Clear state
  setMessage('');
  setImageFile(null);
  setImagePreview(null);           ← CLEARED!
  fileInputRef.current.value = '';
};
```

### Messages Added Optimistically

```tsx
// MainApp receives call
const handleSendMessage = (message: string, imageUrl?: string) => {
  // Create user message immediately (optimistic update)
  const userMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    role: 'user',
    content: message,
    imageUrl: imageUrl,
    timestamp: new Date().toISOString()
  };

  // Update UI immediately
  setConversation(prev => ({
    ...prev,
    messages: [...prev.messages, userMessage]
  }));

  // Set loading state
  setIsLoading(true);

  // Send to backend
  sendMessageToAPI(message, imageUrl);
};
```

### Visual Update Sequence

```
FRAME 1: User clicks send
┌─────────────────────────────┐
│ [Messages Area]             │
│                             │
│ ┌─ User Message ──────────┐ │
│ │ 📸 [Thumbnail Image]    │ │
│ │ "Analyze this!"         │ │
│ │ 12:34 PM                │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Input - Now CLEARED]       │
│ [📎] [🎥] [Textarea] [🔊] │
│ (No image preview)          │
│ [━━━ SEND (disabled) ━━━] │
└─────────────────────────────┘

FRAME 2: Loading state
┌─────────────────────────────┐
│ [Messages Area - Scrolled]  │
│ ┌─ User Message ──────────┐ │
│ │ 📸 [Thumbnail]          │ │
│ │ "Analyze this!"         │ │
│ │ [Edit] 12:34 PM         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─ AI Loading ────────────┐ │
│ │ 👤 ⊙ ⊙ ⊙ (typing)     │ │  ← Typing indicator
│ │    (Animated dots)      │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Input - DISABLED]          │
│ [📎 Off] [🎥 Off]         │
│ [Textarea - Faded]          │
│ [⏹️ STOP]  ← New button   │
└─────────────────────────────┘
```

---

## 🤖 SCENARIO 7: AI Response Generating

### Typing Indicator

```tsx
// TypingIndicator.tsx
<div className="flex items-center gap-2">
  <span className="w-2 h-2 bg-[#FF4D4D] rounded-full animate-pulse"></span>
  <span className="w-2 h-2 bg-[#FF4D4D] rounded-full animate-pulse" 
        style={{ animationDelay: '0.2s' }}></span>
  <span className="w-2 h-2 bg-[#FF4D4D] rounded-full animate-pulse" 
        style={{ animationDelay: '0.4s' }}></span>
</div>

// Result: ⊙ ⊙ ⊙ (dots pulse in sequence, 200ms apart)
```

### Auto-Scroll Behavior

```tsx
useEffect(() => {
  // Waits 200ms for DOM to render new content
  const timeoutId = setTimeout(() => {
    scrollToLatestMessage();  ← Scroll to bottom
  }, 200);
  
  return () => clearTimeout(timeoutId);
}, [conversation?.messages?.length]); ← Triggers on new message

const scrollToLatestMessage = () => {
  // messagesEndRef is a ref to <div /> at bottom
  messagesEndRef.current?.scrollIntoView({ 
    behavior: 'smooth'  ← Smooth animation
  });
};
```

### Input State During Loading

```tsx
<textarea
  disabled={isLoading}  ← TRUE
  className="disabled:opacity-60 disabled:cursor-not-allowed"
/>

{isLoading && onStop && (
  <button
    onClick={onStop}
    className="flex items-center gap-2 px-4 py-2 
               bg-red-500/20 hover:bg-red-500/30 
               text-red-400 rounded-lg"
  >
    <StopIcon className="w-4 h-4" />
    Stop
  </button>
)}
```

---

## ✅ SCENARIO 8: AI Response Complete

### WebSocket Receives Full Response

```json
{
  "type": "chat-response",
  "id": "msg_xyz",
  "content": "# Analysis of Your Strategy\n\n... markdown content ...",
  "suggestedPrompts": ["What about this?", "How to counter?"],
  "metadata": { "model": "gpt-4", "tokens": 150 }
}
```

### MainApp Updates State

```tsx
const handleChatResponse = (response: AIResponse) => {
  setConversation(prev => ({
    ...prev,
    messages: [
      ...prev.messages,
      {
        id: response.id,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString()
      }
    ]
  }));

  setSuggestedPrompts(response.suggestedPrompts);
  setIsLoading(false);  ← KEY: Stop loading state
};
```

### Visual Result

```
┌─────────────────────────────┐
│ [Messages Area - Full]      │
│ ┌─ User Message ──────────┐ │
│ │ 📸 [Thumbnail]          │ │
│ │ "Analyze this!"         │ │
│ │ [Edit]  12:34 PM        │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─ AI Response ───────────┐ │
│ │ 👤 # Analysis            │ │  ← markdown rendered
│ │ ## Key Points            │ │
│ │ - Point 1               │ │
│ │ - Point 2               │ │
│ │ - Point 3               │ │
│ │                         │ │
│ │ [🔊] TTS Button        │ │  ← Controls appear
│ │ 12:36 PM                │ │
│ │                         │ │
│ │ [👍] [👎]  Feedback    │ │  ← Below message
│ │                         │ │
│ │ [Prompt 1: What about?] │ │  ← Suggested prompts
│ │ [Prompt 2: How to...]   │ │
│ │ [Prompt 3: When...]     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Input - Now ENABLED]       │
│ [📎] [🎥] [Textarea] [🔊] │
│ "Type your message..."      │
│ [━━━ SEND ━━━]            │
└─────────────────────────────┘
```

### Feedback Button Interaction

```tsx
// When user clicks thumbs up
const handleFeedback = (type: 'up' | 'down') => {
  if (type === 'up') {
    if (feedbackGiven === 'up') {
      return; // Already liked - no change
    }
    setFeedbackGiven('up');
  }
  
  onFeedback?.(message.id, type, message.content);
};

// Result: Button turns green, stays disabled for future feedback
<button
  onClick={() => handleFeedback('up')}
  disabled={feedbackGiven !== null}  ← Locks after first feedback
  className={`${
    feedbackGiven === 'up'
      ? 'text-green-500 bg-green-500/15'  ← Indicates liked
      : 'text-[#666] hover:text-green-500'
  }`}
>
  👍
</button>
```

---

## 🎮 SCENARIO 9: Game Hub Quick Actions (Mobile Expansion)

### Condition

```tsx
if (conversation?.isGameHub) {
  // Show quick actions instead of subtabs
  showGameHubQuickPrompts = true;
}
```

### Collapsed State

```
┌─────────────────────────────┐
│ Messages                    │
├─────────────────────────────┤
│ [⌄ Latest Gaming News ⌞]    │ ← Closed (z-10)
├─────────────────────────────┤
│ [Chat Input]                │
└─────────────────────────────┘
```

### User Clicks Button

```tsx
<button
  onClick={() => setIsQuickActionsExpanded(true)}
  className="w-full flex items-center justify-between"
>
  <span className="text-xs font-semibold uppercase">
    Latest Gaming News
  </span>
  <svg className="w-4 h-4 transition-all">
    {/* Chevron icon rotates on click */}
  </svg>
</button>
```

### Expanded State

```
┌────────────────────────────────┐
│ Messages Area                  │
│ [Message]                      │
│ [Message]                      │
│                                │
│  ╔════ POPUP OVERLAY ═════╗    │ z-50
│  ║ ┌──────────────────────┐║    │
│  ║ │ ✕ News │ ■ Releases ││    │
│  ║ │ ▲ Reviews │ ◯ Trailers │    │
│  ║ └──────────────────────┘║    │
│  ║ (2-column grid)         ║    │
│  ╚════════════════════════╝    │
│                                │
│  [▲ Latest Gaming News ▲]  z-10│ ← Still clickable
│                                │
│  [Chat Input]                  │
└────────────────────────────────┘
```

### Popup Implementation

```tsx
{isQuickActionsExpanded && (
  <div
    className="absolute bottom-full left-0 right-0 mb-2 z-50 animate-fade-in"
  >
    <div className="grid grid-cols-2 gap-2 p-3 
                    rounded-xl bg-[#1C1C1C]/95 backdrop-blur-md 
                    border border-[#424242]/60 shadow-2xl">
      {prompts.map(prompt => (
        <button
          key={prompt.text}
          onClick={() => {
            setIsQuickActionsExpanded(false);  ← Auto-close
            onSuggestedPromptClick?.(prompt.text);
          }}
          className="group relative px-3 py-3 rounded-xl 
                     hover:border-[#E53A3A]/50 transition-all"
        >
          <span className="text-lg text-[#E53A3A]">
            {prompt.shape}
          </span>
          <span className="text-xs text-[#E5E5E5]">
            {prompt.text}
          </span>
        </button>
      ))}
    </div>
  </div>
)}
```

### Collision Prevention

```tsx
// Close quick actions when sidebar opens (prevent overlap)
useEffect(() => {
  if (isSidebarOpen && isQuickActionsExpanded) {
    setIsQuickActionsExpanded(false);  ← Auto-closes
  }
}, [isSidebarOpen]);  ← Watches sidebar
```

---

## 🔄 SCENARIO 10: Edited Message Re-submission

### User Clicks Edit Button

```
Original message:
┌─ User Message ──────────────────────────┐
│ "What are the best weapons?"            │
│ [Edit Button - appears on hover/active] │
└─────────────────────────────────────────┘
       ▼
User taps [Edit]
       ▼
Input textarea shows:
┌────────────────────────────────────┐
│ [📎] [🎥] [Textarea] [🔊]       │
│ "What are the best weapons?"       │
│ ^ Message restored in input        │
│ [━━ SEND ━━] (Send as new)        │
└────────────────────────────────────┘
```

### Edit Handler

```tsx
const handleEditMessage = (messageId: string, content: string) => {
  // Clean content (remove queue indicators)
  const cleanContent = content.replace(/\n\n_⏳ Queued.*_$/, '');
  
  // Set in textarea
  setMessage(cleanContent);
  
  // Focus for immediate editing
  setTimeout(() => {
    textareaRef.current?.focus();
  }, 100);
};

// Button implementation
{message.role === 'user' && !message.id.startsWith('msg_pending_') && (
  <button
    onClick={() => onEditMessage?.(message.id, message.content)}
    className="w-7 h-7 text-[#666] active:text-[#FF4D4D]"
  >
    ✎ (Edit icon)
  </button>
)}
```

### Send as New Message

When user clicks SEND after editing:
- Original message remains in history
- New message created with edited content
- Treated as fresh message to AI

---

## 📊 RESPONSIVE BEHAVIOR CHECKLIST

### Mobile (< 640px)

- [x] Single column layout
- [x] Padding: `p-3` (12px)
- [x] Avatar: `w-8 h-8` (32px)
- [x] Message width: `max-w-[75%]`
- [x] Touch targets: ≥ 44px
- [x] Font: 16px (prevents zoom)
- [x] Safe area padding applied
- [x] Dynamic viewport height (100dvh)

### Tablet (640px - 1024px)

- [x] Single/dual column capable
- [x] Padding: `sm:p-5` (20px)
- [x] Avatar: `sm:w-9 sm:h-9` (36px)
- [x] Message width: `sm:max-w-[80%]`
- [x] Hover states active
- [x] More spacious layout
- [x] Sidebar visible option

### Desktop (≥ 1024px)

- [x] Full layout with sidebar
- [x] Padding: `lg:p-6` (24px)
- [x] Avatar: Default sizes
- [x] Message width: 85%
- [x] Full hover interactions
- [x] Keyboard shortcuts active

---

## 🧪 Testing the Scenarios

### Test Case 1: Profile Banner Disappear
```
1. Load app
2. ✓ Banner visible
3. Click [✕ Dismiss]
4. ✓ Banner gone, chat area expanded
5. Refresh page
6. ✓ Banner does NOT reappear (persisted)
```

### Test Case 2: Image Upload
```
1. Tap 📎 button
2. ✓ File picker opens
3. Select image
4. ✓ Preview shows (w-24 h-24)
5. ✓ Can tap ✕ to remove
6. Tap SEND
7. ✓ Image uploaded with message
8. ✓ Both appear in chat
```

### Test Case 3: AI Response
```
1. Type "test"
2. Tap SEND
3. ✓ Message appears optimistically
4. ✓ Input disabled
5. ✓ Typing indicator shows
6. ✓ Auto-scrolls to bottom
7. ✓ Response appears
8. ✓ Feedback buttons available
9. ✓ Input enabled again
```

### Test Case 4: Mobile Safe Area
```
iPhone with notch:
1. ✓ Status bar space respected
2. ✓ Home bar space respected
3. ✓ No content under safe areas
4. ✓ Input accessible above home bar
```

---

## 🔗 Key Props & Callbacks

```tsx
interface ChatInterfaceProps {
  // Core
  conversation: Conversation | null;
  onSendMessage: (message: string, imageUrl?: string) => void;
  isLoading: boolean;
  
  // Image handling
  queuedImage?: string | null;              ← WebSocket image
  onImageQueued?: () => void;                ← Notify parent
  
  // Feedback
  onFeedback?: (msgId: string, type: 'up'|'down') => void;
  
  // Editing
  onEditMessage?: (msgId: string, content: string) => void;
  onDeleteQueuedMessage?: (msgId: string) => void;
  
  // UI state
  isSidebarOpen?: boolean;                   ← For collision detection
  isManualUploadMode?: boolean;              ← PC screenshot mode
  
  // Suggested prompts
  suggestedPrompts?: string[];
  onSuggestedPromptClick?: (prompt: string) => void;
}
```

---

## 💡 Performance Tips

1. **Memoize message components** - Prevents re-renders
2. **Use refs for scroll** - Smooth auto-scroll without state
3. **Lazy load images** - Don't render preview until user selects
4. **Debounce textarea resize** - Smooth height changes
5. **Clear image on send** - Don't keep in memory
6. **Disable during loading** - Prevent double-sends

---

## 📚 Related Documentation

- [PWA Safe Area Guide](./CHAT_SCREEN_PWA_SAFE_AREAS.md)
- [Tailwind Responsive Breakpoints](./RESPONSIVE_BREAKPOINTS.md)
- [Component Architecture](./COMPONENT_ARCHITECTURE.md)
- [Performance Optimization](./PERFORMANCE_METRICS.md)

