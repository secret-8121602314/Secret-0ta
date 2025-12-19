# Otakon Connector - JavaScript Error Troubleshooting Guide

## 🚨 **Common JavaScript Errors & Solutions**

### **1. "electronAPI is not defined" Error**

**Error Message:**
```
Uncaught ReferenceError: electronAPI is not defined
```

**Cause:**
- Preload script not loading properly
- Context bridge not working
- Electron security settings blocking preload

**Solutions:**
1. **Check preload.js path in main.js:**
   ```javascript
   webPreferences: {
       nodeIntegration: false,
       contextIsolation: true,
       preload: path.join(__dirname, 'preload.js') // Verify this path
   }
   ```

2. **Verify preload.js exists:**
   ```bash
   ls -la preload.js
   ```

3. **Check Electron version compatibility:**
   ```json
   "devDependencies": {
       "electron": "^28.3.3"
   }
   ```

### **2. "Cannot read property of null" Errors**

**Error Message:**
```
Uncaught TypeError: Cannot read property 'addEventListener' of null
```

**Cause:**
- DOM elements not found
- Script running before DOM is loaded
- Missing HTML elements

**Solutions:**
1. **Use DOMContentLoaded event:**
   ```javascript
   document.addEventListener('DOMContentLoaded', () => {
       // Access DOM elements here
   });
   ```

2. **Add null checks:**
   ```javascript
   const button = document.getElementById('my-button');
   if (button) {
       button.addEventListener('click', handler);
   }
   ```

3. **Verify HTML element IDs:**
   ```html
   <button id="send-latest">Send Latest</button>
   ```

### **3. "ipcRenderer is not defined" Error**

**Error Message:**
```
Uncaught ReferenceError: ipcRenderer is not defined
```

**Cause:**
- Trying to use ipcRenderer directly in renderer
- Preload script not exposing API correctly

**Solutions:**
1. **Use window.electronAPI instead:**
   ```javascript
   // ❌ Wrong
   ipcRenderer.send('message');
   
   // ✅ Correct
   window.electronAPI.send('message');
   ```

2. **Check preload.js exposure:**
   ```javascript
   contextBridge.exposeInMainWorld('electronAPI', {
       send: (channel, data) => { /* ... */ },
       on: (channel, callback) => { /* ... */ }
   });
   ```

### **4. "Channel not allowed" Error**

**Error Message:**
```
Channel 'invalid-channel' is not allowed
```

**Cause:**
- Using unauthorized IPC channels
- Channel not in validChannels list

**Solutions:**
1. **Add channel to preload.js:**
   ```javascript
   const validChannels = [
       'ui-ready', 
       'disconnect-request', 
       'quit-app', 
       'force-reconnect', 
       'set-setting', 
       'send-from-buffer', 
       'get-buffer-info'
   ];
   ```

2. **Check channel names match exactly:**
   ```javascript
   // Must match exactly
   window.electronAPI.send('send-from-buffer', data);
   ```

### **5. "Cannot read property 'send' of undefined" Error**

**Error Message:**
```
Uncaught TypeError: Cannot read property 'send' of undefined
```

**Cause:**
- electronAPI not loaded
- Timing issue with script loading

**Solutions:**
1. **Add API availability check:**
   ```javascript
   if (typeof window.electronAPI === 'undefined') {
       console.error('electronAPI not found!');
       return;
   }
   ```

2. **Wait for API to be ready:**
   ```javascript
   const waitForAPI = () => {
       if (window.electronAPI) {
           initializeApp();
       } else {
           setTimeout(waitForAPI, 100);
       }
   };
   waitForAPI();
   ```

## 🔧 **Debugging Steps**

### **Step 1: Check Console Logs**
1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Look for red error messages
4. Check for missing element warnings

### **Step 2: Verify File Structure**
```
Otakon Connector v2.0/
├── main.js          ✅ Main process
├── preload.js       ✅ Preload script
├── renderer.js      ✅ Renderer script
├── index.html       ✅ HTML interface
└── package.json     ✅ Dependencies
```

