/**
 * Gallery Service
 * 
 * Handles fetching and managing screenshot images from chat messages,
 * organized by game/conversation for the Gallery feature in Gaming Explorer.
 * 
 * Features:
 * - Fetch all images from messages table for a user
 * - Group images by game/conversation
 * - Support for downloading images
 * - Support for adding images to timeline
 */

import { supabase } from '../lib/supabase';
import { timelineStorage } from './gamingExplorerStorage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface GalleryImage {
  id: string;
  imageUrl: string;
  conversationId: string;
  conversationTitle: string;
  gameTitle?: string;
  messageContent?: string;
  capturedAt: number;
  role: 'user' | 'assistant';
}

export interface GalleryAlbum {
  conversationId: string;
  conversationTitle: string;
  gameTitle?: string;
  coverUrl?: string;
  images: GalleryImage[];
  imageCount: number;
  latestImageAt: number;
}

export interface GalleryData {
  albums: GalleryAlbum[];
  totalImages: number;
  loading: boolean;
  error?: string;
}

// ============================================================================
// GALLERY SERVICE
// ============================================================================

export const galleryService = {
  /**
   * Fetch all images from user's messages grouped by conversation/game
   */
  async fetchGalleryData(authUserId: string): Promise<GalleryData> {
    try {
      // First get all conversations for the user
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, title, game_title')
        .eq('user_id', authUserId);

      if (convError) {
        console.error('[GalleryService] Error fetching conversations:', convError);
        return { albums: [], totalImages: 0, loading: false, error: convError.message };
      }

      if (!conversations || conversations.length === 0) {
        return { albums: [], totalImages: 0, loading: false };
      }

      // Get conversation IDs
      const conversationIds = conversations.map(c => c.id);

      // Fetch all messages with images for these conversations
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, image_url, conversation_id, content, role, created_at')
        .in('conversation_id', conversationIds)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false });

      if (msgError) {
        console.error('[GalleryService] Error fetching messages:', msgError);
        return { albums: [], totalImages: 0, loading: false, error: msgError.message };
      }

      // Create a map of conversation details
      const convMap = new Map(conversations.map(c => [c.id, {
        title: c.title,
        gameTitle: c.game_title,
      }]));

      // Group images by conversation
      const albumMap = new Map<string, GalleryAlbum>();

      (messages || []).forEach(msg => {
        if (!msg.image_url) {
          return;
        }

        const convDetails = convMap.get(msg.conversation_id);
        if (!convDetails) {
          return;
        }

        const image: GalleryImage = {
          id: msg.id,
          imageUrl: msg.image_url,
          conversationId: msg.conversation_id,
          conversationTitle: convDetails.title || 'Untitled',
          gameTitle: convDetails.gameTitle || undefined,
          messageContent: msg.content?.substring(0, 100) || undefined,
          capturedAt: new Date(msg.created_at || Date.now()).getTime(),
          role: msg.role as 'user' | 'assistant',
        };

        const existingAlbum = albumMap.get(msg.conversation_id);
        if (existingAlbum) {
          existingAlbum.images.push(image);
          existingAlbum.imageCount++;
          existingAlbum.latestImageAt = Math.max(existingAlbum.latestImageAt, image.capturedAt);
        } else {
          albumMap.set(msg.conversation_id, {
            conversationId: msg.conversation_id,
            conversationTitle: convDetails.title || 'Untitled',
            gameTitle: convDetails.gameTitle || undefined,
            coverUrl: undefined,
            images: [image],
            imageCount: 1,
            latestImageAt: image.capturedAt,
          });
        }
      });

      // Convert map to sorted array (most recent first)
      const albums = Array.from(albumMap.values())
        .sort((a, b) => b.latestImageAt - a.latestImageAt);

      const totalImages = albums.reduce((sum, album) => sum + album.imageCount, 0);

      return { albums, totalImages, loading: false };
    } catch (error) {
      console.error('[GalleryService] Exception:', error);
      return { 
        albums: [], 
        totalImages: 0, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * Download an image
   */
  async downloadImage(imageUrl: string, filename?: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `screenshot_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('[GalleryService] Download failed:', error);
      return false;
    }
  },

  /**
   * Add an image to the user's gaming timeline
   */
  addToTimeline(
    image: GalleryImage,
    title: string,
    year: number,
    description?: string
  ): void {
    timelineStorage.addEvent({
      type: 'album',
      eventDate: new Date(image.capturedAt).toISOString().split('T')[0],
      year,
      title,
      description: description || `Screenshot from ${image.gameTitle || image.conversationTitle}`,
      photos: [image.imageUrl],
    });
  },

  /**
   * Get images count for quick stats
   */
  async getImageCount(authUserId: string): Promise<number> {
    try {
      // Get conversation IDs first
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', authUserId);

      if (!conversations || conversations.length === 0) {
        return 0;
      }

      const conversationIds = conversations.map(c => c.id);

      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .not('image_url', 'is', null);

      if (error) {
        console.error('[GalleryService] Count error:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[GalleryService] Count exception:', error);
      return 0;
    }
  },

  /**
   * Filter images by game title
   */
  filterByGame(albums: GalleryAlbum[], gameTitle: string): GalleryAlbum[] {
    return albums.filter(album => 
      album.gameTitle?.toLowerCase().includes(gameTitle.toLowerCase())
    );
  },

  /**
   * Get unique game titles from albums
   */
  getGameTitles(albums: GalleryAlbum[]): string[] {
    const titles = new Set<string>();
    albums.forEach(album => {
      if (album.gameTitle) {
        titles.add(album.gameTitle);
      }
    });
    return Array.from(titles).sort();
  },
};

export default galleryService;
