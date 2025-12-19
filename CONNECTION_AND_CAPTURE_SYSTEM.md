# Otagon Connector - Connection & Capture System Documentation

## Overview
This document explains how the Otagon Desktop Connector establishes connection with the mobile app and how screenshot captures (single and multishot) are handled.

---

## 🔌 Connection System

### Connection Architecture
The desktop connector uses a **WebSocket relay server** to communicate with the mobile app. The system employs a **6-digit code pairing** mechanism.

```
Desktop Connector ←→ WebSocket Relay Server ←→ Mobile App
                    (wss://otakon-relay.onrender.com)
```

### Connection Flow

#### 1. **Desktop Connector Initialization**
```javascript
// Location: main.js - Line 296
const connectWebSocket = () => {
    ws = new WebSocket(connectionUrl);
}
```

**Steps:**
1. App generates a unique 6-digit connection code using cryptographic hash
2. Code combines multiple entropy sources:
   - High-precision timestamp (milliseconds)
   - Cryptographically secure random bytes
   - Hardware-specific identifiers (hostname, platform, architecture)
3. Connection URL is constructed: `wss://otakon-relay.onrender.com?code={6-digit-code}`

#### 2. **WebSocket Connection Events**

**Event: `open`** - Successfully connected to relay server
```javascript
ws.on('open', () => {
    console.log('✅ Connected to relay server. Waiting for client...');
    clientConnected = false;
    // Start heartbeat to prevent timeout
    startHeartbeat();
})
```

**Event: `partner_connected`** - Mobile app connected using the same code
```javascript
if (message.type === 'partner_connected') {
    console.log('🎉 Client connected! Ready for screenshots.');
    clientConnected = true;
    // UI updates to show "Client Connected" status
}
```

**Event: `partner_disconnected`** - Mobile app disconnected
```javascript
if (message.type === 'partner_disconnected') {
    console.log('👋 Client disconnected. Waiting for reconnection...');
    clientConnected = false;
    // UI updates to show "Waiting for Client..." status
}
```

#### 3. **Connection Maintenance**

**Heartbeat System** - Prevents timeout by sending periodic pings
```javascript
// Sends heartbeat every 15 seconds
const HEARTBEAT_INTERVAL = 15000;

const startHeartbeat = () => {
    heartbeatInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'ping',
                timestamp: Date.now()
            }));
        }
    }, HEARTBEAT_INTERVAL);
}
```

**Automatic Reconnection** - Multiple systems ensure persistent connection:
- **Persistent Reconnection Check**: Every 10 seconds
- **Always-Connected System**: Verifies connection every 10 seconds
- **Connection Monitor**: Checks health every 5 seconds
- **Network Status Monitor**: Attempts reconnection every 30 seconds

**Reconnection Parameters:**
```javascript
const RECONNECT_INTERVAL = 1000;        // 1 second base interval
const MAX_RECONNECT_ATTEMPTS = 50;      // Maximum retry attempts
const MAX_RECONNECT_DELAY = 30000;      // Maximum 30 second delay
const CONNECTION_TIMEOUT = 30000;       // 30 second connection timeout
```

---

## 📸 Screenshot Capture System

### Capture Modes

The connector supports **two capture modes**:

1. **Single Shot** - Captures one screenshot
2. **Multi-Shot** - Captures multiple screenshots in sequence

### Display Selection
```javascript
// User can select which display/monitor to capture from
let selectedDisplayIndex = 0;  // Default: Primary display
let availableDisplays = [];     // All detected displays
```

---

## 📸 Single Shot Capture

### Trigger Methods

#### Method 1: Hotkey Press (Default: F1)
```javascript
// Registered in: main.js - registerHotkeys()
globalShortcut.register(getHotkeySingle(), async () => {
    // Capture single screenshot
    await captureSingleScreenshot('high');
});
```

#### Method 2: Remote Request from Mobile App
```javascript
// Triggered when mobile app sends screenshot_request message
ws.on('message', (messageBuffer) => {
    const message = JSON.parse(messageBuffer.toString());
    if (message.type === 'screenshot_request') {
        handleScreenshotRequest(message);
    }
});
```

### Single Shot Capture Process

**Step 1: Validation**
```javascript
// Check if displays are detected
if (!availableDisplays || availableDisplays.length === 0) {
    throw new Error('Displays not detected');
}

// Validate selected display index
if (selectedDisplayIndex < 0 || selectedDisplayIndex >= availableDisplays.length) {
    selectedDisplayIndex = 0;
}
```

