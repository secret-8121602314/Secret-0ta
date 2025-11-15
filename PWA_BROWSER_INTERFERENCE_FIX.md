# PWA Browser Interference Fix

## Issues Fixed

### 1. **PWA Opens When Logging in Browser**
**Problem**: When logged into PWA and then logging into browser, the OAuth callback would trigger the service worker's notification handler which always calls `clients.openWindow()`, forcing the PWA to open.

**Solution**: Modified `public/sw.js` notification click handler to:
- First try to focus an existing client window
- Only open a new window if no existing client is found
- This prevents forcing PWA to open when browser is already active

### 2. **UI Overflow Issues in PWA**
**Problem**: PWA mode was adding `safe-area-inset` padding to `body`, causing:
- Space at top blocking UI
- Space at bottom causing overflow
- Content scrolling out of bounds

**Solution**: Modified `src/styles/globals.css` to:
- Move safe-area padding from `body` to `#root` element
- Add `overflow-x: hidden` to `html, body` to prevent horizontal scroll
- Add explicit `padding: 0 !important` to body in PWA mode
- Set proper width/height constraints on html/body

### 3. **OAuth Logging Context**
**Solution**: Added logging in `src/App.tsx` to track which context (PWA or Browser) OAuth completes in, helping debug future issues.

## Changes Made

### `public/sw.js`
```javascript
// OLD: Always opened new window
clients.openWindow(`${BASE_PATH}/`)

// NEW: Focuses existing window first
clients.matchAll({ type: 'window', includeUncontrolled: true })
  .then(clientList => {
    for (let client of clientList) {
      if (client.url.includes(BASE_PATH) && 'focus' in client) {
        return client.focus(); // Focus instead of opening new
      }
    }
    return clients.openWindow(`${BASE_PATH}/`); // Only if no existing
  })
```

### `src/styles/globals.css`
```css
/* OLD: Padding on body caused overflow */
@media (display-mode: standalone) {
  body {
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    /* ... */
  }
}

/* NEW: Padding on #root, body has none */
@media (display-mode: standalone) {
  #root {
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    /* ... */
  }
  body {
    padding: 0 !important;
  }
}

/* NEW: Prevent body overflow */
html, body {
  overflow-x: hidden;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
```

## Testing

1. **Test PWA Not Opening from Browser**:
   - Install PWA and login
   - Open browser tab, login
   - Verify browser tab continues, PWA doesn't steal focus

2. **Test UI Not Overflowing in PWA**:
   - Open installed PWA
   - Check no space at top blocking UI
   - Check no space at bottom
   - Verify scrolling works normally

3. **Test Both Contexts Work Independently**:
   - Can use browser while PWA is installed
   - Can use PWA while browser is open
   - Each maintains its own session

## Root Causes

1. **Service Worker Aggressiveness**: Service workers are powerful but can interfere with normal browser behavior. The `clients.openWindow()` API will always prefer opening/focusing a PWA if available.

2. **Safe-Area Padding Location**: iOS safe-area insets need to be applied to the content container (#root), not the body element, to prevent double padding and overflow issues.

3. **No Context Awareness**: The OAuth flow didn't distinguish between being called from browser vs PWA, causing cross-contamination.

## Prevention

- Always focus existing clients before opening new windows in service workers
- Apply safe-area insets to content containers, not body/html
- Log context (PWA/Browser) in auth flows for debugging
- Test both PWA and browser contexts separately when implementing auth features
