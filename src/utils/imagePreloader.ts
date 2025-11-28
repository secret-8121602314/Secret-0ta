/**
 * Image Preloader Utility
 * Preloads all mascot images on app startup for instant display
 */

// All mascot images used in the app
const MASCOT_IMAGES = [
  '/images/mascot/1.png',
  '/images/mascot/2.png',
  '/images/mascot/4.png',
  '/images/mascot/5.1.png',
  '/images/mascot/5.2.png',
  '/images/mascot/6.png',
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

/**
 * Preload a single image and cache it
 */
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  // Return cached image if already loaded
  const cached = imageCache.get(src);
  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
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
  
  await preloadImages(MASCOT_IMAGES);
  
  const duration = Math.round(performance.now() - startTime);
  console.log(`[ImagePreloader] Mascot images preloaded in ${duration}ms`);
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
  console.log(`[ImagePreloader] All images preloaded in ${duration}ms`);
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
};
