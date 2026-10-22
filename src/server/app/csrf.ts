// CSRF guard for every non-GET /api/app/* request: Origin must be an allowed app origin AND X-Knowvia-App: 1.
// PROVISIONAL (D2): cookie/CSRF/CORS policy is an OPEN decision. SameSite=Lax cookies are the first layer.
import { appError } from "./errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertCsrf(request: Request, allowedOrigins: string[]): void {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;
  const origin = request.headers.get("origin");
  const marker = request.headers.get("x-knowvia-app");
  if (!origin || !allowedOrigins.includes(origin) || marker !== "1") throw appError(403, "CSRF_BLOCKED");
}
