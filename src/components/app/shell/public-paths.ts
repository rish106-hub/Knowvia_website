// Screens that need no session. The session provider reads /session only on other paths, so these make no request at all.
const PUBLIC_APP_PATHS = new Set(["/app/start", "/app/emergency"]);

export function isPublicAppPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  // The sample dashboards (/app/demo/{scenario}) need no session either; they are a 404 unless demo data is on.
  return PUBLIC_APP_PATHS.has(clean) || /^\/app\/demo\/[a-z]+$/.test(clean);
}
