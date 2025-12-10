/**
 * Landscape Image Viewer for PWA
 * Allows landscape orientation when viewing images in gallery or modal
 * Automatically rotates and provides full-screen native experience
 */

import { isPWAMode } from './pwaDetection';

// Type augmentation for Screen Orientation API (not fully typed in TypeScript)
interface ScreenOrientationExtended extends ScreenOrientation {
  lock(orientation: 'landscape' | 'portrait' | 'landscape-primary' | 'landscape-secondary' | 'portrait-primary' | 'portrait-secondary'): Promise<void>;
  unlock(): void;
}

// ============================================
// ORIENTATION MANAGEMENT
// ============================================

let originalOrientation: string | null = null;
let isLandscapeMode = false;
let activeImageElement: HTMLElement | null = null;

/**
 * Check if Screen Orientation API is supported
 */
export function isOrientationLockSupported(): boolean {
  return 'orientation' in screen && 'lock' in screen.orientation;
}

/**
 * Lock orientation to landscape
 */
export async function lockLandscape(): Promise<boolean> {
  if (!isPWAMode() || !isOrientationLockSupported()) {
    console.warn('[LandscapeViewer] Orientation lock not supported or not in PWA');
    return false;
  }

  try {
    // Store original orientation
    if (!originalOrientation) {
      originalOrientation = screen.orientation.type;
    }

    // Lock to landscape - cast to extended type
    const orientation = screen.orientation as ScreenOrientationExtended;
    await orientation.lock('landscape');
    isLandscapeMode = true;
    
    console.log('[LandscapeViewer] Locked to landscape');
    return true;
  } catch (error) {
    console.error('[LandscapeViewer] Failed to lock landscape:', error);
    return false;
  }
}

/**
 * Unlock orientation (return to original)
 */
export function unlockOrientation(): void {
  if (!isOrientationLockSupported()) {
    return;
  }

  try {
    const orientation = screen.orientation as ScreenOrientationExtended;
    orientation.unlock();
    isLandscapeMode = false;
    originalOrientation = null;
    
    console.log('[LandscapeViewer] Orientation unlocked');
  } catch (error) {
    console.error('[LandscapeViewer] Failed to unlock orientation:', error);
  }
}

/**
 * Check if currently in landscape mode
 */
export function isLandscape(): boolean {
  return isLandscapeMode;
}

// ============================================
// IMAGE VIEWER COMPONENT
// ============================================

interface ImageViewerOptions {
  imageUrl: string;
  alt?: string;
  allowLandscape?: boolean;
  onClose?: () => void;
}

/**
 * Create and show landscape image viewer
 */
export function showImageViewer(options: ImageViewerOptions): void {
  if (!isPWAMode()) {
    console.log('[LandscapeViewer] Not in PWA mode, using default behavior');
    return;
  }

  const {
    imageUrl,
    alt = 'Image',
    allowLandscape = true,
    onClose,
  } = options;

  // Create viewer container
  const viewer = createViewerElement(imageUrl, alt);
  document.body.appendChild(viewer);
  activeImageElement = viewer;

  // Lock to landscape if enabled
  if (allowLandscape) {
    lockLandscape();
  }

  // Add close handlers
  setupCloseHandlers(viewer, onClose);

  // Animate in
  requestAnimationFrame(() => {
    viewer.classList.add('active');
  });

  console.log('[LandscapeViewer] Image viewer opened');
}

/**
 * Close image viewer
 */
export function closeImageViewer(): void {
  if (!activeImageElement) {
    return;
  }

  // Animate out
  activeImageElement.classList.remove('active');

  // Remove after animation
  setTimeout(() => {
    if (activeImageElement) {
      activeImageElement.remove();
      activeImageElement = null;
    }
  }, 300);

  // Unlock orientation
  unlockOrientation();

  console.log('[LandscapeViewer] Image viewer closed');
}

/**
 * Create viewer DOM element
 */
function createViewerElement(imageUrl: string, alt: string): HTMLElement {
  const viewer = document.createElement('div');
  viewer.className = 'landscape-image-viewer';
  viewer.innerHTML = `
    <div class="landscape-viewer-overlay"></div>
    <div class="landscape-viewer-content">
      <button class="landscape-viewer-close" aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <img 
        src="${imageUrl}" 
        alt="${alt}"
        class="landscape-viewer-image"
      />
      <div class="landscape-viewer-controls">
        <button class="landscape-viewer-rotate" aria-label="Rotate">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
          </svg>
        </button>
        <button class="landscape-viewer-download" aria-label="Download">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Add pinch-to-zoom support
  addPinchZoom(viewer.querySelector('.landscape-viewer-image') as HTMLImageElement);

  return viewer;
}

/**
 * Setup close handlers for viewer
 */
function setupCloseHandlers(viewer: HTMLElement, onClose?: () => void): void {
  // Close button - use capture phase and stop propagation to ensure it works
  const closeBtn = viewer.querySelector('.landscape-viewer-close');
  closeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    closeImageViewer();
    onClose?.();
  }, { capture: true });
  
  // Also handle touch events for mobile
  closeBtn?.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    closeImageViewer();
    onClose?.();
  }, { capture: true });

  // Overlay click
  const overlay = viewer.querySelector('.landscape-viewer-overlay');
  overlay?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeImageViewer();
    onClose?.();
  });

  // Rotate button
  const rotateBtn = viewer.querySelector('.landscape-viewer-rotate');
  const img = viewer.querySelector('.landscape-viewer-image') as HTMLElement;
  let rotation = 0;
  
  rotateBtn?.addEventListener('click', () => {
    rotation = (rotation + 90) % 360;
    img.style.transform = `rotate(${rotation}deg)`;
  });

  // Download button
  const downloadBtn = viewer.querySelector('.landscape-viewer-download');
  downloadBtn?.addEventListener('click', () => {
    const imgSrc = (viewer.querySelector('.landscape-viewer-image') as HTMLImageElement).src;
    downloadImage(imgSrc);
  });

  // ESC key
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeImageViewer();
      onClose?.();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

/**
 * Add pinch-to-zoom support to image
 */
function addPinchZoom(img: HTMLImageElement): void {
  let scale = 1;
  let lastDistance = 0;

  img.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      lastDistance = getDistance(e.touches[0], e.touches[1]);
    }
  }, { passive: true });

  img.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      
      const distance = getDistance(e.touches[0], e.touches[1]);
      const delta = distance / lastDistance;
      scale *= delta;
      scale = Math.max(1, Math.min(scale, 4)); // Limit scale between 1x and 4x

      img.style.transform = `scale(${scale})`;
      lastDistance = distance;
    }
  });

  img.addEventListener('touchend', () => {
    if (scale < 1.1) {
      scale = 1;
      img.style.transform = 'scale(1)';
    }
  }, { passive: true });
}

/**
 * Calculate distance between two touch points
 */
function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Download image to device
 */
async function downloadImage(url: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `otagon-image-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(objectUrl);
    console.log('[LandscapeViewer] Image downloaded');
  } catch (error) {
    console.error('[LandscapeViewer] Download failed:', error);
  }
}

