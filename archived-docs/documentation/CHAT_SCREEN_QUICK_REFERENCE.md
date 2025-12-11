# 📱 Chat Screen - Quick Reference Card

## One-Page Mobile/PWA Chat Interface Overview

---

## 🎯 Layout Structure

```
┌─────────────────┐
│   MESSAGES      │  ← flex-1 (scrollable, grows)
│   (flex-1)      │     overflow-y-auto
│                 │
├─────────────────┤
│   SUBTABS/      │  ← flex-shrink-0 (fixed height)
│   QUICK ACTIONS │     conditional rendering
│                 │
├─────────────────┤
│   CHAT INPUT    │  ← flex-shrink-0 (fixed height)
│   (flex-shrink-0)     bg-background/95
│                 │     backdrop-blur-sm
└─────────────────┘
```

---

## 📍 5 Key Scenarios

### 1️⃣ Profile Setup Banner (Dismissable)
- **Status:** Optional, collapsible
- **Mobile:** Expands to full-screen overlay modal
- **Classes:** `animate-slide-down` (collapsed), `animate-scale-in` (expanded)
- **Dismiss:** → hides forever (persisted via DB)
- **Complete:** → personalized AI responses + banner gone

### 2️⃣ Empty Chat (Default)
- **Shows:** Mascot image (128-256px) + welcome text
- **Layout:** Centered vertically in messages area
- **Input:** Ready, waiting for first message

### 3️⃣ Image Queued (PC Screenshot → Mobile PWA)
- **Receives:** `queuedImage` prop via WebSocket
- **Display:** Small thumbnail (w-24 h-24) inside input
- **Can remove:** Via ✕ button
- **Send with:** Message text or standalone

### 4️⃣ AI Generating (Loading State)
- **Shows:** Typing indicator (⊙ ⊙ ⊙ animated dots)
- **Input:** Disabled, 60% opacity
- **Stop Button:** Shows red ⏹️ button
- **Auto-scroll:** Smooth scroll to bottom
- **Duration:** Until response received

### 5️⃣ AI Response Complete
- **Shows:** Full markdown content + avatar
- **Feedback:** Thumbs up/down buttons below
- **Suggested:** 3-4 prompt suggestions appear
- **TTS:** Voice control button available
- **Input:** Re-enabled, ready for next message

---

## 🎨 Responsive Breakpoints

| Breakpoint | Width | Padding | Avatar | Message Width |
|-----------|-------|---------|--------|---------------|
| Mobile | < 640px | p-3 | w-8 h-8 | 75% |
| Tablet | 640-1024px | sm:p-5 | sm:w-9 sm:h-9 | 80% |
| Desktop | ≥ 1024px | lg:p-6 | default | 85% |

**Key Classes:**
```
p-3        → 12px padding
sm:p-5     → 20px padding (≥640px)
lg:p-6     → 24px padding (≥1024px)
```

---

## 🔄 State Variables (ChatInterface.tsx)

| State | Type | Purpose |
|-------|------|---------|
| `message` | string | User's current input |
| `imagePreview` | string \| null | Image to send |
| `isFocused` | boolean | Gradient border on/off |
| `isLoading` | boolean | AI generating (disable input) |
| `isManualUploadMode` | boolean | Accept WebSocket images |
| `isSubtabsExpanded` | boolean | Subtabs visible (hide scroll) |
| `isQuickActionsExpanded` | boolean | Game Hub prompts showing |

---

## 🎬 Component Tree

```
App.tsx
├─ MainApp.tsx
│  ├─ ProfileSetupBanner.tsx
│  │  ├─ 4-step wizard (collapsible)
│  │  └─ Overlay modal (mobile only)
│  └─ ChatInterface.tsx
│     ├─ Messages Area
│     │  ├─ MemoizedChatMessage (per message)
│     │  │  ├─ MarkdownRenderer
│     │  │  ├─ AIAvatar
│     │  │  ├─ TTSControls
│     │  │  └─ SuggestedPrompts
│     │  └─ TypingIndicator (loading state)
│     ├─ SubTabs (conditional)
│     ├─ Quick Actions (Game Hub only)
│     └─ Chat Input
│        ├─ Image preview (if queued)
│        ├─ Textarea (auto-growing)
│        ├─ Buttons (📎 🎥 🔊 ⏹️)
│        └─ Send/Stop button
```

