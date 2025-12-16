export class StorageService {
  // Maximum messages to keep per conversation in localStorage (Supabase stores full history)
  private static readonly MAX_MESSAGES_PER_CONVERSATION = 50;
  private static readonly CRITICAL_STORAGE_THRESHOLD = 0.9; // 90% of quota

  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      
      // Try to set the item
      localStorage.setItem(key, serialized);
    } catch (error) {
      // Handle QuotaExceededError
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Try cleanup and retry once
        if (this.handleQuotaExceeded(key, value)) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return;
          } catch {
            console.error('Failed to save to localStorage after cleanup');
          }
        }
      }
      console.error(`Error setting ${key} in localStorage:`, error);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Get current localStorage usage statistics
   */
  static getStorageStats(): { used: number; available: number; percentage: number } {
    let totalSize = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        totalSize += (localStorage[key].length + key.length) * 2; // UTF-16 encoding
      }
    }
    // Estimate 5MB quota (actual varies by browser)
    const estimatedQuota = 5 * 1024 * 1024;
    return {
      used: totalSize,
      available: estimatedQuota - totalSize,
      percentage: totalSize / estimatedQuota
    };
  }

  /**
   * Handle QuotaExceededError by cleaning up old data
   */
  private static handleQuotaExceeded<T>(key: string, newValue: T): boolean {
    const CONVERSATIONS_KEY = 'otakon_conversations';
    
    try {
      // If we're trying to save conversations, trim them first
      if (key === CONVERSATIONS_KEY) {
        const trimmed = this.trimConversations(newValue as Record<string, unknown>);
        if (trimmed !== newValue) {
          // Update the value to the trimmed version
          Object.assign(newValue as Record<string, unknown>, trimmed);
        }
      }

      // Clear old cache entries
      this.clearOldCacheEntries();

      // Check if we freed enough space
      const stats = this.getStorageStats();
      return stats.percentage < this.CRITICAL_STORAGE_THRESHOLD;
    } catch (error) {
      console.error('Error during quota cleanup:', error);
      return false;
    }
  }

  /**
   * Trim conversations to keep only recent messages
   */
  private static trimConversations(conversations: Record<string, unknown>): Record<string, unknown> {
    if (!conversations || typeof conversations !== 'object') {
      return conversations;
    }

    const trimmed = { ...conversations };

    for (const conv of Object.values(trimmed)) {
      const conversation = conv as Record<string, unknown>;
      if (conversation?.messages && Array.isArray(conversation.messages)) {
        const originalLength = conversation.messages.length;
        
        // Keep only the most recent messages (last N messages)
        if (originalLength > this.MAX_MESSAGES_PER_CONVERSATION) {
          conversation.messages = conversation.messages.slice(-this.MAX_MESSAGES_PER_CONVERSATION);
        }
      }
    }

    return trimmed;
  }

  /**
   * Clear old cache entries to free up space
   */
  private static clearOldCacheEntries(): void {
    const keysToCheck = Object.keys(localStorage);

    for (const key of keysToCheck) {
      // Remove old IGDB cache entries (keep recent ones)
      if (key.startsWith('igdb_') || key.startsWith('cache_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            const age = Date.now() - (data.timestamp || 0);
            const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
            
            if (age > ONE_WEEK) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
        }
      }
    }
  }
}
