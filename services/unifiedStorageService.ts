import { supabase } from './supabase';
import { authService } from './supabase';
import { ServiceFactory, BaseService } from './ServiceFactory';
import { STORAGE_KEYS } from '../utils/constants';
import { Conversation, Usage } from './types';

/**
 * 🎯 UNIFIED STORAGE SERVICE
 * 
 * This service consolidates all storage functionality from:
 * - dualStorageService.ts (Dual storage management)
 * - offlineStorageService.ts (Offline storage handling)
 * - storage.ts (Basic storage operations)
 * 
 * Features:
 * 1. Multi-tier storage (localStorage, IndexedDB, Supabase)
 * 2. Automatic offline/online synchronization
 * 3. Data persistence and recovery
 * 4. Storage optimization and cleanup
 * 5. Cross-platform compatibility
 */

// ===== STORAGE INTERFACES =====

export interface StorageConfig {
  useLocalStorage: boolean;
  useIndexedDB: boolean;
  useSupabase: boolean;
  fallbackToLocal: boolean;
  autoSync: boolean;
}

export interface StorageEntry {
  key: string;
  value: any;
  timestamp: number;
  category?: string;
  version: number;
  metadata?: Record<string, any>;
}

export interface OfflineData {
  conversations: Conversation[];
  usage: Usage | null;
  lastSync: number;
  offline: boolean;
}

export interface StorageStats {
  localStorage: {
    size: number;
    items: number;
    available: boolean;
  };
  indexedDB: {
    size: number;
    items: number;
    available: boolean;
  };
  supabase: {
    connected: boolean;
    items: number;
    lastSync: number;
  };
  totalSize: number;
  lastCleanup: number;
}

// ===== UNIFIED STORAGE SERVICE =====

export class UnifiedStorageService extends BaseService {
  private config: StorageConfig;
  private db: IDBDatabase | null = null;
  private syncInProgress = false;
  private readonly DB_NAME = 'OtakonUnifiedDB';
  private readonly DB_VERSION = 2;
  private readonly STORES = {
    conversations: 'conversations',
    usage: 'usage',
    cache: 'cache',
    preferences: 'preferences',
    analytics: 'analytics',
    sync: 'sync'
  };

  constructor() {
    super();
    this.config = {
      useLocalStorage: true,
      useIndexedDB: true,
      useSupabase: true,
      fallbackToLocal: true,
      autoSync: true
    };
    
    this.initialize();
  }

  // ===== INITIALIZATION =====

  private async initialize(): Promise<void> {
    try {
      // Initialize IndexedDB
      if (this.config.useIndexedDB) {
        await this.initializeIndexedDB();
      }

      // Start auto-sync if enabled
      if (this.config.autoSync) {
        this.startAutoSync();
      }

      console.log('✅ UnifiedStorageService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize UnifiedStorageService:', error);
    }
  }

