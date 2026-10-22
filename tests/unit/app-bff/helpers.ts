// Test support for the BFF: a FAKE in-memory backend behind an injected fetch. Fake secrets only.
// Nothing here talks to a real CoverSaath instance.
import { createApp, type App } from "@/server/app/handler";
import { createRateLimiter } from "@/server/app/rate-limit";
import type { FetchLike } from "@/server/app/backend-client";
import type { EnvSource } from "@/server/app/env";

export const FAKE_BOOTSTRAP = "fake-bootstrap-token-0123456789abcdefABCDEF";
export const FAKE_SECRET = "fake-session-secret-0123456789-abcdefghijklmnop";
export const FAKE_BACKEND_TOKEN = "fake-backend-session-token-ZZZZZZZZZZZZZZZZZZZZ";
export const ORIGIN = "http://localhost:3000";
export const API = "http://backend.test";

export const baseEnv = (extra: EnvSource = {}): EnvSource => ({
  NODE_ENV: "test",
  APP_ENABLED: "true",
  APP_DEV_IDENTITY: "true",
  COVERSAATH_API_URL: API,
  COVERSAATH_BOOTSTRAP_TOKEN: FAKE_BOOTSTRAP,
  APP_SESSION_SECRET: FAKE_SECRET,
  NEXT_PUBLIC_SITE_URL: ORIGIN,
  ...extra,
});

export type Call = { method: string; path: string; headers: Record<string, string>; body: unknown; bytes?: number };

export type FakeBackend = ReturnType<typeof createFakeBackend>;

