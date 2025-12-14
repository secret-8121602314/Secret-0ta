/**
 * Image Preloader Utility
 * Preloads all mascot images on app startup for instant display
 * Caches images in localStorage as base64 for persistent storage
 */

// All mascot images used in the app
const MASCOT_IMAGES = [
  '/images/mascot/1.png',
  '/images/mascot/2.png',
  '/images/mascot/4.png',
  '/images/mascot/5.1.png',
  '/images/mascot/5.2.png',
  '/images/mascot/6.png',
  '/images/mascot/7.png',
  '/images/mascot/8.png',
  '/images/mascot/9.png',
  '/images/mascot/10.png',
  '/images/mascot/11.png',
  '/images/mascot/pro-user.png',
  '/images/mascot/vanguard-user.png',
];

// Other critical images
const CRITICAL_IMAGES = [
  '/images/otagon-logo.png',
  '/icon-192.png',
];

// Cache for preloaded images
const imageCache = new Map<string, HTMLImageElement>();

// LocalStorage key prefix
const STORAGE_PREFIX = 'otagon_img_cache_';
const CACHE_VERSION = 'v1';
const VERSION_KEY = `${STORAGE_PREFIX}version`;

/**
 * Check if localStorage cache is valid
 */
const isCacheValid = (): boolean => {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    return storedVersion === CACHE_VERSION;
  } catch (error) {
    console.warn('[ImagePreloader] Error checking cache version:', error);
    return false;
  }
};

/**
 * Clear old cache if version mismatch
 */
const clearOldCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    localStorage.setItem(VERSION_KEY, CACHE_VERSION);
    console.log('[ImagePreloader] Cache cleared and version updated');
  } catch (error) {
    console.warn('[ImagePreloader] Error clearing cache:', error);
  }
};

/**
 * Save image to localStorage as base64
 */
const saveImageToLocalStorage = async (src: string, img: HTMLImageElement): Promise<void> => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(img, 0, 0);
    const base64 = canvas.toDataURL('image/png');
    
    const storageKey = `${STORAGE_PREFIX}${encodeURIComponent(src)}`;
    localStorage.setItem(storageKey, base64);
    console.log(`[ImagePreloader] Cached to localStorage: ${src}`);
  } catch (error) {
    // localStorage might be full or unavailable - just log and continue
    console.warn(`[ImagePreloader] Failed to cache to localStorage: ${src}`, error);
  }
};

/**
 * Load image from localStorage cache
 */
const loadImageFromLocalStorage = (src: string): Promise<HTMLImageElement> | null => {
  try {
    const storageKey = `${STORAGE_PREFIX}${encodeURIComponent(src)}`;
    const base64 = localStorage.getItem(storageKey);
    
    if (!base64) return null;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.set(src, img);
        console.log(`[ImagePreloader] Loaded from localStorage: ${src}`);
        resolve(img);
      };
      img.onerror = () => {
        // Cache is corrupted, remove it
        localStorage.removeItem(storageKey);
        reject(new Error(`Failed to load cached image: ${src}`));
      };
      img.src = base64;
    });
  } catch (error) {
    console.warn(`[ImagePreloader] Error loading from localStorage: ${src}`, error);
    return null;
  }
};

/**
 * Preload a single image and cache it in memory and localStorage
 */
export const preloadImage = async (src: string): Promise<HTMLImageElement> => {
  // Return cached image if already loaded in memory
  const cached = imageCache.get(src);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Try to load from localStorage first
  if (isCacheValid()) {
    try {
      const cachedPromise = loadImageFromLocalStorage(src);
      if (cachedPromise) {
        const cachedImg = await cachedPromise;
        return cachedImg;
      }
    } catch (error) {
      console.warn(`[ImagePreloader] Failed to load from cache, fetching fresh: ${src}`);
    }
  }

  // Load fresh from network and cache it
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for canvas operations
    img.onload = async () => {
      imageCache.set(src, img);
      
      // Save to localStorage in the background
      saveImageToLocalStorage(src, img).catch(() => {
        // Ignore errors, image is still in memory
      });
      
      resolve(img);
    };
    img.onerror = () => {
      console.warn(`[ImagePreloader] Failed to preload: ${src}`);
      reject(new Error(`Failed to load image: ${src}`));
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
  
  // Check cache version and clear if needed
  if (!isCacheValid()) {
    console.log('[ImagePreloader] Cache version mismatch, clearing old cache...');
    clearOldCache();
  }
  
  await preloadImages(MASCOT_IMAGES);
  
  const duration = Math.round(performance.now() - startTime);
  const cacheStatus = isCacheValid() ? 'from cache' : 'fresh';
  console.log(`[ImagePreloader] Mascot images preloaded in ${duration}ms (${cacheStatus})`);
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
  
  // Check cache version and clear if needed
  if (!isCacheValid()) {
    console.log('[ImagePreloader] Cache version mismatch, clearing old cache...');
    clearOldCache();
  }
  
  await Promise.all([
    preloadImages(MASCOT_IMAGES),
    preloadImages(CRITICAL_IMAGES),
  ]);
  
  const duration = Math.round(performance.now() - startTime);
  const cachedCount = MASCOT_IMAGES.filter(src => {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}${encodeURIComponent(src)}`) !== null;
    } catch {
      return false;
    }
  }).length;
  
  console.log(`[ImagePreloader] All images preloaded in ${duration}ms (${cachedCount}/${MASCOT_IMAGES.length} from cache)`);
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
 * Clear all cached images from localStorage
 */
export const clearImageCache = (): void => {
  clearOldCache();
  imageCache.clear();
  console.log('[ImagePreloader] All caches cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): { total: number; cached: number; size: number } => {
  let totalSize = 0;
  let cachedCount = 0;
  
  try {
    MASCOT_IMAGES.forEach(src => {
      const storageKey = `${STORAGE_PREFIX}${encodeURIComponent(src)}`;
      const data = localStorage.getItem(storageKey);
      if (data) {
        cachedCount++;
        totalSize += data.length;
      }
    });
  } catch (error) {
    console.warn('[ImagePreloader] Error getting cache stats:', error);
  }
  
  return {
    total: MASCOT_IMAGES.length,
    cached: cachedCount,
    size: Math.round(totalSize / 1024), // KB
  };
};

// Auto-start preloading when this module is imported
// Uses requestIdleCallback to not block the main thread
if (typeof window !== 'undefined') {
  const startPreload = () => {
    preloadAllAppImages().catch(err => {
      console.warn('[ImagePreloader] Preload failed:', err);
    });
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
