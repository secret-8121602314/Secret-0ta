/**
 * IndexedDB Service for Offline Data Persistence
 * 
 * Provides persistent storage for:
 * - Offline message queue (messages sent while offline)
 * - Voice data for hands-free mode
 * - Screenshot data pending upload
 * 
 * Falls back to localStorage if IndexedDB is unavailable (Safari private mode)
 */

const DB_NAME = 'otagon-offline-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  MESSAGES: 'pending-messages',
  VOICE: 'pending-voice',
  IMAGES: 'pending-images',
  SYNC_META: 'sync-metadata'
} as const;

interface PendingMessage {
  id: string;
  conversationId: string;
  content: string;
  imageUrl?: string;
  timestamp: number;
  retryCount: number;
}

interface PendingVoiceData {
  id: string;
  audioData: string;
  timestamp: number;
}

interface PendingImageData {
  id: string;
  imageData: string;
  conversationId: string;
  timestamp: number;
}

interface SyncMetadata {
  lastSyncAttempt: number;
  pendingCount: number;
  lastSuccessfulSync: number;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private isSupported: boolean = true;
  private initPromise: Promise<void> | null = null;
  private readonly MAX_QUEUE_SIZE = 10;

  constructor() {
    // Check if IndexedDB is supported
    if (typeof indexedDB === 'undefined') {
      console.warn('[IndexedDB] Not supported, falling back to localStorage');
      this.isSupported = false;
    }
  }