---

## 🖼️ Image Handling Flow

```
DESKTOP UPLOAD:
User clicks 📎
→ FileReader converts to DataURL
→ setImagePreview()
→ Shows w-24 h-24 thumbnail
→ User clicks SEND
→ onSendMessage(text, imageUrl)

MOBILE WEBSOCKET:
PC sends F1 screenshot
→ WebSocket receives
→ MainApp: setQueuedScreenshot()
→ ChatInterface receives queuedImage prop
→ setImagePreview(queuedImage)
→ Same display/send flow
```

---

## ⌨️ Keyboard Interaction

| Key | Action | Mobile | Desktop |
|-----|--------|--------|---------|
| **Enter** | Send message | ✓ | ✓ |
| **Shift+Enter** | New line in message | ✓ | ✓ |
| **↑ Arrow** | Navigate autocomplete | - | ✓ |
| **↓ Arrow** | Navigate autocomplete | - | ✓ |
| **Escape** | Close autocomplete | - | ✓ |

---

## 🎨 Color Palette

```
Primary Accent:     #FF4D4D (Red)    | #FFAB40 (Orange)
Background:         #0F0F0F (Black)
Surface:            #1C1C1C (Dark)
Border:             #424242 (Gray)
Text Primary:       #F5F5F5 (White)
Text Secondary:     #A3A3A3 (Gray)
Button Primary:     #E53A3A → #D98C1F (Red to Orange gradient)

Feedback Colors:
- Positive (Thumbs Up):  #22C55E (Green)
- Negative (Thumbs Down): #EF4444 (Red)
```

---

## 📐 Safe Area Insets (PWA Standalone)

```tsx
// globals.css @media (display-mode: standalone)
#root {
  padding-top: env(safe-area-inset-top, 0px);      // Notch
  padding-bottom: env(safe-area-inset-bottom, 0px); // Home bar
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  height: 100dvh; // Dynamic viewport height
}
```

**Common Values:**
- iPhone 13 Pro: top 47px, bottom 34px
- iPhone SE: top 0px, bottom 0px
- iPad (landscape): left 40px, right 40px

---

## 🚀 Performance Optimizations

✅ **Memoized Message Component**
- Custom comparison function
- Only re-renders if message data changes
- Prevents SubTab updates from re-rendering messages

✅ **Lazy Image Loading**
- Images only displayed when needed
- No rendering until user selection
- Automatic cleanup on send

✅ **Auto-Scroll Efficiency**
- Uses ref (not state)
- 200ms delay for DOM rendering
- Smooth behavior animation

✅ **Disabled State During Loading**
- Prevents double-message sends
- Visual feedback (60% opacity)
- Stop button available

---

## 🔧 Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Input stuck disabled | isLoading not set to false | Check response handler |
| No image preview | queuedImage prop missing | Check WebSocket handler |
| Typing indicator stuck | Response never completed | Add timeout/error handler |
| Message not scrolling | messagesEndRef not mounted | Verify ref is on DOM element |
| Banner not dismissing | showProfileSetupBanner still true | Check onDismiss callback |
| Safe area not respected | Not in PWA standalone mode | Test via `display-mode: standalone` |

---

## 📋 Mobile Testing Checklist

- [ ] Profile banner appears
- [ ] Banner dismisses and hides forever
- [ ] Banner expands to full modal
- [ ] Modal has progress bar
- [ ] Auto-advances after selection
- [ ] Body scroll locked during modal
- [ ] Empty state shows mascot
- [ ] Can upload image via 📎
- [ ] Image preview shows (w-24)
- [ ] Can remove image with ✕
- [ ] Message sends with image
- [ ] Typing indicator animated
- [ ] Auto-scrolls to new message
- [ ] Input disabled during loading
- [ ] Stop button works
- [ ] Response displays markdown
- [ ] Feedback buttons work
- [ ] Suggested prompts clickable
- [ ] Safe area respected (notch, home bar)
- [ ] No horizontal scroll at 320px
- [ ] Touch targets ≥ 44px × 44px
- [ ] 16px font (no zoom on iOS)
- [ ] Smooth animations
- [ ] Accessibility: ARIA labels
- [ ] Keyboard navigation works

