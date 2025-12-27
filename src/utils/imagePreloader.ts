/**
 * Image Preloader Utility
 * Preloads all mascot images on app startup for instant display
 * Caches images in IndexedDB (50MB+) for persistent storage
 * Uses WebP format with PNG fallback for maximum compatibility and performance
 * Falls back to localStorage for small images
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// All mascot images used in the app (WebP preferred, PNG fallback)
const MASCOT_IMAGES = [
  '/images/mascot/1.webp',
  '/images/mascot/2.webp',
  '/images/mascot/4.webp',
  '/images/mascot/5.1.webp',
  '/images/mascot/5.2.webp',
  '/images/mascot/6.webp',
  '/images/mascot/7.webp',
  '/images/mascot/8.webp',
  '/images/mascot/9.webp',
  '/images/mascot/10.webp',
  '/images/mascot/11.webp',
  '/images/mascot/pro-user.webp',
  '/images/mascot/vanguard-user.webp',
];

// Other critical images (WebP preferred, PNG fallback)
const CRITICAL_IMAGES = [
  '/images/otagon-logo.webp',
  // icon-192.png removed from preload - only used as PWA icon, not displayed in UI
];

// Cache for preloaded images
const imageCache = new Map<string, HTMLImageElement>();

// IndexedDB configuration
interface ImageCacheDB extends DBSchema {
  images: {
    key: string;
    value: { url: string; data: string; timestamp: number };
    indexes: { 'by-url': string };
  };
}

const DB_NAME = 'otagon_image_cache';
const DB_VERSION = 2; // Increment to migrate
let db: IDBPDatabase<ImageCacheDB> | null = null;

// Fallback to localStorage for tiny images
const STORAGE_PREFIX = 'otagon_img_cache_';
const _MAX_LOCALSTORAGE_KB = 200; // Only cache very small images in localStorage

// Track localStorage usage (now using a mutable object to avoid reassignment)
let _estimatedCacheSize = 0;

/**
 * Initialize IndexedDB
 */
const initDB = async (): Promise<IDBPDatabase<ImageCacheDB>> => {
  if (db) {return db;}
  
  try {
    db = await openDB<ImageCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('images')) {
          const store = db.createObjectStore('images', { keyPath: 'url' });
          store.createIndex('by-url', 'url');
        }
      },
    });
    return db;
  } catch (error) {
    console.error('[ImagePreloader] Failed to initialize IndexedDB:', error);
    throw error;
  }
};

/**
 * Check if IndexedDB cache is valid
 */
const isCacheValid = (): boolean => {
  // IndexedDB is always fresh, no version check needed
  return true;
};

/**
 * Estimate IndexedDB + localStorage usage for image cache
 */
const _estimateCacheSize = async (): Promise<number> => {
  let totalSize = 0;
  try {
    // Check IndexedDB quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
  } catch (error) {
    console.warn('[ImagePreloader] Error estimating IndexedDB quota:', error);
  }
  
  // Fallback: estimate localStorage
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    });
  } catch (error) {
    console.warn('[ImagePreloader] Error estimating localStorage size:', error);
  }
  return totalSize;
};

/**
 * Clear old IndexedDB cache
 */
const clearOldCache = async (): Promise<void> => {
  try {
    const database = await initDB();
    await database.clear('images');
    console.log('[ImagePreloader] IndexedDB cache cleared');
  } catch (error) {
    console.warn('[ImagePreloader] Error clearing IndexedDB cache:', error);
  }
};

/**
 * Save image to IndexedDB as base64
 */
