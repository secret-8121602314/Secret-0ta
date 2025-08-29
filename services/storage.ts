// Simple storage utility that automatically uses the localStorage replacer
// This makes it easy to replace localStorage calls throughout your app

import { localStorageReplacer } from './supabase';

// Simple wrapper functions that automatically use the replacer
export const storage = {
  // Set item (automatically migrates to Supabase)
  async setItem(key: string, value: any): Promise<void> {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    await localStorageReplacer.setItem(key, serializedValue);
  },

  // Get item (automatically reads from Supabase first, falls back to localStorage)
  async getItem(key: string): Promise<any> {
    const value = await localStorageReplacer.getItem(key);
    if (value === null) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value; // Return as-is if not JSON
    }
  },

  // Remove item (automatically removes from both)
  async removeItem(key: string): Promise<void> {
    await localStorageReplacer.removeItem(key);
  },

  // Check if item exists
  async hasItem(key: string): Promise<boolean> {
    const value = await localStorageReplacer.getItem(key);
    return value !== null;
  },

  // Clear all storage
  async clear(): Promise<void> {
    await localStorageReplacer.clear();
  }
};

// Synchronous versions for backward compatibility (still work, but don't migrate)
export const storageSync = {
  setItem(key: string, value: any): void {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  },

  getItem(key: string): any {
    const value = localStorage.getItem(key);
    if (value === null) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  },

  clear(): void {
    localStorage.clear();
  }
};
