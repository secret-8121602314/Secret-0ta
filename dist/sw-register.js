// Service Worker Registration for Background Operations
// This ensures the PWA continues running when screen locks

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration.scope);
      
      // Request notification permission for background alerts
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service Worker update found');
        
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New Service Worker available - refresh to update');
            // Notify user of update
            window.dispatchEvent(new CustomEvent('sw-update-available'));
          }
        });
      });
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from Service Worker:', event.data);
        
        if (event.data.type === 'BACKGROUND_TTS_COMPLETE') {
          window.dispatchEvent(new CustomEvent('otakon:ttsBackgroundComplete'));
        }
        
        // Handle auth cache cleared - reload to login page
        if (event.data.type === 'AUTH_CACHE_CLEARED') {
          console.log('Auth cache cleared by service worker');
          window.dispatchEvent(new CustomEvent('otakon:authCacheCleared'));
        }
        
        // Handle keep-alive pings
        if (event.data.type === 'KEEP_ALIVE_PING') {
          console.log('Keep-alive ping received from SW');
        }
      });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
  
  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('Page hidden - Service Worker maintaining session');
    } else {
      console.log('Page visible - resuming foreground operation');
    }
  });
}
