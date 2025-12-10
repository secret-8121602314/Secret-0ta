// Service Worker for Otagon PWA - Performance Optimized with Enhanced Background Sync
// Version: v1.3.6-pwa-android-fix - Wake lock and media session improvements
const CACHE_VERSION = 'v1.3.6-pwa-android-fix';
const CACHE_NAME = `otagon-${CACHE_VERSION}`;
const CHAT_CACHE_NAME = `otagon-chat-${CACHE_VERSION}`;
const STATIC_CACHE = `otagon-static-${CACHE_VERSION}`;
const API_CACHE = `otagon-api-${CACHE_VERSION}`;
const AUTH_CACHE = `otagon-auth-${CACHE_VERSION}`;
const BASE_PATH = '';
let ttsKeepAliveInterval = null;

// Static assets to precache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Precache ALL mascot images for faster first-run loading
  '/images/mascot/1.png',
  '/images/mascot/2.png',
  '/images/mascot/4.png',
  '/images/mascot/5.1.png',
  '/images/mascot/5.2.png',
  '/images/mascot/6.png',
  '/images/mascot/8.png',
  '/images/mascot/9.png',
  '/images/mascot/10.png',
  '/images/mascot/11.png',
  '/images/mascot/pro-user.png',
  '/images/mascot/vanguard-user.png',
];

// Enhanced background sync capabilities
const BACKGROUND_SYNC_TAGS = {
  CHAT_SYNC: 'chat-sync',
  OFFLINE_DATA_SYNC: 'offline-data-sync',
  HANDS_FREE_SYNC: 'hands-free-sync',
  PERIODIC_SYNC: 'periodic-sync',
  IMAGE_SYNC: 'image-sync'
};

// =============================================
// INSTALL EVENT - Cache resources and skip waiting
// =============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    (async () => {
      // Clear ALL old caches first
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => !name.includes(CACHE_VERSION))
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
      
      // Open new cache and add static assets
      const cache = await caches.open(CACHE_NAME);
      console.log('[SW] Opened new cache:', CACHE_NAME);
      await cache.addAll(urlsToCache);
      
      // Skip waiting to activate immediately
      await self.skipWaiting();
      console.log('[SW] Installation complete, skipped waiting');
    })()
  );
});

// =============================================
// ACTIVATE EVENT - Take control immediately (SINGLE LISTENER)
// =============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    (async () => {
      // Clear old caches that don't match current version
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => !name.includes(CACHE_VERSION))
          .map(name => {
            console.log('[SW] Deleting old cache on activate:', name);
            return caches.delete(name);
          })
      );
      
      // Take control of all clients immediately
      await self.clients.claim();
      console.log('[SW] Activation complete, claimed all clients');
    })()
  );
});

