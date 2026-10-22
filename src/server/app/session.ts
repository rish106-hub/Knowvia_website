// Session and state cookies. PROVISIONAL (D1/D2): the backend bearer token lives only inside the encrypted,
// httpOnly session cookie. The state cookie holds non-secret bookkeeping the backend cannot list for us
// (case id, consent grant ids, OCR job ids). Moving this server-side is a D2 decision.
import { z } from "zod";
import { AppError, appError } from "./errors";
import { openCookie, sealCookie } from "./cookie-crypto";

export type SessionData = {
  token: string;
  expiresAt: string;
  householdId: string;
  adultId: string;
  memberId: string;
};

const sessionSchema = z.object({
  token: z.string().min(32).max(256),
  expiresAt: z.string().min(10).max(40),
  householdId: z.string().min(1).max(128),
  adultId: z.string().min(1).max(128),
  memberId: z.string().min(1).max(128),
});

export const CONSENT_SCOPES = ["collect", "ocr_sarvam", "question_gemini"] as const;
export type ConsentScopeName = (typeof CONSENT_SCOPES)[number];

export type StateConsent = { id: string; scope: ConsentScopeName; docs: string[]; at: string };
export type AppState = {
  v: 1;
  hid: string;
  caseId: string | null;
  consents: StateConsent[];
  ocrJobs: Record<string, string>;
};

const stateSchema = z.object({
  v: z.literal(1),
  hid: z.string().max(128),
  caseId: z.string().max(128).nullable(),
  consents: z
    .array(
      z.object({
        id: z.string().max(128),
        scope: z.enum(CONSENT_SCOPES),
        docs: z.array(z.string().max(128)).max(10),
        at: z.string().max(40),
      }),
    )
    .max(24),
  ocrJobs: z.record(z.string().max(128), z.string().max(128)),
});

export const MAX_STATE_ITEMS = 24;
const MAX_COOKIE_VALUE_BYTES = 3800;

export const emptyState = (householdId: string): AppState => ({
  v: 1,
  hid: householdId,
  caseId: null,
  consents: [],
  ocrJobs: {},
});

export type CookieNames = { session: string; state: string };
// __Host- requires Secure, so it is used only when the Secure flag is set (production).
export const cookieNames = (production: boolean): CookieNames =>
  production
    ? { session: "__Host-kv_session", state: "__Host-kv_state" }
    : { session: "kv_session", state: "kv_state" };

export function parseCookieHeader(header: string | null): Map<string, string> {
  const jar = new Map<string, string>();
  if (!header) return jar;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name && !jar.has(name)) jar.set(name, value);
  }
  return jar;
}

export function serializeCookie(
  name: string,
  value: string,
  { production, maxAgeSeconds }: { production: boolean; maxAgeSeconds: number },
): string {
  const attributes = [`${name}=${value}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`];
  if (production) attributes.push("Secure");
  return attributes.join("; ");
}

export const clearCookie = (name: string, production: boolean) =>
  serializeCookie(name, "", { production, maxAgeSeconds: 0 }) + "; Expires=Thu, 01 Jan 1970 00:00:00 GMT";

export type LoadedSession = { session: SessionData; state: AppState };

/** Reads and verifies the session. Throws SESSION_REQUIRED or SESSION_EXPIRED (which clears cookies). */
export function loadSession(
  cookieHeader: string | null,
  { secret, production, nowMs }: { secret: string; production: boolean; nowMs: number },
): LoadedSession {
  const names = cookieNames(production);
  const jar = parseCookieHeader(cookieHeader);
  const raw = jar.get(names.session);
  if (!raw) throw appError(401, "SESSION_REQUIRED");
  const opened = openCookie<unknown>("session", raw, secret, nowMs);
  if (!opened.ok) {
    throw new AppError({
      status: 401,
      code: opened.reason === "expired" ? "SESSION_EXPIRED" : "SESSION_REQUIRED",
      clearSession: true,
    });
  }
  const parsed = sessionSchema.safeParse(opened.value);
  const expiresMs = parsed.success ? Date.parse(parsed.data.expiresAt) : NaN;
  if (!parsed.success || !Number.isFinite(expiresMs)) throw new AppError({ status: 401, code: "SESSION_REQUIRED", clearSession: true });
  if (nowMs >= expiresMs) throw new AppError({ status: 401, code: "SESSION_EXPIRED", clearSession: true });
  const session = parsed.data;

  let state = emptyState(session.householdId);
  const rawState = jar.get(names.state);
  if (rawState) {
    const openedState = openCookie<unknown>("state", rawState, secret, nowMs);
    const parsedState = openedState.ok ? stateSchema.safeParse(openedState.value) : null;
    // A tampered, expired or foreign-household state cookie is dropped, never trusted.
    if (parsedState?.success && parsedState.data.hid === session.householdId) state = parsedState.data;
  }
  return { session, state };
}

export function sessionCookie(session: SessionData, secret: string, production: boolean, nowMs: number): string {
  const expiresMs = Date.parse(session.expiresAt);
  return serializeCookie(cookieNames(production).session, sealCookie("session", session, secret, expiresMs), {
    production,
    maxAgeSeconds: (expiresMs - nowMs) / 1000,
  });
}

export function stateCookie(
  state: AppState,
  session: Pick<SessionData, "expiresAt">,
  secret: string,
  production: boolean,
  nowMs: number,
): string {
  const expiresMs = Date.parse(session.expiresAt);
  const value = sealCookie("state", state, secret, expiresMs);
  if (Buffer.byteLength(value) > MAX_COOKIE_VALUE_BYTES) throw appError(409, "STATE_LIMIT_REACHED");
  return serializeCookie(cookieNames(production).state, value, { production, maxAgeSeconds: (expiresMs - nowMs) / 1000 });
}
