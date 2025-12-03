# 📱 Chat Screen Mobile/PWA Interface - Complete Behavior Guide

> **Last Updated:** December 3, 2025  
> **Component Files:** `ChatInterface.tsx`, `ProfileSetupBanner.tsx`, `MainApp.tsx`  
> **Styling:** Tailwind CSS + `globals.css` (PWA-specific styles)

---

## 🎯 Overview

The Otagon chat interface is **fully responsive** and optimized for mobile/PWA standalone mode. It automatically adapts to different scenarios:

1. **Profile Setup Banner Dismissed** - Expanded chat area
2. **Images Queued** - Shows image preview inside input
3. **AI Generating Response** - Loading state with typing indicator
4. **Different Conversation Types** - Game Hub vs Released Games

---

## 📐 Layout Architecture

### 3-Section Layout (Mobile & Desktop)

```
┌─────────────────────────────┐
│     MESSAGES AREA           │  ← Flex-1 (Takes all space)
│   (Scrollable, Py-3-5)      │
│                             │
├─────────────────────────────┤
│    SUBTABS/QUICK ACTIONS    │  ← Flex-shrink-0 (Fixed height)
│    (Conditional, Pb-1-2)    │
├─────────────────────────────┤
│    CHAT INPUT SECTION       │  ← Flex-shrink-0 (Fixed height)
│   (Form, Textarea, Buttons) │
└─────────────────────────────┘
```

### CSS Classes Structure
```tsx
<div className="h-full bg-background flex flex-col overflow-hidden">
  {/* Messages Area - Scrollable */}
  <div className="flex-1 p-3 sm:p-5 space-y-3 sm:space-y-5 min-h-0 overflow-y-auto">
    
  {/* SubTabs or Quick Actions */}
  <div className="flex-shrink-0 px-3 pb-2">
    
  {/* Chat Input - Always at bottom */}
  <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm">
```

**Key Properties:**
- `h-full` - Takes full height of parent
- `flex flex-col` - Vertical stacking
- `overflow-hidden` - Hides scrollbars at container level
- `min-h-0` - Allows flex items to shrink below content size

---

## 🎨 SCENARIO 1: Default Empty State

### When User Opens Chat

**Profile Setup Banner Status:** VISIBLE (unless dismissed)
**Messages:** None
**Input State:** Empty, ready for input

### Visual Layout

```
┌─────────────────────────────────────┐
│  ⚠️ PROFILE SETUP BANNER (Top)      │
│  [Personalize] [Set Up] [✕ Dismiss]│
├─────────────────────────────────────┤
│                                     │
│        🎮 Otagon Mascot (128-48px) │
│                                     │
│  "Start a conversation with         │
│   Otagon. Ask me anything..."       │
│                                     │
│              (EMPTY SPACE)          │
├─────────────────────────────────────┤
│  📎 🎥 [Textarea] 🔊              │
│  Send...                            │
└─────────────────────────────────────┘
```

### Code Reference (ChatInterface.tsx, Lines 805-825)

```tsx
return (
  <div className="h-full bg-background flex flex-col overflow-hidden">
    {/* Messages Area - Only this should scroll */}
    <div 
      ref={messagesContainerRef}
      className={`flex-1 p-3 sm:p-5 space-y-3 sm:space-y-5 min-h-0 ${
        conversation.messages.length > 0 
          ? isSubtabsExpanded 
            ? 'overflow-hidden'
            : 'overflow-y-auto custom-scrollbar' 
          : 'overflow-y-hidden'
      }`}
    >
      {conversation.messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <img
              src="/images/mascot/4.png"
              alt="Otagon Mascot"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
            />
            <p className="text-text-muted text-lg">
              Start a conversation with <span className="text-gradient">Otagon</span>
            </p>
```

---

## 📍 SCENARIO 2: Profile Setup Banner - Collapsed

### When Banner is Visible but Not Expanded

