import { supabase } from './supabase';
import { supabaseDataService } from './supabaseDataService';

export interface WishlistItem {
  id: string;
  gameName: string;
  releaseDate?: string; // ISO date string
  platform?: string;
  genre?: string;
  description?: string;
  addedAt: number;
  gameId: string; // 'everything-else' for wishlist items
  source?: string; // AI response or user input
  sourceMessageId?: string; // Link to original message
  isReleased?: boolean; // Track if game has been released
  releaseNotificationShown?: boolean; // Track if notification has been shown
  lastChecked?: number; // Last time release status was checked
}

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

      // Add to Supabase (you'll need to create a wishlist table)
      const { data: newItem, error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          game_name: item.gameName,
          release_date: item.releaseDate,
          platform: item.platform,
          genre: item.genre,
          description: item.description,
          game_id: item.gameId,
          source: item.source,
          source_message_id: item.sourceMessageId
        })
        .select()
        .single();

      if (error) throw error;

      const wishlistItem: WishlistItem = {
        id: newItem.id,
        gameName: newItem.game_name,
        releaseDate: newItem.release_date,
        platform: newItem.platform,
        genre: newItem.genre,
        description: newItem.description,
        addedAt: new Date(newItem.created_at).getTime(),
        gameId: newItem.game_id,
        source: newItem.source,
        sourceMessageId: newItem.source_message_id
      };

      // Update cache
      this.wishlistCache.push(wishlistItem);
      this.updateLocalStorage();

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

      // Remove from Supabase
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from cache
      this.wishlistCache = this.wishlistCache.filter(item => item.id !== itemId);
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

      // Get from Supabase
      const { data: wishlistData, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Update cache
      this.wishlistCache = wishlistData.map(item => ({
        id: item.id,
        gameName: item.game_name,
        releaseDate: item.release_date,
        platform: item.platform,
        genre: item.genre,
        description: item.description,
        addedAt: new Date(item.created_at).getTime(),
        gameId: item.game_id,
        source: item.source,
        sourceMessageId: item.source_message_id
      }));

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

      // Check in Supabase
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .ilike('game_name', gameName)
        .single();

      if (error) return false;
      return !!data;
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

      // Clear from Supabase
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id);

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

      // Update in Supabase
      await supabase
        .from('wishlist')
        .update({ 
          is_released: isReleased,
          release_notification_shown: false,
          last_checked: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', user.id);

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

      // Update in Supabase
      await supabase
        .from('wishlist')
        .update({ release_notification_shown: true })
        .eq('id', itemId)
        .eq('user_id', user.id);

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
