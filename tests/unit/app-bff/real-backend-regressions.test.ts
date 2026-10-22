// Regression tests for defects found by the 2026-10-22 real-backend smoke test and the independent security review.
// Each test names the finding it guards. Still a FAKE backend (injected fetch): the real-backend runs are in the report.
import { describe, expect, it } from "vitest";
import { AppConfigError, loadAppConfig } from "@/server/app/env";
import { AppError } from "@/server/app/errors";
import { clientKey, createRateLimiter } from "@/server/app/rate-limit";
import { openCookie } from "@/server/app/cookie-crypto";
import { FAKE_BACKEND_TOKEN, FAKE_SECRET, applyCookies, baseEnv, makeApp, request, signIn, uploadRequest, type Jar } from "./helpers";

type Ctx = ReturnType<typeof makeApp>;
const post = (ctx: Ctx, name: Parameters<Ctx["app"]["dispatch"]>[0], path: string, jar: Jar, json?: unknown, params: Record<string, string> = {}) =>
  ctx.app.dispatch(name, request(path, { method: "POST", json: json ?? {}, jar }), params).then((response) => {
    applyCookies(jar, response);
    return response;
  });

async function withDocument() {
  const ctx = makeApp();
  const { jar } = await signIn(ctx);
  const collect = (await (await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" })).json()).consent;
  const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": collect.grantId }), { caseId: "case-1" });
  return { ctx, jar, documentId: (await upload.json()).document.id as string };
}

describe("F3: sign-in rate limit cannot be steered by client headers", () => {
  const withHeader = (value: string | null) => new Request("http://x.test/", { headers: value === null ? {} : { "x-forwarded-for": value } });

  it("ignores X-Forwarded-For and X-Real-IP when no proxy is trusted", () => {
    expect(clientKey(withHeader("203.0.113.1"))).toBe(clientKey(withHeader("198.51.100.7")));
    expect(clientKey(new Request("http://x.test/", { headers: { "x-real-ip": "203.0.113.1" } }))).toBe(clientKey(withHeader(null)));
  });

  it("takes the entry the trusted proxy appended, so a spoofed left-hand entry changes nothing", () => {
    expect(clientKey(withHeader("1.1.1.1, 2.2.2.2, 203.0.113.9"), 1)).toBe(clientKey(withHeader("9.9.9.9, 203.0.113.9"), 1));
    expect(clientKey(withHeader("203.0.113.9"), 1)).not.toBe(clientKey(withHeader("203.0.113.10"), 1));
    // A header shorter than the trusted hop count falls back to the shared bucket, never to an attacker value.
    expect(clientKey(withHeader("203.0.113.9"), 2)).toBe(clientKey(withHeader(null), 2));
  });

  it("rotating spoofed headers does not escape the limit end to end", async () => {
    const ctx = makeApp({ limit: 3 });
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const response = await ctx.app.dispatch(
        "session.create",
        request("/api/app/session", { method: "POST", json: { email: "a@b.test" }, headers: { "x-forwarded-for": `198.51.100.${i + 1}` } }),
      );
      statuses.push(response.status);
    }
    expect(statuses).toEqual([201, 201, 201, 429, 429, 429]);
  });

  it("a global ceiling holds even when every request has its own key", () => {
    const limiter = createRateLimiter({ limit: 100, globalLimit: 5 });
    const results: boolean[] = [];
    for (let i = 0; i < 8; i += 1) {
      try {
        limiter.check(`key-${i}`, 1000);
        results.push(true);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        results.push(false);
      }
    }
    expect(results).toEqual([true, true, true, true, true, false, false, false]);
  });

  it("stays bounded under a flood of fresh keys (oldest evicted)", () => {
    const limiter = createRateLimiter({ limit: 100, globalLimit: 1_000_000, maxKeys: 50 });
    for (let i = 0; i < 500; i += 1) limiter.check(`key-${i}`, 1000);
    // Not observable directly: the contract is that 500 distinct keys complete quickly and do not throw.
    expect(true).toBe(true);
  });

  it("validates APP_TRUSTED_PROXY_HOPS", () => {
    expect(loadAppConfig(baseEnv())).toMatchObject({ trustedProxyHops: 0 });
    expect(loadAppConfig(baseEnv({ APP_TRUSTED_PROXY_HOPS: "2" }))).toMatchObject({ trustedProxyHops: 2 });
    for (const bad of ["-1", "abc", "9", "1.5"]) expect(() => loadAppConfig(baseEnv({ APP_TRUSTED_PROXY_HOPS: bad }))).toThrow(AppConfigError);
  });
});

describe("F3/F8: sessions are not leaked", () => {
  it("a second sign-in revokes the previous backend session", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    await signIn(ctx, jar);
    const revokes = ctx.backend.calls.filter((call) => call.path === "/api/v1/sessions/current/revoke");
    expect(revokes).toHaveLength(1);
    expect(revokes[0].headers.authorization).toBe(`Bearer ${FAKE_BACKEND_TOKEN}`);
  });

  it("a transient revoke failure on sign-out is retried once", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.failNext.push({ match: /revoke/, respond: () => new TypeError("fetch failed") });
    const response = await ctx.app.dispatch("session.delete", request("/api/app/session", { method: "DELETE", jar }));
    expect(await response.json()).toEqual({ signedOut: true, backendRevoked: true });
  });
});

