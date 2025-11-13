// Service Worker for Otagon PWA - Performance Optimized with Enhanced Background Sync
const CACHE_NAME = 'otakon-v1.2.5';
const CHAT_CACHE_NAME = 'otakon-chat-v1.2.5';
const STATIC_CACHE = 'otakon-static-v1.2.5';
const API_CACHE = 'otakon-api-v1.2.5';
const BASE_PATH = '/Otagon';
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`,
  // Add other assets as needed
];

// Enhanced background sync capabilities
const BACKGROUND_SYNC_TAGS = {
  CHAT_SYNC: 'chat-sync',
  OFFLINE_DATA_SYNC: 'offline-data-sync',
  HANDS_FREE_SYNC: 'hands-free-sync',
  PERIODIC_SYNC: 'periodic-sync',
  IMAGE_SYNC: 'image-sync'
};

// Install event - cache resources and clear old caches
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== CHAT_CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Open new cache
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Opened new cache:', CACHE_NAME);
          return cache.addAll(urlsToCache);
        })
    ])
  );
});

// Activate event - take control and clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      // Clear old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== CHAT_CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache on activate:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Handle chat API requests for offline support
  if (event.request.url.includes('/api/chat') || event.request.url.includes('/api/conversations')) {
    event.respondWith(
      handleChatRequest(event.request)
    );
  } else if (event.request.url.includes('/api/insights') || event.request.url.includes('/api/analytics')) {
    // Handle insights and analytics with enhanced caching
    event.respondWith(
      handleInsightsRequest(event.request)
    );
  } else {
    // Handle other requests with cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request);
        })
    );
  }
});

// Enhanced background sync for various data types
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
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
      console.log('Unknown sync tag:', event.tag);
  }
});

// Periodic sync for background data updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === BACKGROUND_SYNC_TAGS.PERIODIC_SYNC) {
    event.waitUntil(performPeriodicSync());
  }
});

// Enhanced chat data sync
async function syncChatData() {
  try {
    // Get offline data from IndexedDB
    const offlineData = await getOfflineChatData();
    
    if (!offlineData.conversations || offlineData.conversations.length === 0) {
      console.log('No offline chat data to sync');
      return;
    }
    
    // Sync with server
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offlineData)
    });
    
    if (response.ok) {
      console.log('Chat data synced successfully');
      // Clear offline data after successful sync
      await clearOfflineData();
      
      // Notify clients of successful sync
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_SUCCESS',
            data: { chatData: true }
          });
        });
      });
    } else {
      throw new Error(`Sync failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Chat sync failed:', error);
    
    // Schedule retry with exponential backoff
    await scheduleRetry(BACKGROUND_SYNC_TAGS.CHAT_SYNC, error);
  }
}

// Sync hands-free data
async function syncHandsFreeData() {
  try {
    // Sync voice commands and transcriptions
    const voiceData = await getOfflineVoiceData();
    
    if (voiceData && voiceData.length > 0) {
      const response = await fetch('/api/voice/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceData })
      });
      
      if (response.ok) {
        console.log('Voice data synced successfully');
        await clearOfflineVoiceData();
      }
    }
  } catch (error) {
    console.error('Voice data sync failed:', error);
  }
}