type DocRecord = { id: string; caseId: string; documentKind: string; byteSize: number; status: string; uploadedAt: string };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export function createFakeBackend() {
  const calls: Call[] = [];
  const documents = new Map<string, DocRecord>();
  const idempotency = new Map<string, string>();
  const jobs = new Map<string, { id: string; documentId: string; status: string; errorCode: string | null; pageCount: number | null }>();
  const revoked = new Set<string>();
  const grants = new Map<string, unknown>();
  const sessions = new Map<string, { householdId: string; adultId: string; memberId: string }>();
  sessions.set(FAKE_BACKEND_TOKEN, { householdId: "household-1", adultId: "adult-1", memberId: "member-1" });
  let seq = 0;
  let sessionSeq = 0;
  const control = {
    /** Next matching call fails with this response (consumed once). */
    failNext: [] as Array<{ match: RegExp; respond: () => Response | Error }>,
    documentStatus: "accepted" as string,
    ocrFinalStatus: "succeeded" as string,
    expireTokens: false,
    /** The real backend answers 403 FIELD_ACCESS_REQUIRED on list/get once the collect permission is withdrawn. */
    fieldAccessDenied: false,
  };

  const fetch: FetchLike = async (url, init) => {
    const parsed = new URL(url);
    const method = (init?.method ?? "GET").toUpperCase();
    const headers = Object.fromEntries(new Headers(init?.headers as HeadersInit).entries());
    let body: unknown = undefined;
    let bytes: number | undefined;
    if (init?.body instanceof Uint8Array) bytes = init.body.byteLength;
    else if (typeof init?.body === "string") body = JSON.parse(init.body);
    calls.push({ method, path: parsed.pathname + parsed.search, headers, body, bytes });

    const failIndex = control.failNext.findIndex((f) => f.match.test(`${method} ${parsed.pathname}`));
    if (failIndex >= 0) {
      const [failure] = control.failNext.splice(failIndex, 1);
      const result = failure.respond();
      if (result instanceof Error) throw result;
      return result;
    }

    const authHeader = headers.authorization ?? "";
    const path = parsed.pathname;
    if (method === "POST" && path === "/api/v1/households") {
      if (authHeader !== `Bearer ${FAKE_BOOTSTRAP}`) return json(401, { error: { code: "AUTHENTICATION_REQUIRED", message: "Valid authentication is required." } });
      const owner = (body as { owner: { displayName: string } }).owner;
      sessionSeq += 1;
      const principal = { householdId: `household-${sessionSeq}`, adultId: `adult-${sessionSeq}`, memberId: `member-${sessionSeq}` };
      const token = sessionSeq === 1 ? FAKE_BACKEND_TOKEN : `fake-backend-session-token-${String(sessionSeq).padStart(8, "0")}`;
      sessions.set(token, principal);
      return json(201, {
        household: { id: principal.householdId, display_name: "H" },
        owner: { id: principal.adultId, display_name: owner.displayName },
        ownerMember: { id: principal.memberId },
        session: { token, sessionId: `session-${sessionSeq}`, adultUserId: principal.adultId, expiresAt: new Date(Date.now() + 3600_000).toISOString() },
      });
    }
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
    const principal = sessions.get(token);
    if (!principal || control.expireTokens || revoked.has(token)) {
      return json(401, { error: { code: "AUTHENTICATION_REQUIRED", message: "Valid authentication is required." } });
    }
    if (method === "POST" && path === "/api/v1/sessions/current/revoke") {
      revoked.add(token);
      return json(200, { status: "revoked" });
    }
    const householdMatch = path.match(/^\/api\/v1\/households\/([^/]+)$/);
    if (method === "GET" && householdMatch) {
      if (householdMatch[1] !== principal.householdId) return json(404, { error: { code: "HOUSEHOLD_NOT_FOUND", message: "Household not found." } });
      return json(200, { household: { id: principal.householdId }, viewerRole: "owner", members: [{ id: principal.memberId, displayName: "Owner Synthetic", memberKind: "adult", relationshipLabel: null, policiesFound: 0 }] });
    }
    if (method === "POST" && path === "/api/v1/cases") return json(201, { id: "case-1" });
    if (method === "POST" && path === "/api/v1/consents") {
      const id = `consent-${++seq}`;
      grants.set(id, body);
      return json(201, { id });
    }
    const revokeMatch = path.match(/^\/api\/v1\/consents\/([^/]+)\/revoke$/);
    if (method === "POST" && revokeMatch) {
      if (!grants.has(revokeMatch[1])) return json(404, { error: { code: "CONSENT_NOT_FOUND", message: "Consent grant not found." } });
      grants.delete(revokeMatch[1]);
      return json(200, { id: revokeMatch[1] });
    }
    if (method === "POST" && path === "/api/v1/cases/case-1/documents") {
      const key = headers["idempotency-key"];
      const existing = idempotency.get(key);
      if (existing) return json(200, { document: documents.get(existing), idempotentReplay: true });
      const id = `doc-${++seq}`;
      const record: DocRecord = { id, caseId: "case-1", documentKind: headers["x-document-kind"], byteSize: bytes ?? 0, status: "received_pending_checks", uploadedAt: "2026-10-21T00:00:00.000Z" };
      documents.set(id, record);
      idempotency.set(key, id);
      return json(201, { document: record });
    }
    if (method === "GET" && path === "/api/v1/cases/case-1/documents/deletion-inventory") {
      const held = [...documents.values()].filter((d) => d.status !== "deleted").map((d) => ({ id: d.id, documentKind: d.documentKind, byteSize: d.byteSize, status: d.status, uploadedAt: d.uploadedAt }));
      return json(200, { caseId: "case-1", documents: held });
    }
    if (control.fieldAccessDenied && method === "GET" && (path === "/api/v1/cases/case-1/documents" || /^\/api\/v1\/documents\/[^/]+$/.test(path))) {
      return json(403, { error: { code: "FIELD_ACCESS_REQUIRED", message: "Field access is required." } });
    }
    if (method === "GET" && path === "/api/v1/cases/case-1/documents") {
      return json(200, { caseId: "case-1", documents: [...documents.values()].map((d) => ({ ...d, status: d.status === "received_pending_checks" ? control.documentStatus : d.status })) });
    }
    const documentMatch = path.match(/^\/api\/v1\/documents\/([^/]+)$/);
    if (documentMatch) {
      const record = documents.get(documentMatch[1]);
      if (!record) return json(404, { error: { code: "DOCUMENT_NOT_FOUND", message: "Document not found." } });
      if (method === "DELETE") {
        record.status = "deletion_pending";
        return json(202, { document: record });
      }
      return json(200, { ...record, status: record.status === "received_pending_checks" ? control.documentStatus : record.status });
    }
    const ocrStart = path.match(/^\/api\/v1\/documents\/([^/]+)\/ocr-jobs$/);
    if (method === "POST" && ocrStart) {
      const job = { id: `ocr-${++seq}`, documentId: ocrStart[1], status: "processing", errorCode: null, pageCount: null };
      jobs.set(job.id, job);
      return json(202, { job });
    }
    const ocrRefresh = path.match(/^\/api\/v1\/ocr-jobs\/([^/]+)\/refresh$/);
    if (method === "POST" && ocrRefresh) {
      const job = jobs.get(ocrRefresh[1]);
      if (!job) return json(404, { error: { code: "OCR_JOB_NOT_FOUND", message: "OCR job was not found." } });
      job.status = control.ocrFinalStatus;
      job.pageCount = job.status === "succeeded" ? 3 : null;
      job.errorCode = job.status === "failed" ? "OCR_PROVIDER_FAILED" : null;
      return json(200, { job });
    }
    if (method === "POST" && path === "/api/v1/cases/case-1/questions") {
      return json(201, { answerId: "answer-1", replayed: false, answer: { state: "conditional", sources: [] } });
    }
    return json(404, { error: { code: "ROUTE_NOT_FOUND", message: "Versioned backend route not found." } });
  };

  return { fetch, calls, control, documents, grants, revoked, jobs };
}

