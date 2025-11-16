export function getAssetPath(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // BASE_URL is '/' for custom domain
  // @ts-ignore - import.meta.env.BASE_URL is set by Vite at build time
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${cleanPath}`;
}