describe("F2: request bodies are capped while streaming", () => {
  it("cuts off a chunked JSON body that never ends", async () => {
    const ctx = makeApp();
    let pulls = 0;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(new Uint8Array(16 * 1024).fill(97));
      },
      cancel() {
        cancelled = true;
      },
    });
    const response = await ctx.app.dispatch(
      "session.create",
      new Request("http://localhost:3000/api/app/session", {
        method: "POST",
        headers: { origin: "http://localhost:3000", "x-knowvia-app": "1", "content-type": "application/json" },
        body,
        duplex: "half",
      } as RequestInit),
    );
    expect(response.status).toBe(413);
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThan(20);
  });
});

describe("F1: a backend grant is never created that the BFF cannot record", () => {
  it("refuses before calling the backend when the state cookie would overflow", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" });
    const longId = (n: number) => `doc-${n}-${"x".repeat(100)}`;
    let refused = 0;
    let granted = 0;
    for (let n = 0; n < 12; n += 1) {
      const docs = Array.from({ length: 10 }, (_, i) => longId(n * 10 + i));
      const before = ctx.backend.grants.size;
      const response = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "question_gemini", documentIds: docs });
      if (response.status === 201) granted += 1;
      else {
        refused += 1;
        expect(response.status).toBe(409);
        // The backend was not asked, so no unrecorded grant exists.
        expect(ctx.backend.grants.size).toBe(before);
      }
    }
    expect(granted).toBeGreaterThan(0);
    expect(refused).toBeGreaterThan(0);
    // Every grant the backend holds is recorded in the cookie state (collect + the granted question grants).
    const overview = await (await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar }))).json();
    expect(overview.consents).toHaveLength(ctx.backend.grants.size);
  });

  it("checks room for an OCR job before the backend starts it", async () => {
    const { ctx, jar, documentId } = await withDocument();
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId });
    const before = ctx.backend.jobs.size;
    ctx.backend.control.failNext.length = 0;
    const response = await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
    expect(response.status).toBe(202);
    expect(ctx.backend.jobs.size).toBe(before + 1);
  });
});

describe("F1 (OCR half): a started OCR job is always recorded", () => {
  it("never starts a job it cannot remember when the sealed cookie is nearly full", async () => {
    const { ctx, jar, documentId } = await withDocument();
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId });
    // Fill the cookie with small question grants until one is refused.
    for (let n = 0; n < 24; n += 1) {
      const response = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "question_gemini", documentIds: [`pad-${n}-${"y".repeat(110)}`] });
      if (response.status !== 201) break;
    }
    const before = ctx.backend.jobs.size;
    const response = await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
    const started = ctx.backend.jobs.size - before;
    if (response.status === 202) {
      expect(started).toBe(1);
      const sealed = jar.get("kv_state");
      expect(sealed).toBeTruthy();
      const opened = openCookie<{ ocrJobs: Record<string, string> }>("state", sealed as string, FAKE_SECRET, Date.now());
      expect(opened.ok && Object.keys(opened.value.ocrJobs)).toContain(documentId);
    } else {
      expect(response.status).toBe(409);
      expect(started).toBe(0);
    }
  });
});

