import { describe, expect, it } from "vitest";
import { createBackendClient } from "@/server/app/backend-client";
import { AppError, normalizeBackendFailure } from "@/server/app/errors";
import { FAKE_BACKEND_TOKEN, FAKE_BOOTSTRAP, API, createFakeBackend, makeApp, request, signIn } from "./helpers";

describe("backend error normalisation", () => {
  it("normalises { error: { code, message } } and discards the backend message", () => {
    const error = normalizeBackendFailure(403, { error: { code: "CONSENT_REQUIRED", message: "internal detail with SELECT * FROM x" } }, { authenticated: true });
    expect(error).toMatchObject({ status: 403, code: "CONSENT_REQUIRED", retryable: false });
    expect(error.message).not.toContain("SELECT");
  });

  it("normalises { error: 'string' } (publicError and the local guard) to a coded failure", () => {
    const error = normalizeBackendFailure(400, { error: "Case action could not be completed. Check consent and workflow prerequisites." }, { authenticated: true });
    expect(error).toMatchObject({ status: 400, code: "BACKEND_REQUEST_FAILED", retryable: false });
    expect(error.message).not.toContain("Case action");
    const guard = normalizeBackendFailure(403, { error: "Local access only." }, { authenticated: true });
    expect(guard).toMatchObject({ status: 403, code: "BACKEND_REQUEST_FAILED" });
    expect(guard.message).not.toContain("Local access");
  });

  it("maps 401 to SESSION_EXPIRED when authenticated and to BACKEND_AUTH_FAILED (502) for the bootstrap call", () => {
    expect(normalizeBackendFailure(401, { error: "x" }, { authenticated: true })).toMatchObject({ status: 401, code: "SESSION_EXPIRED", clearSession: true });
    expect(normalizeBackendFailure(401, { error: { code: "AUTHENTICATION_REQUIRED", message: "x" } }, { authenticated: false })).toMatchObject({ status: 502, code: "BACKEND_AUTH_FAILED" });
  });

  it("rejects non-application codes and marks 5xx and 429 retryable", () => {
    expect(normalizeBackendFailure(500, { error: { code: "ERR_SQLITE", message: "x" } }, { authenticated: true }).code).toBe("BACKEND_REQUEST_FAILED");
    expect(normalizeBackendFailure(500, { error: { code: "ECONNREFUSED", message: "x" } }, { authenticated: true }).code).toBe("BACKEND_REQUEST_FAILED");
    expect(normalizeBackendFailure(503, null, { authenticated: true }).retryable).toBe(true);
    expect(normalizeBackendFailure(429, null, { authenticated: true }).retryable).toBe(true);
  });
});

describe("backend client transport failures", () => {
  const client = (fetch: Parameters<typeof createBackendClient>[0]["fetch"], timeoutMs = 50) =>
    createBackendClient({ baseUrl: API, bootstrapToken: FAKE_BOOTSTRAP, fetch, timeoutMs });

  it("normalises network failure", async () => {
    const error = await client(async () => { throw new TypeError("fetch failed: ECONNREFUSED 10.0.0.1:8787"); }).getIntegrations(FAKE_BACKEND_TOKEN).catch((e) => e as AppError);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ status: 503, code: "BACKEND_UNREACHABLE", retryable: true });
    expect((error as AppError).message).not.toContain("10.0.0.1");
  });

  it("normalises a timeout", async () => {
    const hang: Parameters<typeof createBackendClient>[0]["fetch"] = (_url, init) =>
      new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));
    const error = await client(hang, 20).getIntegrations(FAKE_BACKEND_TOKEN).catch((e) => e as AppError);
    expect(error).toMatchObject({ status: 504, code: "BACKEND_TIMEOUT", retryable: true });
  });

  it("normalises an HTML or empty success body as BACKEND_BAD_RESPONSE", async () => {
    const html = await client(async () => new Response("<html>proxy</html>", { status: 200 })).getIntegrations(FAKE_BACKEND_TOKEN).catch((e) => e as AppError);
    expect(html).toMatchObject({ status: 502, code: "BACKEND_BAD_RESPONSE" });
  });

  it("exposes both backend shapes through a route response", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.failNext.push({ match: /GET \/api\/v1\/integrations/, respond: () => new Response(JSON.stringify({ error: "Local access only." }), { status: 403 }) });
    const first = await ctx.app.dispatch("integrations.get", request("/api/app/integrations", { jar }));
    expect(first.status).toBe(403);
    expect(await first.json()).toEqual({ error: { code: "BACKEND_REQUEST_FAILED", message: "The request could not be completed.", retryable: false } });
    ctx.backend.control.failNext.push({ match: /GET \/api\/v1\/integrations/, respond: () => new Response(JSON.stringify({ error: { code: "FIELD_ACCESS_REQUIRED", message: "raw backend words" } }), { status: 403 }) });
    const second = await ctx.app.dispatch("integrations.get", request("/api/app/integrations", { jar }));
    const body = await second.json();
    expect(body.error.code).toBe("FIELD_ACCESS_REQUIRED");
    expect(JSON.stringify(body)).not.toContain("raw backend words");
  });

  it("retries an idempotent upload once and reuses the same Idempotency-Key", async () => {
    const fake = createFakeBackend();
    fake.control.failNext.push({ match: /POST \/api\/v1\/cases\/case-1\/documents/, respond: () => new TypeError("fetch failed") });
    const result = await createBackendClient({ baseUrl: API, bootstrapToken: FAKE_BOOTSTRAP, fetch: fake.fetch }).uploadDocument(FAKE_BACKEND_TOKEN, "case-1", {
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      idempotencyKey: "same-key-12345678",
      documentKind: "policy_schedule",
      consentGrantId: "consent-1",
      filename: "a.pdf",
    });
    expect(result.document.id).toMatch(/^doc-/);
    const uploads = fake.calls.filter((c) => c.method === "POST" && c.path === "/api/v1/cases/case-1/documents");
    expect(uploads).toHaveLength(2);
    expect(uploads[0].headers["idempotency-key"]).toBe("same-key-12345678");
    expect(uploads[1].headers["idempotency-key"]).toBe("same-key-12345678");
  });

  it("does not retry non-idempotent calls", async () => {
    const fake = createFakeBackend();
    fake.control.failNext.push({ match: /POST \/api\/v1\/cases$/, respond: () => new TypeError("fetch failed") });
    const error = await createBackendClient({ baseUrl: API, bootstrapToken: FAKE_BOOTSTRAP, fetch: fake.fetch })
      .createCase(FAKE_BACKEND_TOKEN, { householdId: "household-1", subjectMemberId: "member-1", triggerType: "planned_care" })
      .catch((e) => e as AppError);
    expect((error as AppError).code).toBe("BACKEND_UNREACHABLE");
    expect(fake.calls.filter((c) => c.path === "/api/v1/cases")).toHaveLength(1);
  });
});