**Step 2: Capture Screenshot**
```javascript
const captureSingleScreenshot = async (quality = 'high') => {
    // Get screen sources using Electron's desktopCapturer
    const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: getThumbnailSize(quality)  // Resolution based on quality
    });
    
    // Select the correct display
    const sourceIndex = (selectedDisplayIndex < sources.length) ? 
                        selectedDisplayIndex : 0;
    const selectedSource = sources[sourceIndex];
    
    // Convert to base64 data URL
    const screenshot = selectedSource.thumbnail.toDataURL();
    
    // ALWAYS add to buffer first
    addToBuffer(screenshot);
    
    return screenshot;
}
```

**Quality Settings:**
```javascript
const getThumbnailSize = (quality = 'high') => {
    switch (quality) {
        case 'low':    return { width: 1280, height: 720 };
        case 'medium': return { width: 1600, height: 900 };
        case 'high':   return { width: 1920, height: 1080 };  // Default
        case 'ultra':  return { width: 2560, height: 1440 };
    }
}
```

**Step 3: Buffer Storage**
```javascript
const addToBuffer = (screenshot) => {
    screenshotBuffer.push({
        data: screenshot,         // Base64 image data
        timestamp: Date.now()     // Capture timestamp
    });
    
    // Keep only latest MAX_BUFFER_SIZE screenshots (default: 50)
    if (screenshotBuffer.length > MAX_BUFFER_SIZE) {
        screenshotBuffer.shift();
    }
}
```

**Step 4: Send to Mobile App**
```javascript
// Get latest screenshot from buffer
const bufferScreenshots = getBufferScreenshots();
const latestScreenshot = bufferScreenshots[bufferScreenshots.length - 1];

// Send via WebSocket
sendPayload([latestScreenshot], 'screenshot-single');
```

---

## 📸 Multi-Shot Capture

### Trigger Methods

#### Method 1: Hotkey Press (Default: F2)
```javascript
// Only works if multiShotCapture is enabled in settings
globalShortcut.register(getHotkeyMulti(), async () => {
    if (!store.get('multiShotCapture')) {
        showNotification('Otagon Connector', 
            '⚠️ Multi-shot is disabled. Enable it in Settings.');
        return;
    }
    await captureMultiScreenshot(3, 500, 'high');
});
```

#### Method 2: Remote Request from Mobile App
```javascript
// Mobile app sends request with custom parameters
{
    type: 'screenshot_request',
    mode: 'multi',
    count: 5,        // Number of screenshots
    quality: 'high'  // Image quality
}
```

### Multi-Shot Capture Process

**Step 1: Validation**
```javascript
// Check if multi-shot is enabled
if (!store.get('multiShotCapture')) {
    throw new Error('Multi-shot is disabled');
}

// Validate displays
if (!availableDisplays || availableDisplays.length === 0) {
    throw new Error('Displays not detected');
}
```

**Step 2: Sequential Capture**
```javascript
const captureMultiScreenshot = async (count = 3, delay = 500, quality = 'high') => {
    const screenshots = [];
    
    // Capture multiple screenshots in sequence
    for (let i = 0; i < count; i++) {
        // Get screen sources
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: getThumbnailSize(quality)
        });
        
        // Select display and capture
        const sourceIndex = (selectedDisplayIndex < sources.length) ? 
                            selectedDisplayIndex : 0;
        const screenshot = sources[sourceIndex].thumbnail.toDataURL();
        
        // Add to buffer immediately
        addToBuffer(screenshot);
        screenshots.push(screenshot);
        
        // Delay between captures (except last one)
        if (i < count - 1 && delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    return screenshots;
}
```

**Default Parameters:**
- **Count**: 3 screenshots
- **Delay**: 500ms between each capture
- **Quality**: High (1920x1080)

**Step 3: Send to Mobile App**
```javascript
// Send all captured screenshots
sendPayload(screenshots, 'screenshot-multi');
```

---

## 📦 Buffer System

### Purpose
All screenshots are **ALWAYS** stored in a buffer before sending. This provides:
- **Reliability**: Screenshots are saved even if connection drops
- **Flexibility**: Can resend screenshots without recapturing
- **History**: Access to recent captures

### Buffer Configuration
```javascript
const MAX_BUFFER_SIZE = 50;          // Maximum screenshots in buffer
const RETENTION_TIME = 3600000;      // 1 hour retention (milliseconds)
const CAPTURE_INTERVAL = 60000;      // Background capture every 60 seconds
```

