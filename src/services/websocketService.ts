let ws: WebSocket | null = null;
const SERVER_ADDRESS = 'wss://otakon-relay.onrender.com';

let reconnectAttempts = 0;
const maxBackoffMs = 5000;
const sendQueue: object[] = [];
let lastCode: string | null = null;
let handlers: { onOpen: () => void; onMessage: (data: any) => void; onError: (error: string) => void; onClose: () => void } | null = null;
let heartbeatTimer: number | null = null;
let shouldReconnect = true; // ✅ FIX: Flag to prevent reconnection after explicit disconnect
const HEARTBEAT_MS = 30000; // 30s - more frequent heartbeat to maintain connection


const connect = (
  code: string,
  onOpen: () => void,
  onMessage: (data: any) => void,
  onError: (error: string) => void,
  onClose: () => void
) => {

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
  shouldReconnect = true; // ✅ FIX: Enable reconnection for new connections

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
      try { 
        ws.send(JSON.stringify(payload)); 
      } catch {
        // Ignore send errors during queue processing
      }
    }

    // Start heartbeat
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    heartbeatTimer = window.setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try { 
          ws.send(JSON.stringify({ type: 'ping', ts: Date.now() })); 
        } catch {
          // Ignore heartbeat send errors
        }
      }
    }, HEARTBEAT_MS);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Only log errors in development, not every message
      onMessage(data);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to parse WebSocket message:", event.data, e);
      }
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

    // Auto-reconnect with backoff+jitter (only if not explicitly disconnected)
    // ✅ FIX: Check shouldReconnect flag to prevent reconnection after explicit disconnect
    if (shouldReconnect && lastCode && handlers) {
      reconnectAttempts += 1;
      const base = Math.min(maxBackoffMs, 500 * Math.pow(2, reconnectAttempts - 1));
      const jitter = Math.random() * 300;
      const delay = base + jitter;
      setTimeout(() => {
        if (!ws && handlers && shouldReconnect) {
          connect(lastCode!, handlers.onOpen, handlers.onMessage, handlers.onError, handlers.onClose);
        }
      }, delay);
    }
  };
};

const send = (data: object) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    // Queue and let onopen flush
    sendQueue.push(data);
    // Message queued - no need to log every queued message
  }
};

const disconnect = () => {
  // ✅ FIX: Set flag FIRST to prevent race condition with onclose handler
  shouldReconnect = false;
  
  if (ws) {
    ws.close(1000, "User disconnected");
    ws = null;
  }
  reconnectAttempts = 0;
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  
  // Clear all connection state to prevent auto-reconnection after logout
  lastCode = null;
  handlers = null;
  
  // Clear any pending reconnection attempts
  if (process.env.NODE_ENV === 'development') {
    console.log("🔌 WebSocket disconnected and all reconnection state cleared");
  }
};

export { connect, disconnect, send };