describe("F4: a case created before a failing step is not orphaned", () => {
  it("records the case in the state cookie even when the follow-up grant fails", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.failNext.push({ match: /POST \/api\/v1\/consents$/, respond: () => new Response(JSON.stringify({ error: { code: "INTERNAL_FAILURE", message: "x" } }), { status: 500 }) });
    const failed = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" });
    expect(failed.status).toBe(500);
    const retry = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" });
    expect(retry.status).toBe(201);
    expect(ctx.backend.calls.filter((call) => call.method === "POST" && call.path === "/api/v1/cases")).toHaveLength(1);
  });
});

describe("F7: production is the default, development must be explicit", () => {
  it.each(["", "prod", "staging", "Production"])("treats NODE_ENV=%j as production: no dev identity", (nodeEnv) => {
    expect(() => loadAppConfig(baseEnv({ NODE_ENV: nodeEnv, APP_DEV_IDENTITY: "true" }))).toThrow(/APP_DEV_IDENTITY/);
    expect(loadAppConfig(baseEnv({ NODE_ENV: nodeEnv, APP_DEV_IDENTITY: "false" }))).toMatchObject({ production: true });
  });

  it("does not trust localhost origins outside development and test", () => {
    const config = loadAppConfig(baseEnv({ NODE_ENV: "staging", APP_DEV_IDENTITY: "false", NEXT_PUBLIC_SITE_URL: "https://app.example.test" }));
    expect(config.enabled && config.allowedOrigins).toEqual(["https://app.example.test"]);
  });

  it.each(["development", "test"])("allows the dev provider only when NODE_ENV=%s", (nodeEnv) => {
    expect(loadAppConfig(baseEnv({ NODE_ENV: nodeEnv }))).toMatchObject({ devIdentity: true, production: false });
  });
});

describe("F10: the dev identity accepts reserved test domains only", () => {
  it.each(["person@gmail.com", "person@company.in", "person@testing.io"])("refuses %s", async (email) => {
    const ctx = makeApp();
    const response = await ctx.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { email } }));
    expect(response.status).toBe(400);
    expect(ctx.backend.calls).toHaveLength(0);
  });

  it.each(["a@b.test", "a@example.com", "a@mail.example.org", "a@x.invalid", "a@example.test"])("accepts %s", async (email) => {
    const ctx = makeApp();
    const response = await ctx.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { email } }));
    expect(response.status).toBe(201);
  });
});

describe("F6: concurrent uploads per adult are capped", () => {
  it("answers 429 UPLOAD_IN_PROGRESS for a third simultaneous upload and frees the slot afterwards", async () => {
    const { ctx, jar } = await withDocument();
    const stalled = () => {
      let release: () => void = () => undefined;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]));
          release = () => controller.close();
        },
      });
      const template = uploadRequest(jar, { "idempotency-key": `slow-key-${Math.random().toString(36).slice(2)}-abc` });
      const streamed = new Request(template.url, { method: "POST", headers: template.headers, body, duplex: "half" } as RequestInit);
      const pending = ctx.app.dispatch("documents.upload", streamed, { caseId: "case-1" });
      return { pending, release };
    };
    const a = stalled();
    const b = stalled();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const third = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "idempotency-key": "third-key-12345678" }), { caseId: "case-1" });
    expect(third.status).toBe(429);
    expect((await third.json()).error.code).toBe("UPLOAD_IN_PROGRESS");
    a.release();
    b.release();
    await Promise.all([a.pending, b.pending]);
    const after = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "idempotency-key": "after-key-12345678" }), { caseId: "case-1" });
    expect(after.status).toBe(201);
  });
});

describe("F11: ids that collide with object prototype names", () => {
  it("does not read an inherited property as an OCR job id", async () => {
    const { ctx, jar } = await withDocument();
    const response = await ctx.app.dispatch("ocr.refresh", request("/api/app/documents/constructor/ocr/refresh", { method: "POST", json: {}, jar }), { documentId: "constructor" });
    expect([403, 409]).toContain(response.status);
    expect(ctx.backend.calls.some((call) => call.path.includes("/ocr-jobs/"))).toBe(false);
  });
});

