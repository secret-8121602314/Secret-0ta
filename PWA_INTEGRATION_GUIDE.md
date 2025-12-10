# PWA Native Features - Quick Integration Guide

## 🎯 Quick Imports

```typescript
// Haptic Feedback
import { 
  hapticButton, 
  hapticMessageSent, 
  hapticSuccess, 
  hapticError,
  useHaptic 
} from '@/utils/hapticFeedback';

// Touch Interactions
import { 
  useRipple, 
  useLongPress, 
  showContextMenu 
} from '@/utils/touchInteractions';

// Keyboard Management
import { 
  scrollToInput, 
  dismissKeyboard 
} from '@/utils/keyboardManager';

// Landscape Viewer
import { showImageViewer } from '@/utils/landscapeImageViewer';

// Background Operations
import { 
  queueMessageForSync, 
  initBackgroundOperations 
} from '@/utils/backgroundOperations';
```

---

## ⚡ Common Patterns

### Button with Haptic + Ripple
```tsx
import { hapticButton } from '@/utils/hapticFeedback';
import { useRipple } from '@/utils/touchInteractions';

function MyButton() {
  const handleClick = useRipple(() => {
    hapticButton();
    // Your action here
  });

  return (
    <button onClick={handleClick} className="ripple-container">
      Click Me
    </button>
  );
}
```

### Tab Switch with Haptic
```tsx
import { hapticTabSwitch } from '@/utils/hapticFeedback';

function TabBar({ onTabChange }) {
  const handleTabClick = (tabId: string) => {
    hapticTabSwitch();
    onTabChange(tabId);
  };

  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className="tab-button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

### Modal with Haptic
```tsx
import { hapticModal } from '@/utils/hapticFeedback';

function MyModal({ onOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      hapticModal();
    }
  }, [isOpen]);

  return <div className="modal">...</div>;
}
```

### Long Press Context Menu
```tsx
import { useLongPress } from '@/utils/touchInteractions';
import { showContextMenu } from '@/utils/touchInteractions';

function MessageItem({ message }) {
  const longPressHandlers = useLongPress({
    onLongPress: (event) => {
      showContextMenu(event, {
        items: [
          { 
            icon: '📋', 
            label: 'Copy', 
            onClick: () => navigator.clipboard.writeText(message.content)
          },
          { 
            icon: '✏️', 
            label: 'Edit', 
            onClick: () => handleEdit(message.id)
          },
          { 
            icon: '🗑️', 
            label: 'Delete', 
            onClick: () => handleDelete(message.id),
            destructive: true
          },
        ],
      });
    },
    onClick: () => {
      // Normal click action
      handleNormalClick(message.id);
    },
  });

  return (
    <div 
      {...longPressHandlers}
      className="message-item long-press-target"
    >
      {message.content}
    </div>
  );
}
```

### Image Viewer
```tsx
import { showImageViewer } from '@/utils/landscapeImageViewer';

function ImageGallery({ images }) {
  const handleImageClick = (imageUrl: string) => {
    showImageViewer({
      imageUrl,
      alt: 'Game screenshot',
      allowLandscape: true,
      onClose: () => console.log('Viewer closed'),
    });
  };

  return (
    <div className="image-gallery">
      {images.map(img => (
        <img 
          key={img.id}
          src={img.url}
          onClick={() => handleImageClick(img.url)}
          className="cursor-pointer"
        />
      ))}
    </div>
  );
}
```

### Form Input with Keyboard Management
```tsx
// Keyboard management is automatic, but you can enhance it:

function MessageInput() {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleFocus = () => {
    // Auto-scroll is handled automatically
    // But you can manually trigger if needed:
    // scrollToInput(inputRef.current!);
  };

  return (
    <textarea
      ref={inputRef}
      onFocus={handleFocus}
      inputMode="text"
      enterKeyHint="send"
      placeholder="Type your message..."
    />
  );
}
```

### Message Send with Success Haptic
```tsx
import { hapticMessageSent, hapticError } from '@/utils/hapticFeedback';

