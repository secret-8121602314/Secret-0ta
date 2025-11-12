export function getAssetPath(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // In production, BASE_URL is '/Otagon/', in dev it's '/'
  // @ts-ignore - import.meta.env.BASE_URL is set by Vite at build time
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${cleanPath}`;
}
