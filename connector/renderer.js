// ⛔ REMOVED: const { ipcRenderer } = require('electron');

// Wait for DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Otagon Connector...');
    
    // Get DOM elements with null checks
    const codeDisplay = document.getElementById('code-display');
    const statusDisplay = document.getElementById('status');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const runAtStartupCheck = document.getElementById('runAtStartup');
    const closeToTrayCheck = document.getElementById('closeToTray');
    const multiShotCaptureCheck = document.getElementById('multiShotCapture');
    const enableBufferCheck = document.getElementById('enableBuffer');
    const bufferCountDisplay = document.getElementById('buffer-count');
    const reconnectBtn = document.getElementById('reconnect-btn');
    const quitBtn = document.getElementById('quit-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');

    // ✨ NEW: Buffer operation buttons
    const sendLatestBtn = document.getElementById('send-latest');
    const sendAllBtn = document.getElementById('send-all');
    const sendRangeBtn = document.getElementById('send-range');
    const bufferInfoBtn = document.getElementById('buffer-info-btn');
    const bufferInfoDisplay = document.getElementById('buffer-info');
    const displaySelect = document.getElementById('displaySelect');
    
    // ✨ HOTKEY CUSTOMIZATION: Get hotkey elements (dual dropdowns)
    const hotkeySingleModifier = document.getElementById('hotkeySingleModifier');
    const hotkeySingleKey = document.getElementById('hotkeySingleKey');
    const hotkeyMultiModifier = document.getElementById('hotkeyMultiModifier');
    const hotkeyMultiKey = document.getElementById('hotkeyMultiKey');
    const hotkeyConflictWarning = document.getElementById('hotkeyConflictWarning');

    // Verify that electronAPI is available
    if (typeof window.electronAPI === 'undefined') {
        console.error('❌ electronAPI not found! Check preload.js configuration.');
        return;
    }

    console.log('✅ electronAPI found, setting up event listeners...');

    // Tell the main process that the UI is ready.
    // ✨ UPDATED: Uses the secure API from preload.js
    window.electronAPI.send('ui-ready');

    // Listen for the 'set-code' message.
    window.electronAPI.on('set-code', (code) => {
        if (code && codeDisplay) {
            codeDisplay.textContent = code;
        }
    });

    // Listen for connection status updates.
    window.electronAPI.on('set-status', (status) => {
        if (statusDisplay) {
            statusDisplay.textContent = `Status: ${status}`;
            if (status === 'Client Connected') {
                statusDisplay.className = 'connected';
                if (disconnectBtn) disconnectBtn.hidden = false;
            } else if (status === 'Connected to Relay' || status === 'Waiting for Client...') {
                statusDisplay.className = ''; // Default color - not fully connected yet
                if (disconnectBtn) disconnectBtn.hidden = true;
            } else {
                statusDisplay.className = ''; // Use default color for other statuses
                if (status === 'Disconnected' || status.includes('Failed')) {
                    statusDisplay.classList.add('disconnected');
                }
                if (disconnectBtn) disconnectBtn.hidden = true;
            }
        }
    });

    // Set up event listeners only if elements exist
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            window.electronAPI.send('disconnect-request');
        });
    }

    if (reconnectBtn) {
        reconnectBtn.addEventListener('click', () => {
            if (confirm('Force reconnect to the WebSocket server? This will close the current connection and attempt to reconnect.')) {
                window.electronAPI.send('force-reconnect');
            }
        });
    }

    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to quit the app completely? This will stop all background processes.')) {
                window.electronAPI.send('quit-app');
            }
        });
    }

    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => {
            if (confirm('Generate a new connection code?\n\nYour mobile app will need to reconnect with the new code.')) {
                console.log('🔄 User confirmed code regeneration');
                window.electronAPI.send('regenerate-code');
            }
        });
    }

    // Load initial settings from main process
    window.electronAPI.on('load-settings', (settings) => {
        if (runAtStartupCheck) runAtStartupCheck.checked = settings.runAtStartup;
        if (closeToTrayCheck) closeToTrayCheck.checked = settings.closeToTray;
        if (multiShotCaptureCheck) multiShotCaptureCheck.checked = settings.multiShotCapture;
        if (enableBufferCheck) enableBufferCheck.checked = true; // Buffer is always enabled
        
        // ✨ HOTKEY CUSTOMIZATION: Load hotkey settings and parse into modifier + key
        const singleHotkey = settings.hotkeySingle || 'F1';
        const multiHotkey = settings.hotkeyMulti || 'F2';
        
        // Parse single hotkey
        const singleParts = parseHotkey(singleHotkey);
        if (hotkeySingleModifier) hotkeySingleModifier.value = singleParts.modifier;
        if (hotkeySingleKey) hotkeySingleKey.value = singleParts.key;
        
        // Parse multi hotkey
        const multiParts = parseHotkey(multiHotkey);
        if (hotkeyMultiModifier) hotkeyMultiModifier.value = multiParts.modifier;
        if (hotkeyMultiKey) hotkeyMultiKey.value = multiParts.key;
    });
    
    // ✨ HOTKEY CUSTOMIZATION: Parse hotkey string into modifier and key parts
    const parseHotkey = (hotkeyString) => {
        if (!hotkeyString) return { modifier: '', key: 'F1' };
        
        const parts = hotkeyString.split('+');
        if (parts.length === 1) {
            // Single key, no modifier
            return { modifier: '', key: parts[0] };
        } else {
            // Has modifier(s)
            const key = parts[parts.length - 1];
            const modifier = parts.slice(0, -1).join('+');
            return { modifier, key };
        }
    };
    
    // ✨ HOTKEY CUSTOMIZATION: Build hotkey string from modifier and key
    const buildHotkey = (modifier, key) => {
        if (!key) return 'F1'; // Fallback
        if (!modifier || modifier === '') {
            return key; // Single key, no modifier
        } else {
            return `${modifier}+${key}`; // Combination
        }
    };

    // Add event listeners to send settings updates
    function addSettingListener(element, key) {
        if (element) {
            element.addEventListener('change', (event) => {
                window.electronAPI.send('set-setting', { key, value: event.target.checked });
            });
        }
    }

    addSettingListener(runAtStartupCheck, 'runAtStartup');
    addSettingListener(closeToTrayCheck, 'closeToTray');
    addSettingListener(multiShotCaptureCheck, 'multiShotCapture');
    
    // ✨ HOTKEY CUSTOMIZATION: Check for conflicts and show/hide warning
    const checkHotkeyConflict = () => {
        if (!hotkeySingleModifier || !hotkeySingleKey || !hotkeyMultiModifier || !hotkeyMultiKey || !hotkeyConflictWarning) return false;
        
        const single = buildHotkey(hotkeySingleModifier.value, hotkeySingleKey.value);
        const multi = buildHotkey(hotkeyMultiModifier.value, hotkeyMultiKey.value);
        const hasConflict = single === multi;
        
        hotkeyConflictWarning.style.display = hasConflict ? 'block' : 'none';
        
        return hasConflict;
    };
    
    // ✨ HOTKEY CUSTOMIZATION: Single-shot hotkey change handlers
    const saveSingleHotkey = () => {
        if (!hotkeySingleModifier || !hotkeySingleKey) return;
        
        const hotkeyString = buildHotkey(hotkeySingleModifier.value, hotkeySingleKey.value);
        
        // Check for conflicts
        if (checkHotkeyConflict()) {
            console.log('⚠️ Hotkey conflict detected - not saving');
            return;
        }
        
        // Save to store
        console.log(`💾 Saving single-shot hotkey: ${hotkeyString}`);
        window.electronAPI.send('set-setting', { key: 'hotkeySingle', value: hotkeyString });
    };
    
    if (hotkeySingleModifier) {
        hotkeySingleModifier.addEventListener('change', saveSingleHotkey);
    }
    
    if (hotkeySingleKey) {
        hotkeySingleKey.addEventListener('change', saveSingleHotkey);
    }
    
    // ✨ HOTKEY CUSTOMIZATION: Multi-shot hotkey change handlers
    const saveMultiHotkey = () => {
        if (!hotkeyMultiModifier || !hotkeyMultiKey) return;
        
        const hotkeyString = buildHotkey(hotkeyMultiModifier.value, hotkeyMultiKey.value);
        
        // Check for conflicts
        if (checkHotkeyConflict()) {
            console.log('⚠️ Hotkey conflict detected - not saving');
            return;
        }
        
        // Save to store
        console.log(`💾 Saving multi-shot hotkey: ${hotkeyString}`);
        window.electronAPI.send('set-setting', { key: 'hotkeyMulti', value: hotkeyString });
    };
    
    if (hotkeyMultiModifier) {
        hotkeyMultiModifier.addEventListener('change', saveMultiHotkey);
    }
    
    if (hotkeyMultiKey) {
        hotkeyMultiKey.addEventListener('change', saveMultiHotkey);
    }
    
    // ✨ HOTKEY CUSTOMIZATION: Listen for hotkey update confirmations
    window.electronAPI.on('hotkey-updated', (data) => {
        const { key, value, success } = data;
        console.log(`✅ Hotkey updated: ${key} = ${value}, success = ${success}`);
        
        if (!success) {
            console.error('❌ Hotkey registration failed');
            // Conflict warning is already shown by main process notification
        }
    });

    // Display selection functionality
    if (displaySelect) {
        displaySelect.addEventListener('change', (event) => {
            const selectedIndex = parseInt(event.target.value);
            console.log(`🖥️ Display selection changed to index: ${selectedIndex}`);
            
            // Only send selection if it's a valid display index (not -1 for no displays)
            if (selectedIndex >= 0) {
                window.electronAPI.send('select-display', selectedIndex);
            }
        });
    }

    // Listen for buffer count updates
    window.electronAPI.on('update-buffer-count', (count) => {
        if (bufferCountDisplay) {
            bufferCountDisplay.textContent = count;
        }
    });

    // ✨ NEW: Buffer operation event listeners
    if (sendLatestBtn) {
        sendLatestBtn.addEventListener('click', () => {
            console.log('📤 Sending latest screenshot from buffer...');
            window.electronAPI.send('send-from-buffer', { count: 1, mode: 'latest' });
        });
    }

    if (sendAllBtn) {
        sendAllBtn.addEventListener('click', () => {
            console.log('📤 Sending all screenshots from buffer...');
            window.electronAPI.send('send-from-buffer', { mode: 'all' });
        });
    }

    if (sendRangeBtn) {
        sendRangeBtn.addEventListener('click', () => {
            const count = prompt('How many recent screenshots to send? (1-5)', '3');
            const num = parseInt(count);
            if (num && num > 0 && num <= 5) {
                console.log(`📤 Sending ${num} recent screenshots from buffer...`);
                window.electronAPI.send('send-from-buffer', { count: num, mode: 'range' });
            }
        });
    }

    if (bufferInfoBtn) {
        bufferInfoBtn.addEventListener('click', () => {
            console.log('📊 Getting buffer information...');
            window.electronAPI.send('get-buffer-info');
            
            // Toggle buffer info display
            if (bufferInfoDisplay) {
                if (bufferInfoDisplay.style.display === 'none' || !bufferInfoDisplay.style.display) {
                    bufferInfoDisplay.style.display = 'block';
                    bufferInfoBtn.textContent = 'Hide Info';
                } else {
                    bufferInfoDisplay.style.display = 'none';
                    bufferInfoBtn.textContent = 'Buffer Info';
                }
            }
        });
    }

    // ✨ NEW: Listen for buffer operation responses
    window.electronAPI.on('buffer-sent', (data) => {
        if (data.success) {
            console.log(`✅ Successfully sent ${data.count || 'screenshots'} from buffer (${data.mode} mode)`);
            // Update buffer count display
            window.electronAPI.send('get-buffer-info');
        } else {
            console.error(`❌ Failed to send from buffer: ${data.error}`);
        }
    });

    window.electronAPI.on('buffer-info', (info) => {
        if (bufferInfoDisplay) {
            bufferInfoDisplay.innerHTML = `
                <div><strong>Buffer Status:</strong></div>
                <div>Count: ${info.count}/${info.maxSize}</div>
                <div>Retention: ${Math.round(info.retentionTime / 60000)} minutes</div>
                ${info.oldest ? `<div>Oldest: ${new Date(info.oldest).toLocaleTimeString()}</div>` : ''}
                ${info.newest ? `<div>Newest: ${new Date(info.newest).toLocaleTimeString()}</div>` : ''}
            `;
        }
        console.log('📊 Buffer info received:', info);
    });

    // Display detection and selection handlers
    window.electronAPI.on('displays-detected', (displays) => {
        console.log('🖥️ Displays detected:', displays);
        console.log('🖥️ Number of displays found:', displays ? displays.length : 'null/undefined');
        
        if (displaySelect) {
            // Clear existing options
            displaySelect.innerHTML = '';
            
            if (displays && displays.length > 0) {
                console.log('🖥️ Adding display options to dropdown...');
                // Add display options
                displays.forEach((display, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = display.name || `Display ${index + 1}`;
                    displaySelect.appendChild(option);
                    console.log(`🖥️ Added display option: ${option.textContent} (index: ${index})`);
                });
                
                // Set default selection to first display
                displaySelect.value = '0';
                console.log('🖥️ Set default selection to first display');
            } else {
                console.log('🖥️ No displays detected - showing error message');
                // No displays detected
                const option = document.createElement('option');
                option.value = '-1';
                option.textContent = 'No displays detected';
                option.disabled = true;
                displaySelect.appendChild(option);
            }
        } else {
            console.error('❌ displaySelect element not found!');
        }
    });

    window.electronAPI.on('display-selected', (data) => {
        console.log('🖥️ Display selected:', data);
        if (displaySelect) {
            displaySelect.value = data.index;
        }
    });

    window.electronAPI.on('displays-info', (info) => {
        console.log('🖥️ Displays info received:', info);
        if (displaySelect) {
            // Clear existing options
            displaySelect.innerHTML = '';
            
            if (info.displays && info.displays.length > 0) {
                // Add display options
                info.displays.forEach((display, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = display.name;
                    displaySelect.appendChild(option);
                });
                
                // Set selected display
                displaySelect.value = info.selectedIndex || 0;
            } else {
                // No displays detected
                const option = document.createElement('option');
                option.value = '-1';
                option.textContent = 'No displays detected';
                option.disabled = true;
                displaySelect.appendChild(option);
            }
        }
    });

    console.log('✅ Event listeners set up successfully');
});

// Fallback error handling
window.addEventListener('error', (event) => {
    console.error('❌ JavaScript error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
});