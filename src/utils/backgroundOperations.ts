/**
 * Background Operations Manager for PWA
 * Handles background sync, audio continuation, periodic refresh, and session management
 * Only works in PWA mode
 */

import { isPWAMode } from './pwaDetection';

// ============================================
// BACKGROUND SYNC FOR MESSAGES
// ============================================

interface PendingMessage {
  id: string;
  chatId: string;
  content: string;
  timestamp: number;
  retryCount: number;
}

const PENDING_MESSAGES_KEY = 'otagon_pending_messages';
const MAX_RETRY_COUNT = 3;

/**
 * Register background sync for pending messages
 */
export async function registerMessageSync(): Promise<boolean> {
  if (!isPWAMode() || !('serviceWorker' in navigator)) {
    console.warn('[BackgroundSync] Not supported or not in PWA mode');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Background sync may not be available on all browsers
    if ('sync' in registration) {
      await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-messages');
      console.log('[BackgroundSync] Message sync registered');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[BackgroundSync] Failed to register:', error);
    return false;
  }
}

/**
 * Queue a message for background sync
 */
export function queueMessageForSync(chatId: string, content: string): string {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const pendingMessage: PendingMessage = {
    id: messageId,
    chatId,
    content,
    timestamp: Date.now(),
    retryCount: 0,
  };

  const pending = getPendingMessages();
  pending.push(pendingMessage);
  savePendingMessages(pending);

  // Try to register sync
  registerMessageSync();

  return messageId;
}

/**
 * Get pending messages from storage
 */
export function getPendingMessages(): PendingMessage[] {
  try {
    const data = localStorage.getItem(PENDING_MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[BackgroundSync] Failed to get pending messages:', error);
    return [];
  }
}

/**
 * Save pending messages to storage
 */
function savePendingMessages(messages: PendingMessage[]): void {
  try {
    localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('[BackgroundSync] Failed to save pending messages:', error);
  }
}

/**
 * Remove a message from pending queue
 */
export function removePendingMessage(messageId: string): void {
  const pending = getPendingMessages();
  const filtered = pending.filter(msg => msg.id !== messageId);
  savePendingMessages(filtered);
}

/**
 * Increment retry count for a message
 */
export function incrementMessageRetry(messageId: string): void {
  const pending = getPendingMessages();
  const message = pending.find(msg => msg.id === messageId);
  
  if (message) {
    message.retryCount++;
    
    // Remove if max retries reached
    if (message.retryCount >= MAX_RETRY_COUNT) {
      console.warn(`[BackgroundSync] Message ${messageId} exceeded max retries, removing`);
      removePendingMessage(messageId);
    } else {
      savePendingMessages(pending);
    }
  }
}

// ============================================
// BACKGROUND AUDIO CONTINUATION
// ============================================

let audioContext: AudioContext | null = null;
let silentSource: AudioBufferSourceNode | null = null;

/**
 * Initialize background audio system for TTS continuation
 */
export function initBackgroundAudio(): void {
  if (!isPWAMode()) {
    return;
  }

  try {
    // Create audio context for background playback
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioContextClass();
    console.log('[BackgroundAudio] Audio context initialized');
  } catch (error) {
    console.error('[BackgroundAudio] Failed to initialize:', error);
  }
}

/**
 * Keep audio session alive in background
 */
export function keepAudioAlive(): void {
  if (!isPWAMode() || !audioContext) {
    return;
  }

  try {
    // Create silent audio buffer (1 second of silence)
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    
    // Create source and connect
    silentSource = audioContext.createBufferSource();
    silentSource.buffer = buffer;
    silentSource.loop = true;
    silentSource.connect(audioContext.destination);
    silentSource.start();
    
    console.log('[BackgroundAudio] Silent audio loop started');
  } catch (error) {
    console.error('[BackgroundAudio] Failed to keep audio alive:', error);
  }
}

/**
 * Stop background audio
 */
export function stopBackgroundAudio(): void {
  if (silentSource) {
    try {
      silentSource.stop();
      silentSource.disconnect();
      silentSource = null;
      console.log('[BackgroundAudio] Silent audio loop stopped');
    } catch (error) {
      console.error('[BackgroundAudio] Failed to stop audio:', error);
    }
  }
}

/**
 * Resume audio context if suspended
 */
export async function resumeAudioContext(): Promise<void> {
  if (!audioContext) {
    return;
  }

  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('[BackgroundAudio] Audio context resumed');
    }
  } catch (error) {
    console.error('[BackgroundAudio] Failed to resume audio context:', error);
  }
}

// ============================================
// PERIODIC BACKGROUND REFRESH
// ============================================

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
let refreshIntervalId: number | null = null;

/**
 * Register periodic background sync
 */
