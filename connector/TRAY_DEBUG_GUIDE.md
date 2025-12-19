# 🔍 **System Tray Debugging Guide**

## **Step 1: Check Windows Notification Area Settings**

The most common reason tray icons don't appear is Windows notification area settings:

1. **Right-click on the taskbar** (bottom bar)
2. **Select "Taskbar settings"**
3. **Scroll down to "Notification area"**
4. **Click "Select which icons appear on the taskbar"**
5. **Look for "Otagon Connector" or "Electron"**
6. **Make sure it's set to "On"**

## **Step 2: Check Windows Notification Area (Alternative Method)**

1. **Click the "Show hidden icons" arrow** (^) in the system tray
2. **Look for your app icon there**
3. **If you see it, drag it to the main tray area**

## **Step 3: Check Console Output**

Look for these debug messages in your console:

```
🔧 Creating system tray with icon path: C:\...\build\icon.ico
🔍 Checking icon file existence...
🔍 Icon path: C:\...\build\icon.ico
🔍 File exists: true
✅ Using ICO icon: C:\...\build\icon.ico
✅ System tray created successfully
🔍 Tray object: [object Object]
🔍 Tray isDestroyed: false
🔍 Platform: win32
✅ Tray tooltip and context menu set successfully
✅ System tray setup completed successfully
🔄 Windows: Forced tray icon visibility
🔄 Windows: Delayed tray visibility check
```

## **Step 4: Test Tray Interactions**

Even if you can't see the icon, try these:

1. **Look in the "Show hidden icons" area** (^ arrow)
2. **Try clicking where the icon should be**
3. **Try right-clicking where the icon should be**

## **Step 5: Alternative Solutions**

If the icon still doesn't appear:

### **Option A: Use PNG Instead of ICO**
- Sometimes Windows has issues with ICO files
- The app will automatically fallback to PNG if ICO fails

### **Option B: Check Icon File**
- Make sure `build/icon.ico` exists
- Make sure `build/icon.png` exists as backup

### **Option C: Windows Version**
- Some Windows versions have different tray behaviors
- Windows 11 has different notification area settings

## **Step 6: Manual Test**

Try this simple test:
1. **Close the app completely**
2. **Run `npm start` again**
3. **Watch the console output carefully**
4. **Look for any error messages**

## **Common Issues:**

1. **Icon hidden by Windows**: Most common issue
2. **Icon file not found**: Check console for file path errors
3. **Windows notification area settings**: Icon set to "Off"
4. **High DPI display issues**: Icon too small to see
5. **Windows version compatibility**: Some versions hide icons by default

## **Next Steps:**

If you still don't see the icon after checking Windows settings, let me know:
1. What you see in the console output
2. Whether you checked the Windows notification area settings
3. If you see any error messages
4. What Windows version you're using


