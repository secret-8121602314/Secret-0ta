/**
 * Get the correct public asset path considering Vite's base URL
 * Use this for assets in the public folder
 */
export function getPublicPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Combine with base URL from Vite config
  const base = (import.meta as any).env.BASE_URL;
  
  return `${base}${cleanPath}`;
}