  /**
   * Initialize the database connection
   */
  async init(): Promise<void> {
    if (!this.isSupported) {
      return;
    }
    if (this.db) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, _reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('[IndexedDB] Failed to open database:', request.error);
          this.isSupported = false;
          resolve(); // Don't reject, fall back to localStorage
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log('[IndexedDB] Database opened successfully');
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
            const messageStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
            messageStore.createIndex('conversationId', 'conversationId', { unique: false });
            messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          if (!db.objectStoreNames.contains(STORES.VOICE)) {
            db.createObjectStore(STORES.VOICE, { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains(STORES.IMAGES)) {
            const imageStore = db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
            imageStore.createIndex('conversationId', 'conversationId', { unique: false });
          }

          if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
            db.createObjectStore(STORES.SYNC_META, { keyPath: 'id' });
          }

          console.log('[IndexedDB] Database schema created/upgraded');
        };
      } catch (error) {
        console.error('[IndexedDB] Initialization error:', error);
        this.isSupported = false;
        resolve(); // Don't reject, fall back to localStorage
      }
    });

    return this.initPromise;
  }

  /**
   * Check if we can queue more messages
   */
  async canQueueMessage(): Promise<{ allowed: boolean; reason?: string }> {
    const count = await this.getPendingMessageCount();
    if (count >= this.MAX_QUEUE_SIZE) {
      return { 
        allowed: false, 
        reason: `Offline queue is full (${this.MAX_QUEUE_SIZE} messages). Please wait for connection to restore.` 
      };
    }
    return { allowed: true };
  }

  /**
   * Queue a message for sending when online
   */
  async queueMessage(message: Omit<PendingMessage, 'id' | 'timestamp' | 'retryCount'>): Promise<string | null> {
    await this.init();

    const pendingMessage: PendingMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    if (!this.isSupported || !this.db) {
      // Fallback to localStorage
      return this.queueMessageToLocalStorage(pendingMessage);
    }

    return new Promise((resolve, _reject) => {
      try {
        if (!this.db) {
          resolve(this.queueMessageToLocalStorage(pendingMessage));
          return;
        }
        const transaction = this.db.transaction([STORES.MESSAGES], 'readwrite');
        const store = transaction.objectStore(STORES.MESSAGES);
        const request = store.add(pendingMessage);

        request.onsuccess = () => {
          console.log('[IndexedDB] Message queued:', pendingMessage.id);
          resolve(pendingMessage.id);
        };

        request.onerror = () => {
          console.error('[IndexedDB] Failed to queue message:', request.error);
          // Fallback to localStorage
          resolve(this.queueMessageToLocalStorage(pendingMessage));
        };
      } catch (error) {
        console.error('[IndexedDB] Error queuing message:', error);
        resolve(this.queueMessageToLocalStorage(pendingMessage));
      }
    });
  }

  /**
   * Get all pending messages
   */
  async getPendingMessages(): Promise<PendingMessage[]> {
    await this.init();

    if (!this.isSupported || !this.db) {
      return this.getPendingMessagesFromLocalStorage();
    }

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve(this.getPendingMessagesFromLocalStorage());
          return;
        }
        const transaction = this.db.transaction([STORES.MESSAGES], 'readonly');
        const store = transaction.objectStore(STORES.MESSAGES);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          console.error('[IndexedDB] Failed to get messages:', request.error);
          resolve(this.getPendingMessagesFromLocalStorage());
        };
      } catch (error) {
        console.error('[IndexedDB] Error getting messages:', error);
        resolve(this.getPendingMessagesFromLocalStorage());
      }
    });
  }

  /**
   * Get count of pending messages
   */
  async getPendingMessageCount(): Promise<number> {
    await this.init();

    if (!this.isSupported || !this.db) {
      const messages = this.getPendingMessagesFromLocalStorage();
      return messages.length;
    }

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve(this.getPendingMessagesFromLocalStorage().length);
          return;
        }
        const transaction = this.db.transaction([STORES.MESSAGES], 'readonly');
        const store = transaction.objectStore(STORES.MESSAGES);
        const request = store.count();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          resolve(this.getPendingMessagesFromLocalStorage().length);
        };
      } catch {
        resolve(this.getPendingMessagesFromLocalStorage().length);
      }
    });
  }

  /**
   * Remove a message from the queue (after successful send)
   */
  async removeMessage(messageId: string): Promise<boolean> {
    await this.init();

    if (!this.isSupported || !this.db) {
      return this.removeMessageFromLocalStorage(messageId);
    }

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve(this.removeMessageFromLocalStorage(messageId));
          return;
        }
        const transaction = this.db.transaction([STORES.MESSAGES], 'readwrite');
        const store = transaction.objectStore(STORES.MESSAGES);
        const request = store.delete(messageId);

        request.onsuccess = () => {
          console.log('[IndexedDB] Message removed:', messageId);
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDB] Failed to remove message:', request.error);
          resolve(this.removeMessageFromLocalStorage(messageId));
        };
      } catch (error) {
        console.error('[IndexedDB] Error removing message:', error);
        resolve(this.removeMessageFromLocalStorage(messageId));
      }
    });
  }

  /**
   * Clear all pending messages
   */
  async clearAllMessages(): Promise<void> {
    await this.init();

    if (!this.isSupported || !this.db) {
      localStorage.removeItem('otakon_pending_messages');
      return;
    }

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          localStorage.removeItem('otakon_pending_messages');
          resolve();
          return;
        }
        const transaction = this.db.transaction([STORES.MESSAGES], 'readwrite');
        const store = transaction.objectStore(STORES.MESSAGES);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('[IndexedDB] All messages cleared');
          resolve();
        };

        request.onerror = () => {
          console.error('[IndexedDB] Failed to clear messages:', request.error);
          localStorage.removeItem('otakon_pending_messages');
          resolve();
        };
      } catch {
        localStorage.removeItem('otakon_pending_messages');
        resolve();
      }
    });
  }

  /**
   * Queue image data for later upload
   */
  async queueImage(data: Omit<PendingImageData, 'id' | 'timestamp'>): Promise<string | null> {
    await this.init();

    const pendingImage: PendingImageData = {
      ...data,
      id: `img_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now()
    };

    if (!this.isSupported || !this.db) {
      // For images, localStorage might not have enough space
      console.warn('[IndexedDB] Cannot queue large image data to localStorage');
      return null;
    }

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve(null);
          return;
        }
        const transaction = this.db.transaction([STORES.IMAGES], 'readwrite');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.add(pendingImage);

        request.onsuccess = () => {
          console.log('[IndexedDB] Image queued:', pendingImage.id);
          resolve(pendingImage.id);
        };

        request.onerror = () => {
          console.error('[IndexedDB] Failed to queue image:', request.error);
          resolve(null);
        };
      } catch (error) {
        console.error('[IndexedDB] Error queuing image:', error);
        resolve(null);
      }
    });
  }

  /**
   * Get all pending images
   */
  async getPendingImages(): Promise<PendingImageData[]> {
    await this.init();

    if (!this.isSupported || !this.db) {
      return [];
    }

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve([]);
          return;
        }
        const transaction = this.db.transaction([STORES.IMAGES], 'readonly');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          resolve([]);
        };
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * Clear all pending images
   */
  async clearAllImages(): Promise<void> {
    await this.init();

    if (!this.isSupported || !this.db) {
      return;
    }

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve();
          return;
        }
        const transaction = this.db.transaction([STORES.IMAGES], 'readwrite');
        const store = transaction.objectStore(STORES.IMAGES);
        store.clear();
        resolve();
      } catch {
        resolve();
      }
    });
  }

  // ==================== LocalStorage Fallbacks ====================

  private queueMessageToLocalStorage(message: PendingMessage): string {
    try {
      const messages = this.getPendingMessagesFromLocalStorage();
      messages.push(message);
      localStorage.setItem('otakon_pending_messages', JSON.stringify(messages));
      console.log('[IndexedDB] Message queued to localStorage fallback:', message.id);
      return message.id;
    } catch (error) {
      console.error('[IndexedDB] localStorage fallback failed:', error);
      return message.id; // Return ID anyway for tracking
    }
  }

  private getPendingMessagesFromLocalStorage(): PendingMessage[] {
    try {
      const data = localStorage.getItem('otakon_pending_messages');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private removeMessageFromLocalStorage(messageId: string): boolean {
    try {
      const messages = this.getPendingMessagesFromLocalStorage();
      const filtered = messages.filter(m => m.id !== messageId);
      localStorage.setItem('otakon_pending_messages', JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }

  // ==================== Sync Metadata ====================

  async updateSyncMetadata(data: Partial<SyncMetadata>): Promise<void> {
    await this.init();

    const metadata: SyncMetadata = {
      lastSyncAttempt: data.lastSyncAttempt || Date.now(),
      pendingCount: data.pendingCount || 0,
      lastSuccessfulSync: data.lastSuccessfulSync || 0
    };

    if (!this.isSupported || !this.db) {
      localStorage.setItem('otakon_sync_metadata', JSON.stringify(metadata));
      return;
    }

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          localStorage.setItem('otakon_sync_metadata', JSON.stringify(metadata));
          resolve();
          return;
        }
        const transaction = this.db.transaction([STORES.SYNC_META], 'readwrite');
        const store = transaction.objectStore(STORES.SYNC_META);
        store.put({ id: 'sync-status', ...metadata });
        resolve();
      } catch {
        localStorage.setItem('otakon_sync_metadata', JSON.stringify(metadata));
        resolve();
      }
    });
  }

  async getSyncMetadata(): Promise<SyncMetadata | null> {
    await this.init();

    if (!this.isSupported || !this.db) {
      try {
        const data = localStorage.getItem('otakon_sync_metadata');
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    }

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve(null);
          return;
        }
        const transaction = this.db.transaction([STORES.SYNC_META], 'readonly');
        const store = transaction.objectStore(STORES.SYNC_META);
        const request = store.get('sync-status');

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Check if database is available
   */
  isAvailable(): boolean {
    return this.isSupported && this.db !== null;
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();

// Convenience alias for offline queue operations
export const offlineQueueService = {
  queueMessage: (message: Omit<PendingMessage, 'id' | 'timestamp' | 'retryCount'>) => 
    indexedDBService.queueMessage(message),
  getPendingMessages: () => indexedDBService.getPendingMessages(),
  removePendingMessage: (id: string) => indexedDBService.removeMessage(id),
  clearAllMessages: () => indexedDBService.clearAllMessages(),
  canQueueMessage: () => indexedDBService.canQueueMessage(),
  getPendingMessageCount: () => indexedDBService.getPendingMessageCount(),
};

// Export types
export type { PendingMessage, PendingImageData, PendingVoiceData, SyncMetadata };
