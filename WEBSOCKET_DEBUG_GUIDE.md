# WebSocket Connection Debug Guide

## Problem Analysis

Based on your console logs, the WebSocket connection is **NOT being established** even though the UI shows "Connected". Here's why:

### Missing Log Messages

Your logs should show (but don't):
```
🔗 [App] Connecting with code: 123456
🔗 [WebSocket] Connection opened successfully
🔗 [App] WebSocket connection opened, waiting for PC client response...
```

Instead, your logs only show:
- App initialization
- User data loading
- Conversations loading
- **NO connection-related logs**

### Root Cause

The `handleConnect(code)` function in `App.tsx` is **never being called** when you enter the code and click "Connect".

## Solution Steps

### Step 1: Verify Connection Modal Wiring

Check that the ConnectionModal is properly calling the `onConnect` prop:

1. Open browser DevTools → Console
2. Enter a 6-digit code in the connection modal
3. Click "Connect"
4. **You should see:** `🔗 [App] Connecting with code: XXXXXX`
5. **If you don't see this**, the ConnectionModal's connect button is not calling `onConnect`

### Step 2: Check ConnectionModal Implementation

The ConnectionModal should have code like:

```typescript
<button onClick={() => onConnect(enteredCode)}>
  Connect
</button>
```

Run this in browser console to test manually:
```javascript
// Find the connection handler
const appElement = document.querySelector('[data-app-root]');
// Manually trigger connection
window.testConnect = (code) => {
  console.log('Manual connection test with code:', code);
  // This should trigger the App's handleConnect
};
```

### Step 3: Test WebSocket Service Directly

Run this in browser console to bypass the UI:

```javascript
import('./services/websocketService').then(({ connect }) => {
  console.log('Testing WebSocket connection directly...');
  
  connect(
    '123456', // Replace with your actual code
    () => console.log('✅ WebSocket opened!'),
    (data) => console.log('📨 Message:', data),
    (error) => console.error('❌ Error:', error),
    () => console.log('🔌 Closed')
  );
});
```

### Step 4: Enable All WebSocket Logs

The WebSocket service now has comprehensive logging enabled. After connecting, you should see:

```
🔗 [WebSocket] Connection opened successfully to wss://otakon-relay.onrender.com/123456
🔗 [WebSocket] Sent connection_request with code: 123456
🔗 [WebSocket] Message received: { type: 'connection_alive', ... }
📸 [App] Message received: { type: 'connection_alive', ... }
```

### Step 5: Test PC Client Message Format

When you press F1 on your PC client, it should send:

```json
{
  "type": "screenshot",
  "dataUrl": "data:image/png;base64,iVBORw0KG..."
}
```

The app now handles this format correctly (added in this fix).

## Testing Checklist

Run through these tests in order:

### Test 1: Manual Connection
```javascript
// In browser console:
localStorage.setItem('otakon_connection_code', '123456');
location.reload();
```

**Expected**: App should auto-reconnect on reload and show connection logs.

### Test 2: Connection Modal
1. Clear code: `localStorage.removeItem('otakon_connection_code')`
2. Reload page
3. Open connection modal
4. Enter 6-digit code
5. Click Connect

**Expected logs**:
```
🔗 [App] Connecting with code: 123456
🔗 [WebSocket] Connection opened successfully
```

### Test 3: PC Client Communication
1. Ensure PC client is running
2. PC client should connect to same code
3. Press F1 hotkey on PC

**Expected logs**:
```
🔗 [WebSocket] Message received: { type: 'screenshot', ... }
📸 [App] Single screenshot received from PC client
📸 [App] Forwarding screenshot to MainApp
📸 [MainApp] Processing screenshot: {...}
```

## Common Issues & Fixes

### Issue 1: No Connection Logs
**Symptom**: UI shows "Connected" but no logs appear
**Cause**: `handleConnect` never called
**Fix**: Check ConnectionModal button is wired to `onConnect` prop

### Issue 2: Connection Times Out
**Symptom**: Shows "No PC client found on this code" after 5 seconds
**Cause**: PC client not running or using wrong code
**Fix**: 
- Verify PC client is running
- Check PC client console for connection logs
- Ensure both use same 6-digit code

### Issue 3: Screenshots Not Processing
**Symptom**: Connection works but F1 hotkey does nothing
**Cause**: PC client sending wrong message format
**Fix**: PC client should send `{ type: 'screenshot', dataUrl: '...' }`

### Issue 4: "Screenshot handler not ready"
**Symptom**: Screenshot received but toast shows error
**Cause**: MainApp not mounted yet or ref not set
**Fix**: Wait for app to fully load before sending screenshots

## PC Client Requirements

Your PC client must:

1. **Connect to relay server**:
   ```
   wss://otakon-relay.onrender.com/{6-digit-code}
   ```

2. **Send connection confirmation**:
   ```json
   { "type": "connection_alive" }
   ```

3. **Send screenshots on F1**:
   ```json
   {
     "type": "screenshot",
     "dataUrl": "data:image/png;base64,iVBOR..."
   }
   ```

4. **Handle ping/pong**:
   - Respond to `{ "type": "ping" }` messages
   - Send periodic heartbeats

## Debug Commands

Run these in browser console for diagnostics:

```javascript
// Check if WebSocket exists
console.log('WebSocket support:', !!window.WebSocket);

// Check stored code
console.log('Stored code:', localStorage.getItem('otakon_connection_code'));

// Check if MainApp handler is registered
console.log('Has message handler:', typeof mainAppMessageHandlerRef?.current === 'function');

// Simulate screenshot message
if (mainAppMessageHandlerRef?.current) {
  mainAppMessageHandlerRef.current({
    type: 'screenshot',
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  });
}
```

## Success Criteria

Connection is working correctly when you see ALL of these logs:

1. `🔗 [App] Connecting with code: XXXXXX`
2. `🔗 [WebSocket] Connection opened successfully`
3. `🔗 [App] WebSocket connection opened`
4. `🔗 [WebSocket] Message received: { type: 'connection_alive' }`
5. `🔗 [App] ✅ PC client confirmed - connection established`

Screenshot processing works when you see:

1. `🔗 [WebSocket] Message received: { type: 'screenshot', hasDataUrl: true }`
2. `📸 [App] Single screenshot received from PC client`
3. `📸 [App] Forwarding screenshot to MainApp`
4. `📸 [MainApp] Processing screenshot:`
5. Screenshot appears in chat or queued for manual mode

## Next Steps

1. **Test the connection flow** using the checklist above
2. **Check PC client logs** to verify it's sending correct messages
3. **Share the console output** if issues persist
4. **Verify ConnectionModal** is calling `onConnect` properly

The WebSocket debugging is now fully enabled - you'll see detailed logs for every step of the connection and message flow.