export async function registerPeriodicSync(): Promise<boolean> {
  if (!isPWAMode() || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if periodic sync is supported
    if ('periodicSync' in registration) {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName,
      });

      if (status.state === 'granted') {
        await (registration as unknown as { periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> } }).periodicSync.register('periodic-refresh', {
          minInterval: REFRESH_INTERVAL,
        });
        console.log('[PeriodicSync] Registered successfully');
        return true;
      } else {
        console.warn('[PeriodicSync] Permission not granted');
      }
    }
  } catch (error) {
    console.error('[PeriodicSync] Failed to register:', error);
  }

  // Fallback to regular interval if periodic sync not supported
  startFallbackRefresh();
  return false;
}

/**
 * Fallback refresh using setInterval (when app is active)
 */
function startFallbackRefresh(): void {
  if (refreshIntervalId) {
    return;
  }

  refreshIntervalId = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      triggerRefresh();
    }
  }, REFRESH_INTERVAL);

  console.log('[PeriodicSync] Fallback refresh started');
}

/**
 * Stop fallback refresh
 */
export function stopPeriodicSync(): void {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
    console.log('[PeriodicSync] Stopped');
  }
}

/**
 * Trigger a refresh operation
 */
function triggerRefresh(): void {
  console.log('[PeriodicSync] Triggering refresh...');
  
  // Dispatch custom event for app to handle
  window.dispatchEvent(new CustomEvent('otagon-periodic-refresh', {
    detail: { timestamp: Date.now() }
  }));
}

// ============================================
// SESSION KEEP-ALIVE
// ============================================

const SESSION_PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
let sessionPingId: number | null = null;
let lastActivityTime = Date.now();

/**
 * Initialize session keep-alive
 */
export function initSessionKeepAlive(): void {
  if (!isPWAMode()) {
    return;
  }

  // Track user activity
  const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
  activityEvents.forEach(event => {
    window.addEventListener(event, updateLastActivity, { passive: true });
  });

  // Start session ping
  sessionPingId = window.setInterval(() => {
    pingSession();
  }, SESSION_PING_INTERVAL);

  console.log('[SessionKeepAlive] Initialized');
}

/**
 * Update last activity timestamp
 */
function updateLastActivity(): void {
  lastActivityTime = Date.now();
}

/**
 * Ping session to keep it alive
 */
async function pingSession(): Promise<void> {
  const timeSinceActivity = Date.now() - lastActivityTime;
  
  // Only ping if there was recent activity (within last 30 minutes)
  if (timeSinceActivity > 30 * 60 * 1000) {
    console.log('[SessionKeepAlive] No recent activity, skipping ping');
    return;
  }

  try {
    // Send ping to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SESSION_PING',
        timestamp: Date.now(),
      });
    }

    // Dispatch event for app to refresh auth token if needed
    window.dispatchEvent(new CustomEvent('otagon-session-ping', {
      detail: { timestamp: Date.now() }
    }));

    console.log('[SessionKeepAlive] Ping sent');
  } catch (error) {
    console.error('[SessionKeepAlive] Ping failed:', error);
  }
}

/**
 * Stop session keep-alive
 */
export function stopSessionKeepAlive(): void {
  if (sessionPingId) {
    clearInterval(sessionPingId);
    sessionPingId = null;
    console.log('[SessionKeepAlive] Stopped');
  }
}

/**
 * Get session status
 */
export function getSessionStatus(): {
  lastActivity: number;
  timeSinceActivity: number;
  isActive: boolean;
} {
  const timeSinceActivity = Date.now() - lastActivityTime;
  return {
    lastActivity: lastActivityTime,
    timeSinceActivity,
    isActive: timeSinceActivity < 30 * 60 * 1000,
  };
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize all background operations
 */
export function initBackgroundOperations(): void {
  if (!isPWAMode()) {
    console.log('[BackgroundOps] Not in PWA mode, skipping initialization');
    return;
  }

  console.log('[BackgroundOps] Initializing...');
  
  initBackgroundAudio();
  registerPeriodicSync();
  initSessionKeepAlive();

  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[BackgroundOps] App visible, resuming...');
      resumeAudioContext();
      triggerRefresh();
    } else {
      console.log('[BackgroundOps] App hidden, maintaining background operations...');
    }
  });

  console.log('[BackgroundOps] Initialized successfully');
}

/**
 * Cleanup background operations
 */
export function cleanupBackgroundOperations(): void {
  stopBackgroundAudio();
  stopPeriodicSync();
  stopSessionKeepAlive();
  console.log('[BackgroundOps] Cleaned up');
}

// Auto-initialize if in PWA mode
if (isPWAMode() && document.readyState === 'complete') {
  initBackgroundOperations();
} else if (isPWAMode()) {
  window.addEventListener('load', initBackgroundOperations);
}