**Height:** ~80-90px (responsive)
**Location:** Above messages area
**Mobile Width:** `mx-3` (12px padding)
**Desktop Width:** `lg:mx-6` (24px padding)

### Visual Layout

```
┌─── MOBILE (320px) ────────────────┐
│                                   │
│ ┌─ Profile Setup Banner ────────┐ │
│ │ 👤 Personalize Your Experience│ │
│ │ Set preferences for AI        │ │
│ │      [Set Up] [✕ Dismiss]     │ │
│ └───────────────────────────────┘ │
│                                   │
│ ┌─ Messages Area ────────────────┐ │
│ │                                 │ │
│ │  (Chat messages or empty)       │ │
│ │                                 │ │
│ └───────────────────────────────┘ │
│                                   │
│ [Input Bar at Bottom]             │
│                                   │
└───────────────────────────────────┘
```

### Banner Styling

**ProfileSetupBanner.tsx, Lines 140-165**

```tsx
const collapsedBanner = (
  <div className="mx-3 sm:mx-4 lg:mx-6 mb-4 sm:mb-6">
    <div className="bg-gradient-to-r from-[#FF4D4D]/10 to-[#FFAB40]/10 
                    border-2 border-[#FF4D4D]/30 
                    rounded-xl p-4 
                    shadow-lg animate-slide-down backdrop-blur-sm">
      
      <div className="flex items-center justify-between">
        {/* Avatar + Title + Subtitle */}
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] 
                          rounded-full flex items-center justify-center">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold">
              Personalize Your Experience
            </h3>
            <p className="text-sm text-text-secondary hidden sm:block">
              Set up your gaming preferences...
            </p>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex items-center space-x-2 ml-3">
          <button className="px-4 py-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F]
                            rounded-lg transition-all active:scale-95">
            Set Up
          </button>
          <button className="p-2 text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
);
```

**Key Responsive Classes:**
- `mx-3` → Mobile: 12px
- `sm:mx-4` → Tablet: 16px
- `lg:mx-6` → Desktop: 24px
- `mb-4 sm:mb-6` → Margin bottom
- `animate-slide-down` → Smooth entrance animation

---

## 📝 SCENARIO 3: Profile Setup Banner - Expanded (Mobile)

### When User Clicks "Set Up"

**Mode:** Overlay (mobile only, `shouldUseOverlay = true`)
**z-index:** High (modal behavior)
**Animation:** `animate-scale-in`
**Body Scroll:** Disabled during expansion

### Visual Layout (Mobile)

```
┌─── FULL SCREEN OVERLAY ────────────┐
│                                    │
│  ┌─ Profile Setup Wizard ────────┐ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │ Quick Setup      Step 1 of 4 [✕]│ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │                              │ │
│  │  How do you like your hints? │ │
│  │                              │ │
│  │  ☐ 🔮 Cryptic              │ │
│  │  ☑ ⚖️ Balanced  (Selected)  │ │
│  │  ☐ 🎯 Direct               │ │
│  │                              │ │
│  │ Progress: ████░░░░░░ 25%     │ │
│  │                              │ │
│  │  [← Back] [Next →]          │ │
│  └──────────────────────────────┘ │
│                                    │
│  (Rest of screen darkened)         │
│                                    │
└────────────────────────────────────┘
```

### Expanded State Code

**ProfileSetupBanner.tsx, Lines 200-302**