// =============================================
// FETCH EVENT - Handle network requests
// =============================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // CRITICAL: Never intercept Supabase auth requests
  if (url.hostname.includes('supabase.co') || 
      url.hostname.includes('supabase.net') ||
      url.pathname.includes('/auth/') || 
      url.pathname.includes('/rest/v1/') ||
      url.pathname.includes('/storage/v1/')) {
    return; // Let auth/database requests bypass SW completely
  }
  
  // CRITICAL: Don't intercept dev server requests
  if (url.protocol === 'chrome-extension:' || 
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.port === '5173' ||
      url.port === '5174') {
    return; // Never cache localhost during development
  }
  
  // Handle chat API requests for offline support
  if (event.request.url.includes('/api/chat') || 
      event.request.url.includes('/api/conversations')) {
    event.respondWith(handleChatRequest(event.request));
    return;
  }
  
  // Handle insights and analytics with enhanced caching
  if (event.request.url.includes('/api/insights') || 
      event.request.url.includes('/api/analytics')) {
    event.respondWith(handleInsightsRequest(event.request));
    return;
  }
  
  // Network-first strategy for HTML pages (always get latest version)
  if (event.request.mode === 'navigate' || 
      url.pathname.endsWith('.html') || 
      url.pathname === '/' || 
      url.pathname === `${BASE_PATH}/`) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          // Clone and cache the response
          const responseToCache = response.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, responseToCache);
          return response;
        } catch (error) {
          console.log('[SW] Network failed for navigation, trying cache:', error);
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        }
      })()
    );
    return;
  }
  
  // Cache-first strategy for static assets (CSS, JS, images)
  if (event.request.method === 'GET' && url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        // Check cache first
        const cached = await caches.match(event.request);
        if (cached) {
          // Return cached version immediately
          return cached;
        }
        
        // Fetch from network and cache
        try {
          const response = await fetch(event.request);
          if (response.status === 200) {
            const responseToCache = response.clone();
            const cache = await caches.open(STATIC_CACHE);
            cache.put(event.request, responseToCache);
          }
          return response;
        } catch (error) {
          console.log('[SW] Fetch failed for:', event.request.url, error);
          return new Response('Network error', {
            status: 408,
            statusText: 'Request Timeout'
          });
        }
      })()
    );
    return;
  }
  
  // For all other requests (POST, PUT, DELETE, external), don't intercept
});

// =============================================
// MESSAGE EVENT - Handle messages from client (SINGLE CONSOLIDATED LISTENER)
// =============================================
self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;
  
  const { type, payload } = event.data;
  console.log('[SW] Received message:', type);
  
  switch (type) {
    case 'SKIP_WAITING':
      console.log('[SW] Skipping waiting due to client request');
      self.skipWaiting();
      break;
      
    case 'SYNC_OFFLINE_DATA':
      // Trigger background sync for offline data
      if (self.registration.sync) {
        self.registration.sync.register('offline-data-sync');
      }
      break;
      
    case 'CACHE_AUTH_STATE':
      // Cache auth state for PWA offline mode
      console.log('[SW] Caching auth state for offline access');
      caches.open(AUTH_CACHE).then(cache => {
        cache.put('/auth-state', new Response(JSON.stringify(payload), {
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=3600'
          }
        }));
      });
      break;
      
    case 'CLEAR_AUTH_CACHE':
      // Clear auth cache on logout - CRITICAL for fixing stuck state
      console.log('[SW] Clearing auth cache on logout');
      (async () => {
        try {
          // Delete auth cache
          await caches.delete(AUTH_CACHE);
          // Also clear any user-specific data from other caches
          const apiCache = await caches.open(API_CACHE);
          const apiKeys = await apiCache.keys();
          await Promise.all(apiKeys.map(key => apiCache.delete(key)));
          
          const chatCache = await caches.open(CHAT_CACHE_NAME);
          const chatKeys = await chatCache.keys();
          await Promise.all(chatKeys.map(key => chatCache.delete(key)));
          
          console.log('[SW] Auth and user data caches cleared successfully');
          
          // Notify clients that caches are cleared
          const clients = await self.clients.matchAll({ type: 'window' });
          clients.forEach(client => {
            client.postMessage({ type: 'AUTH_CACHE_CLEARED' });
          });
        } catch (error) {
          console.error('[SW] Error clearing caches:', error);
        }
      })();
      break;
      
    case 'CLEAR_ALL_CACHES':
      // Nuclear option - clear everything
      console.log('[SW] Clearing ALL caches');
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[SW] All caches cleared');
      })();
      break;
      
    case 'TTS_STARTED':
      console.log('[SW] TTS Started - keeping service worker alive');
      startKeepAlive();
      break;
      
    case 'TTS_STOPPED':
      console.log('[SW] TTS Stopped - releasing keep alive');
      stopKeepAlive();
      break;
      
    case 'KEEP_ALIVE':
      // Respond to keep-alive ping
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ type: 'KEEP_ALIVE_ACK' });
      }
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// =============================================
// SYNC EVENT - Handle background sync
// =============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case BACKGROUND_SYNC_TAGS.CHAT_SYNC:
      event.waitUntil(syncChatData());
      break;
    case BACKGROUND_SYNC_TAGS.OFFLINE_DATA_SYNC:
      event.waitUntil(syncOfflineData());
      break;
    case BACKGROUND_SYNC_TAGS.HANDS_FREE_SYNC:
      event.waitUntil(syncHandsFreeData());
      break;
    case BACKGROUND_SYNC_TAGS.IMAGE_SYNC:
      event.waitUntil(syncImageData());
      break;
    case BACKGROUND_SYNC_TAGS.PERIODIC_SYNC:
      event.waitUntil(performPeriodicSync());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// =============================================