// ============================================
// AUTO-DETECT IMAGE CLICKS
// ============================================

/**
 * Automatically enable landscape viewer for image clicks
 */
export function enableAutoLandscapeViewer(options?: {
  selector?: string;
  allowLandscape?: boolean;
}): void {
  if (!isPWAMode()) {
    return;
  }

  const { selector = 'img', allowLandscape = true } = options || {};

  // Delegate click handler for images
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Check if clicked element is an image or contains an image
    const img = target.tagName === 'IMG' 
      ? target as HTMLImageElement
      : target.querySelector('img');

    if (img && img.matches(selector)) {
      // Exclude small icons and UI images
      if (img.width < 100 || img.height < 100) {
        return;
      }

      // Exclude images with data-no-viewer attribute
      if (img.hasAttribute('data-no-viewer')) {
        return;
      }

      // ✅ ONLY open landscape viewer for specific image types:
      // 1. User query images (in chat messages)
      // 2. Queued message images (in chat input)
      // 3. Gallery images (explicitly marked)
      const isUserQueryImage = img.closest('.chat-message-image, .message-image, [data-image-type="user-query"]');
      const isQueuedMessageImage = img.closest('.queued-image, .chat-input-image, [data-image-type="queued"]');
      const isGalleryImage = img.closest('.gallery-image, [data-image-type="gallery"]') || img.hasAttribute('data-viewer-enabled');
      
      // Exclude mascot images and other UI images
      const isMascotImage = img.src.includes('/mascot/') || img.src.includes('mascot');
      const isLogoImage = img.src.includes('logo') || img.closest('.logo, [class*="logo"]');
      const isIconImage = img.src.includes('/icons/') || img.closest('.icon, [class*="icon"]');
      const isUIImage = img.closest('.sidebar, .header, .nav, .modal-header, .context-menu, .dropdown');
      
      // Only proceed if it's an allowed image type and not excluded
      if ((!isUserQueryImage && !isQueuedMessageImage && !isGalleryImage) || isMascotImage || isLogoImage || isIconImage || isUIImage) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      showImageViewer({
        imageUrl: img.src,
        alt: img.alt,
        allowLandscape,
      });
    }
  }, { capture: true });

  console.log('[LandscapeViewer] Auto landscape viewer enabled');
}

// ============================================
// CSS INJECTION
// ============================================

/**
 * Inject CSS for landscape viewer
 */
function injectViewerCSS(): void {
  const style = document.createElement('style');
  style.textContent = `
    .landscape-image-viewer {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .landscape-image-viewer.active {
      opacity: 1;
    }

    .landscape-viewer-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
    }

    .landscape-viewer-content {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .landscape-viewer-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.3s ease;
      touch-action: pan-x pan-y pinch-zoom;
    }

    .landscape-viewer-close {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      pointer-events: auto;
      transition: background 0.2s ease;
    }

    .landscape-viewer-close:hover,
    .landscape-viewer-close:active {
      background: rgba(255, 255, 255, 0.2);
    }

    .landscape-viewer-controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      z-index: 10;
    }

    .landscape-viewer-rotate,
    .landscape-viewer-download {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .landscape-viewer-rotate:hover,
    .landscape-viewer-rotate:active,
    .landscape-viewer-download:hover,
    .landscape-viewer-download:active {
      background: rgba(255, 255, 255, 0.2);
    }
  `;
  document.head.appendChild(style);

  console.log('[LandscapeViewer] CSS injected');
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize landscape image viewer
 */
export function initLandscapeViewer(options?: {
  autoEnable?: boolean;
  selector?: string;
}): void {
  if (!isPWAMode()) {
    console.log('[LandscapeViewer] Not in PWA mode, skipping initialization');
    return;
  }

  const { autoEnable = true, selector } = options || {};

  console.log('[LandscapeViewer] Initializing...');

  injectViewerCSS();

  if (autoEnable) {
    enableAutoLandscapeViewer({ selector });
  }

  console.log('[LandscapeViewer] Initialized successfully');
}

// Auto-initialize if in PWA mode
if (isPWAMode() && document.readyState === 'complete') {
  initLandscapeViewer();
} else if (isPWAMode()) {
  window.addEventListener('load', () => initLandscapeViewer());
}