### Buffer Operations

**Adding to Buffer:**
```javascript
addToBuffer(screenshot)  // Automatically adds timestamp
```

**Retrieving from Buffer:**
```javascript
getBufferScreenshots()   // Returns all screenshots in buffer
```

**Sending from Buffer:**
```javascript
// Send latest N screenshots
sendFromBuffer(count, 'latest')

// Send all screenshots
sendFromBuffer(null, 'all')

// Send range of screenshots
sendFromBuffer(count, 'range')
```

**Background Capture:**
```javascript
// If buffer is enabled, captures screenshot every minute
if (store.get('enableBuffer')) {
    startBackgroundCapture();
}
```

---

## 📡 Sending Screenshots to Mobile App

### Message Protocol

All communication uses **JSON messages** over WebSocket:

#### Single Shot Message
```javascript
{
    type: 'screenshot-single',
    payload: {
        images: [
            "data:image/png;base64,iVBORw0KGg..."  // Base64 image
        ]
    }
}
```

#### Multi-Shot Message
```javascript
{
    type: 'screenshot-multi',
    payload: {
        images: [
            "data:image/png;base64,iVBORw0KGg...",  // Screenshot 1
            "data:image/png;base64,iVBORw0KGg...",  // Screenshot 2
            "data:image/png;base64,iVBORw0KGg..."   // Screenshot 3
        ]
    }
}
```

#### Success Response
```javascript
{
    type: 'screenshot_success',
    success: {
        mode: 'single',           // or 'multi', 'buffer'
        count: 1,                 // Number of screenshots sent
        timestamp: 1702998234567,
        details: {
            quality: 'high',
            addedToBuffer: true,
            displayIndex: 0
        }
    }
}
```

#### Error Response
```javascript
{
    type: 'screenshot_error',
    error: {
        type: 'Screenshot capture failed',
        details: 'No screen sources available',
        timestamp: 1702998234567
    }
}
```

### Send Function
```javascript
const sendPayload = (images, messageType = 'screenshot-multi') => {
    // Validate WebSocket is connected
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log('❌ Cannot send: Not connected');
        return;
    }
    
    // Create payload
    const payload = {
        type: messageType,
        payload: {
            images: images  // Array of base64 image strings
        }
    };
    
    // Send via WebSocket
    ws.send(JSON.stringify(payload));
}
```

---

## 🔄 Complete Flow Diagrams

### Single Shot Flow (Hotkey Triggered)
```
User Presses F1
    ↓
captureSingleScreenshot()
    ↓
Validate displays
    ↓
desktopCapturer.getSources()
    ↓
Select display (selectedDisplayIndex)
    ↓
Convert to base64 data URL
    ↓
addToBuffer(screenshot)
    ↓
getBufferScreenshots()
    ↓
sendPayload([latest], 'screenshot-single')
    ↓
ws.send(JSON message)
    ↓
Mobile App Receives Screenshot
```

### Single Shot Flow (Mobile Requested)
```
Mobile App Sends:
{type: 'screenshot_request', mode: 'single'}
    ↓
ws.on('message') receives request
    ↓
handleScreenshotRequest(message)
    ↓
captureSingleScreenshot(quality)
    ↓
[Same capture process as above]
    ↓
sendPayload([latest], 'screenshot-single')
    ↓
sendSuccessResponse('single', 1, details)
    ↓
Mobile App Receives Screenshot + Success Response
```

### Multi-Shot Flow (Hotkey Triggered)
```
User Presses F2
    ↓
Check if multiShotCapture enabled
    ↓
captureMultiScreenshot(3, 500, 'high')
    ↓
FOR i = 0 to count-1:
    ↓
    Validate displays
    ↓
    desktopCapturer.getSources()
    ↓
    Select display
    ↓
    Convert to base64
    ↓
    addToBuffer(screenshot)
    ↓
    screenshots.push(screenshot)
    ↓
    IF not last: wait delay ms
    ↓
END FOR
    ↓
sendPayload(screenshots, 'screenshot-multi')
    ↓
ws.send(JSON message)
    ↓
Mobile App Receives All Screenshots
```

