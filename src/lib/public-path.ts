/** Public file URL. `/` in local builds, `/Reliquary/` on the GitHub Pages build. */
export function publicPath(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  if (path === "/") return base;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${clean}`;
}
