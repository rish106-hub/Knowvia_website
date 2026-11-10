import { describe, expect, it } from "vitest";
import { FAKE_BACKEND_TOKEN, applyCookies, makeApp, request, signIn } from "./helpers";

async function setup() {
  const ctx = makeApp();
  const { jar } = await signIn(ctx);
  const documentId = "doc-synthetic-1";
  ctx.backend.documents.set(documentId, { id: documentId, caseId: "case-1", documentKind: "policy_schedule", byteSize: 14, status: "accepted", uploadedAt: "2026-11-10T00:00:00.000Z" });
  return { ctx, jar, documentId };
}

const confirm = (jar: Map<string, string>, id: string, json: unknown, key: string | null = "profile-key-12345678") =>
  request(`/api/app/documents/${id}/policy-profile/confirm`, { method: "POST", jar, json, headers: key ? { "idempotency-key": key } : {} });

describe("policy profile routes", () => {
  it("proxies GET with the backend bearer token and never forwards the browser Origin", async () => {
    const { ctx, jar, documentId } = await setup();
    const response = await ctx.app.dispatch("policyProfile.get", request(`/api/app/documents/${documentId}/policy-profile`, { jar }), { documentId });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ version: 0, totalPages: 3, proposals: { insurerCode: "SYN" } });
    const call = ctx.backend.calls.at(-1)!;
    expect(call).toMatchObject({ method: "GET", path: `/api/v1/documents/${documentId}/policy-profile` });
    expect(call.headers.authorization).toBe(`Bearer ${FAKE_BACKEND_TOKEN}`);
    expect(call.headers.origin).toBeUndefined();
    expect(call.headers.cookie).toBeUndefined();
  });

  it("requires a session", async () => {
    const ctx = makeApp();
    const response = await ctx.app.dispatch("policyProfile.get", request("/api/app/documents/doc-1/policy-profile"), { documentId: "doc-1" });
    expect(response.status).toBe(401);
    expect(ctx.backend.calls).toHaveLength(0);
  });

  it("confirms with the Idempotency-Key and expectedVersion passed through, and a repeat is the same statement", async () => {
    const { ctx, jar, documentId } = await setup();
    const statement = { uin: "SYNTH00001V010101", insurerName: "Synthetic Insurer", expectedVersion: 0 };
    const first = await ctx.app.dispatch("policyProfile.confirm", confirm(jar, documentId, statement), { documentId });
    expect(first.status).toBe(200);
    expect((await first.json()).version).toBe(1);
    const call = ctx.backend.calls.at(-1)!;
    expect(call).toMatchObject({ method: "POST", path: `/api/v1/documents/${documentId}/policy-profile/confirm`, body: statement });
    expect(call.headers["idempotency-key"]).toBe("profile-key-12345678");
    expect(call.headers.origin).toBeUndefined();
    const repeat = await ctx.app.dispatch("policyProfile.confirm", confirm(jar, documentId, statement), { documentId });
    expect(repeat.status).toBe(200);
    expect((await repeat.json()).version).toBe(1);
  });

  it("refuses a confirm without a usable Idempotency-Key or with an unknown field, before the backend is called", async () => {
    const { ctx, jar, documentId } = await setup();
    const before = ctx.backend.calls.length;
    const missing = await ctx.app.dispatch("policyProfile.confirm", confirm(jar, documentId, { expectedVersion: 0 }, null), { documentId });
    expect(missing.status).toBe(400);
    expect((await missing.json()).error.code).toBe("IDEMPOTENCY_KEY_REQUIRED");
    const extra = await ctx.app.dispatch("policyProfile.confirm", confirm(jar, documentId, { expectedVersion: 0, state: "proven" }), { documentId });
    expect(extra.status).toBe(400);
    const noVersion = await ctx.app.dispatch("policyProfile.confirm", confirm(jar, documentId, { uin: "SYNTH00001V010101" }), { documentId });
    expect(noVersion.status).toBe(400);
    expect(ctx.backend.calls.length).toBe(before);
  });

  it("blocks a confirm without the app marker (CSRF)", async () => {
    const { ctx, jar, documentId } = await setup();
    const response = await ctx.app.dispatch("policyProfile.confirm", request(`/api/app/documents/${documentId}/policy-profile/confirm`, { method: "POST", jar, json: { expectedVersion: 0 }, csrf: false, headers: { "idempotency-key": "profile-key-12345678" } }), { documentId });
    expect(response.status).toBe(403);
  });

  it("maps 404, 409 and 422 to coded errors and keeps the session cookies", async () => {
    const { ctx, jar, documentId } = await setup();
    const missing = await ctx.app.dispatch("policyProfile.get", request("/api/app/documents/doc-nope/policy-profile", { jar }), { documentId: "doc-nope" });
    expect(missing.status).toBe(404);
    expect((await missing.json()).error.code).toBe("POLICY_PROFILE_NOT_FOUND");
    expect(missing.headers.getSetCookie()).toEqual([]);

    const bad = await ctx.app.dispatch("policyProfile.confirm", confirm(jar, documentId, { uin: "bad", expectedVersion: 0 }, "profile-key-aaaaaaaa"), { documentId });
    expect(bad.status).toBe(422);
    expect((await bad.json()).error.code).toBe("POLICY_PROFILE_INVALID_UIN");
    expect(bad.headers.getSetCookie()).toEqual([]);

    const stale = await ctx.app.dispatch("policyProfile.confirm", confirm(jar, documentId, { expectedVersion: 7 }, "profile-key-bbbbbbbb"), { documentId });
    expect(stale.status).toBe(409);
    const staleBody = await stale.json();
    expect(staleBody.error).toMatchObject({ code: "POLICY_PROFILE_VERSION_CONFLICT", retryable: false });
    expect(stale.headers.getSetCookie()).toEqual([]);

    ctx.backend.control.policyProfileReady = false;
    const notReady = await ctx.app.dispatch("policyProfile.get", request(`/api/app/documents/${documentId}/policy-profile`, { jar }), { documentId });
    expect(notReady.status).toBe(409);
    expect((await notReady.json()).error).toMatchObject({ code: "POLICY_PROFILE_NOT_READY", retryable: true });
    expect(notReady.headers.getSetCookie()).toEqual([]);
    expect(jar.size).toBe(2);
  });

  it("clears the session only on the backend's coded token rejection", async () => {
    const { ctx, jar, documentId } = await setup();
    // An uncoded 401 (for example from a proxy) keeps the session.
    ctx.backend.control.failNext.push({ match: /policy-profile/, respond: () => new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) });
    const proxy = await ctx.app.dispatch("policyProfile.get", request(`/api/app/documents/${documentId}/policy-profile`, { jar }), { documentId });
    expect(proxy.status).toBe(502);
    expect((await proxy.json()).error.code).toBe("BACKEND_AUTH_FAILED");
    expect(proxy.headers.getSetCookie()).toEqual([]);
    // The coded rejection ends it.
    ctx.backend.control.expireTokens = true;
    const expired = await ctx.app.dispatch("policyProfile.get", request(`/api/app/documents/${documentId}/policy-profile`, { jar }), { documentId });
    expect(expired.status).toBe(401);
    expect((await expired.json()).error.code).toBe("SESSION_EXPIRED");
    applyCookies(jar, expired);
    expect(jar.size).toBe(0);
  });
});
