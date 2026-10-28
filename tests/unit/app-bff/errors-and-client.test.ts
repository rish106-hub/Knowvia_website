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

describe("backend client retry guard (security review)", () => {
  const upload = {
    bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
    idempotencyKey: "retry-key-12345678",
    documentKind: "policy_schedule" as const,
    consentGrantId: "consent-1",
    filename: "a.pdf",
  };
  const ask = { question: "Is room rent capped?", consentGrantId: "consent-1" };
  const uploadPath = /POST \/api\/v1\/cases\/case-1\/documents/;
  const questionPath = /POST \/api\/v1\/cases\/case-1\/questions/;
  const answerWith = (status: number) => () => new Response(JSON.stringify({ error: { code: "BACKEND_FAILURE", message: "x" } }), { status });

  for (const status of [500, 501, 505, 507, 511]) {
    it(`does not retry a backend ${status} on a paid question or an upload`, async () => {
      const fake = createFakeBackend();
      fake.control.failNext.push({ match: questionPath, respond: answerWith(status) }, { match: questionPath, respond: answerWith(status) });
      const client = createBackendClient({ baseUrl: API, bootstrapToken: FAKE_BOOTSTRAP, fetch: fake.fetch });
      const error = await client.askQuestion(FAKE_BACKEND_TOKEN, "case-1", ask, "ask-key-12345678").catch((e) => e as AppError);
      expect(error).toMatchObject({ status });
      expect(fake.calls.filter((c) => questionPath.test(`${c.method} ${c.path}`))).toHaveLength(1);

      fake.control.failNext.push({ match: uploadPath, respond: answerWith(status) }, { match: uploadPath, respond: answerWith(status) });
      await client.uploadDocument(FAKE_BACKEND_TOKEN, "case-1", upload).catch((e) => e as AppError);
      expect(fake.calls.filter((c) => uploadPath.test(`${c.method} ${c.path}`))).toHaveLength(1);
    });
  }

  it("still retries a backend 502, 503 or 504 once with the same key", async () => {
    for (const status of [502, 503, 504]) {
      const fake = createFakeBackend();
      fake.control.failNext.push({ match: questionPath, respond: answerWith(status) });
      const client = createBackendClient({ baseUrl: API, bootstrapToken: FAKE_BOOTSTRAP, fetch: fake.fetch });
      await client.askQuestion(FAKE_BACKEND_TOKEN, "case-1", ask, "ask-key-12345678").catch(() => undefined);
      const calls = fake.calls.filter((c) => questionPath.test(`${c.method} ${c.path}`));
      expect(calls).toHaveLength(2);
      expect(calls[1].headers["idempotency-key"]).toBe("ask-key-12345678");
    }
  });

  it("does not retry after a client-side timeout: the first request may still be running and billing", async () => {
    let attempts = 0;
    const hang: Parameters<typeof createBackendClient>[0]["fetch"] = (_url, init) => {
      attempts += 1;
      return new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));
    };
    const client = createBackendClient({ baseUrl: API, bootstrapToken: FAKE_BOOTSTRAP, fetch: hang, timeoutMs: 20, uploadTimeoutMs: 20 });
    const asked = await client.askQuestion(FAKE_BACKEND_TOKEN, "case-1", ask, "ask-key-12345678").catch((e) => e as AppError);
    expect(asked).toMatchObject({ status: 504, code: "BACKEND_TIMEOUT" });
    const uploaded = await client.uploadDocument(FAKE_BACKEND_TOKEN, "case-1", upload).catch((e) => e as AppError);
    expect(uploaded).toMatchObject({ status: 504, code: "BACKEND_TIMEOUT" });
    expect(attempts).toBe(2);
  });

  it("refuses an oversized backend body instead of buffering it", async () => {
    const big = async () => new Response(JSON.stringify({ pad: "x".repeat(3 * 1024 * 1024) }), { status: 200, headers: { "content-type": "application/json" } });
    const error = await createBackendClient({ baseUrl: API, bootstrapToken: FAKE_BOOTSTRAP, fetch: big }).getIntegrations(FAKE_BACKEND_TOKEN).catch((e) => e as AppError);
    expect(error).toMatchObject({ status: 502, code: "BACKEND_BAD_RESPONSE" });
  });
});