```tsx
const expandedCard = (
  <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] 
                  border-2 border-[#FF4D4D]/30 
                  rounded-xl shadow-2xl overflow-hidden 
                  animate-scale-in backdrop-blur-xl"
       role="dialog"
       aria-modal={isMobile}>
    
    {/* Header - Red Gradient */}
    <div className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Quick Setup</h2>
          <p className="text-white/90 text-sm mt-1">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
        <button className="p-2 text-white/80 hover:text-white">✕</button>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-white/20 rounded-full h-1">
        <div 
          className="bg-white rounded-full h-1 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
    
    {/* Content Area */}
    <div className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        {currentStepData.title}
      </h3>
      
      {/* Options Grid */}
      <div className="space-y-3">
        {currentStepData.options.map(option => (
          <button
            key={option.value}
            onClick={() => handleOptionSelect(currentStepData.field, option.value)}
            className={`w-full p-3 rounded-lg border-2 transition-all ${
              profile[currentStepData.field] === option.value
                ? 'border-[#FF4D4D] bg-[#FF4D4D]/10'
                : 'border-[#424242] hover:border-[#FF4D4D]/50'
            }`}
          >
            <span className="text-lg mr-3">{option.label.split(' ')[0]}</span>
            {option.label}
          </button>
        ))}
      </div>
    </div>
    
    {/* Footer - Navigation */}
    <div className="px-4 sm:px-6 py-4 border-t border-[#424242]/50 bg-[#0F0F0F]">
      <div className="flex gap-3">
        <button 
          onClick={handleBack}
          className="flex-1 py-2 px-4 rounded-lg border border-[#424242] hover:border-[#FF4D4D]/50"
        >
          ← Back
        </button>
        <button 
          onClick={handleNext}
          className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] text-white font-semibold"
        >
          {currentStep === steps.length - 1 ? 'Complete' : 'Next →'}
        </button>
      </div>
    </div>
  </div>
);

// On mobile: Render as overlay
if (shouldUseOverlay) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm 
                    flex items-center justify-center p-4">
      {expandedCard}
    </div>
  );
}
```

**Mobile Safe Area Considerations:**
```tsx
useEffect(() => {
  if (!shouldUseOverlay) return;
  
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden'; // Prevent background scroll
  
  return () => {
    document.body.style.overflow = originalOverflow;
  };
}, [shouldUseOverlay]);
```

---

## 🖼️ SCENARIO 4: Image Queued (Manual Upload Mode)

### When User Queues Screenshot

**Trigger:** WebSocket sends `queuedImage` → `ChatInterface` receives it  
**Upload Mode:** `isManualUploadMode = true`  
**Image Location:** Inside chat input area

### Visual Layout

```
┌─── MOBILE (320px) ────────────────┐
│                                   │
│ Messages Area (scrollable)        │
│                                   │
├─────────────────────────────────────┤
│  SUBTABS (if applicable)           │
├─────────────────────────────────────┤
│ ┌─ Chat Input ───────────────────┐ │
│ │                                 │ │
│ │  ┌───────────────────────────┐  │ │
│ │  │ 📸 [Image Preview]  [✕]  │  │ │
│ │  │ w-24 h-24 rounded-lg     │  │ │
│ │  └───────────────────────────┘  │ │
│ │  "Image Ready - Add message..."  │ │
│ │                                 │ │
│ │  [📎] [📹] [Textarea]    [🔊] │ │
│ │  "Type your message..."         │ │
│ │              ........................ │ │
│ │              . AI ANALYSIS .        │ │
│ │              ........................ │ │
│ │                                 │ │
│ │       [─────SEND────────]       │ │
│ │       [━SEND (loading)━]        │ │
│ └─────────────────────────────────┘ │
│                                   │
└───────────────────────────────────┘
```

### Image Preview Code

**ChatInterface.tsx, Lines 1050-1075**

```tsx
{/* Image Preview - Inside the form */}
{imagePreview && (
  <div className="mb-2 flex items-center gap-2">
    <div className="relative">
      <img
        src={imagePreview}
        alt="Preview"
        className="w-24 h-24 object-cover rounded-lg border border-[#424242]/40"
      />
      <button
        type="button"
        onClick={removeImage}
        className="absolute -top-2 -right-2 bg-red-500 text-white 
                   rounded-full w-5 h-5 flex items-center justify-center 
                   text-xs hover:bg-red-600 transition-colors"
      >
        ×
      </button>
    </div>
    <div className="text-xs text-[#A3A3A3]">
      <p className="font-semibold">Image Ready</p>
      <p>Add a message or send</p>
    </div>
  </div>
)}

<textarea
  ref={textareaRef}
  value={message}
  onChange={handleValueChange}
  onKeyDown={handleKeyDown}
  placeholder="Type your message..."
  className="w-full px-4 sm:px-6 text-base text-[#F5F5F5] 
             placeholder-[#A3A3A3] resize-none overflow-y-auto 
             focus:outline-none bg-transparent border-0 rounded-xl"
  style={{
    minHeight: '44px',
    maxHeight: '120px',
    lineHeight: '44px'
  }}
/>
```

