// IGDB Service - Client-side integration for game data
// Date: January 2025
// Purpose: Fetch rich game data from IGDB via Supabase Edge Function

import { supabase } from '../lib/supabase';

// IGDB Game Data Interface
export interface IGDBGameData {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  rating?: number;
  aggregated_rating?: number;
  total_rating?: number;
  first_release_date?: number;
  genres?: { id: number; name: string }[];
  platforms?: { id: number; name: string; abbreviation?: string }[];
  themes?: { id: number; name: string }[];
  game_modes?: { id: number; name: string }[];
  player_perspectives?: { id: number; name: string }[];
  involved_companies?: { 
    id: number; 
    company: { id: number; name: string }; 
    developer?: boolean; 
    publisher?: boolean 
  }[];
  cover?: { id: number; url: string; image_id: string };
  screenshots?: { id: number; url: string; image_id: string }[];
  artworks?: { id: number; url: string; image_id: string }[];
  videos?: { id: number; video_id: string; name?: string }[];
  similar_games?: { 
    id: number; 
    name: string; 
    cover?: { id: number; url: string; image_id: string } 
  }[];
  websites?: { id: number; url: string; category: number }[];
  age_ratings?: { id: number; category: number; rating: number }[];
  franchises?: { id: number; name: string }[];
  collections?: { id: number; name: string }[];
  dlcs?: { id: number; name: string }[];
  expansions?: { id: number; name: string }[];
  game_engines?: { id: number; name: string }[];
  keywords?: { id: number; name: string }[];
  status?: number;
  category?: number;
}

// Cache for in-flight requests (prevents duplicate fetches)
const pendingRequests = new Map<string, Promise<IGDBGameData | null>>();

// Local memory cache for session (reduces API calls)
const sessionCache = new Map<string, { data: IGDBGameData; timestamp: number }>();
const SESSION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch game data from IGDB via Edge Function
 * Uses caching at multiple levels:
 * 1. Session memory cache (30 min)
 * 2. Supabase DB cache (24 hours) - handled by edge function
 * 3. IGDB API as fallback
 */
export async function fetchIGDBGameData(gameName: string): Promise<IGDBGameData | null> {
  if (!gameName || gameName.trim().length === 0) {
    console.warn('[IGDBService] Empty game name provided');
    return null;
  }

  const cacheKey = gameName.toLowerCase().trim();
  
  // Check session cache first
  const cached = sessionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SESSION_CACHE_TTL) {
    console.log('[IGDBService] Session cache hit:', gameName);
    return cached.data;
  }

  // Check if there's already a pending request for this game
  if (pendingRequests.has(cacheKey)) {
    console.log('[IGDBService] Waiting for pending request:', gameName);
    return pendingRequests.get(cacheKey)!;
  }

  // Create new request
  const requestPromise = (async (): Promise<IGDBGameData | null> => {
    try {
      console.log('[IGDBService] Fetching game data:', gameName);
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header if available (not required for IGDB, but good practice)
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      console.log('[IGDBService] Invoking igdb-proxy with gameName:', gameName);
      
      const response = await supabase.functions.invoke('igdb-proxy', {
        body: JSON.stringify({ gameName }),
        headers
      });

      if (response.error) {
        console.error('[IGDBService] Edge function error:', response.error);
        // Check for specific error codes
        const errorData = response.error as { message?: string };
        if (errorData?.message?.includes('IGDB_NOT_CONFIGURED') || 
            errorData?.message?.includes('503')) {
          console.warn('[IGDBService] IGDB service not configured - game data will not be available');
        }
        return null;
      }

      const result = response.data;
      
      // Handle specific error codes from the edge function
      if (result?.code === 'IGDB_NOT_CONFIGURED') {
        console.warn('[IGDBService] IGDB service not configured on server');
        return null;
      }
      
      if (!result.success || !result.data) {
        console.log('[IGDBService] No data found for:', gameName);
        return null;
      }

      const gameData = result.data as IGDBGameData;
      
      // Update session cache
      sessionCache.set(cacheKey, { data: gameData, timestamp: Date.now() });
      
      console.log('[IGDBService] Successfully fetched:', gameData.name, result.cached ? '(cached)' : '(fresh)');
      return gameData;

    } catch (error) {
      console.error('[IGDBService] Error fetching game data:', error);
      return null;
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Fetch game data by IGDB ID (for similar games)
 */
export async function fetchIGDBGameById(gameId: number): Promise<IGDBGameData | null> {
  return fetchIGDBGameData(`id:${gameId}`);
}

/**
 * Clear session cache (useful for testing)
 */
export function clearIGDBSessionCache(): void {
  sessionCache.clear();
  console.log('[IGDBService] Session cache cleared');
}

/**
 * Get YouTube embed URL from IGDB video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Get website category name from IGDB category ID
 */
export function getWebsiteCategoryName(category: number): string {
  const categories: Record<number, string> = {
    1: 'Official',
    2: 'Wikia',
    3: 'Wikipedia',
    4: 'Facebook',
    5: 'Twitter',
    6: 'Twitch',
    8: 'Instagram',
    9: 'YouTube',
    10: 'iPhone',
    11: 'iPad',
    12: 'Android',
    13: 'Steam',
    14: 'Reddit',
    15: 'Itch.io',
    16: 'Epic Games',
    17: 'GOG',
    18: 'Discord'
  };
  return categories[category] || 'Website';
}

/**
 * Get age rating display name
 */
export function getAgeRatingDisplay(category: number, rating: number): string {
  // Category 1 = ESRB, Category 2 = PEGI
  if (category === 1) {
    const esrbRatings: Record<number, string> = {
      6: 'RP (Rating Pending)',
      7: 'EC (Early Childhood)',
      8: 'E (Everyone)',
      9: 'E10+ (Everyone 10+)',
      10: 'T (Teen)',
      11: 'M (Mature 17+)',
      12: 'AO (Adults Only)'
    };
    return esrbRatings[rating] || 'Not Rated';
  } else if (category === 2) {
    const pegiRatings: Record<number, string> = {
      1: 'PEGI 3',
      2: 'PEGI 7',
      3: 'PEGI 12',
      4: 'PEGI 16',
      5: 'PEGI 18'
    };
    return pegiRatings[rating] || 'Not Rated';
  }
  return 'Not Rated';
}

/**
 * Format release date from Unix timestamp
 */
export function formatReleaseDate(timestamp?: number): string {
  if (!timestamp) return 'TBA';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Get developers from involved companies
 */
export function getDevelopers(companies?: IGDBGameData['involved_companies']): string[] {
  if (!companies) return [];
  return companies
    .filter(c => c.developer)
    .map(c => c.company.name);
}

/**
 * Get publishers from involved companies
 */
export function getPublishers(companies?: IGDBGameData['involved_companies']): string[] {
  if (!companies) return [];
  return companies
    .filter(c => c.publisher)
    .map(c => c.company.name);
}

/**
 * Calculate combined rating (prefer aggregated, fallback to user rating)
 */
export function getCombinedRating(gameData: IGDBGameData): number | null {
  return gameData.total_rating ?? gameData.aggregated_rating ?? gameData.rating ?? null;
}