// PERIODIC SYNC EVENT
// =============================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === BACKGROUND_SYNC_TAGS.PERIODIC_SYNC) {
    event.waitUntil(performPeriodicSync());
  }
});

// =============================================
// PUSH NOTIFICATION EVENT
// =============================================
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New message from Otagon',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'open', title: 'Open App', icon: '/icon-192.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Otagon', options)
  );
});

// =============================================
// NOTIFICATION CLICK EVENT
// =============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      
      // Focus existing client if available
      for (const client of clientList) {
        if (client.url.includes(BASE_PATH) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(`${BASE_PATH}/`);
      }
    })()
  );
});

// =============================================
// HELPER FUNCTIONS
// =============================================

// Start keep-alive interval for TTS
function startKeepAlive() {
  if (ttsKeepAliveInterval) return;
  
  ttsKeepAliveInterval = setInterval(() => {
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ 
            type: 'KEEP_ALIVE_PING',
            timestamp: Date.now()
          });
        });
      });
  }, 15000);
}

// Stop keep-alive interval
function stopKeepAlive() {
  if (ttsKeepAliveInterval) {
    clearInterval(ttsKeepAliveInterval);
    ttsKeepAliveInterval = null;
  }
}

// Handle chat requests with offline support
async function handleChatRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CHAT_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Chat network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'You are offline. Showing cached conversations.',
      data: await getOfflineChatData()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle insights requests
async function handleInsightsRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Insights request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'You are offline. Showing cached insights.',
      data: { insights: [], offline: true }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static requests with cache-first
async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Static request failed:', error);
    return new Response('Network error', { status: 408 });
  }
}

// Sync functions
async function syncChatData() {
  try {
    const offlineData = await getOfflineChatData();
    if (!offlineData.conversations?.length) {
      console.log('[SW] No offline chat data to sync');
      return;
    }
    
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offlineData)
    });
    
    if (response.ok) {
      console.log('[SW] Chat data synced successfully');
      await clearOfflineData();
      
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'SYNC_SUCCESS', data: { chatData: true } });
      });
    }
  } catch (error) {
    console.error('[SW] Chat sync failed:', error);
    await scheduleRetry(BACKGROUND_SYNC_TAGS.CHAT_SYNC);
  }
}

async function syncHandsFreeData() {
  try {
    const voiceData = await getOfflineVoiceData();
    if (voiceData?.length > 0) {
      const response = await fetch('/api/voice/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceData })
      });
      
      if (response.ok) {
        console.log('[SW] Voice data synced successfully');
        await clearOfflineVoiceData();
      }
    }
  } catch (error) {
    console.error('[SW] Voice data sync failed:', error);
  }
}

