// Default wiring for the Next route files. Server-only. PROVISIONAL (D1/D2).
import { createApp, type App } from "./handler";
import { createRateLimiter } from "./rate-limit";

type Methods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Dispatch = Parameters<App["dispatch"]>[0];
type RouteCtx = { params: Promise<Record<string, string>> };

const globalApp = globalThis as typeof globalThis & { knowviaAppBff?: App };

// The rate limiter is per instance and lives on globalThis so dev hot reloads keep its counters.
export function getApp(): App {
  globalApp.knowviaAppBff ??= createApp({
    env: () => process.env,
    fetch: (input, init) => globalThis.fetch(input, init),
    now: () => Date.now(),
    rateLimiter: createRateLimiter(),
  });
  return globalApp.knowviaAppBff;
}

const handlerFor = (name: Dispatch) => async (request: Request, context: RouteCtx) =>
  getApp().dispatch(name, request, (await context.params) ?? {});

const unsupported = (kind: "method_not_allowed") => async () => getApp().fallback(kind);

/**
 * Builds the exported method handlers for a route file. Unlisted methods answer APP_DISABLED while the BFF is
 * off, and 405 otherwise, so every method of every /api/app/* path is gated by APP_ENABLED.
 */
export function routeMethods(map: Partial<Record<Methods, Dispatch>>) {
  const pick = (method: Methods) => (map[method] ? handlerFor(map[method] as Dispatch) : unsupported("method_not_allowed"));
  return {
    GET: pick("GET"),
    POST: pick("POST"),
    PUT: pick("PUT"),
    PATCH: pick("PATCH"),
    DELETE: pick("DELETE"),
    OPTIONS: unsupported("method_not_allowed"),
  };
}

/** For the catch-all: every method answers APP_DISABLED (off) or a JSON 404. */
export function catchAllMethods() {
  const notFound = async () => getApp().fallback("not_found");
  return { GET: notFound, POST: notFound, PUT: notFound, PATCH: notFound, DELETE: notFound, OPTIONS: notFound };
}