### Connection Flow
```
Desktop App Starts
    ↓
Generate 6-digit code (crypto hash)
    ↓
connectWebSocket()
    ↓
ws = new WebSocket(wss://relay?code=123456)
    ↓
ws.on('open') → "Connected to Relay"
    ↓
Display code to user
    ↓
User enters code in Mobile App
    ↓
Mobile App connects to same relay with code
    ↓
Relay sends 'partner_connected' message
    ↓
Desktop receives → clientConnected = true
    ↓
UI shows "Client Connected" ✅
    ↓
Start heartbeat (every 15s)
    ↓
Ready to send screenshots!
```

---

## 🔧 Key Configuration Settings

### User Configurable
- **Single Shot Hotkey**: Default F1 (customizable)
- **Multi-Shot Hotkey**: Default F2 (customizable)
- **Enable Multi-Shot**: Toggle on/off
- **Enable Buffer**: Toggle background capture on/off
- **Selected Display**: Choose which monitor to capture
- **Run at Startup**: Auto-start connector
- **Close to Tray**: Minimize to system tray

### System Constants
```javascript
RELAY_URL = 'wss://otakon-relay.onrender.com'
HEARTBEAT_INTERVAL = 15000          // 15 seconds
CONNECTION_TIMEOUT = 30000          // 30 seconds
MAX_BUFFER_SIZE = 50                // 50 screenshots
RETENTION_TIME = 3600000            // 1 hour
```

---

## 🛡️ Error Handling

### Connection Errors
- **ECONNRESET**: Connection reset by server → Auto-reconnect
- **ECONNREFUSED**: Connection refused → Retry with backoff
- **Timeout**: No response in 30s → Close and reconnect

### Capture Errors
- **No displays detected**: Show notification, prevent capture
- **Invalid display index**: Reset to primary display (index 0)
- **Multi-shot disabled**: Show notification, guide user to settings

### WebSocket State Validation
Every send operation checks:
```javascript
if (!ws || ws.readyState !== WebSocket.OPEN) {
    // Cannot send - handle gracefully
}
```

---

## 📊 Message Types Summary

### Desktop → Relay → Mobile
- `screenshot-single` - Single screenshot data
- `screenshot-multi` - Multiple screenshots data
- `screenshot_success` - Capture success confirmation
- `screenshot_error` - Capture error notification
- `ping` - Heartbeat keepalive

### Mobile → Relay → Desktop
- `screenshot_request` - Request screenshot capture
- `partner_connected` - Mobile app connected
- `partner_disconnected` - Mobile app disconnected
- `pong` - Heartbeat response

### Internal/System
- `connection_verify` - Verify connection active
- `health_check` - Check connection health
- `connection_alive` - Keepalive check
- `wake_check` - System wake verification
- `focus_check` - App focus verification

---

## 🎯 Critical Features

### ✅ Always Buffer First
**Every screenshot is added to buffer before sending** - this ensures no data loss if connection drops during capture.

### ✅ Automatic Reconnection
Multiple independent systems monitor and restore connection automatically.

### ✅ Display Selection
Users can choose which monitor to capture from (useful for multi-monitor setups).

### ✅ Quality Control
Adjustable quality settings balance image clarity with file size.

### ✅ Persistent Connection
Heartbeat and health checks maintain stable relay connection.

---

## 📝 Storage Locations

### Electron Store (User Settings)
Stored in: `%APPDATA%/otagon-connector/config.json` (Windows)

Contains:
- Hotkey configurations
- Connection code
- Buffer enable/disable
- Multi-shot enable/disable
- Display selection
- Auto-start settings

### In-Memory Buffer
Screenshots stored in RAM:
```javascript
let screenshotBuffer = [];  // Array of {data, timestamp}
```

**Note**: Buffer is cleared when app closes unless persisted.

---

## 🚀 Initialization Sequence

```
1. App Starts
2. Load user settings from electron-store
3. Generate connection code
4. Initialize WebSocket connection
5. Detect available displays
6. Register global hotkeys
7. Start background capture (if enabled)
8. Start heartbeat system
9. Start connection monitors
10. Display UI with connection code
11. Wait for mobile app to connect
12. Ready to capture! 📸
```

---

## 📞 Support & Troubleshooting

### Common Issues

**"Displays not detected"**
- Wait a few seconds after app start
- App needs time to enumerate displays

**"Multi-shot is disabled"**
- Enable in Settings → Multi-Shot Capture checkbox

**"Client not connected"**
- Check connection code matches on mobile app
- Verify internet connection
- Check WebSocket relay is accessible

**Hotkey not working**
- Another app may be using the same hotkey
- Change hotkey in Settings
- Restart app after changing

---

*Generated: December 19, 2025*
*Otagon Desktop Connector v2.0*