---

## 📚 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `ChatInterface.tsx` | Main chat UI, input, messages | 1195 |
| `ProfileSetupBanner.tsx` | Profile wizard modal | 302 |
| `MainApp.tsx` | App state, webhooks | 2000+ |
| `globals.css` | PWA styles, safe areas | 1140 |
| `MarkdownRenderer.tsx` | Markdown content display | - |
| `SuggestedPrompts.tsx` | Prompt suggestion UI | - |
| `TypingIndicator.tsx` | Loading indicator animation | - |
| `SubTabs.tsx` | Game insights/analysis tabs | - |

---

## 🔗 Import Paths

```tsx
import ChatInterface from './features/ChatInterface';
import ProfileSetupBanner from './ui/ProfileSetupBanner';
import MainApp from './MainApp';
import MarkdownRenderer from './features/MarkdownRenderer';
import TypingIndicator from './ui/TypingIndicator';
import AIAvatar from './ui/AIAvatar';
import TTSControls from './ui/TTSControls';
import SuggestedPrompts from './features/SuggestedPrompts';
```

---

## 🎯 Props Summary

### ChatInterface Props
```tsx
interface ChatInterfaceProps {
  conversation: Conversation | null;
  onSendMessage: (message: string, imageUrl?: string) => void;
  isLoading: boolean;
  queuedImage?: string | null;           // WebSocket image
  onImageQueued?: () => void;             // Notify parent
  isManualUploadMode?: boolean;           // PC screenshot mode
  isSidebarOpen?: boolean;                // Collision detection
  suggestedPrompts?: string[];
  onSuggestedPromptClick?: (prompt: string) => void;
  onFeedback?: (id: string, type: 'up'|'down') => void;
  onEditMessage?: (id: string, content: string) => void;
  onDeleteQueuedMessage?: (id: string) => void;
  onModifySubtab?: (id: string, title: string, suggestion: string) => void;
  onDeleteSubtab?: (id: string) => void;
}
```

### ProfileSetupBanner Props
```tsx
interface ProfileSetupBannerProps {
  onComplete: (profile: PlayerProfile) => void;
  onDismiss: () => void;
}
```

---

## 💾 State Persistence

| State | Storage | Duration |
|-------|---------|----------|
| `message` | Memory (state) | Session |
| `imagePreview` | Memory (state) | Session |
| `showProfileSetupBanner` | Memory (state) | Session |
| `hasProfileSetup` | Database | Permanent |
| `playerProfile` | Database | Permanent |
| `conversations` | Database | Permanent |

---

## 🔐 Security Notes

✓ **Image Validation:**
- DataURL format validated
- Size checks before upload
- MIME type verified

✓ **XSS Prevention:**
- Markdown sanitized
- User content escaped
- DOMPurify integrated

✓ **CORS Handling:**
- WebSocket secure (wss://)
- API endpoints authenticated
- Token refreshed on auth

---

## 📈 Performance Metrics

- **First Paint:** < 1s (with skeleton)
- **Message Render:** < 100ms (memoized)
- **Auto-Scroll:** 200ms (smooth behavior)
- **Image Upload:** < 500ms (local)
- **Modal Animation:** 300ms (scale-in)

---

## 🎓 Learning Resources

1. **Tailwind Responsive Design:** https://tailwindcss.com/docs/responsive-design
2. **React Performance:** https://react.dev/learn/render-and-commit
3. **PWA Safe Areas:** https://developer.mozilla.org/en-US/docs/Web/CSS/env
4. **Mobile UX:** https://www.nngroup.com/articles/mobile-usability/

---

## 📞 Quick Support

**Message won't send?**
- Check: `message.trim()` and `imageFile` - need at least one
- Check: `isLoading` - wait for previous response
- Check: Input disabled state

**Image not showing?**
- Check: `queuedImage` prop received
- Check: `isManualUploadMode` enabled
- Check: Base64 data URL valid

**Typing indicator stuck?**
- Check: `isLoading` set to false
- Check: Response received handler
- Check: No promise rejection

**Layout broken at 320px?**
- Check: `overflow-hidden` on container
- Check: `min-h-0` on flex children
- Check: No `px` padding > 12px