// Sync image data
async function syncImageData() {
  try {
    // Sync cached images and analysis results
    const imageData = await getOfflineImageData();
    
    if (imageData && imageData.length > 0) {
      const response = await fetch('/api/images/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });
      
      if (response.ok) {
        console.log('Image data synced successfully');
        await clearOfflineImageData();
      }
    }
  } catch (error) {
    console.error('Image data sync failed:', error);
  }
}

// Periodic sync for background updates
async function performPeriodicSync() {
  try {
    console.log('Performing periodic sync');
    
    // Sync all types of offline data
    await Promise.all([
      syncChatData(),
      syncHandsFreeData(),
      syncImageData()
    ]);
    
    // Update cached content
    await updateCachedContent();
    
    console.log('Periodic sync completed successfully');
  } catch (error) {
    console.error('Periodic sync failed:', error);
  }
}

// Schedule retry with exponential backoff
async function scheduleRetry(syncTag, error) {
  const retryCount = await getRetryCount(syncTag);
  const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
  
  console.log(`Scheduling retry for ${syncTag} in ${backoffTime}ms (attempt ${retryCount + 1})`);
  
  setTimeout(() => {
    self.registration.sync.register(syncTag);
  }, backoffTime);
  
  await incrementRetryCount(syncTag);
}

// Get retry count for a sync tag
async function getRetryCount(syncTag) {
  try {
    const cache = await caches.open('retry-counts');
    const response = await cache.match(syncTag);
    return response ? parseInt(await response.text()) : 0;
  } catch (error) {
    return 0;
  }
}

// Increment retry count for a sync tag
async function incrementRetryCount(syncTag) {
  try {
    const cache = await caches.open('retry-counts');
    const currentCount = await getRetryCount(syncTag);
    const newCount = currentCount + 1;
    
    await cache.put(syncTag, new Response(newCount.toString()));
  } catch (error) {
    console.error('Failed to increment retry count:', error);
  }
}

// Update cached content
async function updateCachedContent() {
  try {
    // Update static assets
    const staticCache = await caches.open(STATIC_CACHE);
    const requests = await staticCache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await staticCache.put(request, response);
        }
      } catch (error) {
        console.log('Failed to update cached asset:', request.url);
      }
    }
  } catch (error) {
    console.error('Failed to update cached content:', error);
  }
}

// Handle insights and analytics requests
async function handleInsightsRequest(request) {
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Insights request failed, trying cache:', error);
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'You are offline. Showing cached insights.',
      data: await getOfflineInsightsData()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get offline insights data
async function getOfflineInsightsData() {
  // This will be implemented with IndexedDB in the main app
  return { insights: [], offline: true };
}

// Get offline voice data
async function getOfflineVoiceData() {
  // This will be implemented with IndexedDB in the main app
  return [];
}

// Get offline image data
async function getOfflineImageData() {
  // This will be implemented with IndexedDB in the main app
  return [];
}

// Clear offline voice data
async function clearOfflineVoiceData() {
  // This will be implemented with IndexedDB in the main app
  console.log('Offline voice data cleared after sync');
}

// Clear offline image data
async function clearOfflineImageData() {
  // This will be implemented with IndexedDB in the main app
  console.log('Offline image data cleared after sync');
}

// Handle chat requests with offline support
async function handleChatRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CHAT_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    // Network failed, try cache
    const cache = await caches.open(CHAT_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'You are offline. Showing cached conversations.',
      data: await getOfflineChatData()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get offline chat data from IndexedDB
async function getOfflineChatData() {
  // This will be implemented with IndexedDB in the main app
  return { conversations: [], offline: true };
}

// Sync all offline data
async function syncOfflineData() {
  try {
    // Sync conversations, usage, settings, etc.
    await syncChatData();
    // Add other sync operations here
    
    console.log('All offline data synced');
  } catch (error) {
    console.error('Offline data sync failed:', error);
  }
}

// Clear offline data after successful sync
async function clearOfflineData() {
  // This will be implemented with IndexedDB in the main app
  console.log('Offline data cleared after sync');
}

// Push notification handling
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
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Otagon', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(`${BASE_PATH}/`)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow(`${BASE_PATH}/`)
    );
  }
});

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SYNC_OFFLINE_DATA') {
    // Trigger background sync for offline data
    self.registration.sync.register('offline-data-sync');
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== CHAT_CACHE_NAME && 
              cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Performance-optimized request handlers

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Static request failed:', error);
    // Return offline fallback for critical assets
    if (request.url.includes('index.html')) {
      return caches.match(`${BASE_PATH}/`);
    }
    throw error;
  }
}

// Handle external API requests with network-first strategy
async function handleExternalRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('External request failed, trying cache:', error);
    
    // Try cache as fallback
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Handle default requests with network-first strategy
async function handleDefaultRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Default request failed, trying cache:', error);
    
    // Try cache as fallback
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}