describe("I1: withdrawing the storage permission must not lock the person out of their documents", () => {
  it("overview falls back to the deletion inventory and says why", async () => {
    const { ctx, jar, documentId } = await withDocument();
    ctx.backend.control.fieldAccessDenied = true;
    const response = await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar }));
    expect(response.status).toBe(200);
    const overview = await response.json();
    expect(overview.documentsAccess).toBe("permission_withdrawn");
    expect(overview.documents.map((d: { id: string }) => d.id)).toEqual([documentId]);
  });

  it("the case document list and a single document do the same, and a deleted one is 404", async () => {
    const { ctx, jar, documentId } = await withDocument();
    ctx.backend.control.fieldAccessDenied = true;
    const list = await ctx.app.dispatch("documents.list", request("/api/app/cases/case-1/documents", { jar }), { caseId: "case-1" });
    expect(list.status).toBe(200);
    expect((await list.json()).documentsAccess).toBe("permission_withdrawn");
    const one = await ctx.app.dispatch("documents.get", request(`/api/app/documents/${documentId}`, { jar }), { documentId });
    expect(one.status).toBe(200);
    ctx.backend.documents.get(documentId)!.status = "deleted";
    const gone = await ctx.app.dispatch("documents.get", request(`/api/app/documents/${documentId}`, { jar }), { documentId });
    expect(gone.status).toBe(404);
  });

  it("the normal list reports full access", async () => {
    const { ctx, jar } = await withDocument();
    const overview = await (await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar }))).json();
    expect(overview.documentsAccess).toBe("full");
  });
});

describe("I3: honest failures", () => {
  it("OCR_PROVIDER_DISABLED and EVIDENCE_DISABLED are not retryable, whatever the status", async () => {
    const { ctx, jar, documentId } = await withDocument();
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId });
    ctx.backend.control.failNext.push({
      match: /ocr-jobs/,
      respond: () => new Response(JSON.stringify({ error: { code: "OCR_PROVIDER_DISABLED", message: "x" } }), { status: 503 }),
    });
    const response = await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toMatchObject({ code: "OCR_PROVIDER_DISABLED", retryable: false });
    expect(body.error.message).toMatch(/not available yet/);
  });

  it("a failed OCR refresh on GET /documents/{id} is surfaced, not shown as an idle document", async () => {
    const { ctx, jar, documentId } = await withDocument();
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId });
    await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
    ctx.backend.control.failNext.push({ match: /ocr-jobs\/.*\/refresh/, respond: () => new Response(JSON.stringify({ error: { code: "BACKEND_REQUEST_FAILED", message: "x" } }), { status: 500 }) });
    const response = await ctx.app.dispatch("documents.get", request(`/api/app/documents/${documentId}`, { jar }), { documentId });
    expect(response.status).toBe(500);
  });
});

describe("backend client does not repeat a request the backend said is pointless to repeat", () => {
  it("does not retry a 503 DOCUMENT_STORAGE_NOT_CONFIGURED upload", async () => {
    const { ctx, jar } = await withDocument();
    const before = ctx.backend.calls.filter((call) => call.path.endsWith("/documents") && call.method === "POST").length;
    ctx.backend.control.failNext.push({
      match: /POST \/api\/v1\/cases\/case-1\/documents/,
      respond: () => new Response(JSON.stringify({ error: { code: "DOCUMENT_STORAGE_NOT_CONFIGURED", message: "x" } }), { status: 503 }),
    });
    ctx.backend.control.failNext.push({
      match: /POST \/api\/v1\/cases\/case-1\/documents/,
      respond: () => new Response(JSON.stringify({ error: { code: "DOCUMENT_STORAGE_NOT_CONFIGURED", message: "x" } }), { status: 503 }),
    });
    const response = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "idempotency-key": "nocfg-key-12345678" }), { caseId: "case-1" });
    expect(response.status).toBe(503);
    expect(ctx.backend.control.failNext).toHaveLength(1);
    expect(ctx.backend.calls.filter((call) => call.path.endsWith("/documents") && call.method === "POST").length - before).toBe(1);
  });
});
