import { describe, expect, it } from "vitest";
import { loadSession } from "@/server/app/session";
import { applyCookies, FAKE_SECRET, makeApp, request, signIn, uploadRequest, type Jar } from "./helpers";

type Ctx = ReturnType<typeof makeApp>;

const post = async (ctx: Ctx, name: Parameters<Ctx["app"]["dispatch"]>[0], path: string, jar: Jar, json: unknown = {}, params: Record<string, string> = {}) => {
  const response = await ctx.app.dispatch(name, request(path, { method: "POST", json, jar }), params);
  applyCookies(jar, response);
  return response;
};
const get = async (ctx: Ctx, name: Parameters<Ctx["app"]["dispatch"]>[0], path: string, jar: Jar) => {
  const response = await ctx.app.dispatch(name, request(path, { jar }));
  applyCookies(jar, response);
  return response;
};
const stateOf = (jar: Jar) => {
  const header = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  return loadSession(header, { secret: FAKE_SECRET, production: false, nowMs: Date.now() }).state;
};

async function withCollect() {
  const ctx = makeApp();
  const { jar } = await signIn(ctx);
  const collect = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" });
  const collectId = (await collect.json()).consent.grantId as string;
  return { ctx, jar, collectId };
}

describe("consents.list", () => {
  it("returns labelled views with no scopes and no household id", async () => {
    const { ctx, jar, collectId } = await withCollect();
    const response = await get(ctx, "consents.list", "/api/app/consents", jar);
    expect(response.status).toBe(200);
    const text = await response.clone().text();
    const body = JSON.parse(text);
    expect(body.permissions).toHaveLength(1);
    expect(body.permissions[0]).toMatchObject({ id: collectId, kind: "store_documents", label: "Keep the PDFs you add", status: "active", noticeStatus: "draft_needs_legal_review" });
    expect(Object.keys(body.permissions[0]).sort()).toEqual(["documentIds", "expiresAt", "grantedAt", "id", "kind", "label", "noticeStatus", "status"]);
    expect(text).not.toMatch(/scopes|householdId|household-1|dataCategory|resourceType|recipient|sarvam|adult-1/i);
  });

  it("labels a reading permission with its document count and exposes only the document ids", async () => {
    const { ctx, jar } = await withCollect();
    const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": "consent-1" }), { caseId: "case-1" });
    const documentId = (await upload.json()).document.id as string;
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId });
    const body = await (await get(ctx, "consents.list", "/api/app/consents", jar)).json();
    const reading = body.permissions.find((p: { kind: string }) => p.kind === "read_document");
    expect(reading).toMatchObject({ label: "Read 1 document with the reading service (OCR)", documentIds: [documentId] });
  });

  it("needs a session and the marker header", async () => {
    const ctx = makeApp();
    expect((await ctx.app.dispatch("consents.list", request("/api/app/consents"))).status).toBe(401);
    const { jar } = await signIn(ctx);
    const noMarker = await ctx.app.dispatch("consents.list", request("/api/app/consents", { jar, csrf: false }));
    expect(noMarker.status).toBe(403);
  });

  it("asks the backend for this household only (taken from the session, never from the request)", async () => {
    const { ctx, jar } = await withCollect();
    await get(ctx, "consents.list", "/api/app/consents?householdId=other-household", jar);
    const calls = ctx.backend.calls.filter((call) => /\/consents\?/.test(call.path));
    expect(calls.map((call) => call.path)).toEqual(["/api/v1/households/household-1/consents?limit=100"]);
  });
});

