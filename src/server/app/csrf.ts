// CSRF guard for every non-GET /api/app/* request: Origin must be an allowed app origin AND X-Knowvia-App: 1.
// A GET that has a backend side effect (the OCR refresh polls the provider) needs the marker header too: SameSite=Lax
// cookies ride on a cross-site top-level navigation, but such a navigation cannot add a custom header.
// PROVISIONAL (D2): cookie/CSRF/CORS policy is an OPEN decision. SameSite=Lax cookies are the first layer.
import { appError } from "./errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertCsrf(request: Request, allowedOrigins: string[], { markerOnGet = false }: { markerOnGet?: boolean } = {}): void {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    if (markerOnGet && request.headers.get("x-knowvia-app") !== "1") throw appError(403, "CSRF_BLOCKED");
    return;
  }
  const origin = request.headers.get("origin");
  const marker = request.headers.get("x-knowvia-app");
  if (!origin || !allowedOrigins.includes(origin) || marker !== "1") throw appError(403, "CSRF_BLOCKED");
}
