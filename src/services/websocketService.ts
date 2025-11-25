import { toastService } from './toastService';

let ws: WebSocket | null = null;
const SERVER_ADDRESS = 'wss://otakon-relay.onrender.com';

let reconnectAttempts = 0;
const maxBackoffMs = 5000;
const sendQueue: Record<string, unknown>[] = [];
let lastCode: string | null = null;
let handlers: { onOpen: () => void; onMessage: (data: Record<string, unknown>) => void; onError: (error: string) => void; onClose: () => void } | null = null;
let heartbeatTimer: number | null = null;
let shouldReconnect = true; // ✅ FIX: Flag to prevent reconnection after explicit disconnect
const HEARTBEAT_MS = 30000; // 30s - more frequent heartbeat to maintain connection

const connect = (
  code: string,
  onOpen: () => void,
  onMessage: (data: Record<string, unknown>) => void,
  onError: (error: string) => void,
  onClose: () => void
) => {

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    // Skip logging for already connected state
    return;
  }

  // Only accept 6-digit codes
  if (!/^\d{6}$/.test(code)) {
    const errorMsg = "Invalid code format. Please enter a 6-digit code.";
    onError(errorMsg);
    toastService.error(errorMsg);
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
    const errorMsg = `Connection failed: ${message}. Please check the URL and your network connection.`;
    onError(errorMsg);
    toastService.error('PC connection failed. Please check your network and try again.');
    return;
  }

  ws.onopen = () => {
    // Connection established
    console.log('🔗 [WebSocket] Connection opened successfully to', fullUrl);
    reconnectAttempts = 0;
    onOpen();
    
    // Immediately send connection request to speed up handshake
    try {
      ws?.send(JSON.stringify({ type: 'connection_request', code: code, ts: Date.now() }));
      console.log('🔗 [WebSocket] Sent connection_request with code:', code);
    } catch (error) {
      console.error('🔗 [WebSocket] Failed to send connection_request:', error);
    }
    
    // Flush queued messages
    while (sendQueue.length && ws && ws.readyState === WebSocket.OPEN) {
      const payload = sendQueue.shift();
      try { 
        ws.send(JSON.stringify(payload)); 
        console.log('🔗 [WebSocket] Sent queued message:', payload?.type);
      } catch (error) {
        console.error('🔗 [WebSocket] Failed to send queued message:', error);
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
      console.log('🔗 [WebSocket] Message received:', {
        type: data.type || 'unknown',
        hasDataUrl: !!data.dataUrl,
        dataUrlLength: data.dataUrl?.length,
        keys: Object.keys(data)
      });
      
      // Log full message for screenshot types to debug
      if (data.type === 'screenshot_success' || data.type === 'screenshot_batch' || data.type === 'screenshot') {
        console.log('🔗 [WebSocket] Full screenshot message:', JSON.stringify(data).substring(0, 500));
      }
      
      // ✅ FIX: Call from handlers object instead of closure to get fresh handler
      if (handlers && typeof handlers.onMessage === 'function') {
        console.log('🔗 [WebSocket] Invoking onMessage handler with data:', data.type);
        try {
          handlers.onMessage(data);
          console.log('🔗 [WebSocket] Handler completed successfully');
        } catch (err) {
          console.error('🔗 [WebSocket] Handler threw error:', err);
        }
      } else {
        console.error('🔗 [WebSocket] No valid onMessage handler!', handlers);
      }
    } catch (e) {
      console.error("🔗 [WebSocket] Failed to parse message:", event.data, e);
    }
  };

  ws.onerror = () => {
    // Handled by onclose
  };

  ws.onclose = (event: CloseEvent) => {
    console.log('🔗 [WebSocket] Connection closed:', {
      wasClean: event.wasClean,
      code: event.code,
      reason: event.reason
    });

    if (!event.wasClean) {
      let errorMessage = "Connection closed unexpectedly.";
      if (event.code === 1006) {
        errorMessage = "Connection to the server failed. Please check your network, verify the code, and ensure the PC client is running.";
        // Only show toast for critical connection failures, not during auto-reconnect
        if (reconnectAttempts === 0) {
          toastService.warning('PC connection lost. Attempting to reconnect...');
        }
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

const send = (data: Record<string, unknown>) => {
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
      }
};

// ✅ FIX: Allow updating handlers without reconnecting to prevent stale closures
const setHandlers = (
  onOpen: () => void,
  onMessage: (data: Record<string, unknown>) => void,
  onError: (error: string) => void,
  onClose: () => void
) => {
  handlers = { onOpen, onMessage, onError, onClose };
  console.log('🔗 [WebSocket] Handlers updated');
};

export { connect, disconnect, send, setHandlers };
