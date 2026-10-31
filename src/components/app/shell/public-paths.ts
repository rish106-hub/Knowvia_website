// Screens that need no session. The session provider reads /session only on other paths, so these two make no request at all.
const PUBLIC_APP_PATHS = new Set(["/app/start", "/app/emergency"]);

export function isPublicAppPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PUBLIC_APP_PATHS.has(clean);
}
