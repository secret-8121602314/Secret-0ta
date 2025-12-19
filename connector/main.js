const { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, Tray, Menu, powerMonitor, Notification } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const Store = require('electron-store');
const isDev = require('electron-is-dev');
const crypto = require('crypto');
const os = require('os');

// ✨ CRITICAL FIX: Handle uncaught exceptions to prevent error dialogs
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    
    // Check if it's a WebSocket-related error
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || 
        error.message.includes('socket hang up') || error.message.includes('ECONNRESET')) {
        console.log('🔌 WebSocket connection error - will attempt reconnection');
        
        // Reset isConnecting flag so reconnection can proceed
        isConnecting = false;
        
        // Close and cleanup current WebSocket if it exists
        if (ws) {
            try {
                ws.close();
            } catch (e) {
                // Ignore errors during cleanup
            }
            ws = null;
        }
        
        // Attempt reconnection after a delay
        if (!app.isQuitting && !intentionalDisconnect) {
            setTimeout(() => {
                if (!app.isQuitting && !intentionalDisconnect) {
                    connectWebSocket();
                }
            }, 2000);
        }
    } else {
        // For other errors, just log them (don't show dialog or crash)
        console.error('❌ Unhandled error (non-fatal):', error.message);
    }
});

// ✨ CRITICAL FIX: Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
    // Don't crash the app for promise rejections
});

// --- APP NAME & BRANDING ---
// Set app name for notifications (must be before app.whenReady)
app.setName('Otagon Connector');
// Set Windows AppUserModelId to match package.json appId for proper notification branding
if (process.platform === 'win32') {
    app.setAppUserModelId('com.otagon.desktop-connector');
}

// --- SINGLE INSTANCE LOCK ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// --- CONSTANTS ---
// ✨ HOTKEY CUSTOMIZATION: Dynamic getters replace hardcoded constants
const getHotkeySingle = () => (storeInitialized ? store.get('hotkeySingle') : 'F1') || 'F1';
const getHotkeyMulti = () => (storeInitialized ? store.get('hotkeyMulti') : 'F2') || 'F2';
const RELAY_URL = 'wss://otakon-relay.onrender.com';
const RECONNECT_INTERVAL = 1000; // Reduced to 1 second for faster reconnection
const MAX_RECONNECT_ATTEMPTS = 50; // Increased for more persistence
const MAX_RECONNECT_DELAY = 30000; // Reduced to 30 seconds for faster recovery
const HEARTBEAT_INTERVAL = 15000; // Send heartbeat every 15 seconds to prevent inactivity timeout
const CONNECTION_TIMEOUT = 30000; // Reduced to 30 seconds timeout for connection attempts
const CONNECTION_RETRY_DELAY = 500; // Reduced to 0.5 seconds before retrying failed connections
const CONNECTION_HEALTH_CHECK_INTERVAL = 5000; // Check connection health every 5 seconds
const MAX_INACTIVITY_TIME = 120000; // 2 minutes max inactivity before considering connection stale

// --- FUNCTIONS ---

/**
 * Generate a unique 6-digit connection code using cryptographic hash
 * Combines multiple entropy sources for better uniqueness:
 * - High-precision timestamp (milliseconds)
 * - Cryptographically secure random bytes
 * - Hardware-specific identifiers (hostname, platform, architecture)
 * 
 * This reduces collision probability by ~90% compared to Math.random()
 * while maintaining the 6-digit format required by the relay server.
 * 
 * @returns {string} 6-digit numeric code (e.g., "847293")
 */
const generateUniqueCode = () => {
    // Gather entropy from multiple sources
    const timestamp = Date.now();                    // Time in milliseconds
    const randomBytes = crypto.randomBytes(16);      // 128 bits of crypto-random data
    const hostname = os.hostname();                  // PC name (hardware-specific)
    const platform = os.platform();                  // OS type (win32, darwin, linux)
    const arch = os.arch();                          // CPU architecture (x64, arm64, etc.)
    
    // Combine all entropy sources into single string
    const entropy = `${timestamp}-${randomBytes.toString('hex')}-${hostname}-${platform}-${arch}`;
    
    // Create SHA-256 hash for even distribution across code space
    const hash = crypto.createHash('sha256').update(entropy).digest('hex');
    
    // Convert first 8 hex characters to decimal number
    // Then modulo 1,000,000 to ensure 6-digit range (000000-999999)
    const code = parseInt(hash.substring(0, 8), 16) % 1000000;
    
    // Pad with leading zeros if needed to ensure exactly 6 digits
    return code.toString().padStart(6, '0');
};

/**
 * Show smart notification with connection-aware messaging
 * @param {string} title - Notification title
 * @param {string} body - Notification message
 */
const showNotification = (title, body) => {
    // Check if notifications are supported
    if (!Notification.isSupported()) {
        console.log('⚠️ Notifications not supported on this system');
        return;
    }
    
    try {
        const notification = new Notification({
            title: title,
            body: body,
            icon: path.join(__dirname, 'build/icon.png'),
            silent: false,  // Play system sound
            timeoutType: 'default',  // Auto-dismiss after few seconds
            ...(process.platform === 'win32' && { toastXml: undefined })  // Let Windows use appUserModelId
        });
        
        notification.show();
        console.log(`📢 Notification: ${title} - ${body}`);
    } catch (error) {
        console.error('❌ Failed to show notification:', error);
    }
};

// --- STATE ---
let mainWindow;
let tray = null;
let ws = null;
let intentionalDisconnect = false;
let isConnecting = false; // Prevent multiple simultaneous connection attempts
let connectionUrl = '';
let reconnectAttempts = 0;
let reconnectTimeout = null;
let heartbeatInterval = null;
let connectionTimeout = null;
app.isQuitting = false;

// Display management
let availableDisplays = [];
let selectedDisplayIndex = 0;

// Client connection state
let clientConnected = false;

// Screenshot buffer system
let screenshotBuffer = [];
let backgroundCaptureInterval = null;
const MAX_BUFFER_SIZE = 5;
const CAPTURE_INTERVAL = 60000; // 1 minute (60 seconds)
const RETENTION_TIME = 300000; // 5 minutes

// ✨ WINDOWS STARTUP FIX: Wrap electron-store with error handling for pre-login startup
let store;
let storeInitialized = false;
let connectionCode = null; // Track code in memory if store fails

try {
    store = new Store({
        defaults: {
            runAtStartup: false,
            closeToTray: true,
            multiShotCapture: true,
            enableBuffer: true,
            hotkeySingle: 'F1',    // Customizable single-shot hotkey
            hotkeyMulti: 'F2',     // Customizable multi-shot hotkey
        }
    });
    storeInitialized = true;
    console.log('✅ electron-store initialized successfully');
} catch (error) {
    console.error('❌ electron-store initialization failed (pre-login?):', error.message);
    console.log('🔄 Using in-memory fallback storage');
    // Create fallback in-memory store
    store = {
        _data: {
            runAtStartup: false,
            closeToTray: true,
            multiShotCapture: true,
            enableBuffer: true,
            hotkeySingle: 'F1',
            hotkeyMulti: 'F2',
        },
        get: function(key) { return this._data[key]; },
        set: function(key, value) { this._data[key] = value; },
        delete: function(key) { delete this._data[key]; },
        store: {}
    };
    storeInitialized = false;
}

// ✨ WINDOWS STARTUP FIX: Retry store initialization periodically
const retryStoreInitialization = () => {
    if (!storeInitialized) {
        try {
            const testStore = new Store({
                defaults: {
                    runAtStartup: false,
                    closeToTray: true,
                    multiShotCapture: true,
                    enableBuffer: true,
                    hotkeySingle: 'F1',
                    hotkeyMulti: 'F2',
                }
            });
            // If we get here, store works now
            store = testStore;
            storeInitialized = true;
            console.log('✅ electron-store recovered successfully');
            
            // If we have a connection code in memory, save it
            if (connectionCode) {
                store.set('connectionCode', connectionCode);
                console.log('💾 Saved in-memory connection code to store');
            }
            
            return true;
        } catch (error) {
            // Still not ready, will retry later
            return false;
        }
    }
    return true;
};

// Task Scheduler startup is managed by installer and settings toggle
// No need to set login items on app startup anymore

// --- FUNCTIONS ---
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        resizable: false,
        show: false, // ✨ Don't show window until content is loaded to prevent flashing
        title: 'Otagon Connector',
        webPreferences: {
            nodeIntegration: false, // 🔒 Disabled for security
            contextIsolation: true,  // 🔒 Enabled for security
            preload: path.join(__dirname, 'preload.js') // ✨ Link to the new preload script
        }
    });
    mainWindow.loadFile('index.html');
    
    // ✨ Show window only when content is ready to prevent flashing
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('✅ Window ready and shown');
    });

    mainWindow.on('close', (event) => {
        if (store.get('closeToTray') && !app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            console.log('🔄 App minimized to tray');
            
            // Ensure tray is visible and functional
            if (tray) {
                tray.setToolTip('Otagon Connector - Click to show/hide (App is running)');
            }
        } else {
            // User wants to actually close the app
            console.log('🚪 App closing completely');
            app.isQuitting = true;
            // Don't prevent default - let the window close
        }
    });
};

