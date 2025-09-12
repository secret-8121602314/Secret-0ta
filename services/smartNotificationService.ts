export interface SmartNotificationService {
  initialize(): Promise<void>;
  showAINotification(message: string, conversationId?: string): void;
  isScreenLocked(): boolean;
  requestPermission(): Promise<NotificationPermission>;
  isSupported(): boolean;
}

class SmartNotificationServiceImpl implements SmartNotificationService {
  private screenLocked = false;
  private lastActivity = Date.now();
  private readonly LOCK_TIMEOUT = 30000; // 30 seconds of inactivity = locked

  constructor() {
    // Initialize immediately instead of lazy initialization for Firebase hosting compatibility
    this.initialize();
  }

  async initialize(): Promise<void> {

    try {
      // Don't request notification permission during initialization
      // It will be requested on-demand when actually needed
      
      // Set up screen lock detection
      this.setupScreenLockDetection();
      
      // Set up activity monitoring
      this.setupActivityMonitoring();
      
      // Initialization complete - no need for isInitialized flag
      console.log('Smart notification service initialized');
    } catch (error) {
      console.error('Failed to initialize smart notification service:', error);
    }
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  private setupScreenLockDetection(): void {
    // Monitor visibility changes (app going to background)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.screenLocked = true;
        console.log('Screen locked (app hidden)');
      } else {
        this.screenLocked = false;
        this.lastActivity = Date.now();
        console.log('Screen unlocked (app visible)');
      }
    });

    // Monitor page focus/blur
    window.addEventListener('blur', () => {
      this.screenLocked = true;
      console.log('Screen locked (page blurred)');
    });

    window.addEventListener('focus', () => {
      this.screenLocked = false;
      this.lastActivity = Date.now();
      console.log('Screen unlocked (page focused)');
    });

    // Monitor device orientation changes (mobile)
    if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', () => {
        this.lastActivity = Date.now();
      });
    }

    // Monitor touch events (mobile)
    document.addEventListener('touchstart', () => {
      this.lastActivity = Date.now();
      this.screenLocked = false;
    });

    // Monitor mouse events (desktop)
    document.addEventListener('mousemove', () => {
      this.lastActivity = Date.now();
      this.screenLocked = false;
    });

    document.addEventListener('keydown', () => {
      this.lastActivity = Date.now();
      this.screenLocked = false;
    });

    // Check for inactivity periodically
    setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity;
      if (timeSinceLastActivity > this.LOCK_TIMEOUT && !this.screenLocked) {
        this.screenLocked = true;
        console.log('Screen locked due to inactivity');
      }
    }, 10000); // Check every 10 seconds
  }

  private setupActivityMonitoring(): void {
    // Monitor network activity for AI responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Check if this is an AI response
      if (this.isAIResponse(args[0], response)) {
        this.handleAIResponse(response);
      }
      
      return response;
    };
  }

  private isAIResponse(url: RequestInfo | URL, response: Response): boolean {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Check if it's a chat/API endpoint
    if (urlString.includes('/api/chat') || urlString.includes('/api/conversations')) {
      return true;
    }
    
    return false;
  }

  private async handleAIResponse(response: Response): Promise<void> {
    try {
      // Clone response to read content
      const responseClone = response.clone();
      const data = await responseClone.json();
      
      // Check if this contains an AI response
      if (data && (data.response || data.message || data.content)) {
        // Extract the AI response text
        const aiMessage = data.response || data.message || data.content || 'AI response received';
        
        // Show notification if screen is locked
        if (this.isScreenLocked()) {
          this.showAINotification(aiMessage, data.conversationId);
        }
      }
    } catch (error) {
      // Ignore errors when parsing response
    }
  }

  isScreenLocked(): boolean {
    return this.screenLocked;
  }

  showAINotification(message: string, conversationId?: string): void {
    if (Notification.permission !== 'granted') {
      console.log('Notifications not permitted');
      return;
    }

    // Truncate message if too long
    const truncatedMessage = message.length > 100 
      ? message.substring(0, 100) + '...' 
      : message;

    const notification = new Notification('Otakon AI Response', {
      body: truncatedMessage,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: conversationId || 'ai-response',
      requireInteraction: false,
      silent: false,
      // vibrate: [200, 100, 200], // Removed for TypeScript compatibility
      data: {
        conversationId,
        timestamp: Date.now(),
        type: 'ai-response'
      },
      // actions: [ // Removed for TypeScript compatibility
      //   {
      //     action: 'open',
      //     title: 'Open Chat',
      //     icon: '/icon-192.png'
      //   },
      //   {
      //     action: 'dismiss',
      //     title: 'Dismiss'
      //   }
      // ]
    });

    // Handle notification clicks
    notification.onclick = (event) => {
      event.preventDefault();
      
      // Instead of changing location, dispatch a custom event
      // The app can listen for this event and handle navigation internally
      const navigationEvent = new CustomEvent('otakonNotificationClick', {
        detail: { conversationId }
      });
      window.dispatchEvent(navigationEvent);
      
      notification.close();
    };

    // Handle notification action clicks
    // notification.onaction = (event) => { // Removed for TypeScript compatibility
    //   if (event.action === 'open') {
    //     if (conversationId) {
    //       window.location.href = `/?conversation=${conversationId}`;
    //     } else {
    //       window.location.href = '/';
    //     }
    //   }
    //   notification.close();
    // };

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    console.log('AI response notification shown:', truncatedMessage);
  }

  

  // Get current screen lock status
  getScreenStatus(): { locked: boolean; lastActivity: number; timeSinceLastActivity: number } {
    return {
      locked: this.screenLocked,
      lastActivity: this.lastActivity,
      timeSinceLastActivity: Date.now() - this.lastActivity
    };
  }
}

export const smartNotificationService = new SmartNotificationServiceImpl();