### **Step 3: Test Individual Components**
1. **Test HTML:**
   ```bash
   # Open test.html in browser
   start test.html
   ```

2. **Test JavaScript syntax:**
   ```bash
   node -c renderer.js
   node -c preload.js
   node -c main.js
   ```

3. **Test Electron app:**
   ```bash
   npm start
   ```

### **Step 4: Check Dependencies**
```bash
# Verify all dependencies are installed
npm install

# Check for outdated packages
npm outdated

# Clear npm cache if needed
npm cache clean --force
```

## 🛠 **Quick Fixes**

### **Fix 1: Add Error Handling**
```javascript
// Add to renderer.js
window.addEventListener('error', (event) => {
    console.error('❌ JavaScript error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
});
```

### **Fix 2: Add Null Checks**
```javascript
// Before
element.addEventListener('click', handler);

// After
if (element) {
    element.addEventListener('click', handler);
}
```

### **Fix 3: Wait for DOM**
```javascript
// Before
const element = document.getElementById('my-element');

// After
document.addEventListener('DOMContentLoaded', () => {
    const element = document.getElementById('my-element');
    if (element) {
        // Use element
    }
});
```

### **Fix 4: Verify API Availability**
```javascript
// Add to renderer.js
if (typeof window.electronAPI === 'undefined') {
    console.error('❌ electronAPI not found! Check preload.js configuration.');
    return;
}
```

## 📱 **Common Issues by Platform**

### **Windows Issues**
- **Path separators**: Use `path.join()` for cross-platform compatibility
- **File permissions**: Run as administrator if needed
- **Antivirus**: Whitelist the app folder

### **macOS Issues**
- **Security settings**: Allow app in System Preferences > Security
- **Gatekeeper**: Right-click > Open if blocked
- **File paths**: Use absolute paths

### **Linux Issues**
- **Permissions**: Check file permissions (chmod +x)
- **Dependencies**: Install required system packages
- **Display server**: Ensure X11/Wayland compatibility

## 🔍 **Advanced Debugging**

### **Enable Verbose Logging**
```javascript
// Add to main.js
process.env.DEBUG = 'electron:*';
console.log('🔍 Debug mode enabled');

// Add to renderer.js
console.log('🔍 Renderer debug mode enabled');
```

### **Check IPC Communication**
```javascript
// Add to preload.js
console.log('📡 IPC channel setup:', {
    sendChannels: ['ui-ready', 'disconnect-request', 'quit-app'],
    listenChannels: ['set-code', 'set-status', 'load-settings']
});
```

### **Monitor DOM Changes**
```javascript
// Add to renderer.js
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        console.log('🔄 DOM changed:', mutation.type);
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
```

## 📞 **Getting Help**

### **Before Asking for Help**
1. ✅ Check console logs for errors
2. ✅ Verify all files exist and are correct
3. ✅ Test with minimal configuration
4. ✅ Check Electron version compatibility

### **Include in Bug Report**
- **Error message**: Exact error text
- **Console logs**: All console output
- **File contents**: Relevant code sections
- **System info**: OS, Electron version, Node version
- **Steps to reproduce**: What you did to cause the error

### **Common Solutions**
- **Restart the app**: Close and reopen
- **Clear cache**: Delete node_modules and reinstall
- **Update dependencies**: Run `npm update`
- **Check file paths**: Ensure all files are in correct locations

## 🎯 **Prevention Tips**

1. **Always use null checks** when accessing DOM elements
2. **Wait for DOM to load** before running scripts
3. **Verify API availability** before using electronAPI
4. **Use try-catch blocks** for error-prone operations
5. **Test incrementally** - add features one at a time
6. **Keep console logging** for debugging
7. **Validate HTML structure** matches JavaScript expectations

By following these troubleshooting steps, you should be able to resolve most JavaScript errors in the Otakon Connector app.