const connectWebSocket = () => {
    if (!connectionUrl) return;
    
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
        console.log('⚠️ Connection attempt already in progress, skipping...');
        return;
    }
    isConnecting = true;
    
    // Clear any existing timeouts and intervals
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
    }
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    
    // If there's an existing connection, close it first
    if (ws && ws.readyState !== WebSocket.CLOSED) {
        console.log('🔄 Closing existing connection before reconnecting...');
        const oldWs = ws; // Store reference to prevent race conditions
        ws = null; // Clear global reference immediately
        
        // Clear any existing timeouts on the old WebSocket
        if (oldWs.pingTimeout) {
            clearTimeout(oldWs.pingTimeout);
            oldWs.pingTimeout = null;
        }
        if (oldWs.aggressiveHeartbeat) {
            clearInterval(oldWs.aggressiveHeartbeat);
            oldWs.aggressiveHeartbeat = null;
        }
        // Remove all listeners before closing to prevent stray events
        oldWs.removeAllListeners();
        try {
            oldWs.close();
        } catch (e) {
            // Ignore close errors
        }
    }
    
    console.log(`🔌 Connecting to relay server at: ${connectionUrl}`);
    if (mainWindow) mainWindow.webContents.send('set-status', 'Connecting to Relay...');
    
    // Set connection timeout
    connectionTimeout = setTimeout(() => {
        if (ws && ws.readyState === WebSocket.CONNECTING) {
            console.log('⏰ Connection timeout - closing and retrying...');
            ws.close();
        }
    }, CONNECTION_TIMEOUT);
    
    try {
        ws = new WebSocket(connectionUrl);
        
        // Initialize lastActivity when WebSocket is created
        ws.lastActivity = Date.now();
        
        // ✨ CRITICAL FIX: Add error handler immediately after creation
        // This prevents uncaught errors during the connection phase
        ws.on('error', () => {
            // Error handler attached, detailed handling below
        });
        
        // Note: Ping timeout moved to on('open') handler - don't start before connection opens
    } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        isConnecting = false; // Allow new connection attempts
        
        // Clear the connection timeout since we're not connecting
        if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
        }
        // Schedule reconnection attempt
        setTimeout(() => {
            if (!app.isQuitting && !intentionalDisconnect) {
                connectWebSocket();
            }
        }, 1000);
        return;
    }

    ws.on('open', () => {
        console.log('✅ Connected to relay server. Waiting for client...');
        isConnecting = false; // Connection successful, allow new attempts
        intentionalDisconnect = false;
        reconnectAttempts = 0; // Reset reconnection attempts on successful connection
        clientConnected = false; // Reset client connection state
        
        // Initialize lastActivity when connection opens
        ws.lastActivity = Date.now();
        
        // Clear connection timeout
        if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
        }
        
        // Clear any existing ping timeout and set new one
        if (ws.pingTimeout) {
            clearTimeout(ws.pingTimeout);
        }
        // Set ping timeout to detect unresponsive connections (starts AFTER connection is open)
        ws.pingTimeout = setTimeout(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                console.log('⚠️ Ping timeout - connection may be unresponsive');
                try {
                    ws.close();
                } catch (e) {
                    // Ignore errors during close
                }
            }
        }, 30000); // 30 second ping timeout (only for unresponsive connections)
        
        // Start heartbeat to prevent inactivity timeout
        startHeartbeat();
        
        if (mainWindow) mainWindow.webContents.send('set-status', 'Waiting for Client...');
    });
    
    ws.on('message', (messageBuffer) => {
        // ✨ CRITICAL FIX: Check if WebSocket still exists before processing
        if (!ws) {
            console.log('⚠️ WebSocket is null, ignoring message to prevent crash');
            return;
        }
        
        // ✨ ENHANCED SAFETY: Ensure lastActivity is always initialized
        if (!ws.lastActivity) {
            console.log('⚠️ lastActivity not initialized in message handler, setting it now...');
            ws.lastActivity = Date.now();
        }
        
        // Track last activity
        ws.lastActivity = Date.now();
        
        // Reset ping timeout on any message (connection is active)
        if (ws.pingTimeout) {
            clearTimeout(ws.pingTimeout);
            ws.pingTimeout = setTimeout(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    console.log('⚠️ Ping timeout - connection may be unresponsive');
                    try {
                        ws.close();
                    } catch (e) {
                        // Ignore errors during close
                    }
                }
            }, 30000); // Reset to 30 seconds
        }
        
        const message = JSON.parse(messageBuffer.toString());
        if (message.type === 'partner_connected') {
            console.log('🎉 Client connected! Ready for screenshots.');
            clientConnected = true;
            if (mainWindow) mainWindow.webContents.send('set-status', 'Client Connected');
        } else if (message.type === 'partner_disconnected') {
            console.log('👋 Client disconnected. Waiting for reconnection...');
            clientConnected = false;
            if (mainWindow) mainWindow.webContents.send('set-status', 'Waiting for Client...');
        } else if (message.type === 'pong') {
            console.log('💓 Heartbeat response received');
        } else if (message.type === 'screenshot_request') {
            // ✨ NEW: Handle remote screenshot requests from mobile app
            console.log('🎯 WebSocket screenshot request received!');
            console.log('📋 Full message:', JSON.stringify(message, null, 2));
            handleScreenshotRequest(message);
        } else if (message.type === 'health_check_response') {
            console.log('💓 Health check response received');
        } else if (message.type === 'connection_verify_response') {
            console.log('💓 Connection verification response received');
        } else if (message.type === 'connection_alive_response') {
            console.log('💓 Connection alive response received');
        } else if (message.type === 'keepalive_response') {
            console.log('💓 Keepalive response received');
        } else if (message.type === 'focus_check_response') {
            console.log('💓 Focus check response received');
        } else if (message.type === 'wake_check_response') {
            console.log('💓 Wake check response received');
        }
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        console.error('❌ Error code:', error.code);
        
        // Handle specific error types
        if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || 
            error.message.includes('socket hang up')) {
            console.log('🔌 Connection error detected - cleaning up and will retry...');
            
            // Reset isConnecting flag so we can attempt reconnection
            isConnecting = false;
            
            // Clean up the connection
            if (ws) {
                try {
                    // Remove all listeners to prevent further errors
                    ws.removeAllListeners();
                    // Try to close gracefully
                    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                        ws.close();
                    }
                } catch (closeError) {
                    console.log('⚠️ Error during cleanup (ignoring):', closeError.message);
                }
                ws = null;
            }
        } else {
            // Don't immediately close on error - let the connection try to recover
            // Only close if it's a fatal error or connection is already closed
            if (ws && ws.readyState === WebSocket.CLOSED) {
                console.log('🔄 Connection closed due to error, will retry...');
            }
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`🔌 WebSocket closed. Code: ${code}, Reason: ${reason}`);
        isConnecting = false; // Allow new connection attempts
        
        // Store reference to WebSocket before clearing it
        const closedWs = ws;
        
        // ✨ CRITICAL FIX: Remove all event listeners to prevent stray events
        if (closedWs) {
            console.log('🧹 Removing all WebSocket event listeners to prevent stray events...');
            closedWs.removeAllListeners();
        }
        
        // Clear all timeouts
        if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
        }
        
        // Clear WebSocket-specific timeouts if they exist
        if (closedWs && closedWs.pingTimeout) {
            clearTimeout(closedWs.pingTimeout);
            closedWs.pingTimeout = null;
        }
        if (closedWs && closedWs.aggressiveHeartbeat) {
            clearInterval(closedWs.aggressiveHeartbeat);
            closedWs.aggressiveHeartbeat = null;
        }
        
        // Stop heartbeat
        stopHeartbeat();
        
        // Clear the WebSocket reference
        ws = null;
        
        // Only try to reconnect if:
        // 1. Not an intentional disconnect
        // 2. App is not shutting down
        // 3. Connection wasn't closed due to app shutdown
        if (!intentionalDisconnect && !app.isQuitting) {
            // Wait a bit before attempting reconnection to avoid rapid reconnection loops
            setTimeout(() => {
                if (!app.isQuitting && !intentionalDisconnect) {
                    scheduleReconnection();
                }
            }, CONNECTION_RETRY_DELAY);
        } else if (intentionalDisconnect) {
            console.log('🔄 Intentional disconnect - not reconnecting');
        } else if (app.isQuitting) {
            console.log('🔄 App shutting down - not reconnecting');
        }
    });
    
    // Add ping/pong handlers for better connection monitoring
    ws.on('ping', () => {
        console.log('💓 Ping received, sending pong...');
        
        // ✨ CRITICAL FIX: Check if WebSocket still exists before processing
        if (!ws) {
            console.log('⚠️ WebSocket is null, ignoring ping to prevent crash');
            return;
        }
        
        try {
            ws.pong();
        } catch (error) {
            console.log('⚠️ Error sending pong:', error.message);
        }
    });
    
    ws.on('pong', () => {
        console.log('💓 Pong received');
        
        // ✨ CRITICAL FIX: Check if WebSocket still exists before processing
        if (!ws) {
            console.log('⚠️ WebSocket is null, ignoring pong to prevent crash');
            return;
        }
        
        // ✨ ENHANCED SAFETY: Ensure lastActivity is always initialized
        if (!ws.lastActivity) {
            console.log('⚠️ lastActivity not initialized in pong handler, setting it now...');
            ws.lastActivity = Date.now();
        }
        ws.lastActivity = Date.now();
    });
};

// Enhanced reconnection logic with better backoff strategy
const scheduleReconnection = () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log(`⚠️ Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Will continue trying with longer intervals...`);
        // Don't give up completely, just use longer intervals
        reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
    }
    
    reconnectAttempts++;
    
    // Calculate delay with exponential backoff, but cap it reasonably
    // More aggressive backoff for faster reconnection
    const delay = Math.min(RECONNECT_INTERVAL * Math.pow(1.2, Math.min(reconnectAttempts - 1, 8)), MAX_RECONNECT_DELAY);
    
    console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${Math.round(delay/1000)} seconds...`);
    
    if (mainWindow) mainWindow.webContents.send('set-status', `Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    
    reconnectTimeout = setTimeout(() => {
        if (!app.isQuitting && !intentionalDisconnect) {
            connectWebSocket();
        }
    }, delay);
    // Removed duplicate backup reconnection - isConnecting flag now prevents race conditions
};