const saveImageToIndexedDB = async (src: string, img: HTMLImageElement): Promise<void> => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {return;}
    
    ctx.drawImage(img, 0, 0);
    const base64 = canvas.toDataURL('image/png');
    const imageSizeKB = base64.length / 1024;
    
    const database = await initDB();
    await database.put('images', {
      url: src,
      data: base64,
      timestamp: Date.now(),
    });
    
    console.log(`[ImagePreloader] Cached to IndexedDB: ${src} (${Math.round(imageSizeKB)}KB)`);
  } catch (error) {
    // IndexedDB might be unavailable or quota exceeded
    console.warn(`[ImagePreloader] Failed to cache to IndexedDB: ${src}`, error);
    
    // Try localStorage fallback for small images
    if (img.naturalHeight * img.naturalWidth < 200000) { // ~200KB threshold
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {return;}
        
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        const storageKey = `${STORAGE_PREFIX}${encodeURIComponent(src)}`;
        localStorage.setItem(storageKey, base64);
        console.log(`[ImagePreloader] Fallback cached to localStorage: ${src}`);
      } catch (lsError) {
        console.warn(`[ImagePreloader] localStorage fallback also failed: ${src}`, lsError);
      }
    }
  }
};

/**
 * Load image from IndexedDB cache
 */
const loadImageFromIndexedDB = async (src: string): Promise<HTMLImageElement | null> => {
  try {
    const database = await initDB();
    const cached = await database.get('images', src);
    
    if (!cached || !cached.data) {return null;}
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.set(src, img);
        console.log(`[ImagePreloader] Loaded from IndexedDB: ${src}`);
        resolve(img);
      };
      img.onerror = () => {
        // Cache is corrupted, remove it
        database.delete('images', src).catch(() => {});
        reject(new Error(`Failed to load cached image: ${src}`));
      };
      img.src = cached.data;
    });
  } catch (error) {
    console.warn(`[ImagePreloader] Error loading from IndexedDB: ${src}`, error);
    
    // Try localStorage fallback
    try {
      const storageKey = `${STORAGE_PREFIX}${encodeURIComponent(src)}`;
      const base64 = localStorage.getItem(storageKey);
      if (!base64) {return null;}
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imageCache.set(src, img);
          console.log(`[ImagePreloader] Loaded from localStorage fallback: ${src}`);
          resolve(img);
        };
        img.onerror = () => {
          localStorage.removeItem(storageKey);
          reject(new Error(`Failed to load cached image: ${src}`));
        };
        img.src = base64;
      });
    } catch (lsError) {
      console.warn(`[ImagePreloader] localStorage fallback also failed: ${src}`, lsError);
      return null;
    }
  }
};

/**
 * Preload a single image and cache it in memory and IndexedDB
 * Tries WebP first, falls back to PNG if WebP loads fail
 */
export const preloadImage = async (src: string): Promise<HTMLImageElement> => {
  // Return cached image if already loaded in memory
  const cached = imageCache.get(src);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Try to load from IndexedDB first
  if (isCacheValid()) {
    try {
      const cachedImg = await loadImageFromIndexedDB(src);
      if (cachedImg) {
        return cachedImg;
      }
    } catch (_error) {
      console.warn(`[ImagePreloader] Failed to load from cache, fetching fresh: ${src}`);
    }
  }

  // Load fresh from network and cache it
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for canvas operations
    img.onload = async () => {
      imageCache.set(src, img);
      
      // Save to IndexedDB in the background
      saveImageToIndexedDB(src, img).catch(() => {
        // Ignore errors, image is still in memory
      });
      
      resolve(img);
    };
    img.onerror = () => {
      // If WebP fails, try PNG fallback
      if (src.endsWith('.webp')) {
        const pngSrc = src.replace(/\.webp$/i, '.png');
        console.warn(`[ImagePreloader] WebP failed for ${src}, trying PNG fallback: ${pngSrc}`);
        
        const imgPng = new Image();
        imgPng.crossOrigin = 'anonymous';
        imgPng.onload = async () => {
          imageCache.set(src, imgPng); // Cache under original WebP key for consistency
          saveImageToIndexedDB(src, imgPng).catch(() => {});
          resolve(imgPng);
        };
        imgPng.onerror = () => {
          console.warn(`[ImagePreloader] PNG fallback also failed: ${pngSrc}`);
          reject(new Error(`Failed to load image: ${src} or fallback ${pngSrc}`));
        };
        imgPng.src = pngSrc;
      } else {
        console.warn(`[ImagePreloader] Failed to preload: ${src}`);
        reject(new Error(`Failed to load image: ${src}`));
      }
    };
    img.src = src;
  });
};

/**
 * Preload multiple images in parallel
 */
