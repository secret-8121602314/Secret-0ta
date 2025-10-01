import { ConnectionStatus } from '../types';

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
      if (data.type === 'pong') {
        // Heartbeat response - no action needed
        return;
      }
      onMessage(data);
    } catch (e) {
      // Only log parsing errors for non-heartbeat messages
      console.warn('Failed to parse WebSocket message');
    }
  };

  ws.onerror = () => {
    // Only log significant errors, not routine connection issues
    console.warn('WebSocket connection error');
    onError('Connection error occurred. Please try again.');
  };

  ws.onclose = (event) => {
    // Only log unexpected closures
    if (event.code !== 1000) {
      console.warn('WebSocket closed unexpectedly:', event.code, event.reason);
    }
    
    // Clear heartbeat
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    // Attempt reconnection if not a clean close
    if (event.code !== 1000 && lastCode && reconnectAttempts < 5) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxBackoffMs);
      reconnectAttempts++;
      
      setTimeout(() => {
        if (lastCode && handlers) {
          // Only log first few reconnection attempts
          if (reconnectAttempts <= 2) {
            console.log(`WebSocket reconnecting... (${reconnectAttempts}/5)`);
          }
          connect(lastCode, handlers.onOpen, handlers.onMessage, handlers.onError, handlers.onClose);
        }
      }, delay);
    } else {
      onClose();
    }
  };
};

const disconnect = () => {
  if (ws) {
    ws.close(1000, 'User disconnected');
    ws = null;
  }
  
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  
  lastCode = null;
  handlers = null;
  reconnectAttempts = 0;
};

const sendMessage = (message: object) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message));
    } catch (e) {
      // Only log send errors in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to send WebSocket message');
      }
    }
  } else {
    // Queue message for when connection is restored
    sendQueue.push(message);
  }
};

const getConnectionStatus = (): ConnectionStatus => {
  if (!ws) return ConnectionStatus.DISCONNECTED;
  
  switch (ws.readyState) {
    case WebSocket.CONNECTING:
      return ConnectionStatus.CONNECTING;
    case WebSocket.OPEN:
      return ConnectionStatus.CONNECTED;
    case WebSocket.CLOSING:
    case WebSocket.CLOSED:
    default:
      return ConnectionStatus.DISCONNECTED;
  }
};

export {
  connect,
  disconnect,
  sendMessage,
  getConnectionStatus,
  SERVER_ADDRESS
};
