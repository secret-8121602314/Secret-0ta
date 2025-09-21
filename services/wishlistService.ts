import { supabase } from './supabase';
import { supabaseDataService } from './supabaseDataService';
import { WishlistItem } from './types';

class WishlistService {
  private static instance: WishlistService;
  private wishlistCache: WishlistItem[] = [];

  static getInstance(): WishlistService {
    if (!WishlistService.instance) {
      WishlistService.instance = new WishlistService();
    }
    return WishlistService.instance;
  }

  constructor() {
    this.loadFromLocalStorage();
  }

  // Load wishlist from localStorage in development mode
  private loadFromLocalStorage(): void {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Loading wishlist from localStorage');
        const wishlistData = localStorage.getItem('otakon_wishlist');
        if (wishlistData) {
          this.wishlistCache = JSON.parse(wishlistData);
          console.log(`🔧 Loaded ${this.wishlistCache.length} wishlist items from localStorage`);
        }
      }
    } catch (error) {
      console.warn('Failed to load wishlist from localStorage:', error);
    }
  }

  // Add item to wishlist
  async addToWishlist(item: Omit<WishlistItem, 'id' | 'addedAt'>): Promise<WishlistItem> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for adding to wishlist');
        return this.addToWishlistLocalStorage(item);
      }
      
      if (!user) throw new Error('User not authenticated');

      // Create wishlist item
      const wishlistItem: WishlistItem = {
        ...item,
        id: `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: Date.now()
      };

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) throw userError;

      // Update app_state with new wishlist item
      const currentAppState = userData.app_state || {};
      const currentWishlist = currentAppState.wishlist || [];
      
      // Check if item already exists
      const existingItem = currentWishlist.find((w: WishlistItem) => 
        w.gameName.toLowerCase() === item.gameName.toLowerCase()
      );
      
      if (existingItem) {
        throw new Error('Game already in wishlist');
      }

      const updatedWishlist = [...currentWishlist, wishlistItem];
      const updatedAppState = {
        ...currentAppState,
        wishlist: updatedWishlist
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      // Update cache
      this.wishlistCache = updatedWishlist;
      this.updateLocalStorage();

      // Trigger comprehensive sync
      try {
        const { comprehensivePersistenceService } = await import('./comprehensivePersistenceService');
        comprehensivePersistenceService.syncAllUserData();
      } catch (error) {
        console.warn('Failed to trigger comprehensive sync:', error);
      }

      return wishlistItem;
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      throw error;
    }
  }

  // Development mode localStorage fallback
  private addToWishlistLocalStorage(item: Omit<WishlistItem, 'id' | 'addedAt'>): WishlistItem {
    const wishlistItem: WishlistItem = {
      ...item,
      id: `local_wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      addedAt: Date.now()
    };
    
    this.wishlistCache.push(wishlistItem);
    this.updateLocalStorage();
    
    console.log('🔧 Development mode: Added to wishlist in localStorage:', wishlistItem);
    return wishlistItem;
  }

  // Remove item from wishlist
  async removeFromWishlist(itemId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for removing from wishlist');
        return this.removeFromWishlistLocalStorage(itemId);
      }
      
      if (!user) throw new Error('User not authenticated');

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) throw userError;

      // Update app_state by removing the item
      const currentAppState = userData.app_state || {};
      const currentWishlist = currentAppState.wishlist || [];
      const updatedWishlist = currentWishlist.filter((item: WishlistItem) => item.id !== itemId);
      
      const updatedAppState = {
        ...currentAppState,
        wishlist: updatedWishlist
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      // Update cache
      this.wishlistCache = updatedWishlist;
      this.updateLocalStorage();

      return true;
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      return false;
    }
  }

  // Development mode localStorage fallback
  private removeFromWishlistLocalStorage(itemId: string): boolean {
    const initialLength = this.wishlistCache.length;
    this.wishlistCache = this.wishlistCache.filter(item => item.id !== itemId);
    
    if (this.wishlistCache.length !== initialLength) {
      this.updateLocalStorage();
      console.log('🔧 Development mode: Removed from wishlist in localStorage:', itemId);
      return true;
    }
    
    return false;
  }

  // Get all wishlist items
  async getWishlist(): Promise<WishlistItem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for getting wishlist');
        return this.wishlistCache;
      }
      
      if (!user) return [];

      // Get from Supabase users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;

      // Extract wishlist from app_state
      const currentAppState = userData.app_state || {};
      const wishlistData = currentAppState.wishlist || [];

      // Update cache
      this.wishlistCache = wishlistData;

      return this.wishlistCache;
    } catch (error) {
      console.error('Failed to get wishlist:', error);
      // Fallback to local cache
      return this.wishlistCache;
    }
  }

  // Check if game is in wishlist
  async isInWishlist(gameName: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        return this.wishlistCache.some(item => 
          item.gameName.toLowerCase() === gameName.toLowerCase()
        );
      }
      
      if (!user) return false;

      // Get wishlist from users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (error) return false;

      const currentAppState = userData.app_state || {};
      const wishlistData = currentAppState.wishlist || [];
      
      return wishlistData.some((item: WishlistItem) => 
        item.gameName.toLowerCase() === gameName.toLowerCase()
      );
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
      return false;
    }
  }

  // Update localStorage cache
  private async updateLocalStorage(): Promise<void> {
    try {
      // Update in Supabase
      await supabaseDataService.updateUserAppState('wishlist', this.wishlistCache);
      
      // Also update localStorage as backup
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('otakon_wishlist', JSON.stringify(this.wishlistCache));
      }
    } catch (error) {
      console.warn('Failed to update wishlist in Supabase, using localStorage only:', error);
      
      // Fallback to localStorage only
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('otakon_wishlist', JSON.stringify(this.wishlistCache));
      }
    }
  }

  // Load wishlist from Supabase with localStorage fallback
  private async loadWishlistFromSupabase(): Promise<void> {
    try {
      const appState = await supabaseDataService.getUserAppState();
      const wishlistData = appState.wishlist;
      
      if (wishlistData && Array.isArray(wishlistData)) {
        this.wishlistCache = wishlistData;
        console.log(`Loaded ${wishlistData.length} wishlist items from Supabase`);
      }
    } catch (error) {
      console.warn('Failed to load wishlist from Supabase, using localStorage fallback:', error);
      
      // Fallback to localStorage
      if (process.env.NODE_ENV === 'development') {
        const localData = localStorage.getItem('otakon_wishlist');
        if (localData) {
          try {
            this.wishlistCache = JSON.parse(localData);
            console.log(`Loaded ${this.wishlistCache.length} wishlist items from localStorage fallback`);
          } catch (parseError) {
            console.error('Failed to parse localStorage wishlist data:', parseError);
            this.wishlistCache = [];
          }
        }
      }
    }
  }

  // Clear all wishlist data
  async clearWishlist(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user && process.env.NODE_ENV === 'development') {
        this.wishlistCache = [];
        this.updateLocalStorage();
        return;
      }
      
      if (!user) return;

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) throw userError;

      // Update app_state to clear wishlist
      const currentAppState = userData.app_state || {};
      const updatedAppState = {
        ...currentAppState,
        wishlist: []
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      // Clear cache
      this.wishlistCache = [];
    } catch (error) {
      console.error('Failed to clear wishlist:', error);
    }
  }

  // Check if a game has been released (called when user submits a query)
  async checkGameReleaseStatus(gameName: string): Promise<boolean> {
    try {
      // Simple heuristic: if game has a release date and it's in the past, it's released
      const wishlistItem = this.wishlistCache.find(item => 
        item.gameName.toLowerCase() === gameName.toLowerCase()
      );
      
      if (!wishlistItem || !wishlistItem.releaseDate) return false;
      
      const releaseDate = new Date(wishlistItem.releaseDate);
      const now = new Date();
      const isReleased = releaseDate <= now;
      
      if (isReleased && !wishlistItem.isReleased) {
        // Game was just released - update status
        await this.updateWishlistItemReleaseStatus(wishlistItem.id, true);
        console.log(`🎉 Game released: ${gameName}`);
      }
      
      return isReleased;
    } catch (error) {
      console.error('Failed to check game release status:', error);
      return false;
    }
  }

  // Update wishlist item release status
  private async updateWishlistItemReleaseStatus(itemId: string, isReleased: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user && process.env.NODE_ENV === 'development') {
        // Update in localStorage
        const item = this.wishlistCache.find(i => i.id === itemId);
        if (item) {
          item.isReleased = isReleased;
          item.releaseNotificationShown = false;
          item.lastChecked = Date.now();
          this.updateLocalStorage();
        }
        return;
      }
      
      if (!user) return;

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) throw userError;

      // Update app_state with modified wishlist item
      const currentAppState = userData.app_state || {};
      const currentWishlist = currentAppState.wishlist || [];
      
      const itemIndex = currentWishlist.findIndex((item: WishlistItem) => item.id === itemId);
      if (itemIndex === -1) return;

      const updatedItem = {
        ...currentWishlist[itemIndex],
        isReleased,
        releaseNotificationShown: false,
        lastChecked: Date.now()
      };

      const updatedWishlist = [...currentWishlist];
      updatedWishlist[itemIndex] = updatedItem;
      
      const updatedAppState = {
        ...currentAppState,
        wishlist: updatedWishlist
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      // Update cache
      const item = this.wishlistCache.find(i => i.id === itemId);
      if (item) {
        item.isReleased = isReleased;
        item.releaseNotificationShown = false;
        item.lastChecked = Date.now();
      }
    } catch (error) {
      console.error('Failed to update wishlist item release status:', error);
    }
  }

  // Mark release notification as shown
  async markReleaseNotificationShown(itemId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user && process.env.NODE_ENV === 'development') {
        const item = this.wishlistCache.find(i => i.id === itemId);
        if (item) {
          item.releaseNotificationShown = true;
          this.updateLocalStorage();
        }
        return;
      }
      
      if (!user) return;

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) throw userError;

      // Update app_state with modified wishlist item
      const currentAppState = userData.app_state || {};
      const currentWishlist = currentAppState.wishlist || [];
      
      const itemIndex = currentWishlist.findIndex((item: WishlistItem) => item.id === itemId);
      if (itemIndex === -1) return;

      const updatedItem = {
        ...currentWishlist[itemIndex],
        releaseNotificationShown: true
      };

      const updatedWishlist = [...currentWishlist];
      updatedWishlist[itemIndex] = updatedItem;
      
      const updatedAppState = {
        ...currentAppState,
        wishlist: updatedWishlist
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      // Update cache
      const item = this.wishlistCache.find(i => i.id === itemId);
      if (item) {
        item.releaseNotificationShown = true;
      }
    } catch (error) {
      console.error('Failed to mark release notification as shown:', error);
    }
  }

  // Get wishlist items with release notifications
  getWishlistWithNotifications(): WishlistItem[] {
    return this.wishlistCache.map(item => ({
      ...item,
      hasReleaseNotification: item.isReleased && !item.releaseNotificationShown
    }));
  }

  // Get count of unreleased games
  getUnreleasedCount(): number {
    return this.wishlistCache.filter(item => !item.isReleased).length;
  }

  // Get count of newly released games (with notifications)
  getNewlyReleasedCount(): number {
    return this.wishlistCache.filter(item => 
      item.isReleased && !item.releaseNotificationShown
    ).length;
  }
}

export const wishlistService = WishlistService.getInstance();
