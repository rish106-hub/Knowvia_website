import { type BetaSession, openSession, readCookie, SESSION_COOKIE, sealSession, sessionCookie } from "./session";

export type BetaDeps = { fetchImpl: typeof fetch; env: NodeJS.ProcessEnv };

export class BackendError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function defaultDeps(): BetaDeps {
  return { fetchImpl: (...args) => fetch(...args), env: process.env };
}

export function backendBase(env: NodeJS.ProcessEnv) {
  const raw = (env.BACKEND_API_URL || "").trim().replace(/\/+$/, "");
  if (!raw) throw new BackendError(503, "BETA_NOT_CONFIGURED", "The beta is not available right now.");
  return raw;
}

/** Context for one request: the opened session and a way to change it (written back as a Set-Cookie). */
export class Ctx {
  session: BetaSession | null;
  private dirty = false;
  constructor(public request: Request, public deps: BetaDeps) {
    this.session = openSession(readCookie(request, SESSION_COOKIE), deps.env);
  }
  require(): BetaSession {
    if (!this.session) throw new BackendError(401, "BETA_SESSION_REQUIRED", "Start again to continue.");
    return this.session;
  }
  update(patch: Partial<BetaSession>) {
    this.session = { ...this.require(), ...patch };
    this.dirty = true;
  }
  set(session: BetaSession) {
    this.session = session;
    this.dirty = true;
  }
  headers(extra: Record<string, string> = {}) {
    const h = new Headers(extra);
    if (this.dirty && this.session) h.append("set-cookie", sessionCookie(sealSession(this.session, this.deps.env), this.deps.env));
    h.set("cache-control", "no-store");
    return h;
  }
}

type CallOptions = { method?: string; token?: string | null; body?: unknown; raw?: BodyInit; headers?: Record<string, string>; stream?: boolean };

/** One server-to-server call. The bearer never leaves this module. Coded backend errors become BackendError. */
export async function backend(ctx: Ctx, path: string, opts: CallOptions = {}): Promise<Response> {
  const base = backendBase(ctx.deps.env);
  const headers: Record<string, string> = { accept: "application/json", ...(opts.headers || {}) };
  const token = opts.token === undefined ? ctx.session?.token : opts.token;
  if (token) headers.authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.raw !== undefined) body = opts.raw;
  else if (opts.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  let res: Response;
  try {
    res = await ctx.deps.fetchImpl(base + path, { method: opts.method || (body ? "POST" : "GET"), headers, body, cache: "no-store", ...(opts.raw !== undefined ? { duplex: "half" } : {}) } as RequestInit);
  } catch {
    throw new BackendError(502, "BACKEND_UNAVAILABLE", "We could not reach the service. Try again in a moment.");
  }
  if (res.ok) return res;
  throw await toError(res);
}

export async function backendJson<T = Record<string, unknown>>(ctx: Ctx, path: string, opts: CallOptions = {}): Promise<T> {
  const res = await backend(ctx, path, opts);
  return (await res.json()) as T;
}

async function toError(res: Response) {
  let code = "BACKEND_ERROR";
  let message = "Something went wrong. Try again.";
  try {
    const data = (await res.json()) as { error?: { code?: unknown; message?: unknown } };
    if (typeof data?.error?.code === "string" && /^[A-Z][A-Z0-9_]{1,80}$/.test(data.error.code)) code = data.error.code;
    if (typeof data?.error?.message === "string") message = data.error.message.slice(0, 300);
  } catch {
    /* non-JSON body: keep generic */
  }
  const status = res.status >= 400 && res.status < 600 ? res.status : 502;
  return new BackendError(status, code, message);
}

export function jsonResponse(ctx: Ctx | null, body: unknown, status = 200) {
  const headers = ctx ? ctx.headers({ "content-type": "application/json" }) : new Headers({ "content-type": "application/json", "cache-control": "no-store" });
  return new Response(JSON.stringify(body), { status, headers });
}

export function errorResponse(error: unknown, ctx: Ctx | null = null) {
  if (error instanceof BackendError) return jsonResponse(ctx, { error: { code: error.code, message: error.message } }, error.status);
  console.error("beta handler failed", error instanceof Error ? error.name : "unknown");
  return jsonResponse(ctx, { error: { code: "BETA_FAILED", message: "Something went wrong. Try again." } }, 500);
}

/** Wraps a handler: builds the context, maps errors to coded JSON, and writes any session change back. */
export function route(handler: (ctx: Ctx) => Promise<Response>) {
  return async (request: Request, deps: BetaDeps = defaultDeps()) => {
    let ctx: Ctx | null = null;
    try {
      ctx = new Ctx(request, deps);
      return await handler(ctx);
    } catch (error) {
      return errorResponse(error, ctx);
    }
  };
}
