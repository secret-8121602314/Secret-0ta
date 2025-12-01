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

// ✅ NEW: localStorage cache for persistence across refreshes
const LOCALSTORAGE_CACHE_KEY = 'otagon_igdb_cache';
const LOCALSTORAGE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const LOCALSTORAGE_COVER_CACHE_KEY = 'otagon_cover_urls';

interface LocalStorageCache {
  version: number;
  timestamp: number;
  games: { [key: string]: { data: IGDBGameData; timestamp: number } };
}

interface CoverUrlCache {
  version: number;
  timestamp: number;
  urls: { [key: string]: string };
}

// Load localStorage cache into memory on startup
function loadLocalStorageCache(): void {
  try {
    const cached = localStorage.getItem(LOCALSTORAGE_CACHE_KEY);
    if (cached) {
      const parsed: LocalStorageCache = JSON.parse(cached);
      if (parsed.version === 1 && Date.now() - parsed.timestamp < LOCALSTORAGE_CACHE_TTL) {
        // Load valid entries into session cache
        for (const [key, value] of Object.entries(parsed.games)) {
          if (Date.now() - value.timestamp < LOCALSTORAGE_CACHE_TTL) {
            sessionCache.set(key, value);
          }
        }
        console.log('[IGDBService] Loaded', sessionCache.size, 'games from localStorage cache');
      }
    }
  } catch (error) {
    console.warn('[IGDBService] Error loading localStorage cache:', error);
  }
}