describe("consents.revokeById", () => {
  it("calls the backend once and drops the consent from state", async () => {
    const { ctx, jar, collectId } = await withCollect();
    const response = await post(ctx, "consents.revokeById", `/api/app/consents/${collectId}/revoke`, jar, {}, { consentId: collectId });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revoked: 1 });
    const revokes = ctx.backend.calls.filter((call) => call.path === `/api/v1/consents/${collectId}/revoke`);
    expect(revokes).toHaveLength(1);
    expect(stateOf(jar).consents).toEqual([]);
    expect(ctx.backend.grants.has(collectId)).toBe(false);
    const listed = await (await get(ctx, "consents.list", "/api/app/consents", jar)).json();
    expect(listed.permissions).toEqual([]);
  });

  it("clears the OCR job of the document whose reading permission was taken back", async () => {
    const { ctx, jar } = await withCollect();
    const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": "consent-1" }), { caseId: "case-1" });
    const documentId = (await upload.json()).document.id as string;
    const ocrId = (await (await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId })).json()).consent.grantId as string;
    ctx.backend.control.documentStatus = "accepted";
    expect((await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId })).status).toBe(202);
    expect(Object.keys(stateOf(jar).ocrJobs)).toEqual([documentId]);
    const response = await post(ctx, "consents.revokeById", `/api/app/consents/${ocrId}/revoke`, jar, {}, { consentId: ocrId });
    expect(response.status).toBe(200);
    expect(stateOf(jar).ocrJobs).toEqual({});
    expect(stateOf(jar).consents.map((c) => c.scope)).toEqual(["collect"]);
  });

  it("taking back the store-documents permission also drops the OCR job and the document-scoped grants kept here", async () => {
    const { ctx, jar, collectId } = await withCollect();
    const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": "consent-1" }), { caseId: "case-1" });
    const documentId = (await upload.json()).document.id as string;
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId });
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "question_gemini", documentIds: [documentId] });
    ctx.backend.control.documentStatus = "accepted";
    expect((await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId })).status).toBe(202);
    expect(stateOf(jar).consents.map((c) => c.scope).sort()).toEqual(["collect", "ocr_sarvam", "question_gemini"]);

    const response = await post(ctx, "consents.revokeById", `/api/app/consents/${collectId}/revoke`, jar, {}, { consentId: collectId });
    expect(response.status).toBe(200);
    expect(stateOf(jar).consents).toEqual([]);
    expect(stateOf(jar).ocrJobs).toEqual({});
  });

  it("taking back a reading grant never touches the store-documents grant", async () => {
    const { ctx, jar, collectId } = await withCollect();
    const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": "consent-1" }), { caseId: "case-1" });
    const documentId = (await upload.json()).document.id as string;
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId });
    const ocrId = stateOf(jar).consents.find((c) => c.scope === "ocr_sarvam")!.id;
    await post(ctx, "consents.revokeById", `/api/app/consents/${ocrId}/revoke`, jar, {}, { consentId: ocrId });
    expect(stateOf(jar).consents.map((c) => c.id)).toEqual([collectId]);
  });

  it("a backend 404 becomes 404 CONSENT_NOT_FOUND and the stale record is forgotten here", async () => {
    const { ctx, jar, collectId } = await withCollect();
    ctx.backend.grants.delete(collectId);
    const response = await post(ctx, "consents.revokeById", `/api/app/consents/${collectId}/revoke`, jar, {}, { consentId: collectId });
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("CONSENT_NOT_FOUND");
    expect(stateOf(jar).consents).toEqual([]);
  });

  it("another person's consent id is a 404 and changes nothing here", async () => {
    const { ctx, jar, collectId } = await withCollect();
    const response = await post(ctx, "consents.revokeById", "/api/app/consents/consent-not-mine/revoke", jar, {}, { consentId: "consent-not-mine" });
    expect(response.status).toBe(404);
    expect(stateOf(jar).consents.map((c) => c.id)).toEqual([collectId]);
  });

  it("a backend failure other than not-found keeps the grant so the person can retry", async () => {
    const { ctx, jar, collectId } = await withCollect();
    ctx.backend.control.failNext.push({ match: /POST \/api\/v1\/consents\/.+\/revoke/, respond: () => new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "raw" } }), { status: 500 }) });
    const response = await post(ctx, "consents.revokeById", `/api/app/consents/${collectId}/revoke`, jar, {}, { consentId: collectId });
    expect(response.status).toBe(500);
    expect(stateOf(jar).consents.map((c) => c.id)).toEqual([collectId]);
  });

  it("needs a session, the marker header and a well-formed id", async () => {
    const { ctx, jar, collectId } = await withCollect();
    const anon = await ctx.app.dispatch("consents.revokeById", request(`/api/app/consents/${collectId}/revoke`, { method: "POST", json: {} }), { consentId: collectId });
    expect(anon.status).toBe(401);
    const noMarker = await ctx.app.dispatch("consents.revokeById", request(`/api/app/consents/${collectId}/revoke`, { method: "POST", json: {}, jar, csrf: false }), { consentId: collectId });
    expect(noMarker.status).toBe(403);
    const bad = await ctx.app.dispatch("consents.revokeById", request("/api/app/consents/x/revoke", { method: "POST", json: {}, jar }), { consentId: "../x" });
    expect(bad.status).toBe(400);
    expect(ctx.backend.calls.filter((call) => /\/consents\/.*\/revoke$/.test(call.path))).toEqual([]);
  });
});

describe("overview: lost case recovery", () => {
  it("adopts the newest open case when the state has none, and re-seals the state", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.cases = [
      { id: "case-1", status: "collecting", createdAt: "2026-10-21T00:00:00.000Z" },
      { id: "case-old", status: "closed", createdAt: "2026-10-01T00:00:00.000Z" },
    ];
    const response = await get(ctx, "overview.get", "/api/app/overview", jar);
    expect(response.status).toBe(200);
    expect((await response.json()).cases).toEqual([{ id: "case-1" }]);
    expect(response.headers.getSetCookie().length).toBe(1);
    expect(stateOf(jar).caseId).toBe("case-1");
  });

  it("skips a newer closed or revoked case", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.cases = [
      { id: "case-new", status: "revoked", createdAt: "2026-10-22T00:00:00.000Z" },
      { id: "case-1", status: "created", createdAt: "2026-10-21T00:00:00.000Z" },
    ];
    expect((await (await get(ctx, "overview.get", "/api/app/overview", jar)).json()).cases).toEqual([{ id: "case-1" }]);
  });

  it("only closed cases: no case is adopted", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.cases = [{ id: "case-1", status: "closed", createdAt: "2026-10-21T00:00:00.000Z" }];
    const response = await get(ctx, "overview.get", "/api/app/overview", jar);
    expect((await response.json()).cases).toEqual([]);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(stateOf(jar).caseId).toBeNull();
  });

  it("does not look when the state already has a case", async () => {
    const { ctx, jar } = await withCollect();
    await post(ctx, "cases.create", "/api/app/cases", jar, {});
    const callsBefore = ctx.backend.calls.filter((call) => /households\/[^/]+\/cases/.test(call.path)).length;
    await get(ctx, "overview.get", "/api/app/overview", jar);
    expect(ctx.backend.calls.filter((call) => /households\/[^/]+\/cases/.test(call.path)).length).toBe(callsBefore);
  });
});