### Queued Image Hook

**ChatInterface.tsx, Lines 715-730**

```tsx
// ✅ NEW: Handle queued image from WebSocket (manual mode)
useEffect(() => {
  if (queuedImage && isManualUploadMode) {
    console.log('📸 [ChatInterface] Queued image received from WebSocket:', {
      queuedImageLength: queuedImage.length,
      currentImagePreview: imagePreview?.substring(0, 50)
    });
    setImagePreview(queuedImage);
    // Notify parent that image was accepted
    onImageQueued?.();
  }
  // ✅ FIX: Removed imagePreview from dependencies to prevent infinite loop
}, [queuedImage, isManualUploadMode, onImageQueued]);
```

---

## 🤖 SCENARIO 5: AI Generating Response

### When Assistant is Responding

**State Variables:**
- `isLoading = true`
- `conversation.messages` includes queued user message
- Latest message shows typing indicator

### Visual Layout (with AI Response)

```
┌─────────────────────────────────┐
│   Messages Area                 │
│                                 │
│   USER MESSAGE (Right)          │
│   ☐ "Show me best weapons"      │
│   [Edit] icon                   │
│                                 │
│   AI MESSAGE (Left) - LOADING   │
│   👤 ⊙ ⊙ ⊙ (Typing dots)      │
│      (Animated typing)          │
│                                 │
│   (Space for more content)      │
├─────────────────────────────────┤
│   SUBTABS (if visible)          │
├─────────────────────────────────┤
│   INPUT: DISABLED STATE         │
│   [📎 Disabled] [📹 Disabled]  │
│   [Textarea: Disabled & faded]  │
│   "Type your message..."        │
│   [⏹️ STOP] button              │
└─────────────────────────────────┘
```

### Loading State Code

**ChatInterface.tsx, Lines 860-880**

```tsx
{isLoading && (
  <div className="flex justify-start">
    <div className="flex items-center gap-3">
      <AIAvatar className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" />
      <TypingIndicator variant="dots" showText={false} />
    </div>
  </div>
)}

// Textarea disabled when loading
<textarea
  ref={textareaRef}
  value={message}
  {...props}
  disabled={isLoading}  // ← DISABLED STATE
  className="disabled:opacity-60 ..."  // ← Faded appearance
/>

// Stop Button Visible
{isLoading && onStop && (
  <button
    onClick={onStop}
    className="flex items-center gap-2 px-4 py-2 
               bg-red-500/20 hover:bg-red-500/30 
               text-red-400 rounded-lg transition-colors"
  >
    <StopIcon className="w-4 h-4" />
    Stop
  </button>
)}
```

### Auto-Scroll Behavior

**ChatInterface.tsx, Lines 700-710**

```tsx
useEffect(() => {
  // Add delay to ensure DOM is updated before scrolling
  const timeoutId = setTimeout(() => {
    scrollToLatestMessage();
  }, 200);
  return () => clearTimeout(timeoutId);
}, [conversation?.messages?.length]); // Triggers on new message

const scrollToLatestMessage = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};
```

---

## 💬 SCENARIO 6: AI Response Complete

### After AI Generates Full Response

**State Variables:**
- `isLoading = false`
- Message appears with full markdown content
- Feedback buttons (thumbs up/down) visible
- Suggested prompts appear below

### Visual Layout