export function makeApp(options: { env?: EnvSource; backend?: FakeBackend; now?: () => number; limit?: number } = {}) {
  const backend = options.backend ?? createFakeBackend();
  const env = options.env ?? baseEnv();
  const app: App = createApp({
    env: () => env,
    fetch: backend.fetch,
    now: options.now ?? (() => Date.now()),
    rateLimiter: createRateLimiter({ limit: options.limit ?? 100 }),
  });
  return { app, backend, env };
}

export type Jar = Map<string, string>;

/** Applies Set-Cookie headers to a cookie jar, honouring clears. */
export function applyCookies(jar: Jar, response: Response) {
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(";");
    const index = pair.indexOf("=");
    const name = pair.slice(0, index);
    const value = pair.slice(index + 1);
    if (value === "" || /Max-Age=0/i.test(header)) jar.delete(name);
    else jar.set(name, value);
  }
}

export const cookieHeader = (jar: Jar) => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

export function request(path: string, init: { method?: string; json?: unknown; jar?: Jar; headers?: Record<string, string>; body?: BodyInit; csrf?: boolean } = {}) {
  const method = init.method ?? "GET";
  const headers = new Headers(init.headers);
  if (init.csrf !== false && method !== "GET") {
    headers.set("origin", ORIGIN);
    headers.set("x-knowvia-app", "1");
  }
  if (init.json !== undefined) headers.set("content-type", "application/json");
  if (init.jar && init.jar.size) headers.set("cookie", cookieHeader(init.jar));
  return new Request(`${ORIGIN}${path}`, { method, headers, body: init.json !== undefined ? JSON.stringify(init.json) : init.body });
}

/** Signs in through the dev provider and returns the cookie jar. */
export async function signIn(ctx: ReturnType<typeof makeApp>, jar: Jar = new Map()) {
  const response = await ctx.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { email: "dev@example.test" }, jar }));
  applyCookies(jar, response);
  return { jar, response };
}

export const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46]);

export function uploadRequest(jar: Jar, overrides: Record<string, string | null> = {}, body: Uint8Array | BodyInit = PDF_BYTES) {
  const headers: Record<string, string> = {
    "content-type": "application/pdf",
    "idempotency-key": "upload-key-12345678",
    "x-document-kind": "policy_schedule",
    "x-consent-grant-id": "consent-1",
    "x-filename": encodeURIComponent("synthetic policy.pdf"),
  };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) delete headers[key];
    else headers[key] = value;
  }
  return request("/api/app/cases/case-1/documents", { method: "POST", jar, headers, body: body as BodyInit });
}