describe("overview: lost case recovery when the list cannot be read", () => {
  it.each([
    [404, "ROUTE_NOT_FOUND"],
    [503, "BACKEND_UNAVAILABLE"],
  ])("a %s on the case list does not fail the overview", async (status, code) => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.failNext.push({ match: /GET \/api\/v1\/households\/[^/]+\/cases/, respond: () => new Response(JSON.stringify({ error: { code, message: "raw" } }), { status }) });
    const response = await get(ctx, "overview.get", "/api/app/overview", jar);
    expect(response.status).toBe(200);
    expect((await response.json()).cases).toEqual([]);
    expect(stateOf(jar).caseId).toBeNull();
  });

  it("an unreachable backend on the case list does not fail the overview", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.failNext.push({ match: /GET \/api\/v1\/households\/[^/]+\/cases/, respond: () => new TypeError("fetch failed") });
    expect((await get(ctx, "overview.get", "/api/app/overview", jar)).status).toBe(200);
  });

  it("a session that ended while listing still ends the session", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.failNext.push({ match: /GET \/api\/v1\/households\/[^/]+\/cases/, respond: () => new Response(JSON.stringify({ error: { code: "AUTHENTICATION_REQUIRED", message: "x" } }), { status: 401 }) });
    expect((await get(ctx, "overview.get", "/api/app/overview", jar)).status).toBe(401);
  });
});

describe("GET /consents origin check", () => {
  it("rejects a GET that carries a foreign Origin", async () => {
    const { ctx, jar } = await withCollect();
    const response = await ctx.app.dispatch("consents.list", request("/api/app/consents", { jar, csrf: false, headers: { origin: "https://evil.example", "x-knowvia-app": "1" } }));
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("CSRF_BLOCKED");
  });

  it("accepts an app Origin and accepts no Origin at all (a same-origin GET carries none), both with the marker", async () => {
    const { ctx, jar } = await withCollect();
    expect((await ctx.app.dispatch("consents.list", request("/api/app/consents", { jar }))).status).toBe(200);
    const bare = new Request("http://localhost:3000/api/app/consents", { headers: { "x-knowvia-app": "1", cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ") } });
    expect((await ctx.app.dispatch("consents.list", bare)).status).toBe(200);
  });
});

describe("overview: scan switched off", () => {
  async function withWaitingDocument(scanMode: string) {
    const { ctx, jar } = await withCollect();
    ctx.backend.control.scanMode = scanMode;
    ctx.backend.control.documentStatus = "received_pending_checks";
    const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": "consent-1" }), { caseId: "case-1" });
    expect(upload.status).toBe(201);
    return { ctx, jar };
  }

  it("disabled + awaiting_checks: the scan-off note is present", async () => {
    const { ctx, jar } = await withWaitingDocument("disabled");
    const body = await (await get(ctx, "overview.get", "/api/app/overview", jar)).json();
    expect(body.documents[0]).toMatchObject({ stage: "awaiting_checks", note: "scan_disabled" });
  });

  it("scanning on: the usual note, no scan-off note", async () => {
    const { ctx, jar } = await withWaitingDocument("clamd");
    const body = await (await get(ctx, "overview.get", "/api/app/overview", jar)).json();
    expect(body.documents[0]).toMatchObject({ stage: "awaiting_checks", note: "scan_state_not_visible" });
  });

  it("an unreadable integrations report changes nothing and breaks nothing", async () => {
    const { ctx, jar } = await withWaitingDocument("disabled");
    ctx.backend.control.failNext.push({ match: /GET \/api\/v1\/integrations/, respond: () => new Response("{}", { status: 503 }) });
    const response = await get(ctx, "overview.get", "/api/app/overview", jar);
    expect(response.status).toBe(200);
    expect((await response.json()).documents[0].note).toBe("scan_state_not_visible");
  });

  it("the integrations report is not read when no document is waiting", async () => {
    const { ctx, jar } = await withCollect();
    await get(ctx, "overview.get", "/api/app/overview", jar);
    expect(ctx.backend.calls.filter((call) => call.path === "/api/v1/integrations")).toEqual([]);
  });

  it("a just-uploaded document is never marked scan-off", async () => {
    const { ctx, jar } = await withCollect();
    ctx.backend.control.scanMode = "disabled";
    const upload = await (await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": "consent-1" }), { caseId: "case-1" })).json();
    expect(upload.document).toMatchObject({ stage: "received", note: "scan_state_not_visible" });
  });
});