```
┌─────────────────────────────────┐
│   Messages Area                 │
│                                 │
│   USER MESSAGE (Right)          │
│   ☐ "Show me best weapons"      │
│   [Edit] icon                   │
│                                 │
│   AI MESSAGE (Left) - COMPLETE  │
│   👤 Analysis of weapons...     │
│      Pros: [markdown]           │
│      Cons: [markdown]           │
│      Strategy: [markdown]       │
│                                 │
│   👍 👎 (Feedback buttons)       │
│   [Suggested Prompt 1]          │
│   [Suggested Prompt 2]          │
│   [Suggested Prompt 3]          │
│                                 │
├─────────────────────────────────┤
│   INPUT: ENABLED                │
│   [📎] [📹] [Textarea]    [🔊]│
│   "Type your message..."        │
│   [━━━SEND━━━] button           │
└─────────────────────────────────┘
```

### Response UI Code

**ChatInterface.tsx, Lines 250-350**

```tsx
// Message with full content + markdown rendering
<div className="flex flex-col items-start w-full">
  <div className="flex items-start gap-3">
    {/* AI Avatar */}
    {message.role === 'assistant' && (
      <AIAvatar className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" />
    )}
    
    <div className="flex-1 min-w-0">
      {/* Markdown Content */}
      <MarkdownRenderer 
        content={message.content} 
        variant="chat" 
        className="text-[#F5F5F5] leading-relaxed"
      />
      
      {/* TTS Controls */}
      {message.role === 'assistant' && (
        <TTSControls isLatestMessage={isLatestAIMessage} />
      )}
      
      {/* Suggested Prompts */}
      {message.role === 'assistant' && suggestedPrompts.length > 0 && (
        <div className="mt-4">
          <SuggestedPrompts
            prompts={suggestedPrompts}
            onPromptClick={onSuggestedPromptClick}
          />
        </div>
      )}
    </div>
  </div>
  
  {/* Feedback Buttons - Below message */}
  {message.role === 'assistant' && onFeedback && !isLoading && (
    <div className="flex items-center justify-start gap-1.5 mt-1.5 ml-11">
      <button
        onClick={() => handleFeedback('up')}
        className={`flex items-center justify-center w-7 h-7 rounded-full 
                    ${feedbackGiven === 'up'
                      ? 'text-green-500 bg-green-500/15'
                      : 'text-[#666] hover:text-green-500'
                    }`}
      >
        👍
      </button>
      <button
        onClick={() => handleFeedback('down')}
        className={`flex items-center justify-center w-7 h-7 rounded-full 
                    ${feedbackGiven === 'down'
                      ? 'text-red-500 bg-red-500/15'
                      : 'text-[#666] hover:text-red-500'
                    }`}
      >
        👎
      </button>
    </div>
  )}
</div>
```

---

## 🎮 SCENARIO 7: Game Hub Quick Actions (Mobile Behavior)

### When Chat is for Game Hub

**Condition:** `conversation.isGameHub = true`  
**Quick Actions Show:** Latest Gaming News section  
**Behavior:** Collapsible overlay (z-50)

### Visual Layout

```
┌─── MOBILE EXPANDED STATE ─────────┐
│                                   │
│  Messages Area                    │
│                                   │
├─────────────────────────────────────┤
│  ┌─ Latest Gaming News (z-50) ──┐ │
│  │ Overlay above input button    │ │
│  │                              │ │
│  │ ┌─ Quick Prompt Grid ─────┐  │ │
│  │ │ [✕ Latest News]  [■ Releases]  │ │
│  │ │ [▲ Reviews]      [◯ Trailers]  │ │
│  │ └───────────────────────────┘  │ │
│  └──────────────────────────────┘ │
│                                   │
│  [⌄ Latest Gaming News ⌞]         │
│                                   │
│  [📎] [📹] [Textarea]        [🔊] │
│                                   │
└───────────────────────────────────┘
```

### Code Implementation

**ChatInterface.tsx, Lines 925-980**