function ChatInput({ onSend }) {
  const handleSubmit = async (message: string) => {
    try {
      await onSend(message);
      hapticMessageSent(); // Success vibration
    } catch (error) {
      hapticError(); // Error vibration
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Background Message Sync
```tsx
import { queueMessageForSync } from '@/utils/backgroundOperations';

async function sendMessage(chatId: string, content: string) {
  if (!navigator.onLine) {
    // Queue for background sync
    const messageId = queueMessageForSync(chatId, content);
    console.log('Message queued for sync:', messageId);
    return;
  }

  // Send normally
  await api.sendMessage(chatId, content);
}
```

### useHaptic Hook
```tsx
import { useHaptic } from '@/utils/hapticFeedback';

function MyComponent() {
  const haptic = useHaptic();

  const handleSuccess = () => {
    haptic.success(); // Success pattern
  };

  const handleError = () => {
    haptic.error(); // Error pattern
  };

  const handleButton = () => {
    haptic.button(); // Light tap
  };

  return (
    <div>
      <button onClick={handleButton}>Button</button>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
    </div>
  );
}
```

---

## 🎨 CSS Classes to Use

### Touch Feedback
```tsx
<button className="touch-feedback">
  Button with expanding circle feedback
</button>
```

### Ripple Container
```tsx
<button className="ripple-container">
  Button with Material Design ripple
</button>
```

### Card Pressable
```tsx
<div className="card-pressable">
  Card that scales down on press
</div>
```

### Long Press Target
```tsx
<div className="long-press-target">
  Shows red outline animation on long press
</div>
```

### Tab Button
```tsx
<button className="tab-button" role="tab">
  Tab with press animation
</button>
```

---

## 🔒 PWA Detection

```typescript
import { isRunningAsPWA } from '@/utils/pwaDetection';

if (isRunningAsPWA()) {
  // Only in PWA standalone mode
  hapticButton();
}
```

---

## 📱 Input Modes

Set correct keyboard types:

```tsx
// Email keyboard
<input type="email" inputMode="email" enterKeyHint="next" />

// Phone keyboard
<input type="tel" inputMode="tel" enterKeyHint="done" />

// Number keyboard
<input type="number" inputMode="numeric" enterKeyHint="done" />

// URL keyboard
<input type="url" inputMode="url" enterKeyHint="go" />

// Search keyboard
<input type="search" inputMode="search" enterKeyHint="search" />

// Message input (shows send button on keyboard)
<textarea inputMode="text" enterKeyHint="send" />
```

---

## ⚠️ Important Notes

1. **All haptic functions are PWA-only** - They do nothing in browser mode
2. **Landscape viewer auto-initializes** - Just click any image > 100x100px
3. **Keyboard manager is automatic** - Focus any input and it scrolls into view
4. **Background operations start on PWA load** - No manual initialization needed
5. **CSS classes only work in PWA** - They're scoped to `@media (display-mode: standalone)`

---

## 🚀 Testing

### In Browser
- Haptic functions: ❌ No effect (by design)
- Touch interactions: ❌ No ripple/press effects
- Everything else: ✅ Works normally

### In PWA (Standalone)
- Haptic functions: ✅ Vibrates on supported devices
- Touch interactions: ✅ Full ripple/press effects
- Keyboard: ✅ Smooth auto-scroll
- Landscape: ✅ Auto-rotation on image view
- Background: ✅ Audio continues, sync works

### How to Test PWA
1. Build: `npm run build`
2. Serve: `npm run preview`
3. Open in mobile browser
4. Install as PWA (Add to Home Screen)
5. Open from home screen (standalone mode)
6. All features should work!

---

## 🎯 Next Steps for Integration

1. **Add haptics to all CTA buttons**
   ```tsx
   import { hapticButton } from '@/utils/hapticFeedback';
   <button onClick={() => { hapticButton(); doAction(); }}>
   ```

2. **Add ripples to all buttons**
   ```tsx
   import { useRipple } from '@/utils/touchInteractions';
   const handleClick = useRipple(doAction);
   <button onClick={handleClick} className="ripple-container">
   ```

3. **Add long-press to list items**
   ```tsx
   import { useLongPress } from '@/utils/touchInteractions';
   const longPress = useLongPress({ onLongPress: showMenu });
   <div {...longPress} className="long-press-target">
   ```

4. **Mark images for landscape**
   ```tsx
   // Automatic! Just ensure images are > 100x100px
   // To exclude an image:
   <img src="icon.png" data-no-viewer />
   ```

5. **Test on real device**
   - Build and deploy
   - Install PWA
   - Test all interactions

---

## 📞 Support

All features are documented in `PWA_NATIVE_FEATURES_COMPLETE.md`.

For bugs or questions, check:
- `src/utils/hapticFeedback.ts` - Haptic patterns
- `src/utils/touchInteractions.ts` - Touch utilities
- `src/utils/keyboardManager.ts` - Keyboard handling
- `src/utils/backgroundOperations.ts` - Background sync
- `src/utils/landscapeImageViewer.ts` - Image viewer

Happy coding! 🚀
