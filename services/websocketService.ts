
let ws: WebSocket | null = null;
const SERVER_ADDRESS = 'wss://otakon-relay.onrender.com';

let reconnectAttempts = 0;
const maxBackoffMs = 5000;
const sendQueue: object[] = [];
let lastCode: string | null = null;
let handlers: { onOpen: () => void; onMessage: (data: any) => void; onError: (error: string) => void; onClose: () => void } | null = null;
let heartbeatTimer: number | null = null;
const HEARTBEAT_MS = 90000; // 90s

const connect = (
  code: string,
  onOpen: () => void,
  onMessage: (data: any) => void,
  onError: (error: string) => void,
  onClose: () => void
) => {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    if (import.meta.env.DEV) console.log("WebSocket is already open or connecting.");
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
    if (import.meta.env.DEV) console.log("WebSocket connection established to:", fullUrl);
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
      if (import.meta.env.DEV) {
        console.log("🔌 WebSocket message received:", data);
        console.log("🔌 Message type:", data.type);
      }
      onMessage(data);
    } catch (e) {
      if (import.meta.env.DEV) console.error("Failed to parse WebSocket message:", event.data, e);
      // Ignore non-JSON
    }
  };

  ws.onerror = () => {
    // Handled by onclose
  };

  ws.onclose = (event: CloseEvent) => {
    if (import.meta.env.DEV) console.log(`WebSocket connection closed. Code: ${event.code}, Reason: '${event.reason}', Clean: ${event.wasClean}`);

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
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    // Queue and let onopen flush
    sendQueue.push(data);
    if (import.meta.env.DEV) console.warn("WebSocket is not connected. Queued message:", data);
  }
};

const disconnect = () => {
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
  if (import.meta.env.DEV) {
    console.log("🔌 WebSocket disconnected and all reconnection state cleared");
  }
};

export { connect, disconnect, send };