```tsx
{conversation?.isGameHub && (
  <div className="flex-shrink-0 mx-3 pb-1.5 relative">
    {/* Collapsible Button */}
    <button
      onClick={() => setIsQuickActionsExpanded(!isQuickActionsExpanded)}
      className="w-full flex items-center justify-between mb-2 py-2 px-3 
                 rounded-lg bg-[#1C1C1C]/50 hover:bg-[#1C1C1C] 
                 border border-[#424242]/30 hover:border-[#424242]/60"
    >
      <div className={`text-xs font-semibold uppercase 
                      ${isQuickActionsExpanded 
                        ? 'text-[#FF4D4D]' 
                        : 'text-[#A3A3A3]'}`}>
        Latest Gaming News
      </div>
      <svg className={`w-4 h-4 transition-all 
                       ${isQuickActionsExpanded 
                         ? 'rotate-180 text-[#FF4D4D]' 
                         : 'text-[#A3A3A3]'}`}>
        {/* Chevron icon */}
      </svg>
    </button>

    {/* Overlay Popup - Positioned ABOVE the button (bottom-full) */}
    {isQuickActionsExpanded && (
      <div className="absolute bottom-full left-0 right-0 mb-2 z-50 animate-fade-in">
        <div className="grid grid-cols-2 gap-2 p-3 
                        rounded-xl bg-[#1C1C1C]/95 backdrop-blur-md 
                        border border-[#424242]/60 shadow-2xl">
          {[
            { text: "What's the latest gaming news?", shape: "✕" },
            { text: "Which games are releasing soon?", shape: "■" },
            { text: "What are the latest game reviews?", shape: "▲" },
            { text: "Show me the hottest new game trailers.", shape: "◯" }
          ].map((prompt) => (
            <button
              key={prompt.text}
              onClick={() => {
                setIsQuickActionsExpanded(false);
                onSuggestedPromptClick?.(prompt.text);
              }}
              className="px-3 py-3 rounded-xl 
                        bg-gradient-to-br from-[#1C1C1C] to-[#0F0F0F]
                        hover:from-[#252525] hover:to-[#1A1A1A]
                        border border-[#424242]/30 
                        hover:border-[#E53A3A]/50 transition-all"
            >
              <span className="text-lg text-[#E53A3A]">{prompt.shape}</span>
              <span className="text-xs text-[#E5E5E5]">{prompt.text}</span>
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

**Key Positioning:**
- `absolute bottom-full` - Popup appears ABOVE the button
- `z-50` - Appears above input area
- `animate-fade-in` - Smooth entrance
- Closes when sidebar opens (collision prevention)

---

## 📊 RESPONSIVE BREAKPOINTS

### Tailwind Breakpoints Used

| Breakpoint | Width | Context |
|-----------|-------|---------|
| **No prefix** | < 640px | Mobile (phones) |
| **sm:** | ≥ 640px | Small tablets |
| **md:** | ≥ 768px | Tablets |
| **lg:** | ≥ 1024px | Desktops |
| **xl:** | ≥ 1280px | Large desktops |

### Example Responsive Classes

```tsx
// Padding
p-3        // Mobile: 12px
sm:p-5     // Tablet: 20px
lg:p-6     // Desktop: 24px

// Font sizes
text-base  // Mobile: 16px
sm:text-lg // Tablet: 18px
md:text-xl // Desktop: 20px

// Avatar sizes
w-8 h-8         // Mobile: 32px
sm:w-9 sm:h-9   // Tablet: 36px