export const preloadImages = async (sources: string[]): Promise<void> => {
  const promises = sources.map(src => 
    preloadImage(src).catch(() => null) // Don't fail if one image fails
  );
  await Promise.all(promises);
};

/**
 * Preload all mascot images - call this on app startup
 */
export const preloadAllMascotImages = async (): Promise<void> => {
  console.log('[ImagePreloader] Starting mascot image preload...');
  const startTime = performance.now();
  
  await preloadImages(MASCOT_IMAGES);
  
  const duration = Math.round(performance.now() - startTime);
  console.log(`[ImagePreloader] Mascot images preloaded in ${duration}ms (${MASCOT_IMAGES.length} images)`);
};

/**
 * Preload all critical images (logos, icons)
 */
export const preloadCriticalImages = async (): Promise<void> => {
  await preloadImages(CRITICAL_IMAGES);
};

/**
 * Preload ALL app images - call on first app load
 */
export const preloadAllAppImages = async (): Promise<void> => {
  console.log('[ImagePreloader] Starting full image preload...');
  const startTime = performance.now();
  
  await Promise.all([
    preloadImages(MASCOT_IMAGES),
    preloadImages(CRITICAL_IMAGES),
  ]);
  
  const duration = Math.round(performance.now() - startTime);
  const inMemoryCached = MASCOT_IMAGES.filter(src => imageCache.has(src)).length;
  
  console.log(`[ImagePreloader] All images preloaded in ${duration}ms (${inMemoryCached}/${MASCOT_IMAGES.length} in-memory cached)`);
};

/**
 * Check if an image is already cached
 */
export const isImageCached = (src: string): boolean => {
  return imageCache.has(src);
};

/**
 * Get a cached image element
 */
export const getCachedImage = (src: string): HTMLImageElement | undefined => {
  return imageCache.get(src);
};

/**
 * Clear all cached images from IndexedDB and localStorage
 */
export const clearImageCache = async (): Promise<void> => {
  await clearOldCache();
  imageCache.clear();
  _estimatedCacheSize = 0;
  console.log('[ImagePreloader] All caches cleared');
};

/**
 * Get cache statistics (IndexedDB + in-memory)
 */
export const getCacheStats = async (): Promise<{ total: number; inMemory: number; indexedDB: number }> => {
  const inMemory = MASCOT_IMAGES.filter(src => imageCache.has(src)).length;
  
  let indexedDBCount = 0;
  try {
    const database = await initDB();
    const allCached = await database.getAll('images');
    indexedDBCount = allCached.length;
  } catch (error) {
    console.warn('[ImagePreloader] Error getting IndexedDB stats:', error);
  }
  
  return {
    total: MASCOT_IMAGES.length,
    inMemory,
    indexedDB: indexedDBCount,
  };
};

// Auto-start preloading intelligently based on context
// Only preload mascot images when user is authenticated or on login page
if (typeof window !== 'undefined') {
  const startPreload = () => {
    // Check if user is authenticated (has auth token)
    const hasAuth = localStorage.getItem('supabase.auth.token') || 
                   sessionStorage.getItem('supabase.auth.token') ||
                   window.location.pathname.includes('/login') ||
                   window.location.pathname.includes('/app');
    
    if (hasAuth) {
      console.log('[ImagePreloader] Starting preload for authenticated/app context');
      preloadAllAppImages().catch(err => {
        console.warn('[ImagePreloader] Preload failed:', err);
      });
    } else {
      console.log('[ImagePreloader] Skipping mascot preload on landing page - will load on demand');
      // Only preload critical images for landing page
      preloadCriticalImages().catch(err => {
        console.warn('[ImagePreloader] Critical image preload failed:', err);
      });
    }
  };

  if ('requestIdleCallback' in window) {
    (window as Window).requestIdleCallback(startPreload, { timeout: 2000 });
  } else {
    // Fallback for Safari
    setTimeout(startPreload, 100);
  }
}

export default {
  preloadImage,
  preloadImages,
  preloadAllMascotImages,
  preloadCriticalImages,
  preloadAllAppImages,
  isImageCached,
  getCachedImage,
  clearImageCache,
  getCacheStats,
};