async function syncImageData() {
  try {
    const imageData = await getOfflineImageData();
    if (imageData?.length > 0) {
      const response = await fetch('/api/images/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });
      
      if (response.ok) {
        console.log('[SW] Image data synced successfully');
        await clearOfflineImageData();
      }
    }
  } catch (error) {
    console.error('[SW] Image data sync failed:', error);
  }
}

async function syncOfflineData() {
  try {
    await syncChatData();
    console.log('[SW] All offline data synced');
  } catch (error) {
    console.error('[SW] Offline data sync failed:', error);
  }
}

async function performPeriodicSync() {
  try {
    console.log('[SW] Performing periodic sync');
    await Promise.all([
      syncChatData(),
      syncHandsFreeData(),
      syncImageData()
    ]);
    await updateCachedContent();
    console.log('[SW] Periodic sync completed');
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}

async function updateCachedContent() {
  try {
    const staticCache = await caches.open(STATIC_CACHE);
    const requests = await staticCache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await staticCache.put(request, response);
        }
      } catch {
        // Ignore failed updates for individual assets
      }
    }
  } catch (error) {
    console.error('[SW] Failed to update cached content:', error);
  }
}

async function scheduleRetry(syncTag) {
  const retryCount = await getRetryCount(syncTag);
  const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000);
  
  console.log(`[SW] Scheduling retry for ${syncTag} in ${backoffTime}ms`);
  
  setTimeout(() => {
    if (self.registration.sync) {
      self.registration.sync.register(syncTag);
    }
  }, backoffTime);
  
  await incrementRetryCount(syncTag);
}

async function getRetryCount(syncTag) {
  try {
    const cache = await caches.open('retry-counts');
    const response = await cache.match(syncTag);
    return response ? parseInt(await response.text()) : 0;
  } catch {
    return 0;
  }
}

async function incrementRetryCount(syncTag) {
  try {
    const cache = await caches.open('retry-counts');
    const currentCount = await getRetryCount(syncTag);
    await cache.put(syncTag, new Response((currentCount + 1).toString()));
  } catch (error) {
    console.error('[SW] Failed to increment retry count:', error);
  }
}

// ✅ IndexedDB integration for offline data persistence
const OFFLINE_DB_NAME = 'otagon-offline-db';
const OFFLINE_DB_VERSION = 1;

// Helper to open IndexedDB connection
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
      
      request.onerror = () => {
        console.error('[SW] Failed to open IndexedDB:', request.error);
        resolve(null);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('pending-messages')) {
          const messageStore = db.createObjectStore('pending-messages', { keyPath: 'id' });
          messageStore.createIndex('conversationId', 'conversationId', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('pending-voice')) {
          db.createObjectStore('pending-voice', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('pending-images')) {
          const imageStore = db.createObjectStore('pending-images', { keyPath: 'id' });
          imageStore.createIndex('conversationId', 'conversationId', { unique: false });
        }
        
        console.log('[SW] IndexedDB schema created/upgraded');
      };
    } catch (error) {
      console.error('[SW] IndexedDB open error:', error);
      resolve(null);
    }
  });
}

// Get all pending chat messages from IndexedDB
async function getOfflineChatData() {
  try {
    const db = await openOfflineDB();
    if (!db) {
      console.log('[SW] IndexedDB not available, returning empty data');
      return { conversations: [], offline: true };
    }
    
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(['pending-messages'], 'readonly');
        const store = transaction.objectStore('pending-messages');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const messages = request.result || [];
          console.log('[SW] Retrieved', messages.length, 'pending messages from IndexedDB');
          
          // Group messages by conversationId for sync
          const conversations = {};
          messages.forEach(msg => {
            if (!conversations[msg.conversationId]) {
              conversations[msg.conversationId] = [];
            }
            conversations[msg.conversationId].push(msg);
          });
          
          resolve({ 
            conversations: Object.entries(conversations).map(([id, msgs]) => ({
              conversationId: id,
              messages: msgs
            })),
            offline: true 
          });
        };
        
        request.onerror = () => {
          console.error('[SW] Failed to get messages from IndexedDB:', request.error);
          resolve({ conversations: [], offline: true });
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      } catch (error) {
        console.error('[SW] Error reading messages:', error);
        resolve({ conversations: [], offline: true });
      }
    });
  } catch (error) {
    console.error('[SW] getOfflineChatData error:', error);
    return { conversations: [], offline: true };
  }
}