// Image max-width
w-64 h-48            // Mobile: 256px × 192px
sm:w-80 sm:h-60      // Tablet: 320px × 240px
```

---

## 📱 PWA-Specific Styling

### Safe Area Insets

**globals.css, Lines 24-40**

```css
@media (display-mode: standalone) {
  html, body {
    overflow: hidden !important;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height for mobile */
    position: fixed;
    width: 100%;
  }
  
  #root {
    padding-top: env(safe-area-inset-top, 0px);      /* Notch */
    padding-bottom: env(safe-area-inset-bottom, 0px); /* Home bar */
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}
```

### Mobile Chat Optimizations

**globals.css, Lines 618-650**

```css
/* Mobile-specific chat optimizations */
@media (max-width: 640px) {
  /* Use dynamic viewport height instead of fixed vh */
  .chat-container {
    height: 100dvh;
  }
  
  /* Prevent zoom on input focus */
  input[type="text"], 
  textarea {
    font-size: 16px;
  }
  
  /* Improve touch targets */
  button, .btn-icon {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Better spacing for mobile */
  .conversation-tab {
    padding: 12px;
  }
  
  /* Faster scrolling feel */
  .custom-scrollbar {
    -webkit-overflow-scrolling: touch;
  }
}
```

### Touch States

**globals.css, Lines 507-550**

```css
/* Touch-safe button states (no hover persistence on mobile) */
@media (pointer: coarse) {
  /* Mobile: Only active state, no hover */
  button {
    transition: background-color 0.15s ease;
  }
  
  button:active {
    transform: scale(0.95);
    opacity: 0.9;
  }
  
  button:not(:active):hover {
    /* No hover effect on mobile */
  }
}

@media (pointer: fine) {
  /* Desktop: Full hover and active states */
  button:hover {
    background-color: var(--hover-color);
  }
}
```

---

## ⌨️ Input Handling - Mobile vs Desktop

### Mobile (Touch)
- **Textarea:** Min 44px height (iOS touch target)
- **Font size:** 16px (prevents zoom on focus)
- **Enter behavior:** Shift+Enter for newline, Enter to send
- **Keyboard:** Native mobile keyboard

### Desktop
- **Textarea:** Min 44px, max 120px
- **Font size:** 16px (normalized)
- **Enter behavior:** Same as mobile
- **Keyboard:** Full keyboard support

### Code Example

**ChatInterface.tsx, Lines 1078-1095**

```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  // Shift+Enter for newline
  if (e.key === 'Enter' && e.shiftKey) {
    return; // Allow default newline behavior
  }

  // Enter to send (mobile and desktop)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(e as React.FormEvent);
  }
};

<textarea
  ref={textareaRef}
  value={message}
  onChange={handleValueChange}
  onKeyDown={handleKeyDown}
  placeholder="Type your message..."
  className="w-full px-4 sm:px-6 text-base text-[#F5F5F5]"
  style={{
    minHeight: '44px',
    maxHeight: '120px',
    lineHeight: '44px'
  }}
/>
```

---

## 🔄 State Management & Hooks

### Key State Variables

```tsx
// Messages and conversation
const [conversation, setConversation] = useState<Conversation | null>(null);
const [message, setMessage] = useState('');

// Image handling
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [queuedImage, setQueuedImage] = useState<string | null>(null);
const [isManualUploadMode, setIsManualUploadMode] = useState(false);

// UI state
const [isLoading, setIsLoading] = useState(false);
const [isFocused, setIsFocused] = useState(false);
const [isSubtabsExpanded, setIsSubtabsExpanded] = useState(false);
const [isQuickActionsExpanded, setIsQuickActionsExpanded] = useState(false);

// Profile banner
const [showProfileSetupBanner, setShowProfileSetupBanner] = useState(true);
```

### Auto-Scroll Hook

```tsx
useEffect(() => {
  const timeoutId = setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 200);
  return () => clearTimeout(timeoutId);
}, [conversation?.messages?.length]);
```

### Queued Image Hook

```tsx
useEffect(() => {
  if (queuedImage && isManualUploadMode) {
    setImagePreview(queuedImage);
    onImageQueued?.();
  }
}, [queuedImage, isManualUploadMode, onImageQueued]);
```

---

## 🎨 Color & Styling Reference

### Palette

| Element | Color | Hex |
|---------|-------|-----|
| **Background** | Dark Gray | `#0F0F0F` |
| **Surface** | Darker Gray | `#1C1C1C` |
| **Border** | Gray/Dark | `#424242` |
| **Accent** | Red/Orange | `#FF4D4D` / `#FFAB40` |
| **Primary Button** | Red Gradient | `#E53A3A` → `#D98C1F` |
| **Text Primary** | Light Gray | `#F5F5F5` |
| **Text Secondary** | Medium Gray | `#A3A3A3` |
| **Text Muted** | Dim Gray | `#666666` |