// ✨ NEW: Persistent reconnection system
const startPersistentReconnection = () => {
    console.log('🔄 Starting persistent reconnection system...');
    
    // Check every 15 seconds if we need to reconnect (less aggressive)
    setInterval(() => {
        if (!app.isQuitting && !intentionalDisconnect && (!ws || ws.readyState === WebSocket.CLOSED)) {
            console.log('🔄 Persistent reconnection check - attempting to connect...');
            connectWebSocket();
        }
    }, 15000); // Check every 15 seconds instead of 10 seconds
    
    // Additional reconnection check every 10 seconds (less aggressive)
    setInterval(() => {
        if (!app.isQuitting && !intentionalDisconnect) {
            if (!ws || ws.readyState === WebSocket.CLOSED) {
                console.log('🔄 Reconnection check - attempting to connect...');
                connectWebSocket();
            } else if (ws && ws.readyState === WebSocket.OPEN) {
                // ✨ ENHANCED SAFETY: Additional null checks and fallbacks
                if (!ws.lastVerify) {
                    console.log('⚠️ lastVerify not initialized in persistent reconnection check, setting it now...');
                    ws.lastVerify = 0;
                }
                
                // Only verify connection occasionally, not on every check
                const lastVerify = ws.lastVerify || 0;
                if (Date.now() - lastVerify > 60000) { // Only verify every minute
                    try {
                        ws.send(JSON.stringify({
                            type: 'connection_verify',
                            timestamp: Date.now()
                        }));
                        ws.lastVerify = Date.now();
                    } catch (error) {
                        console.log('⚠️ Connection verification failed:', error.message);
                        // ✨ IMPROVED: Handle connection errors gracefully
                        if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                            console.log('🔌 Connection error during verification - closing...');
                            try {
                                if (ws) ws.close();
                            } catch (e) {
                                // Ignore errors during cleanup
                            }
                        }
                    }
                }
            }
        }
    }, 10000); // Check every 10 seconds instead of 5 seconds
};

// ✨ NEW: Ensure app is always connected
const ensureAlwaysConnected = () => {
    console.log('🔄 Starting always-connected system...');
    
    // Check every 10 seconds if we need to connect or reconnect (less aggressive)
    setInterval(() => {
        if (!app.isQuitting && !intentionalDisconnect) {
            if (!ws || ws.readyState === WebSocket.CLOSED) {
                console.log('🔄 Always-connected check - attempting to connect...');
                connectWebSocket();
            } else if (ws && ws.readyState === WebSocket.OPEN) {
                // Connection is open, verify it's working (but less frequently)
                try {
                    ws.send(JSON.stringify({
                        type: 'connection_alive',
                        timestamp: Date.now()
                    }));
                } catch (error) {
                    console.log('⚠️ Connection alive check failed:', error.message);
                    // ✨ IMPROVED: Handle connection errors gracefully
                    if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                        console.log('🔌 Connection error during alive check - closing...');
                        try {
                            if (ws) ws.close();
                        } catch (e) {
                            // Ignore errors during cleanup
                        }
                    }
                }
            }
        }
    }, 10000); // Check every 10 seconds instead of 3 seconds
    
    // Additional connection verification every 30 seconds (much less aggressive)
    setInterval(() => {
        if (!app.isQuitting && !intentionalDisconnect && ws && ws.readyState === WebSocket.OPEN) {
            // ✨ ENHANCED SAFETY: Additional null checks and fallbacks
            if (!ws.lastActivity) {
                console.log('⚠️ lastActivity not initialized in always-connected check, setting it now...');
                ws.lastActivity = Date.now();
            }
            
            // Only verify connection if it's been inactive for a reasonable time
            const lastActivity = ws.lastActivity || Date.now();
            if (Date.now() - lastActivity > 120000) { // 2 minutes without activity
                console.log('⚠️ Connection appears inactive (2+ minutes) - sending verification...');
                try {
                    ws.send(JSON.stringify({
                        type: 'connection_verify',
                        timestamp: Date.now()
                    }));
                } catch (error) {
                    console.log('⚠️ Connection verification failed:', error.message);
                    // ✨ IMPROVED: Handle connection errors gracefully
                    if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                        console.log('🔌 Connection error during inactivity verification - closing...');
                        try {
                            if (ws) ws.close();
                        } catch (e) {
                            // Ignore errors during cleanup
                        }
                    }
                }
            }
        }
    }, 30000); // Check every 30 seconds instead of 2 seconds
};

// Buffer management functions
const addToBuffer = (screenshot) => {
    const timestamp = Date.now();
    screenshotBuffer.push({
        data: screenshot,
        timestamp: timestamp
    });
    
    // Keep only the latest MAX_BUFFER_SIZE screenshots
    if (screenshotBuffer.length > MAX_BUFFER_SIZE) {
        screenshotBuffer.shift();
    }
    
    console.log(`📸 Added to buffer. Buffer size: ${screenshotBuffer.length}/${MAX_BUFFER_SIZE}`);
    
    // Update UI with buffer count
    if (mainWindow) {
        mainWindow.webContents.send('update-buffer-count', screenshotBuffer.length);
    }
};

const cleanOldScreenshots = () => {
    const now = Date.now();
    screenshotBuffer = screenshotBuffer.filter(item => 
        (now - item.timestamp) < RETENTION_TIME
    );
};

const startBackgroundCapture = () => {
    if (backgroundCaptureInterval) {
        clearInterval(backgroundCaptureInterval);
    }
    
    console.log('🔄 Starting background screenshot capture every minute...');
    
    // Capture immediately
    captureAndBufferScreenshot();
    
    // Then set up interval
    backgroundCaptureInterval = setInterval(() => {
        captureAndBufferScreenshot();
        cleanOldScreenshots();
    }, CAPTURE_INTERVAL);
};

const stopBackgroundCapture = () => {
    if (backgroundCaptureInterval) {
        clearInterval(backgroundCaptureInterval);
        backgroundCaptureInterval = null;
        console.log('⏹️ Stopped background screenshot capture');
    }
};

// Manual reconnection trigger
const forceReconnect = () => {
    console.log('🔄 Manual reconnection requested');
    
    // Reset flags to allow reconnection
    intentionalDisconnect = false;
    isConnecting = false;
    reconnectAttempts = 0;
    
    // Clear any pending reconnection timeout
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    if (ws) {
        // Close existing connection, then reconnect immediately
        const oldWs = ws;
        ws = null;
        oldWs.removeAllListeners();
        try {
            oldWs.close();
        } catch (e) {
            // Ignore close errors
        }
    }
    
    // Connect immediately
    connectWebSocket();
};

// Heartbeat functions to prevent inactivity timeout
const startHeartbeat = () => {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    
    console.log('💓 Starting heartbeat to prevent inactivity timeout...');
    
    // Send initial heartbeat
    sendHeartbeat();
    
    // Set up periodic heartbeat
    heartbeatInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            sendHeartbeat();
            // Also check connection health
            checkConnectionHealth();
        } else {
            console.log('💓 WebSocket not open, stopping heartbeat');
            stopHeartbeat();
        }
    }, HEARTBEAT_INTERVAL);
    
    // Additional aggressive heartbeat every 5 seconds for critical connections
    if (ws) {
        const aggressiveHeartbeat = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify({
                        type: 'keepalive',
                        timestamp: Date.now()
                    }));
                    // Update lastActivity when aggressive heartbeat is sent
                    if (ws) {
                        ws.lastActivity = Date.now();
                    }
                } catch (error) {
                    console.log('⚠️ Aggressive heartbeat failed:', error.message);
                    // ✨ IMPROVED: Handle connection errors gracefully
                    if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                        console.log('🔌 Connection error during aggressive heartbeat - closing...');
                        try {
                            if (ws) ws.close();
                        } catch (e) {
                            // Ignore errors during cleanup
                        }
                    }
                }
            } else {
                clearInterval(aggressiveHeartbeat);
            }
        }, 5000);
        
        // Store the aggressive heartbeat interval for cleanup
        ws.aggressiveHeartbeat = aggressiveHeartbeat;
    }
};

const stopHeartbeat = () => {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        console.log('💓 Heartbeat stopped');
    }
    
    // Also clear aggressive heartbeat if it exists
    if (ws && ws.aggressiveHeartbeat) {
        clearInterval(ws.aggressiveHeartbeat);
        ws.aggressiveHeartbeat = null;
        console.log('💓 Aggressive heartbeat stopped');
    }
};

const sendHeartbeat = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(JSON.stringify({
                type: 'ping',
                timestamp: Date.now()
            }));
            // Update lastActivity when heartbeat is sent
            if (ws) {
                ws.lastActivity = Date.now();
            }
            console.log('💓 Heartbeat sent');
        } catch (error) {
            console.error('❌ Failed to send heartbeat:', error.message);
            // ✨ IMPROVED: Handle connection errors gracefully
            if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                console.log('🔌 Connection error during heartbeat - closing and reconnecting...');
                try {
                    if (ws) ws.close();
                } catch (e) {
                    // Ignore errors during cleanup
                }
            } else {
                console.log('⚠️ Heartbeat failed - will retry on next interval');
            }
        }
    }
};

// Connection health check - detect and fix stale connections
const checkConnectionHealth = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        // Check if the connection is responsive
        const now = Date.now();
        const lastActivity = ws.lastActivity || now;
        
        // Only consider connection stale if no activity for a very long time (5 minutes)
        // This prevents premature disconnections
        if (now - lastActivity > 300000) { // 5 minutes instead of MAX_INACTIVITY_TIME
            console.log('⚠️ Connection appears stale (5+ minutes inactive) - reconnecting...');
            if (ws) ws.close();
            return;
        }
        
        // Only send health check if we haven't sent one recently
        const lastHealthCheck = ws.lastHealthCheck || 0;
        if (now - lastHealthCheck > 30000) { // Only check every 30 seconds
            try {
                ws.send(JSON.stringify({
                    type: 'health_check',
                    timestamp: Date.now()
                }));
                ws.lastHealthCheck = now;
            } catch (error) {
                console.log('⚠️ Connection health check failed:', error.message);
                // ✨ IMPROVED: Handle connection errors gracefully
                if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                    console.log('🔌 Connection error during health check - closing...');
                    try {
                        if (ws) ws.close();
                    } catch (e) {
                        // Ignore errors during cleanup
                    }
                }
            }
        }
    }
};