// Save session cache to localStorage
function saveLocalStorageCache(): void {
  try {
    const games: { [key: string]: { data: IGDBGameData; timestamp: number } } = {};
    sessionCache.forEach((value, key) => {
      games[key] = value;
    });
    const cache: LocalStorageCache = {
      version: 1,
      timestamp: Date.now(),
      games
    };
    localStorage.setItem(LOCALSTORAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('[IGDBService] Error saving localStorage cache:', error);
  }
}

// Load cover URL cache from localStorage
function loadCoverUrlCache(): Map<string, string> {
  try {
    const cached = localStorage.getItem(LOCALSTORAGE_COVER_CACHE_KEY);
    if (cached) {
      const parsed: CoverUrlCache = JSON.parse(cached);
      if (parsed.version === 1 && Date.now() - parsed.timestamp < LOCALSTORAGE_CACHE_TTL) {
        console.log('[IGDBService] Loaded', Object.keys(parsed.urls).length, 'cover URLs from localStorage');
        return new Map(Object.entries(parsed.urls));
      }
    }
  } catch (error) {
    console.warn('[IGDBService] Error loading cover URL cache:', error);
  }
  return new Map();
}

// Save cover URL cache to localStorage
function saveCoverUrlCache(urls: Map<string, string>): void {
  try {
    const cache: CoverUrlCache = {
      version: 1,
      timestamp: Date.now(),
      urls: Object.fromEntries(urls)
    };
    localStorage.setItem(LOCALSTORAGE_COVER_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('[IGDBService] Error saving cover URL cache:', error);
  }
}

// Initialize localStorage cache on module load
loadLocalStorageCache();

// Persistent cover URL cache
const coverUrlMemoryCache = loadCoverUrlCache();

/**
 * Convert IGDB cover URL to a specific size
 * Size options: 't_thumb' (90x90), 't_cover_small' (90x128), 't_cover_big' (264x374), 't_720p', 't_1080p'
 */
export function getCoverUrl(url: string | undefined, size: 'thumb' | 'cover_small' | 'cover_big' | '720p' | '1080p' = 'cover_small'): string | undefined {
  if (!url) {
    return undefined;
  }
  // IGDB URLs may come in different formats:
  // - //images.igdb.com/igdb/image/upload/t_thumb/xxx.jpg (raw from IGDB)
  // - https://images.igdb.com/igdb/image/upload/t_cover_big/xxx.jpg (already processed by edge function)
  // We need to handle both cases
  let processedUrl = url;
  
  // Replace any existing size with the new size
  processedUrl = processedUrl.replace(/t_(thumb|cover_small|cover_big|720p|1080p|screenshot_huge)/g, `t_${size}`);
  
  // Ensure https:// prefix
  if (processedUrl.startsWith('//')) {
    processedUrl = 'https:' + processedUrl;
  } else if (!processedUrl.startsWith('http')) {
    processedUrl = 'https://' + processedUrl;
  }
  
  return processedUrl;
}

/**
 * Extract cover URL from IGDB game data with appropriate size for sidebar
 */
export function getSidebarCoverUrl(gameData: IGDBGameData | null): string | undefined {
  if (!gameData?.cover?.url) {
    return undefined;
  }
  return getCoverUrl(gameData.cover.url, 'cover_small');
}

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
      
      // ✅ NEW: Persist to localStorage for faster reload
      saveLocalStorageCache();
      
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

// Interface for IGDB cache table rows
interface IGDBCacheRow {
  game_name_key: string;
  game_data: IGDBGameData;
}

// Interface for Supabase error response
interface SupabaseError {
  message: string;
  code?: string;
}

/**
 * Fetch cover URLs for multiple games from IGDB cache in a single batch query
 * Uses localStorage cache first for instant display, then updates from Supabase
 * Returns a map of game name (lowercase) -> cover URL
 */
export async function fetchCoverUrlsFromCache(gameNames: string[]): Promise<Map<string, string>> {
  const coverUrls = new Map<string, string>();
  
  if (gameNames.length === 0) {
    return coverUrls;
  }
  
  // Normalize game names for cache lookup
  const normalizedNames = gameNames.map(name => name.toLowerCase().trim());
  
  // ✅ NEW: Check localStorage cache first for instant display
  const missingFromLocalCache: string[] = [];
  for (const name of normalizedNames) {
    const cached = coverUrlMemoryCache.get(name);
    if (cached) {
      coverUrls.set(name, cached);
    } else {
      missingFromLocalCache.push(name);
    }
  }
  
  // If all found in local cache, return immediately
  if (missingFromLocalCache.length === 0) {
    console.log('[IGDBService] All cover URLs from localStorage cache:', coverUrls.size);
    return coverUrls;
  }
  
  // Fetch missing ones from Supabase in background
  try {
    // Use type assertion since igdb_game_cache may not be in generated types
    const { data, error } = await (supabase
      .from('igdb_game_cache' as never)
      .select('game_name_key, game_data')
      .in('game_name_key', missingFromLocalCache)
      .gt('expires_at', new Date().toISOString()) as unknown as Promise<{ data: IGDBCacheRow[] | null; error: SupabaseError | null }>);
    
    if (error) {
      console.warn('[IGDBService] Error fetching cover URLs from cache:', error.message);
      return coverUrls;
    }
    
    if (data) {
      for (const row of data) {
        const gameData = row.game_data;
        if (gameData?.cover?.url) {
          const coverUrl = getCoverUrl(gameData.cover.url, 'cover_small');
          if (coverUrl) {
            coverUrls.set(row.game_name_key, coverUrl);
            // ✅ NEW: Update memory cache
            coverUrlMemoryCache.set(row.game_name_key, coverUrl);
          }
        }
      }
      // ✅ NEW: Persist updated cache to localStorage
      saveCoverUrlCache(coverUrlMemoryCache);
    }
    
    console.log('[IGDBService] Fetched cover URLs:', coverUrls.size, 'of', gameNames.length, 
      '(', coverUrls.size - missingFromLocalCache.length + (data?.length ?? 0), 'from localStorage,', 
      data?.length || 0, 'from Supabase)');
  } catch (error) {
    console.warn('[IGDBService] Error in fetchCoverUrlsFromCache:', error);
  }
  
  return coverUrls;
}