### Gradient Examples

```css
/* Primary Accent Gradient */
background: linear-gradient(135deg, #FF4D4D, #FFAB40);

/* Primary Button */
background: linear-gradient(to-right, #E53A3A, #D98C1F);

/* Subtle Hover */
background: linear-gradient(to-right, from-[#E53A3A]/10, to-transparent);
```

---

## 🧪 Testing Checklist

### Mobile Behavior

- [ ] Profile banner appears on load
- [ ] Banner can be dismissed
- [ ] Banner can be expanded to full modal
- [ ] Modal slides down with animation
- [ ] Progress bar updates on step change
- [ ] Auto-advance works after selection
- [ ] Body scroll disabled during modal
- [ ] Safe area padding applied (notch, home bar)

### Image Queued

- [ ] Image preview shows in input area
- [ ] Image can be removed with ✕ button
- [ ] Can add message with image
- [ ] Send button works with image only
- [ ] File input clears after submit

### AI Response

- [ ] Typing indicator appears
- [ ] Auto-scroll to latest message
- [ ] Input disabled during loading
- [ ] Stop button visible
- [ ] Stop button cancels request
- [ ] Feedback buttons appear after response
- [ ] Suggested prompts display

### Responsive

- [ ] Layout works at 320px width
- [ ] Layout works at 768px width
- [ ] Layout works at 1024px width
- [ ] Padding scales correctly
- [ ] Font sizes scale correctly
- [ ] Touch targets ≥ 44px × 44px
- [ ] No horizontal scroll

### Game Hub

- [ ] Quick actions button visible
- [ ] Expands above input (z-50)
- [ ] 2-column grid on mobile
- [ ] Closes when sidebar opens
- [ ] Prompts work correctly

---

## 📚 Component Dependencies

```
ChatInterface
├── ChatMessageComponent (Memoized)
│   ├── MarkdownRenderer
│   ├── SessionSummaryCard
│   ├── AIAvatar
│   ├── TTSControls
│   ├── SuggestedPrompts
│   └── DownloadIcon
├── TypingIndicator
├── ManualUploadToggle
├── ScreenshotButton
├── SubTabs
├── AIAvatar
├── StopIcon
├── SendIcon
└── ProfileSetupBanner (outside, in MainApp)
```

---

## 🔗 Related Files

- **Main UI:** `src/components/features/ChatInterface.tsx`
- **Profile Banner:** `src/components/ui/ProfileSetupBanner.tsx`
- **App Container:** `src/components/MainApp.tsx`
- **Styling:** `src/styles/globals.css`
- **Message Types:** `src/types/index.ts`
- **Utils:** `src/utils/pwaDetection.ts`

---

## 💡 Key Takeaways

1. **3-Section Layout:** Messages (flex-1) → SubTabs (flex-shrink-0) → Input (flex-shrink-0)
2. **Profile Banner:** Collapsed by default, expands to full-screen modal on mobile
3. **Image Preview:** Displays inside chat input form, not separate
4. **Loading State:** Typing indicator + disabled input + stop button
5. **Responsive:** Tailwind breakpoints (sm:, md:, lg:) adjust spacing, sizes, visibility
6. **PWA Safe Areas:** Uses `env(safe-area-inset-*)` for notches/home bar
7. **Mobile Touch:** 44px+ touch targets, 16px font size, no zoom on input focus
8. **Auto-Scroll:** Smooth scroll to bottom on new messages
9. **Accessibility:** ARIA labels, semantic HTML, keyboard navigation
10. **Performance:** Memoized message components, efficient re-renders