// Get pending voice data from IndexedDB
async function getOfflineVoiceData() {
  try {
    const db = await openOfflineDB();
    if (!db) return [];
    
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(['pending-voice'], 'readonly');
        const store = transaction.objectStore('pending-voice');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const data = request.result || [];
          console.log('[SW] Retrieved', data.length, 'pending voice items from IndexedDB');
          resolve(data);
        };
        
        request.onerror = () => {
          resolve([]);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      } catch {
        resolve([]);
      }
    });
  } catch {
    return [];
  }
}

// Get pending image data from IndexedDB
async function getOfflineImageData() {
  try {
    const db = await openOfflineDB();
    if (!db) return [];
    
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(['pending-images'], 'readonly');
        const store = transaction.objectStore('pending-images');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const data = request.result || [];
          console.log('[SW] Retrieved', data.length, 'pending images from IndexedDB');
          resolve(data);
        };
        
        request.onerror = () => {
          resolve([]);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      } catch {
        resolve([]);
      }
    });
  } catch {
    return [];
  }
}

// Clear all pending chat messages from IndexedDB
async function clearOfflineData() {
  try {
    const db = await openOfflineDB();
    if (!db) {
      console.log('[SW] IndexedDB not available for clearing');
      return;
    }
    
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(['pending-messages'], 'readwrite');
        const store = transaction.objectStore('pending-messages');
        const request = store.clear();
        
        request.onsuccess = () => {
          console.log('[SW] Offline chat data cleared from IndexedDB');
          resolve();
        };
        
        request.onerror = () => {
          console.error('[SW] Failed to clear offline data:', request.error);
          resolve();
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      } catch (error) {
        console.error('[SW] Error clearing offline data:', error);
        resolve();
      }
    });
  } catch (error) {
    console.error('[SW] clearOfflineData error:', error);
  }
}

// Clear pending voice data from IndexedDB
async function clearOfflineVoiceData() {
  try {
    const db = await openOfflineDB();
    if (!db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(['pending-voice'], 'readwrite');
        const store = transaction.objectStore('pending-voice');
        store.clear();
        console.log('[SW] Voice data cleared from IndexedDB');
        
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
      } catch {
        resolve();
      }
    });
  } catch {
    console.log('[SW] Voice data clear skipped');
  }
}

// Clear pending image data from IndexedDB
async function clearOfflineImageData() {
  try {
    const db = await openOfflineDB();
    if (!db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(['pending-images'], 'readwrite');
        const store = transaction.objectStore('pending-images');
        store.clear();
        console.log('[SW] Image data cleared from IndexedDB');
        
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
      } catch {
        resolve();
      }
    });
  } catch {
    console.log('[SW] Image data clear skipped');
  }
}

// =============================================
// BACKGROUND OPERATIONS - MESSAGE SYNC
// =============================================
async function syncChatData() {
  console.log('[SW] Syncing chat data...');
  
  try {
    // Get pending messages from localStorage (via clients)
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_PENDING_MESSAGES',
        timestamp: Date.now()
      });
    }
    
    console.log('[SW] Chat sync request sent to clients');
  } catch (error) {
    console.error('[SW] Chat sync failed:', error);
  }
}

// =============================================
// BACKGROUND OPERATIONS - SESSION PING
// =============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SESSION_PING') {
    console.log('[SW] Session ping received, keeping session alive');
    
    // Respond to client
    if (event.source) {
      event.source.postMessage({
        type: 'SESSION_PONG',
        timestamp: Date.now()
      });
    }
  }
});

// =============================================
// BACKGROUND OPERATIONS - PERIODIC REFRESH
// =============================================
async function performPeriodicSync() {
  console.log('[SW] Performing periodic refresh...');
  
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const client of clients) {
      client.postMessage({
        type: 'PERIODIC_REFRESH',
        timestamp: Date.now()
      });
    }
    
    console.log('[SW] Periodic refresh notification sent');
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}

console.log('[SW] Service worker script loaded:', CACHE_VERSION);

