let ws: WebSocket | null = null;
const SERVER_ADDRESS = 'wss://otakon-relay.onrender.com';

// ✅ SCALABILITY: Connection management
let reconnectAttempts = 0;
const maxBackoffMs = 5000;
const maxReconnectAttempts = 5;

// ✅ SCALABILITY: Message queuing with size limits
const sendQueue: object[] = [];
const MAX_QUEUE_SIZE = 100; // Prevent memory bloat

// ✅ SCALABILITY: Connection state management
let lastCode: string | null = null;
let handlers: { onOpen: () => void; onMessage: (data: any) => void; onError: (error: string) => void; onClose: () => void } | null = null;

// ✅ SCALABILITY: Timer management for cleanup
let heartbeatTimer: number | null = null;
let reconnectTimer: number | null = null;
const HEARTBEAT_MS = 90000; // 90s

// ✅ SCALABILITY: Rate limiting
const messageRateLimiter = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_MESSAGES_PER_MINUTE = 30;

// ✅ SCALABILITY: Memory management
let isDestroyed = false;
const cleanupFunctions: (() => void)[] = [];

// ✅ SCALABILITY: Rate limiting check
const checkRateLimit = (): boolean => {
  if (isDestroyed) return false;
  
  const now = Date.now();
  const key = 'websocket_messages';
  const attempt = messageRateLimiter.get(key);
  
  if (!attempt || now > attempt.resetTime) {
    messageRateLimiter.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (attempt.count >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }
  
  attempt.count++;
  return true;
};

// ✅ SCALABILITY: Cleanup function
const cleanup = () => {
  if (isDestroyed) return;
  
  console.log('🧹 [WebSocket] Cleaning up...');
  
  isDestroyed = true;
  
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (ws) {
    ws.close();
    ws = null;
  }
  
  handlers = null;
  sendQueue.length = 0;
  messageRateLimiter.clear();
  
  // Run cleanup functions
  cleanupFunctions.forEach(cleanup => {
    try {
      cleanup();
    } catch (error) {
      console.error('Error during websocket cleanup:', error);
    }
  });
  cleanupFunctions.length = 0;
  
  console.log('🧹 [WebSocket] Cleanup completed');
};

const connect = (
  code: string,
  onOpen: () => void,
  onMessage: (data: any) => void,
  onError: (error: string) => void,
  onClose: () => void
) => {
  if (isDestroyed) {
    onError('WebSocket service has been destroyed');
    return;
  }

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    // Skip logging for already connected state
    return;
  }

  // Only accept 6-digit codes
  if (!/^\d{6}$/.test(code)) {
    onError("Invalid code format. Please enter a 6-digit code.");
    return;
  }

  lastCode = code;
  handlers = { onOpen, onMessage, onError, onClose };

  const fullUrl = `${SERVER_ADDRESS}/${code}`;

  try {
    ws = new WebSocket(fullUrl);
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unknown error occurred.";
    onError(`Connection failed: ${message}. Please check the URL and your network connection.`);
    return;
  }

  ws.onopen = () => {
    // Connection established - no need to log every connection
    reconnectAttempts = 0;
    onOpen();
    // Flush queued messages
    while (sendQueue.length && ws && ws.readyState === WebSocket.OPEN) {
      const payload = sendQueue.shift();
      try { ws.send(JSON.stringify(payload)); } catch {}
    }

    // Start heartbeat
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    heartbeatTimer = window.setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: 'ping', ts: Date.now() })); } catch {}
      }
    }, HEARTBEAT_MS);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Only log errors in development, not every message
      onMessage(data);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error("Failed to parse WebSocket message:", event.data, e);
      // Ignore non-JSON
    }
  };

  ws.onerror = () => {
    // Handled by onclose
  };

  ws.onclose = (event: CloseEvent) => {
    // Only log unexpected closures
    if (!event.wasClean && process.env.NODE_ENV === 'development') {
      console.warn(`WebSocket connection closed unexpectedly. Code: ${event.code}, Reason: '${event.reason}'`);
    }

    if (!event.wasClean) {
      let errorMessage = "Connection closed unexpectedly.";
      if (event.code === 1006) {
        errorMessage = "Connection to the server failed. Please check your network, verify the code, and ensure the PC client is running.";
      } else if (event.reason) {
        errorMessage = `Connection closed: ${event.reason}`;
      }
      onError(errorMessage);
    }

    ws = null;
    onClose();

    // Stop heartbeat
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    // Auto-reconnect with backoff+jitter
    if (lastCode && handlers) {
      reconnectAttempts += 1;
      const base = Math.min(maxBackoffMs, 500 * Math.pow(2, reconnectAttempts - 1));
      const jitter = Math.random() * 300;
      const delay = base + jitter;
      setTimeout(() => {
        if (!ws && handlers) {
          connect(lastCode!, handlers.onOpen, handlers.onMessage, handlers.onError, handlers.onClose);
        }
      }, delay);
    }
  };
};

const send = (data: object) => {
  if (isDestroyed) {
    console.warn('🔌 [WebSocket] Cannot send message - service destroyed');
    return;
  }

  // ✅ SCALABILITY: Check rate limit
  if (!checkRateLimit()) {
    console.warn('🔌 [WebSocket] Rate limit exceeded, message dropped');
    return;
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(data));
    } catch (e) {
      // Silently fail - connection will be retried
    }
  } else {
    // ✅ SCALABILITY: Check queue size limit
    if (sendQueue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest message to make room
      sendQueue.shift();
    }
    // Queue and let onopen flush
    sendQueue.push(data);
    // Message queued - no need to log every queued message
  }
};

const disconnect = () => {
  cleanup();
};

// ✅ SCALABILITY: Export cleanup function
export { connect, disconnect, send, cleanup };