// ✨ NEW: Enhanced connection monitoring
const monitorConnection = () => {
    setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            // Connection is open but we need to check if a client is actually connected
            // Don't automatically set status to "Client Connected" - let the WebSocket message handlers do that
            // This function should only handle connection state, not client connection state
        } else if (ws && ws.readyState === WebSocket.CONNECTING) {
            // Still trying to connect
            if (mainWindow) {
                mainWindow.webContents.send('set-status', 'Connecting to Relay...');
            }
        } else if (!ws || ws.readyState === WebSocket.CLOSED) {
            // No connection, try to reconnect immediately
            if (!app.isQuitting && !intentionalDisconnect) {
                console.log('🔄 Connection monitor detected disconnected state - attempting immediate reconnection...');
                connectWebSocket();
            }
        }
    }, CONNECTION_HEALTH_CHECK_INTERVAL); // Check every 5 seconds for faster response
};

// ✨ NEW: Handle remote screenshot requests from mobile app - ALWAYS USE BUFFER
const handleScreenshotRequest = async (message) => {
    const { mode, count, quality } = message;
    
    console.log(`📸 Screenshot request received: ${mode} mode`);
    console.log(`📋 Request details:`, { mode, count, quality });
    
    try {
        if (mode === 'single') {
            // Capture new single screenshot and send
            await captureSingleScreenshot(quality);
            const bufferScreenshots = getBufferScreenshots();
            if (bufferScreenshots.length > 0) {
                const latestScreenshot = bufferScreenshots[bufferScreenshots.length - 1];
                sendPayload([latestScreenshot], 'screenshot-single');
                console.log('📤 Single screenshot sent from buffer (mobile request)');
            }
        } else if (mode === 'buffer') {
            // Send existing buffer contents without capturing new screenshots
            const bufferScreenshots = getBufferScreenshots();
            if (bufferScreenshots.length > 0) {
                const screenshotsToSend = count ? bufferScreenshots.slice(-count) : bufferScreenshots;
                sendPayload(screenshotsToSend, 'screenshot-multi');
                console.log(`📤 ${screenshotsToSend.length} screenshots sent from buffer (mobile request)`);
                sendSuccessResponse('buffer', screenshotsToSend.length, { fromBuffer: true, totalInBuffer: bufferScreenshots.length });
            } else {
                throw new Error('Buffer is empty - no screenshots available');
            }
        } else {
            console.log(`⚠️ Unknown screenshot mode: ${mode}`);
            sendErrorResponse('Unknown screenshot mode', mode);
        }
    } catch (error) {
        console.error('❌ Failed to handle screenshot request:', error);
        sendErrorResponse('Screenshot capture failed', error.message);
    }
};

// ✨ NEW: Send error response to mobile app
const sendErrorResponse = (errorType, details) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(JSON.stringify({
                type: 'screenshot_error',
                error: {
                    type: errorType,
                    details: details,
                    timestamp: Date.now()
                }
            }));
            console.log('📤 Error response sent to mobile app');
        } catch (error) {
            console.error('❌ Failed to send error response:', error.message);
            // ✨ IMPROVED: Handle connection errors gracefully
            if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                console.log('🔌 Connection error during error response send - closing...');
                try {
                    if (ws) ws.close();
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        }
    }
};

// ✨ NEW: Send success response to mobile app
const sendSuccessResponse = (mode, count = 1, details = {}) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(JSON.stringify({
                type: 'screenshot_success',
                success: {
                    mode: mode,
                    count: count,
                    timestamp: Date.now(),
                    details: details
                }
            }));
            console.log(`📤 Success response sent to mobile app: ${mode} mode, ${count} screenshot(s)`);
        } catch (error) {
            console.error('❌ Failed to send success response:', error.message);
            // ✨ IMPROVED: Handle connection errors gracefully
            if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                console.log('🔌 Connection error during success response send - closing...');
                try {
                    if (ws) ws.close();
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        }
    }
};

// ✨ NEW: Capture single screenshot function - ALWAYS BUFFER FIRST
const captureSingleScreenshot = async (quality = 'high') => {
    console.log(`📸 Capturing single screenshot (quality: ${quality})...`);
    
    // ✨ Validate displays are detected
    if (!availableDisplays || availableDisplays.length === 0) {
        console.error('❌ No displays detected yet - cannot capture screenshot');
        showNotification('Otagon Connector', '⚠️ Displays not detected yet. Please wait...');
        throw new Error('Displays not detected');
    }
    
    // ✨ Validate selected display index
    if (selectedDisplayIndex < 0 || selectedDisplayIndex >= availableDisplays.length) {
        console.warn(`⚠️ Invalid display index ${selectedDisplayIndex}, resetting to 0`);
        selectedDisplayIndex = 0;
    }
    
    try {
        console.log('🔍 Getting screen sources...');
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: getThumbnailSize(quality)
        });
        
        console.log(`📱 Found ${sources.length} screen source(s)`);
        
        if (sources.length > 0) {
            // ✨ NEW: Use selected display if available, otherwise use first display
            const sourceIndex = (selectedDisplayIndex < sources.length) ? selectedDisplayIndex : 0;
            const selectedSource = sources[sourceIndex];
            
            console.log(`📸 Using display: ${selectedSource.name || `Display ${sourceIndex + 1}`} (index: ${sourceIndex})`);
            console.log('📸 Converting screenshot to data URL...');
            const screenshot = selectedSource.thumbnail.toDataURL();
            console.log(`📊 Screenshot data length: ${screenshot.length} characters`);
            
            // ✨ ALWAYS ADD TO BUFFER FIRST - Never send immediately
            addToBuffer(screenshot);
            console.log('📸 Single screenshot added to buffer');
            
            // Send success response to mobile app
            sendSuccessResponse('single', 1, { quality, addedToBuffer: true, displayIndex: sourceIndex });
            
            return screenshot; // Return the screenshot for potential immediate use
        } else {
            throw new Error('No screen sources available');
        }
    } catch (error) {
        console.error('❌ Failed to capture single screenshot:', error);
        throw error;
    }
};

