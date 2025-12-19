const { contextBridge, ipcRenderer } = require('electron');

// 🔒 SECURE BRIDGE: Expose specific ipc channels to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // One-way channel from Renderer to Main
    send: (channel, data) => {
        const validChannels = ['ui-ready', 'disconnect-request', 'quit-app', 'force-reconnect', 'set-setting', 'send-from-buffer', 'get-buffer-info', 'select-display', 'detect-displays', 'regenerate-code'];
        if (validChannels.includes(channel)) {
            try {
                ipcRenderer.send(channel, data);
            } catch (error) {
                console.error(`❌ Failed to send message on channel ${channel}:`, error);
            }
        } else {
            console.warn(`⚠️ Invalid channel attempted: ${channel}`);
        }
    },
    // One-way channel from Main to Renderer (for listening)
    on: (channel, callback) => {
        const validChannels = ['set-code', 'set-status', 'load-settings', 'update-buffer-count', 'buffer-sent', 'buffer-info', 'displays-detected', 'display-selected', 'displays-info', 'hotkey-updated'];
        if (validChannels.includes(channel)) {
            try {
                // Deliberately strip the 'event' argument from the callback for security
                ipcRenderer.on(channel, (event, ...args) => {
                    try {
                        callback(...args);
                    } catch (error) {
                        console.error(`❌ Error in callback for channel ${channel}:`, error);
                    }
                });
            } catch (error) {
                console.error(`❌ Failed to set up listener for channel ${channel}:`, error);
            }
        } else {
            console.warn(`⚠️ Invalid channel attempted for listening: ${channel}`);
        }
    }
});

// Log successful initialization
console.log('✅ Preload script loaded successfully');
