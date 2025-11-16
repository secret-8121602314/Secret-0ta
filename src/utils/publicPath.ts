import type { ViteImportMeta } from '../types/enhanced';

/**
 * Get the correct public asset path considering Vite's base URL
 * Use this for assets in the public folder
 */
export function getPublicPath(path: string): string {
  // In development, Vite serves public assets from root
  // In production, they're served from the base path
  const isDev = (import.meta as ViteImportMeta).env.DEV;
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // In development, just return the path with leading slash
  if (isDev) {
    return `/${cleanPath}`;
  }
  
  // In production, combine with base URL from Vite config
  const base = (import.meta as ViteImportMeta).env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  
  return `${normalizedBase}${cleanPath}`;
}