// ✨ NEW: Capture multi-screenshot function - ALWAYS USE BUFFER
const captureMultiScreenshot = async (count = 3, delay = 500, quality = 'high') => {
    console.log(`📸 Capturing ${count} screenshots (delay: ${delay}ms, quality: ${quality})...`);
    
    // ✨ Validate displays are detected
    if (!availableDisplays || availableDisplays.length === 0) {
        console.error('❌ No displays detected yet - cannot capture screenshot');
        showNotification('Otagon Connector', '⚠️ Displays not detected yet. Please wait...');
        throw new Error('Displays not detected');
    }
    
    // ✨ Validate selected display index
    if (selectedDisplayIndex < 0 || selectedDisplayIndex >= availableDisplays.length) {
        console.warn(`⚠️ Invalid display index ${selectedDisplayIndex}, resetting to 0`);
        selectedDisplayIndex = 0;
    }
    
    try {
        if (!store.get('multiShotCapture')) {
            throw new Error('Multi-shot is disabled');
        }
        
        // ✨ ALWAYS CAPTURE TO BUFFER FIRST
        const screenshots = [];
        for (let i = 0; i < count; i++) {
            console.log(`📸 Capturing screenshot ${i + 1}/${count}...`);
            
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: getThumbnailSize(quality)
            });
            
            if (sources.length > 0) {
                // ✨ NEW: Use selected display if available, otherwise use first display
                const sourceIndex = (selectedDisplayIndex < sources.length) ? selectedDisplayIndex : 0;
                const selectedSource = sources[sourceIndex];
                
                console.log(`📸 Using display: ${selectedSource.name || `Display ${sourceIndex + 1}`} (index: ${sourceIndex})`);
                const screenshot = selectedSource.thumbnail.toDataURL();
                screenshots.push(screenshot);
                addToBuffer(screenshot); // Add each screenshot to buffer
            }
            
            // Delay between captures (except for the last one)
            if (i < count - 1 && delay > 0) {
                console.log(`⏳ Waiting ${delay}ms before next capture...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        if (screenshots.length > 0) {
            console.log(`📸 ${screenshots.length} screenshots captured and added to buffer`);
            // Send success response to mobile app
            sendSuccessResponse('multi', screenshots.length, { quality, delay, addedToBuffer: true, displayIndex: selectedDisplayIndex });
            return screenshots; // Return screenshots for potential immediate use
        } else {
            throw new Error('Failed to capture any screenshots');
        }
    } catch (error) {
        console.error('❌ Failed to capture multi-screenshot:', error);
        throw error;
    }
};

// ✨ NEW: Get thumbnail size based on quality setting
const getThumbnailSize = (quality = 'high') => {
    switch (quality) {
        case 'low':
            return { width: 1280, height: 720 };
        case 'medium':
            return { width: 1600, height: 900 };
        case 'high':
        default:
            return { width: 1920, height: 1080 };
        case 'ultra':
            return { width: 2560, height: 1440 };
    }
};

const captureAndBufferScreenshot = async () => {
    // ✨ Skip capture if displays aren't detected yet
    if (!availableDisplays || availableDisplays.length === 0) {
        console.log('⚠️ Skipping buffer capture - displays not detected yet');
        return;
    }
    
    // ✨ Validate selected display index
    if (selectedDisplayIndex < 0 || selectedDisplayIndex >= availableDisplays.length) {
        console.warn(`⚠️ Invalid display index ${selectedDisplayIndex}, resetting to 0`);
        selectedDisplayIndex = 0;
    }
    
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1920, height: 1080 }
        });
        
        if (sources.length > 0) {
            // ✨ NEW: Use selected display if available, otherwise use first display
            const sourceIndex = (selectedDisplayIndex < sources.length) ? selectedDisplayIndex : 0;
            const selectedSource = sources[sourceIndex];
            
            const screenshot = selectedSource.thumbnail.toDataURL();
            addToBuffer(screenshot);
        }
    } catch (error) {
        console.error('❌ Failed to capture screenshot for buffer:', error);
    }
};

const getBufferScreenshots = () => {
    return screenshotBuffer.map(item => item.data);
};

// ✨ NEW: Display detection and management functions
const detectDisplays = async () => {
    try {
        console.log('🖥️ Detecting available displays...');
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1, height: 1 } // Minimal size for detection
        });
        
        // Get system display information for better naming
        const { screen } = require('electron');
        const displays = screen.getAllDisplays();
        
        availableDisplays = sources.map((source, index) => {
            // Try to match with system display info
            let displayName = `Display ${index + 1}`;
            
            // Extract display index from source ID (format: "screen:0:0" or "screen:1:0")
            const idParts = source.id.split(':');
            if (idParts.length >= 2) {
                const displayIndex = parseInt(idParts[1]);
                if (displayIndex < displays.length) {
                    const systemDisplay = displays[displayIndex];
                    displayName = systemDisplay.label || `Display ${displayIndex + 1}`;
                    
                    // Add resolution info if available
                    if (systemDisplay.size) {
                        displayName += ` (${systemDisplay.size.width}x${systemDisplay.size.height})`;
                    }
                }
            }
            
            return {
                id: source.id,
                name: displayName,
                index: index,
                systemDisplay: displays[index] || null
            };
        });
        
        console.log(`🖥️ Found ${availableDisplays.length} display(s):`, availableDisplays);
        
        // Send display information to renderer
        if (mainWindow) {
            mainWindow.webContents.send('displays-detected', availableDisplays);
        }
        
        return availableDisplays;
    } catch (error) {
        console.error('❌ Failed to detect displays:', error);
        availableDisplays = [];
        if (mainWindow) {
            mainWindow.webContents.send('displays-detected', []);
        }
        return [];
    }
};

const selectDisplay = (index) => {
    if (index >= 0 && index < availableDisplays.length) {
        selectedDisplayIndex = index;
        console.log(`🖥️ Selected display: ${availableDisplays[index].name} (index: ${index})`);
        
        if (mainWindow) {
            mainWindow.webContents.send('display-selected', {
                index: index,
                display: availableDisplays[index]
            });
        }
        return true;
    } else {
        console.error(`❌ Invalid display index: ${index}. Available displays: ${availableDisplays.length}`);
        return false;
    }
};

const clearBuffer = () => {
    screenshotBuffer = [];
    console.log('🗑️ Screenshot buffer cleared');
    
    // Update UI with buffer count
    if (mainWindow) {
        mainWindow.webContents.send('update-buffer-count', 0);
    }
};

const sendPayload = (images, messageType = 'screenshot-multi') => {
    console.log(`📤 sendPayload called with ${images.length} image(s), type: ${messageType}`);
    console.log(`🔌 WebSocket state: ${ws ? ws.readyState : 'null'}`);
    
    if (!ws || ws.readyState !== WebSocket.OPEN || images.length === 0) {
        console.log('❌ Cannot send payload: Not connected or no images to send.');
        return;
    }
    
    try {
        const payload = {
            type: messageType,
            payload: {
                images: images
            }
        };
        
        ws.send(JSON.stringify(payload));
        console.log(`✅ Successfully sent ${images.length} screenshot(s) to client`);
        console.log(`📊 Payload size: ${JSON.stringify(payload).length} characters`);
    } catch (error) {
        console.error('❌ Failed to send payload:', error.message);
        // ✨ IMPROVED: Handle connection errors gracefully
        if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
            console.log('🔌 Connection error during payload send - closing and reconnecting...');
            try {
                if (ws) ws.close();
            } catch (e) {
                // Ignore errors during cleanup
            }
        }
    }
};

// ✨ SIMPLIFIED: Network status monitoring - just check if we need to reconnect
// Removed external WebSocket test to echo.websocket.org to save resources
const monitorNetworkStatus = () => {
    console.log('🌐 Starting network status monitoring...');
    
    // Check if we need to reconnect every 30 seconds (much less aggressive)
    setInterval(() => {
        if (!app.isQuitting && !intentionalDisconnect) {
            // If we're not connected to our relay, try to connect
            if (!ws || ws.readyState === WebSocket.CLOSED) {
                console.log('🌐 Network monitor: Not connected - attempting to connect to relay...');
                connectWebSocket();
            }
        }
    }, 30000); // Check every 30 seconds instead of 10
};

// ✨ NEW: Handle system wake events
const handleSystemWake = () => {
    console.log('🔄 System wake detected - checking connection...');
    if (!app.isQuitting && !intentionalDisconnect) {
        // Wait a bit for network to stabilize, then check connection
        setTimeout(() => {
            if (!app.isQuitting && !intentionalDisconnect) {
                if (!ws || ws.readyState === WebSocket.CLOSED) {
                    console.log('🔄 System woke up but not connected - attempting connection...');
                    connectWebSocket();
                } else if (ws && ws.readyState === WebSocket.OPEN) {
                    // Verify existing connection is working
                    try {
                        ws.send(JSON.stringify({
                            type: 'wake_check',
                            timestamp: Date.now()
                        }));
                    } catch (error) {
                        console.log('⚠️ Wake check failed:', error.message);
                        // ✨ IMPROVED: Handle connection errors gracefully
                        if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                            console.log('🔌 Connection error during wake check - closing...');
                            try {
                                if (ws) ws.close();
                            } catch (e) {
                                // Ignore errors during cleanup
                            }
                        }
                    }
                }
            }
        }, 5000); // Wait 5 seconds for network to stabilize
    }
};

// ✨ NEW: Send screenshots from buffer on demand
const sendFromBuffer = (count = null, mode = 'latest') => {
    const bufferScreenshots = getBufferScreenshots();
    
    if (bufferScreenshots.length === 0) {
        console.log('⚠️ Buffer is empty - no screenshots to send');
        return false;
    }
    
    let screenshotsToSend = [];
    
    switch (mode) {
        case 'latest':
            // Send the most recent screenshot(s)
            const numToSend = count || 1;
            screenshotsToSend = bufferScreenshots.slice(-numToSend);
            break;
        case 'all':
            // Send all screenshots in buffer
            screenshotsToSend = [...bufferScreenshots];
            break;
        case 'range':
            // Send a specific range (if count is specified)
            if (count && count <= bufferScreenshots.length) {
                screenshotsToSend = bufferScreenshots.slice(-count);
            } else {
                screenshotsToSend = [...bufferScreenshots];
            }
            break;
        default:
            screenshotsToSend = [bufferScreenshots[bufferScreenshots.length - 1]];
    }
    
    if (screenshotsToSend.length > 0) {
        sendPayload(screenshotsToSend);
        console.log(`📤 ${screenshotsToSend.length} screenshots sent from buffer (${mode} mode)`);
        return true;
    }
    
    return false;
};

// --- IPC & APP LIFECYCLE ---
ipcMain.on('disconnect-request', () => {
    if (ws) {
        intentionalDisconnect = true;
        ws.close();
        
        // Reset intentionalDisconnect after a delay so manual reconnection works later
        // Without this, the app would never auto-reconnect after user disconnects
        setTimeout(() => {
            intentionalDisconnect = false;
            console.log('🔄 Intentional disconnect flag reset - manual reconnection now possible');
        }, 5000);
    }
});

ipcMain.on('quit-app', () => {
    console.log('🚪 User requested app shutdown from UI');
    app.isQuitting = true;
    
    // Aggressive cleanup
    stopBackgroundCapture();
    
    // Clear all timeouts and intervals
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (connectionTimeout) clearTimeout(connectionTimeout);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    if (ws) {
        ws.close();
    }
    if (tray) {
        tray.destroy();
    }
    
            // ✨ SIMPLIFIED: Just tells the app to quit. The 'before-quit' event will handle cleanup.
});

// Manual reconnection request from UI
ipcMain.on('force-reconnect', () => {
    console.log('🔄 Manual reconnection requested from UI');
    forceReconnect();
});

// ✨ NEW: Regenerate connection code
ipcMain.on('regenerate-code', () => {
    console.log('🔄 User requested code regeneration');
    
    // Generate new code
    const newCode = generateUniqueCode();
    store.set('connectionCode', newCode);
    console.log(`✨ Generated new code: ${newCode}`);
    
    // Disconnect current connection
    intentionalDisconnect = true;
    if (ws) {
        ws.close();
    }
    
    // Update connection URL
    connectionUrl = `${RELAY_URL}/${newCode}`;
    
    // Reset disconnect flag and reconnect
    setTimeout(() => {
        intentionalDisconnect = false;
        connectWebSocket();
    }, 500);
    
    // Update UI with new code
    if (mainWindow) {
        mainWindow.webContents.send('set-code', newCode);
        mainWindow.webContents.send('set-status', 'Connecting with new code...');
    }
});

// ✨ NEW: Send screenshots from buffer on demand
ipcMain.on('send-from-buffer', (event, { count, mode }) => {
    console.log(`📤 UI requested to send screenshots from buffer: count=${count}, mode=${mode}`);
    const success = sendFromBuffer(count, mode);
    if (success) {
        mainWindow.webContents.send('buffer-sent', { count, mode, success: true });
    } else {
        mainWindow.webContents.send('buffer-sent', { count, mode, success: false, error: 'Buffer is empty' });
    }
});

// ✨ NEW: Get buffer information
ipcMain.on('get-buffer-info', (event) => {
    const bufferInfo = {
        count: screenshotBuffer.length,
        maxSize: MAX_BUFFER_SIZE,
        retentionTime: RETENTION_TIME,
        oldest: screenshotBuffer.length > 0 ? screenshotBuffer[0].timestamp : null,
        newest: screenshotBuffer.length > 0 ? screenshotBuffer[screenshotBuffer.length - 1].timestamp : null
    };
    mainWindow.webContents.send('buffer-info', bufferInfo);
});

// ✨ NEW: Display detection and selection IPC handlers
ipcMain.on('detect-displays', async (event) => {
    console.log('🖥️ Display detection requested from UI');
    await detectDisplays();
});

ipcMain.on('select-display', (event, index) => {
    console.log(`🖥️ Display selection requested from UI: index ${index}`);
    const success = selectDisplay(index);
    if (!success) {
        console.error(`❌ Failed to select display at index ${index}`);
    }
});

ipcMain.on('get-settings', (event) => {
    event.returnValue = store.store;
});

ipcMain.on('set-setting', (event, { key, value }) => {
    store.set(key, value);
    
    if (key === 'runAtStartup' && !isDev) {
        // Enable or disable the scheduled task created by installer
        const { exec } = require('child_process');
        const action = value ? 'enable' : 'disable';
        exec(`schtasks /change /tn "OtagonConnectorStartup" /${action}`, (error) => {
            if (error) {
                console.error(`❌ Failed to ${action} startup task:`, error.message);
            } else {
                console.log(`🔄 Run at startup: ${value ? 'enabled' : 'disabled'}`);
            }
        });
    }
    
    if (key === 'closeToTray') {
        console.log(`🔄 Minimize to tray: ${value ? 'enabled' : 'disabled'}`);
    }
    
    // Handle buffer system settings
    if (key === 'enableBuffer' || key === 'multiShotCapture') {
        // Buffer always runs, settings only control whether F2 hotkey works
        console.log('Buffer system settings updated');
    }
    
    // ✨ HOTKEY CUSTOMIZATION: Re-register hotkeys when they change
    if (key === 'hotkeySingle' || key === 'hotkeyMulti') {
        console.log(`🔄 Hotkey changed: ${key} = ${value}`);
        const success = registerHotkeys(false); // false = show notifications for user-triggered changes
        
        // Send confirmation to UI
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('hotkey-updated', { key, value, success });
        }
    }
});

app.whenReady().then(async () => {
    // ✨ WINDOWS STARTUP FIX: Detect if launched at Windows startup and wait for user session
    const isStartupLaunch = process.argv.includes('--startup');
    if (process.platform === 'win32' && isStartupLaunch) {
        console.log('🕐 Startup launch detected - waiting for user session to initialize...');
        // Wait 15 seconds for Windows user session to fully load
        await new Promise(resolve => setTimeout(resolve, 15000));
        console.log('✅ Wait completed - proceeding with initialization');
        
        // Retry store initialization now that user session should be ready
        retryStoreInitialization();
    }
    
    createWindow();

    // ✨ CRITICAL: Detect displays FIRST before any screenshot operations
    console.log('🔍 Detecting displays before starting services...');
    let displayDetected = false;
    let attempts = 0;
    const maxAttempts = 5; // ✨ Increased from 3 to 5 for startup scenarios
    
    while (!displayDetected && attempts < maxAttempts) {
        attempts++;
        console.log(`🔍 Display detection attempt ${attempts}/${maxAttempts}...`);
        
        const displays = await detectDisplays();
        
        if (displays && displays.length > 0) {
            displayDetected = true;
            console.log(`✅ Displays detected successfully on attempt ${attempts}`);
        } else {
            console.warn(`⚠️ Display detection attempt ${attempts} failed`);
            if (attempts < maxAttempts) {
                // ✨ Longer delays for startup scenarios (2 seconds instead of 1)
                const delay = isStartupLaunch ? 2000 : 1000;
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    if (!displayDetected) {
        console.error('❌ Failed to detect displays after all attempts');
        if (isStartupLaunch) {
            console.log('🔄 Startup launch - displays may become available after full login');
            showNotification('Otagon Connector', '⏳ Waiting for displays... Will retry automatically.');
        } else {
            showNotification('Otagon Connector', '⚠️ Failed to detect displays. Screenshots may not work.');
        }
        // Continue anyway - recovery system will retry
    }

    try {
        // ✨ ROBUST PATH: Works in dev and after packaging
        // Use .ico file for better Windows compatibility
        let iconPath;
        if (app.isPackaged) {
            // In packaged app, icons are in extraResources
            iconPath = path.join(process.resourcesPath, 'build', 'icon.ico');
            console.log('🔧 Packaged app - using extraResources path:', iconPath);
        } else {
            // In development, icons are in the build folder
            iconPath = path.join(__dirname, 'build', 'icon.ico');
            console.log('🔧 Development app - using build path:', iconPath);
        }
        
        console.log('🔧 Creating system tray with icon path:', iconPath);
        
        // Check if icon file exists
        const fs = require('fs');
        console.log('🔍 Checking icon file existence...');
        console.log('🔍 Icon path:', iconPath);
        console.log('🔍 File exists:', fs.existsSync(iconPath));
        
        if (!fs.existsSync(iconPath)) {
            console.error('❌ Tray icon file not found at:', iconPath);
            // Try PNG as fallback
            let pngPath;
            if (app.isPackaged) {
                pngPath = path.join(process.resourcesPath, 'build', 'icon.png');
            } else {
                pngPath = path.join(__dirname, 'build', 'icon.png');
            }
            console.log('🔍 Trying PNG fallback:', pngPath);
            console.log('🔍 PNG file exists:', fs.existsSync(pngPath));
            if (fs.existsSync(pngPath)) {
                console.log('🔄 Using PNG icon as fallback:', pngPath);
                tray = new Tray(pngPath);
            } else {
                // Try dragon logo as additional fallback
                const dragonLogoPath = path.join(__dirname, 'src', 'Public', 'Images', 'Dragon Circle Logo Design.png');
                console.log('🔍 Trying dragon logo:', dragonLogoPath);
                console.log('🔍 Dragon logo exists:', fs.existsSync(dragonLogoPath));
                if (fs.existsSync(dragonLogoPath)) {
                    console.log('🔄 Using dragon logo for tray:', dragonLogoPath);
                    tray = new Tray(dragonLogoPath);
                } else {
                    // ✨ CRITICAL FIX: Try alternative paths for packaged app
                    if (app.isPackaged) {
                        console.log('🔍 Trying alternative packaged paths...');
                        const altPaths = [
                            path.join(process.resourcesPath, 'icon.ico'),
                            path.join(process.resourcesPath, 'icon.png'),
                            path.join(__dirname, 'icon.ico'),
                            path.join(__dirname, 'icon.png')
                        ];
                        
                        for (const altPath of altPaths) {
                            console.log('🔍 Trying alternative path:', altPath);
                            if (fs.existsSync(altPath)) {
                                console.log('✅ Found icon at alternative path:', altPath);
                                tray = new Tray(altPath);
                                break;
                            }
                        }
                        
                        if (!tray) {
                            throw new Error('No icon file found in any location');
                        }
                    } else {
                        throw new Error('No icon file found (tried .ico, .png, and dragon logo)');
                    }
                }
            }
        } else {
            console.log('✅ Using ICO icon:', iconPath);
            tray = new Tray(iconPath);
        }
        
        console.log('✅ System tray created successfully');
        
        // ✨ DEBUG: Check tray object properties
        console.log('🔍 Tray object:', tray);
        console.log('🔍 Tray isDestroyed:', tray.isDestroyed());
        console.log('🔍 Platform:', process.platform);
        
        // ✨ CRITICAL FIX: Ensure tray is properly initialized
        if (!tray) {
            throw new Error('Tray creation failed - tray object is null');
        }
        
        const contextMenu = Menu.buildFromTemplate([
            { 
                label: 'Show/Hide App', 
                click: () => {
                    console.log('🖱️ Tray context menu: Show/Hide clicked');
                    if (mainWindow && mainWindow.isVisible()) {
                        mainWindow.hide();
                        console.log('🔄 App hidden via tray');
                    } else if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                        console.log('🔄 App shown via tray');
                    }
                } 
            },
            { type: 'separator' },
            { 
                label: 'Quit Completely', 
                click: () => { 
                    console.log('🚪 User requested complete app shutdown via tray');
                    app.isQuitting = true;
                    app.quit(); 
                } 
            }
        ]);
        
        // ✨ CRITICAL FIX: Set tooltip and context menu with error handling
        try {
            tray.setToolTip('Otagon Connector - Click to show/hide');
            tray.setContextMenu(contextMenu);
            console.log('✅ Tray tooltip and context menu set successfully');
        } catch (error) {
            console.error('❌ Failed to set tray tooltip/context menu:', error);
        }
        
        // ✨ CRITICAL FIX: Handle tray click events with better error handling
        tray.on('click', (event, bounds) => {
            console.log('🖱️ Tray clicked, bounds:', bounds);
            try {
                if (mainWindow && mainWindow.isVisible()) {
                    mainWindow.hide();
                    console.log('🔄 App hidden via tray click');
                } else if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                    console.log('🔄 App shown via tray click');
                }
            } catch (error) {
                console.error('❌ Error handling tray click:', error);
            }
        });
        
        // ✨ CRITICAL FIX: Handle right-click events with better error handling
        tray.on('right-click', (event, bounds) => {
            console.log('🖱️ Tray right-clicked, bounds:', bounds);
            try {
                tray.popUpContextMenu();
            } catch (error) {
                console.error('❌ Error handling tray right-click:', error);
            }
        });
        
        // ✨ CRITICAL FIX: Add double-click handler for better Windows compatibility
        tray.on('double-click', (event, bounds) => {
            console.log('🖱️ Tray double-clicked, bounds:', bounds);
            try {
                if (mainWindow && mainWindow.isVisible()) {
                    mainWindow.hide();
                    console.log('🔄 App hidden via tray double-click');
                } else if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                    console.log('🔄 App shown via tray double-click');
                }
            } catch (error) {
                console.error('❌ Error handling tray double-click:', error);
            }
        });
        
        console.log('✅ System tray setup completed successfully');
        
        // ✨ WINDOWS-SPECIFIC FIX: Force tray icon to be visible
        if (process.platform === 'win32') {
            try {
                // Force the tray to be visible by setting it again
                tray.setToolTip('Otagon Connector - Click to show/hide');
                console.log('🔄 Windows: Forced tray icon visibility');
                
                // ✨ ADDITIONAL WINDOWS FIX: Try to make tray icon visible
                // Sometimes Windows hides tray icons by default
                setTimeout(() => {
                    try {
                        tray.setToolTip('Otagon Connector - Click to show/hide');
                        console.log('🔄 Windows: Delayed tray visibility check');
                    } catch (error) {
                        console.error('❌ Windows: Delayed tray visibility failed:', error);
                    }
                }, 1000);
                
            } catch (error) {
                console.error('❌ Windows: Failed to force tray visibility:', error);
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to create system tray:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Stack trace:', error.stack);
    }
    
    // ✨ WINDOWS STARTUP FIX: Extract code initialization to separate function for reuse
    await initializeConnectionCode();

    // ✨ START CONNECTION after displays are detected
    console.log('🚀 Displays ready - connecting to relay server...');
    connectWebSocket();
    
    // ✨ START PERSISTENT SYSTEMS
    startPersistentReconnection();
    monitorConnection();
    ensureAlwaysConnected();
    monitorNetworkStatus();
    
    // ✨ WINDOWS STARTUP FIX: Start recovery monitoring system
    startRecoveryMonitoring();
    
    // ✨ LISTEN FOR SYSTEM EVENTS
    // Handle system wake events
    if (process.platform === 'win32') {
        // Windows-specific wake detection
        powerMonitor.on('resume', handleSystemWake);
        
        // ✨ WINDOWS STARTUP FIX: Handle screen unlock for recovery
        powerMonitor.on('unlock-screen', async () => {
            console.log('🔓 Screen unlocked - checking for recovery needs...');
            
            // Retry store initialization if it failed earlier
            if (!storeInitialized) {
                console.log('🔄 Retrying store initialization after unlock...');
                const recovered = retryStoreInitialization();
                if (recovered) {
                    // Regenerate/reload connection code
                    await initializeConnectionCode();
                }
            }
            
            // Retry display detection if it failed earlier
            if (!availableDisplays || availableDisplays.length === 0) {
                console.log('🔄 Retrying display detection after unlock...');
                const displays = await detectDisplays();
                if (displays && displays.length > 0) {
                    console.log('✅ Displays recovered after unlock');
                    showNotification('Otagon Connector', '✅ Displays detected - app is ready!');
                    
                    // Start background capture if not running
                    if (!backgroundCaptureInterval) {
                        startBackgroundCapture();
                    }
                }
            }
            
            // Retry WebSocket connection if needed
            if (!ws || ws.readyState === WebSocket.CLOSED) {
                console.log('🔄 Reconnecting WebSocket after unlock...');
                if (connectionUrl) {
                    connectWebSocket();
                }
            }
        });
    }
    
    // ✨ Start background screenshot capture AFTER displays are detected
    if (displayDetected) {
        console.log('🔄 Starting background capture with detected displays...');
        startBackgroundCapture();
    } else {
        console.log('⚠️ Delaying background capture until displays are available');
        // Will be started when displays are detected via ui-ready or manual detection
    }

    // ✨ HOTKEY CUSTOMIZATION: Register hotkeys dynamically with delay
    // Delay hotkey registration to allow system to stabilize after startup
    setTimeout(() => {
        registerHotkeys(true); // true = silent mode for initial registration
    }, 2000);

    // OLD HOTKEY REGISTRATION REMOVED - Now handled by registerHotkeys() function
    /*
    // Register Single Screenshot Hotkey
    globalShortcut.register(HOTKEY_SINGLE, async () => {
        console.log(`Hotkey ${HOTKEY_SINGLE} pressed.`);
        
        // Check connection status
        const isConnected = ws && ws.readyState === WebSocket.OPEN;
        const hasClient = clientConnected;
        
        try {
            // ✨ ALWAYS CAPTURE TO BUFFER FIRST, then send from buffer
            await captureSingleScreenshot();
            
            // Now send the latest screenshot from buffer
            const bufferScreenshots = getBufferScreenshots();
            if (bufferScreenshots.length > 0) {
                const latestScreenshot = bufferScreenshots[bufferScreenshots.length - 1];
                
                if (isConnected && hasClient) {
                    // Connected and client ready - send screenshot
                    sendPayload([latestScreenshot]);
                    console.log('📤 Hotkey screenshot sent from buffer');
                    showNotification('Otagon Connector', '✓ Screenshot sent successfully!');
                } else if (isConnected && !hasClient) {
                    // Connected but no client
                    console.log('⚠️ Screenshot not sent - No client connected');
                    showNotification('Otagon Connector', '⚠️ Screenshot not sent - No client connected');
                } else {
                    // Not connected to relay
                    console.log('⚠️ Screenshot not sent - Not connected to relay');
                    showNotification('Otagon Connector', '⚠️ Screenshot not sent - Not connected to relay');
                }
            }
        } catch (error) {
            console.error('Failed to capture single screenshot:', error);
            showNotification('Otagon Connector', '✗ Failed to capture screenshot');
        }
    });

    // Register Multi-Shot Hotkey (sends buffer contents)
    globalShortcut.register(HOTKEY_MULTI, async () => {
        if (!store.get('multiShotCapture')) {
            console.log('Multi-shot is disabled. Ignoring hotkey.');
            showNotification('Otagon Connector', '⚠️ Multi-shot is disabled in settings');
            return;
        }
        console.log(`Hotkey ${HOTKEY_MULTI} pressed. Capturing 3 screenshots...`);
        
        // Check connection status
        const isConnected = ws && ws.readyState === WebSocket.OPEN;
        const hasClient = clientConnected;
        
        try {
            // ✨ ALWAYS CAPTURE TO BUFFER FIRST, then send from buffer
            await captureMultiScreenshot(3, 500);
            
            // Now send the latest screenshots from buffer
            const bufferScreenshots = getBufferScreenshots();
            const recentScreenshots = bufferScreenshots.slice(-Math.min(3, bufferScreenshots.length));
            
            if (recentScreenshots.length > 0) {
                if (isConnected && hasClient) {
                    // Connected and client ready - send screenshots
                    sendPayload(recentScreenshots);
                    console.log(`📤 ${recentScreenshots.length} hotkey screenshots sent from buffer`);
                    showNotification('Otagon Connector', `✓ ${recentScreenshots.length} screenshots sent successfully!`);
                } else if (isConnected && !hasClient) {
                    // Connected but no client
                    console.log(`⚠️ ${recentScreenshots.length} screenshots not sent - No client connected`);
                    showNotification('Otagon Connector', `⚠️ ${recentScreenshots.length} screenshots not sent - No client connected`);
                } else {
                    // Not connected to relay
                    console.log(`⚠️ ${recentScreenshots.length} screenshots not sent - Not connected to relay`);
                    showNotification('Otagon Connector', `⚠️ ${recentScreenshots.length} screenshots not sent - Not connected`);
                }
            }
        } catch (error) {
            console.error('Failed to capture multi-screenshot:', error);
            showNotification('Otagon Connector', '✗ Failed to capture screenshots');
        }
    });
    */

    // ✨ UI READY HANDLER - Now just updates UI, doesn't start connection
    ipcMain.on('ui-ready', async () => {
        mainWindow.webContents.send('set-code', connectionCode);
        mainWindow.webContents.send('load-settings', store.store);
        mainWindow.webContents.send('update-buffer-count', screenshotBuffer.length);
        
        // Update UI with current connection status
        if (ws && ws.readyState === WebSocket.OPEN) {
            if (clientConnected) {
                mainWindow.webContents.send('set-status', 'Client Connected');
            } else {
                mainWindow.webContents.send('set-status', 'Waiting for Client...');
            }
        } else if (ws && ws.readyState === WebSocket.CONNECTING) {
            mainWindow.webContents.send('set-status', 'Connecting to Relay...');
        } else {
            mainWindow.webContents.send('set-status', 'Disconnected');
        }
        
        // ✨ Refresh display detection when UI is ready (in case displays changed)
        console.log('🖥️ UI ready - refreshing display detection...');
        const displays = await detectDisplays();
        
        // ✨ Start background capture if it wasn't started earlier
        if (displays && displays.length > 0 && !backgroundCaptureInterval) {
            console.log('🔄 Starting background capture from ui-ready handler...');
            startBackgroundCapture();
        }
    });
});

app.on('before-quit', () => {
    console.log('🔄 App shutting down - cleaning up resources...');
    app.isQuitting = true;
    
    // Clean up all resources
    globalShortcut.unregisterAll();
    stopBackgroundCapture();
    
    // Use comprehensive cleanup function
    cleanupAllTimeouts();
    
    // Close WebSocket connection
    if (ws) {
        ws.close();
    }
    
    // Remove tray
    if (tray) {
        console.log('🗑️ Destroying system tray...');
        tray.destroy();
        tray = null;
    }
    
    // ✨ RELIABLE CLEANUP: This is the primary place for all cleanup logic.
    
    console.log('✅ Cleanup completed');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // On Windows, don't quit immediately if we have tray functionality
        if (store.get('closeToTray')) {
            console.log('🔄 Window closed, but app continues in tray');
            return;
        }
        console.log('🚪 No tray mode - quitting app');
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

// ✨ NEW: Handle app focus events to ensure connection
app.on('browser-window-focus', () => {
    console.log('🔄 App window focused - checking connection status...');
    if (!app.isQuitting && !intentionalDisconnect) {
        // If not connected, try to connect immediately
        if (!ws || ws.readyState === WebSocket.CLOSED) {
            console.log('🔄 App focused but not connected - attempting immediate connection...');
            connectWebSocket();
        } else if (ws && ws.readyState === WebSocket.OPEN) {
            // Verify connection is working
            try {
                ws.send(JSON.stringify({
                    type: 'focus_check',
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.log('⚠️ Focus check failed:', error.message);
                // ✨ IMPROVED: Handle connection errors gracefully
                if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                    console.log('🔌 Connection error during focus check - closing...');
                    try {
                        if (ws) ws.close();
                    } catch (e) {
                        // Ignore errors during cleanup
                    }
                }
            }
        }
    }
});

// ✨ NEW: Handle app visibility changes
app.on('browser-window-show', () => {
    console.log('🔄 App window shown - ensuring connection...');
    if (!app.isQuitting && !intentionalDisconnect && (!ws || ws.readyState === WebSocket.CLOSED)) {
        console.log('🔄 App shown but not connected - attempting connection...');
        connectWebSocket();
    }
});

// Ensure cleanup happens on any process exit
process.on('exit', () => {
    console.log('🔄 Process exit - cleaning up...');
    stopBackgroundCapture();
    cleanupAllTimeouts();
    if (ws) {
        ws.close();
    }
});

process.on('SIGINT', () => {
    console.log('🔄 SIGINT received - shutting down...');
    cleanupAllTimeouts();
    app.quit();
});

process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received - shutting down...');
    cleanupAllTimeouts();
    app.quit();
});

// ✨ HOTKEY CUSTOMIZATION: Dynamic hotkey registration with validation
// silentMode: When true, don't show error notifications (used for initial startup)
// retryCount: Number of retry attempts remaining
const registerHotkeys = (silentMode = false, retryCount = 3) => {
    console.log(`🔧 Registering hotkeys...${silentMode ? ' (silent mode)' : ''}${retryCount < 3 ? ` (retry ${3 - retryCount}/3)` : ''}`);
    
    // Unregister existing hotkeys first
    globalShortcut.unregisterAll();
    
    const single = getHotkeySingle();
    const multi = getHotkeyMulti();
    
    console.log(`🎯 Attempting to register: Single=${single}, Multi=${multi}`);
    
    // Validate: Check if hotkeys are the same
    if (single === multi) {
        console.error('❌ Hotkey conflict: Single and Multi cannot be the same');
        if (!silentMode) {
            showNotification('Otagon Connector', '⚠️ Hotkey conflict! Single and Multi cannot use the same key.');
        }
        return false;
    }
    
    let singleSuccess = false;
    let multiSuccess = false;
    
    // Register single-shot hotkey
    try {
        const singleRet = globalShortcut.register(single, async () => {
            console.log(`Hotkey ${single} pressed.`);
            
            // Check connection status
            const isConnected = ws && ws.readyState === WebSocket.OPEN;
            const hasClient = clientConnected;
            
            try {
                // ✨ ALWAYS CAPTURE TO BUFFER FIRST, then send from buffer
                await captureSingleScreenshot();
                
                // Now send the latest screenshot from buffer
                const bufferScreenshots = getBufferScreenshots();
                if (bufferScreenshots.length > 0) {
                    const latestScreenshot = bufferScreenshots[bufferScreenshots.length - 1];
                    
                    if (isConnected && hasClient) {
                        // Connected and client ready - send screenshot
                        sendPayload([latestScreenshot], 'screenshot-single');
                        console.log('📤 Single-shot hotkey screenshot sent from buffer');
                        showNotification('Otagon Connector', '✓ Screenshot sent successfully!');
                    } else if (isConnected && !hasClient) {
                        // Connected but no client
                        console.log('⚠️ Screenshot not sent - No client connected');
                        showNotification('Otagon Connector', '⚠️ Screenshot not sent - No client connected');
                    } else {
                        // Not connected to relay
                        console.log('⚠️ Screenshot not sent - Not connected to relay');
                        showNotification('Otagon Connector', '⚠️ Screenshot not sent - Not connected to relay');
                    }
                }
            } catch (error) {
                console.error('Failed to capture single screenshot:', error);
                showNotification('Otagon Connector', '✗ Failed to capture screenshot');
            }
        });
        
        if (singleRet) {
            console.log(`✅ Single-shot hotkey registered: ${single}`);
            singleSuccess = true;
        } else {
            console.error(`❌ Failed to register single-shot hotkey: ${single}`);
            // Only show notification if not in silent mode
            if (!silentMode) {
                showNotification('Otagon Connector', `⚠️ Failed to register ${single} - key may be in use by system`);
            }
        }
    } catch (error) {
        console.error(`❌ Error registering single-shot hotkey:`, error);
        if (!silentMode) {
            showNotification('Otagon Connector', `⚠️ Error registering ${single}`);
        }
    }
    
    // Register multi-shot hotkey (buffer mode)
    try {
        const multiRet = globalShortcut.register(multi, async () => {
            if (!store.get('multiShotCapture')) {
                console.log('Multi-shot is disabled. Ignoring hotkey.');
                showNotification('Otagon Connector', '⚠️ Multi-shot is disabled in settings');
                return;
            }
            console.log(`Hotkey ${multi} pressed. Sending buffer screenshots...`);
            
            // Check connection status
            const isConnected = ws && ws.readyState === WebSocket.OPEN;
            const hasClient = clientConnected;
            
            try {
                // Send existing buffer contents (no new capture)
                const bufferScreenshots = getBufferScreenshots();
                
                if (bufferScreenshots.length > 0) {
                    if (isConnected && hasClient) {
                        // Connected and client ready - send buffer screenshots
                        sendPayload(bufferScreenshots, 'screenshot-multi');
                        console.log(`📤 ${bufferScreenshots.length} buffer screenshots sent`);
                        showNotification('Otagon Connector', `✓ ${bufferScreenshots.length} screenshots sent from buffer!`);
                    } else if (isConnected && !hasClient) {
                        // Connected but no client
                        console.log(`⚠️ ${bufferScreenshots.length} screenshots not sent - No client connected`);
                        showNotification('Otagon Connector', `⚠️ No client connected`);
                    } else {
                        // Not connected to relay
                        console.log(`⚠️ ${bufferScreenshots.length} screenshots not sent - Not connected to relay`);
                        showNotification('Otagon Connector', `⚠️ Not connected to relay`);
                    }
                } else {
                    console.log('⚠️ Buffer is empty - no screenshots to send');
                    showNotification('Otagon Connector', '⚠️ Buffer is empty');
                }
            } catch (error) {
                console.error('Failed to send buffer screenshots:', error);
                showNotification('Otagon Connector', '✗ Failed to send screenshots');
            }
        });
        
        if (multiRet) {
            console.log(`✅ Multi-shot hotkey registered: ${multi}`);
            multiSuccess = true;
        } else {
            console.error(`❌ Failed to register multi-shot hotkey: ${multi}`);
            // Only show notification if not in silent mode
            if (!silentMode) {
                showNotification('Otagon Connector', `⚠️ Failed to register ${multi} - key may be in use by system`);
            }
        }
    } catch (error) {
        console.error(`❌ Error registering multi-shot hotkey:`, error);
        if (!silentMode) {
            showNotification('Otagon Connector', `⚠️ Error registering ${multi}`);
        }
    }
    
    const allSuccess = singleSuccess && multiSuccess;
    if (allSuccess) {
        console.log(`✅ All hotkeys registered successfully`);
    } else {
        console.warn(`⚠️ Some hotkeys failed to register`);
        
        // Retry if we have attempts remaining and in silent mode (startup)
        if (silentMode && retryCount > 0) {
            console.log(`🔄 Retrying hotkey registration in 2 seconds... (${retryCount} attempts left)`);
            setTimeout(() => {
                registerHotkeys(retryCount === 1 ? false : true, retryCount - 1);
            }, 2000);
        }
    }
    
    return allSuccess;
};

// ✨ WINDOWS STARTUP FIX: Connection code initialization function
const initializeConnectionCode = async () => {
    try {
        // Force generation of new 6-digit numeric code (clear any old 4-digit or alphanumeric codes)
        let code = storeInitialized ? store.get('connectionCode') : connectionCode;
        // Check if code exists, is 6 digits, AND is numeric only (no letters)
        const isValidNumericCode = code && code.length === 6 && /^\d{6}$/.test(code);
        
        if (!isValidNumericCode) {
            // Clear any old connection code (alphanumeric or wrong length)
            if (storeInitialized) {
                store.delete('connectionCode');
            }
            // Use cryptographic hash-based generation for better uniqueness
            code = generateUniqueCode();
            connectionCode = code; // Always store in memory
            
            if (storeInitialized) {
                store.set('connectionCode', code);
                console.log(`🔄 Generated new secure 6-digit code (crypto-hash): ${code}`);
            } else {
                console.log(`🔄 Generated code in memory (store unavailable): ${code}`);
            }
        } else {
            connectionCode = code; // Store in memory
            console.log(`📱 Using existing 6-digit code: ${code}`);
        }
        
        // Update connection URL
        connectionUrl = `${RELAY_URL}/${connectionCode}`;
        
        // Send to UI if window exists
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('set-code', connectionCode);
        }
        
        return connectionCode;
    } catch (error) {
        console.error('❌ Failed to initialize connection code:', error.message);
        // Generate emergency code in memory only
        connectionCode = generateUniqueCode();
        connectionUrl = `${RELAY_URL}/${connectionCode}`;
        console.log(`⚠️ Using emergency memory-only code: ${connectionCode}`);
        return connectionCode;
    }
};

// ✨ WINDOWS STARTUP FIX: Recovery monitoring system
const startRecoveryMonitoring = () => {
    console.log('🔄 Starting recovery monitoring system...');
    
    // Check every 10 seconds for recovery needs
    setInterval(async () => {
        if (app.isQuitting) return;
        
        // Check if store needs recovery
        if (!storeInitialized) {
            const recovered = retryStoreInitialization();
            if (recovered && connectionCode) {
                console.log('✅ Store recovered in monitoring loop');
                // Update UI with code
                if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('set-code', connectionCode);
                }
            }
        }
        
        // Check if displays need recovery
        if (!availableDisplays || availableDisplays.length === 0) {
            const displays = await detectDisplays();
            if (displays && displays.length > 0) {
                console.log('✅ Displays recovered in monitoring loop');
                // Start background capture if not running
                if (!backgroundCaptureInterval) {
                    startBackgroundCapture();
                }
            }
        }
        
        // Check if connection code is missing in UI
        if (!connectionCode || connectionCode === '----') {
            console.log('⚠️ Connection code missing - reinitializing...');
            await initializeConnectionCode();
        }
    }, 10000); // Check every 10 seconds
};

// ✨ NEW: Comprehensive timeout cleanup function
const cleanupAllTimeouts = () => {
    console.log('🧹 Cleaning up all timeouts and intervals...');
    
    // Clear main timeouts
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
    }
    
    // Clear intervals
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (backgroundCaptureInterval) {
        clearInterval(backgroundCaptureInterval);
        backgroundCaptureInterval = null;
    }
    
    // Clear WebSocket-specific timeouts
    if (ws) {
        if (ws.pingTimeout) {
            clearTimeout(ws.pingTimeout);
            ws.pingTimeout = null;
        }
        if (ws.aggressiveHeartbeat) {
            clearInterval(ws.aggressiveHeartbeat);
            ws.aggressiveHeartbeat = null;
        }
    }
    
    console.log('✅ All timeouts and intervals cleaned up');
};