  private async initializeIndexedDB(): Promise<void> {
    if (!this.isIndexedDBAvailable()) {
      throw new Error('IndexedDB not available');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create all stores
        Object.values(this.STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('category', 'category', { unique: false });
          }
        });
      };
    });
  }

  // ===== CORE STORAGE METHODS =====

  async set(key: string, value: any, category?: string): Promise<void> {
    const entry: StorageEntry = {
      key,
      value,
      timestamp: Date.now(),
      category,
      version: 1,
      metadata: { source: 'unified_storage' }
    };

    // Store in localStorage
    if (this.config.useLocalStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch (error) {
        console.warn('Failed to store in localStorage:', error);
      }
    }

    // Store in IndexedDB
    if (this.config.useIndexedDB && this.db) {
      try {
        await this.storeInIndexedDB(entry);
      } catch (error) {
        console.warn('Failed to store in IndexedDB:', error);
      }
    }

    // Store in Supabase
    if (this.config.useSupabase) {
      try {
        await this.storeInSupabase(entry);
      } catch (error) {
        console.warn('Failed to store in Supabase:', error);
        
        // Fallback to localStorage if enabled
        if (this.config.fallbackToLocal && !this.config.useLocalStorage) {
          try {
            localStorage.setItem(key, JSON.stringify(entry));
          } catch (localError) {
            console.warn('Failed to fallback to localStorage:', localError);
          }
        }
      }
    }
  }

  async get(key: string, category?: string): Promise<any | null> {
    // Try Supabase first if enabled
    if (this.config.useSupabase) {
      try {
        const result = await this.getFromSupabase(key, category);
        if (result) return result;
      } catch (error) {
        console.warn('Failed to get from Supabase:', error);
      }
    }

    // Try IndexedDB
    if (this.config.useIndexedDB && this.db) {
      try {
        const result = await this.getFromIndexedDB(key);
        if (result) return result;
      } catch (error) {
        console.warn('Failed to get from IndexedDB:', error);
      }
    }

    // Fallback to localStorage
    if (this.config.useLocalStorage) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const entry = JSON.parse(stored);
          return entry.value;
        }
      } catch (error) {
        console.warn('Failed to get from localStorage:', error);
      }
    }

    return null;
  }

  async remove(key: string, category?: string): Promise<void> {
    // Remove from localStorage
    if (this.config.useLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    }

    // Remove from IndexedDB
    if (this.config.useIndexedDB && this.db) {
      try {
        await this.removeFromIndexedDB(key);
      } catch (error) {
        console.warn('Failed to remove from IndexedDB:', error);
      }
    }

    // Remove from Supabase
    if (this.config.useSupabase) {
      try {
        await this.removeFromSupabase(key, category);
      } catch (error) {
        console.warn('Failed to remove from Supabase:', error);
      }
    }
  }

  async clear(category?: string): Promise<void> {
    // Clear localStorage
    if (this.config.useLocalStorage) {
      try {
        if (category) {
          // Clear only items with specific category
          Object.keys(localStorage).forEach(key => {
            try {
              const stored = localStorage.getItem(key);
              if (stored) {
                const entry = JSON.parse(stored);
                if (entry.category === category) {
                  localStorage.removeItem(key);
                }
              }
            } catch (error) {
              // Ignore parsing errors
            }
          });
        } else {
          // Clear all localStorage items
          localStorage.clear();
        }
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }

    // Clear IndexedDB
    if (this.config.useIndexedDB && this.db) {
      try {
        await this.clearIndexedDB(category);
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error);
      }
    }

    // Clear Supabase
    if (this.config.useSupabase) {
      try {
        await this.clearSupabase(category);
      } catch (error) {
        console.warn('Failed to clear Supabase:', error);
      }
    }
  }

  // ===== CONVERSATION MANAGEMENT =====

  async saveConversation(conversation: Conversation): Promise<void> {
    await this.set(`conversation_${conversation.id}`, conversation, 'conversations');
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return await this.get(`conversation_${id}`, 'conversations');
  }

  async getAllConversations(): Promise<Conversation[]> {
    try {
      const conversations: Conversation[] = [];
      
      // Get from IndexedDB first (most complete)
      if (this.config.useIndexedDB && this.db) {
        const indexedDBConversations = await this.getAllFromIndexedDB('conversations');
        conversations.push(...indexedDBConversations);
      }

      // Fallback to localStorage
      if (conversations.length === 0 && this.config.useLocalStorage) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('conversation_')) {
            try {
              const stored = localStorage.getItem(key);
              if (stored) {
                const entry = JSON.parse(stored);
                if (entry.category === 'conversations') {
                  conversations.push(entry.value);
                }
              }
            } catch (error) {
              // Ignore parsing errors
            }
          }
        });
      }

      return conversations.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Failed to get all conversations:', error);
      return [];
    }
  }

  async deleteConversation(id: string): Promise<void> {
    await this.remove(`conversation_${id}`, 'conversations');
  }

  // ===== USAGE MANAGEMENT =====

  async saveUsage(usage: Usage): Promise<void> {
    await this.set('usage', usage, 'usage');
  }

  async getUsage(): Promise<Usage | null> {
    return await this.get('usage', 'usage');
  }


  // ===== SYNC METHODS =====

  private startAutoSync(): void {
    // Sync every 30 seconds
    setInterval(() => {
      this.syncData();
    }, 30000);
  }

  async syncData(): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    try {
      // Sync conversations
      await this.syncConversations();
      
      // Sync usage data
      await this.syncUsageData();
      
      // Sync preferences
      await this.syncPreferences();
      
      console.log('✅ Data sync completed');
    } catch (error) {
      console.warn('Data sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncConversations(): Promise<void> {
    try {
      const conversations = await this.getAllConversations();
      const userId = await this.getCurrentUserId();
      
      if (userId && conversations.length > 0) {
        await supabase
          .from('users')
          .upsert({
            auth_user_id: userId,
            conversations: conversations
          });
      }
    } catch (error) {
      console.warn('Failed to sync conversations:', error);
    }
  }

  private async syncUsageData(): Promise<void> {
    try {
      const usage = await this.getUsage();
      const userId = await this.getCurrentUserId();
      
      if (userId && usage) {
        await supabase
          .from('users')
          .upsert({
            auth_user_id: userId,
            usage_data: usage
          });
      }
    } catch (error) {
      console.warn('Failed to sync usage data:', error);
    }
  }

  private async syncPreferences(): Promise<void> {
    try {
      const preferences: Record<string, any> = {};
      const userId = await this.getCurrentUserId();
      
      if (userId) {
        // Collect all preference-related localStorage items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('otakon') && !key.includes('conversation')) {
            try {
              const value = localStorage.getItem(key);
              if (value) {
                preferences[key] = value;
              }
            } catch (error) {
              // Ignore parsing errors
            }
          }
        });

        if (Object.keys(preferences).length > 0) {
          await supabase
            .from('users')
            .upsert({
              auth_user_id: userId,
              preferences
            });
        }
      }
    } catch (error) {
      console.warn('Failed to sync preferences:', error);
    }
  }

  // ===== STORAGE IMPLEMENTATION METHODS =====

  private async storeInIndexedDB(entry: StorageEntry): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.STORES.cache], 'readwrite');
    const store = transaction.objectStore(this.STORES.cache);
    await store.put(entry);
  }

  private async getFromIndexedDB(key: string): Promise<any | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction([this.STORES.cache], 'readonly');
    const store = transaction.objectStore(this.STORES.cache);
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.STORES.cache], 'readwrite');
    const store = transaction.objectStore(this.STORES.cache);
    await store.delete(key);
  }

  private async clearIndexedDB(category?: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.STORES.cache], 'readwrite');
    const store = transaction.objectStore(this.STORES.cache);
    
    if (category) {
      const index = store.index('category');
      const range = IDBKeyRange.only(category);
      const request = index.openCursor(range);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } else {
      const request = store.clear();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  private async getAllFromIndexedDB(storeName: string): Promise<any[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result || [];
        resolve(result.map((entry: any) => entry.value));
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async storeInSupabase(entry: StorageEntry): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    const category = entry.category || 'general';
    const data = { [entry.key]: entry.value };

    await supabase
      .from('users')
      .upsert({
        auth_user_id: userId,
        [category]: data
      });
  }

  private async getFromSupabase(key: string, category?: string): Promise<any | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const cat = category || 'general';
    const { data } = await supabase
      .from('users')
      .select(cat)
      .eq('auth_user_id', userId)
      .limit(1);

    return data?.[0]?.[cat]?.[key] || null;
  }

  private async removeFromSupabase(key: string, category?: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    const cat = category || 'general';
    const { data } = await supabase
      .from('users')
      .select(cat)
      .eq('auth_user_id', userId)
      .limit(1);

    if (data?.[0]?.[cat]) {
      const updated = { ...data[0][cat] };
      delete updated[key];
      
      await supabase
        .from('users')
        .upsert({
          auth_user_id: userId,
          [cat]: updated
        });
    }
  }

  private async clearSupabase(category?: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    if (category) {
      await supabase
        .from('users')
        .upsert({
          auth_user_id: userId,
          [category]: {}
        });
    } else {
      // Clear all user data
      await supabase
        .from('users')
        .delete()
        .eq('auth_user_id', userId);
    }
  }

  // ===== UTILITY METHODS =====

  private isIndexedDBAvailable(): boolean {
    return 'indexedDB' in window;
  }

  private async isAuthenticated(): Promise<boolean> {
    try {
      const authState = authService.getCurrentState();
      return !!authState.user;
    } catch (error) {
      return false;
    }
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const authState = authService.getCurrentState();
      return authState.user?.id || null;
    } catch (error) {
      return null;
    }
  }

  // ===== PUBLIC API =====

  updateConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  async getStorageStats(): Promise<StorageStats> {
    const stats: StorageStats = {
      localStorage: {
        size: 0,
        items: 0,
        available: true
      },
      indexedDB: {
        size: 0,
        items: 0,
        available: this.isIndexedDBAvailable()
      },
      supabase: {
        connected: false,
        items: 0,
        lastSync: 0
      },
      totalSize: 0,
      lastCleanup: 0
    };

    try {
      // Calculate localStorage stats
      if (this.config.useLocalStorage) {
        stats.localStorage.items = localStorage.length;
        stats.localStorage.size = JSON.stringify(localStorage).length;
      }

      // Calculate IndexedDB stats
      if (this.config.useIndexedDB && this.db) {
        const transaction = this.db.transaction([this.STORES.cache], 'readonly');
        const store = transaction.objectStore(this.STORES.cache);
        const request = store.count();
        stats.indexedDB.items = await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }

      // Check Supabase connection
      if (this.config.useSupabase) {
        try {
          const { data } = await supabase.from('users').select('id').limit(1);
          stats.supabase.connected = true;
          stats.supabase.items = data?.length || 0;
        } catch (error) {
          stats.supabase.connected = false;
        }
      }

      stats.totalSize = stats.localStorage.size + stats.indexedDB.size;
    } catch (error) {
      console.warn('Failed to get storage stats:', error);
    }

    return stats;
  }

  override async cleanup(): Promise<void> {
    try {
      // Clean up old entries
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      if (this.config.useIndexedDB && this.db) {
        const transaction = this.db.transaction([this.STORES.cache], 'readwrite');
        const store = transaction.objectStore(this.STORES.cache);
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(cutoffTime);
        const request = index.openCursor(range);
        
        await new Promise((resolve, reject) => {
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            } else {
              resolve(undefined);
            }
          };
          request.onerror = () => {
            reject(request.error);
          };
        });
      }

      console.log('✅ Storage cleanup completed');
    } catch (error) {
      console.warn('Storage cleanup failed:', error);
    }
  }

  // ===== CLEANUP =====

  destroy(): void {
    console.log('🧹 UnifiedStorageService: Destroy called');
    this.db = null;
    this.syncInProgress = false;
  }
}

// Export lazy singleton instance - only creates when first accessed
let _unifiedStorageService: UnifiedStorageService | null = null;
export const unifiedStorageService = (): UnifiedStorageService => {
  if (!_unifiedStorageService) {
    _unifiedStorageService = ServiceFactory.create(UnifiedStorageService);
  }
  return _unifiedStorageService;
};
