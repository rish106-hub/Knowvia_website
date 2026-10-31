// One reading permission for a batch of up to 10 documents (run V2). Fake backend only, synthetic data only.
// The permission names each document exactly (one scope per document); it never reaches a document it does not name.
import { describe, expect, it } from "vitest";
import { loadSession } from "@/server/app/session";
import { applyCookies, FAKE_SECRET, makeApp, request, signIn, uploadRequest, type Jar } from "./helpers";

type Ctx = ReturnType<typeof makeApp>;
type RouteName = Parameters<Ctx["app"]["dispatch"]>[0];

const post = (ctx: Ctx, name: RouteName, path: string, jar: Jar, json: unknown = {}, params: Record<string, string> = {}) =>
  ctx.app.dispatch(name, request(path, { method: "POST", json, jar }), params).then((response) => {
    applyCookies(jar, response);
    return response;
  });
const overviewOf = async (ctx: Ctx, jar: Jar) => {
  const response = await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar }));
  applyCookies(jar, response);
  return response.json();
};
const stateOf = (jar: Jar) => {
  const header = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  return loadSession(header, { secret: FAKE_SECRET, production: false, nowMs: Date.now() }).state;
};

/** Signed in, storage permission held, `count` documents uploaded (each with its own upload key). */
async function withDocuments(count: number) {
  const ctx = makeApp();
  const { jar } = await signIn(ctx);
  const collect = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" });
  const collectId = (await collect.json()).consent.grantId as string;
  const ids: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const upload = await ctx.app.dispatch(
      "documents.upload",
      uploadRequest(jar, { "x-consent-grant-id": collectId, "idempotency-key": `upload-key-${String(index).padStart(8, "0")}` }),
      { caseId: "case-1" },
    );
    ids.push((await upload.json()).document.id as string);
  }
  return { ctx, jar, ids, collectId };
}

const backendConsentCalls = (ctx: Ctx) => ctx.backend.calls.filter((call) => call.method === "POST" && call.path === "/api/v1/consents");
const readingGrants = (ctx: Ctx) => backendConsentCalls(ctx).filter((call) => (call.body as { grantedToActor?: string }).grantedToActor === "sarvam");

describe("batched reading permission: the grant", () => {
  it("names every document exactly: one derive scope each, sorted, for the reading service only", async () => {
    const { ctx, jar, ids } = await withDocuments(3);
    const response = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [ids[2], ids[0], ids[1]] });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.consent.documentIds).toEqual([...ids].sort());
    expect(body.consent.noticeStatus).toBe("draft_needs_legal_review");

    const [call] = readingGrants(ctx);
    const grant = call.body as { grantedToActor: string; purpose: string; scopes: Array<Record<string, unknown>> };
    expect(grant.grantedToActor).toBe("sarvam");
    expect(grant.purpose).toBe("document_processing");
    expect(grant.scopes).toHaveLength(3);
    expect(grant.scopes.map((scope) => scope.resourceId)).toEqual([...ids].sort());
    for (const scope of grant.scopes) {
      // Every scope names one document. No scope without a resource id, no collect scope, no other recipient.
      expect(scope).toEqual({ resourceType: "document", resourceId: scope.resourceId, action: "derive", dataCategory: "insurance_document", recipient: "sarvam" });
    }
  });

  it("rejects 11 documents with 400 INVALID_REQUEST before any backend call", async () => {
    const { ctx, jar } = await withDocuments(1);
    const eleven = Array.from({ length: 11 }, (_, index) => `doc-extra-${index}`);
    const response = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: eleven });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatchObject({ code: "INVALID_REQUEST", fields: ["documentIds"] });
    expect(readingGrants(ctx)).toHaveLength(0);
    expect(stateOf(jar).consents.filter((consent) => consent.scope === "ocr_sarvam")).toEqual([]);
  });

  it("accepts exactly 10 documents", async () => {
    const { ctx, jar, ids } = await withDocuments(10);
    const response = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    expect(response.status).toBe(201);
    expect((readingGrants(ctx)[0].body as { scopes: unknown[] }).scopes).toHaveLength(10);
  });

  it("removes duplicates, so the same document is never named twice", async () => {
    const { ctx, jar, ids } = await withDocuments(2);
    const response = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [ids[1], ids[0], ids[1], ids[0]] });
    expect(response.status).toBe(201);
    expect((await response.json()).consent.documentIds).toEqual([...ids].sort());
    expect((readingGrants(ctx)[0].body as { scopes: unknown[] }).scopes).toHaveLength(2);
  });

  it("refuses an empty list, and a request that names both documentId and documentIds", async () => {
    const { ctx, jar, ids } = await withDocuments(1);
    expect((await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [] })).status).toBe(400);
    expect((await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam" })).status).toBe(400);
    expect((await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId: ids[0], documentIds: [ids[0]] })).status).toBe(400);
    expect(readingGrants(ctx)).toHaveLength(0);
  });

  it("still takes one document through documentId, as a batch of one", async () => {
    const { ctx, jar, ids } = await withDocuments(1);
    const response = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId: ids[0] });
    expect((await response.json()).consent.documentIds).toEqual([ids[0]]);
  });

  it("reuses the same permission for the same set of documents, in any order", async () => {
    const { ctx, jar, ids } = await withDocuments(2);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    const again = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [...ids].reverse() });
    expect(again.status).toBe(200);
    expect((await again.json()).reused).toBe(true);
    expect(readingGrants(ctx)).toHaveLength(1);
  });
});

describe("batched reading permission: what the document says it needs", () => {
  it("a document that has been received and has no reading permission asks for it, and keeps its stage", async () => {
    const { ctx, jar } = await withDocuments(2);
    ctx.backend.control.documentStatus = "received_pending_checks";
    const view = await overviewOf(ctx, jar);
    expect(view.documents).toHaveLength(2);
    for (const doc of view.documents) expect(doc).toMatchObject({ stage: "awaiting_checks", nextAction: "grant_ocr_consent", backendStatus: "received_pending_checks" });
  });

  it("the upload response asks for it too", async () => {
    const { ctx, jar, collectId } = await withDocuments(0);
    const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": collectId }), { caseId: "case-1" });
    expect((await upload.json()).document).toMatchObject({ stage: "received", nextAction: "grant_ocr_consent" });
  });

  it("once the permission is held the same documents only wait for their checks", async () => {
    const { ctx, jar, ids } = await withDocuments(2);
    ctx.backend.control.documentStatus = "received_pending_checks";
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    const view = await overviewOf(ctx, jar);
    for (const doc of view.documents) expect(doc).toMatchObject({ stage: "awaiting_checks", nextAction: "wait" });
  });

  it("an accepted document with the permission is ready to start; one the permission does not name still asks", async () => {
    const { ctx, jar, ids } = await withDocuments(3);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [ids[0], ids[1]] });
    const view = await overviewOf(ctx, jar);
    const byId = new Map<string, { nextAction: string; stage: string }>(view.documents.map((doc: { id: string; nextAction: string; stage: string }) => [doc.id, doc]));
    expect(byId.get(ids[0])).toMatchObject({ stage: "awaiting_ocr_consent", nextAction: "start_ocr" });
    expect(byId.get(ids[1])).toMatchObject({ stage: "awaiting_ocr_consent", nextAction: "start_ocr" });
    expect(byId.get(ids[2])).toMatchObject({ stage: "awaiting_ocr_consent", nextAction: "grant_ocr_consent" });
  });
});

describe("batched reading permission: starting and withdrawing", () => {
  const startOcr = (ctx: Ctx, jar: Jar, documentId: string) => post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
  const jobCalls = (ctx: Ctx) => ctx.backend.calls.filter((call) => call.method === "POST" && /\/api\/v1\/documents\/[^/]+\/ocr-jobs$/.test(call.path));

  it("starting each document (one after another) uses the one permission, once per document", async () => {
    const { ctx, jar, ids } = await withDocuments(3);
    const granted = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    const grantId = (await granted.json()).consent.grantId as string;
    for (const id of ids) expect((await startOcr(ctx, jar, id)).status).toBe(202);

    const calls = jobCalls(ctx);
    expect(calls).toHaveLength(3);
    expect(calls.map((call) => call.path.split("/")[4]).sort()).toEqual([...ids].sort());
    for (const call of calls) expect((call.body as { consentGrantId: string }).consentGrantId).toBe(grantId);
    // Every job was remembered: nothing was lost between the three sealed-cookie updates.
    expect(Object.keys(stateOf(jar).ocrJobs).sort()).toEqual([...ids].sort());
  });

  it("starting a document the permission does not name is refused without a backend call", async () => {
    const { ctx, jar, ids } = await withDocuments(3);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [ids[0], ids[1]] });
    const refused = await startOcr(ctx, jar, ids[2]);
    expect(refused.status).toBe(403);
    expect((await refused.json()).error.code).toBe("CONSENT_REQUIRED");
    expect(jobCalls(ctx)).toHaveLength(0);
  });

  it("taking the permission back (by id) revokes once on the backend and clears all N jobs", async () => {
    const { ctx, jar, ids } = await withDocuments(3);
    const granted = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    const grantId = (await granted.json()).consent.grantId as string;
    for (const id of ids) await startOcr(ctx, jar, id);
    expect(Object.keys(stateOf(jar).ocrJobs)).toHaveLength(3);

    const revoked = await post(ctx, "consents.revokeById", `/api/app/consents/${grantId}/revoke`, jar, {}, { consentId: grantId });
    expect(await revoked.json()).toEqual({ revoked: 1 });
    expect(ctx.backend.calls.filter((call) => call.path === `/api/v1/consents/${grantId}/revoke`)).toHaveLength(1);
    expect(stateOf(jar).ocrJobs).toEqual({});
    expect(stateOf(jar).consents.some((consent) => consent.scope === "ocr_sarvam")).toBe(false);

    const view = await overviewOf(ctx, jar);
    for (const doc of view.documents) expect(doc).toMatchObject({ stage: "awaiting_ocr_consent", nextAction: "grant_ocr_consent", ocr: null });
  });

  it("taking it back by the same list of documents clears all N jobs too", async () => {
    const { ctx, jar, ids } = await withDocuments(2);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    for (const id of ids) await startOcr(ctx, jar, id);
    const revoked = await post(ctx, "consents.revoke", "/api/app/consents/revoke", jar, { scope: "ocr_sarvam", documentIds: [...ids].reverse() });
    expect(await revoked.json()).toEqual({ revoked: 1 });
    expect(stateOf(jar).ocrJobs).toEqual({});
  });

  it("a request for one document does not quietly withdraw a permission that names several", async () => {
    const { ctx, jar, ids } = await withDocuments(2);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    const response = await post(ctx, "consents.revoke", "/api/app/consents/revoke", jar, { scope: "ocr_sarvam", documentId: ids[0] });
    expect(response.status).toBe(404);
    expect(stateOf(jar).consents.some((consent) => consent.scope === "ocr_sarvam")).toBe(true);
  });
});

describe("batched reading permission: overlapping permissions", () => {
  const startOcr = (ctx: Ctx, jar: Jar, documentId: string) => post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
  const jobCalls = (ctx: Ctx) => ctx.backend.calls.filter((call) => call.method === "POST" && /\/api\/v1\/documents\/[^/]+\/ocr-jobs$/.test(call.path));

  it("refuses a second permission that names a document an earlier one already covers (409), and creates nothing", async () => {
    const { ctx, jar, ids } = await withDocuments(3);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [ids[0], ids[1]] });
    const grantsBefore = readingGrants(ctx).length;
    const response = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatchObject({ code: "CONSENT_ALREADY_HELD", fields: ["documentIds"], retryable: false });
    expect(readingGrants(ctx)).toHaveLength(grantsBefore);
    expect(stateOf(jar).consents.filter((consent) => consent.scope === "ocr_sarvam")).toHaveLength(1);
  });

  it("still accepts the same set again (reused) and a set of documents nothing covers yet", async () => {
    const { ctx, jar, ids } = await withDocuments(3);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [ids[0], ids[1]] });
    expect((await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [ids[1], ids[0]] })).status).toBe(200);
    expect((await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [ids[2]] })).status).toBe(201);
  });

  it("after the permission is withdrawn nothing starts reading: the documents ask again and a start is refused", async () => {
    const { ctx, jar, ids } = await withDocuments(3);
    const granted = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [ids[0], ids[1]] });
    const grantId = (await granted.json()).consent.grantId as string;
    // A wider permission cannot be stacked on top, so withdrawing the first leaves nothing that covers these documents.
    expect((await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids })).status).toBe(409);
    for (const id of [ids[0], ids[1]]) await startOcr(ctx, jar, id);
    await post(ctx, "consents.revokeById", `/api/app/consents/${grantId}/revoke`, jar, {}, { consentId: grantId });

    const view = await overviewOf(ctx, jar);
    for (const doc of view.documents) expect(doc).toMatchObject({ stage: "awaiting_ocr_consent", nextAction: "grant_ocr_consent" });
    const jobsBefore = jobCalls(ctx).length;
    const refused = await startOcr(ctx, jar, ids[0]);
    expect(refused.status).toBe(403);
    expect(jobCalls(ctx)).toHaveLength(jobsBefore);
  });
});

describe("batched reading permission: documents must belong to the case", () => {
  it("refuses an id that is not one of this case's documents (400) before the backend creates anything", async () => {
    const { ctx, jar, ids } = await withDocuments(1);
    const response = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [ids[0], "doc-from-somewhere-else"] });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatchObject({ code: "INVALID_REQUEST", fields: ["documentIds"] });
    expect(readingGrants(ctx)).toHaveLength(0);
  });

  it("refuses when the session has no case at all", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    const response = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ["doc-1"] });
    expect(response.status).toBe(400);
    expect(readingGrants(ctx)).toHaveLength(0);
  });
});

describe("batched reading permission: a permission the backend no longer honours is forgotten", () => {
  const gone = () => new Response(JSON.stringify({ error: { code: "CONSENT_REQUIRED", message: "raw backend text" } }), { status: 403 });

  it("on a refresh that says the permission is gone, it is dropped, its jobs are cleared and it is not offered as reused", async () => {
    const { ctx, jar, ids } = await withDocuments(2);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    for (const id of ids) await post(ctx, "ocr.start", `/api/app/documents/${id}/ocr`, jar, {}, { documentId: id });
    expect(Object.keys(stateOf(jar).ocrJobs)).toHaveLength(2);

    // The backend refuses both refreshes (the permission is gone for every document it named).
    for (let index = 0; index < 2; index += 1) ctx.backend.control.failNext.push({ match: /POST \/api\/v1\/ocr-jobs\/.+\/refresh/, respond: gone });
    const view = await overviewOf(ctx, jar);
    for (const doc of view.documents) expect(doc).toMatchObject({ nextAction: "grant_ocr_consent" });
    expect(stateOf(jar).consents.some((consent) => consent.scope === "ocr_sarvam")).toBe(false);
    expect(stateOf(jar).ocrJobs).toEqual({});

    const again = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    expect(again.status).toBe(201);
    expect((await again.json()).reused).toBe(false);
  });

  it("on a start that says the permission is gone, it is dropped and the error is passed on", async () => {
    const { ctx, jar, ids } = await withDocuments(1);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    ctx.backend.control.failNext.push({ match: /POST \/api\/v1\/documents\/.+\/ocr-jobs/, respond: gone });
    const response = await post(ctx, "ocr.start", `/api/app/documents/${ids[0]}/ocr`, jar, {}, { documentId: ids[0] });
    expect(response.status).toBe(403);
    expect(JSON.stringify(await response.json())).not.toContain("raw backend text");
    expect(stateOf(jar).consents.some((consent) => consent.scope === "ocr_sarvam")).toBe(false);
  });

  it("a document that is merely not ready does not drop the permission for the others", async () => {
    const { ctx, jar, ids } = await withDocuments(2);
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    for (const id of ids) await post(ctx, "ocr.start", `/api/app/documents/${id}/ocr`, jar, {}, { documentId: id });
    ctx.backend.control.failNext.push({
      match: /POST \/api\/v1\/ocr-jobs\/.+\/refresh/,
      respond: () => new Response(JSON.stringify({ error: { code: "DOCUMENT_NOT_OCR_READY", message: "raw" } }), { status: 409 }),
    });
    await overviewOf(ctx, jar);
    expect(stateOf(jar).consents.some((consent) => consent.scope === "ocr_sarvam")).toBe(true);
  });
});

describe("batched reading permission: the sealed state cookie at the limit", () => {
  const startOcr = (ctx: Ctx, jar: Jar, documentId: string) => post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
  const jobCalls = (ctx: Ctx) => ctx.backend.calls.filter((call) => call.method === "POST" && /\/api\/v1\/documents\/[^/]+\/ocr-jobs$/.test(call.path));

  it("10 documents and 10 jobs with realistic (UUID-length) ids fit", async () => {
    const ctx = makeApp();
    ctx.backend.control.idPrefix = "document-3f2b8c1e-5a7d-4e9a-b1c2-";
    ctx.backend.control.jobIdPrefix = "ocr-3f2b8c1e-5a7d-4e9a-b1c2-";
    const { jar } = await signIn(ctx);
    const collectId = (await (await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" })).json()).consent.grantId as string;
    const ids: string[] = [];
    for (let index = 0; index < 10; index += 1) {
      const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": collectId, "idempotency-key": `upload-key-${String(index).padStart(8, "0")}` }), { caseId: "case-1" });
      ids.push((await upload.json()).document.id as string);
    }
    expect((await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids })).status).toBe(201);
    for (const id of ids) expect((await startOcr(ctx, jar, id)).status).toBe(202);
    expect(Object.keys(stateOf(jar).ocrJobs)).toHaveLength(10);
    expect(Buffer.byteLength(jar.get("kv_state") ?? "")).toBeLessThanOrEqual(3800);
  });

  it("with the longest ids it fails closed with a coded 409 and never starts a job it cannot remember", async () => {
    const ctx = makeApp();
    ctx.backend.control.idPrefix = "d".repeat(115);
    ctx.backend.control.jobIdPrefix = "j".repeat(115);
    const { jar } = await signIn(ctx);
    const collectId = (await (await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" })).json()).consent.grantId as string;
    const ids: string[] = [];
    for (let index = 0; index < 10; index += 1) {
      const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": collectId, "idempotency-key": `upload-key-${String(index).padStart(8, "0")}` }), { caseId: "case-1" });
      ids.push((await upload.json()).document.id as string);
    }
    const grant = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: ids });
    const outcomes: number[] = [grant.status];
    if (grant.status === 201) {
      for (const id of ids) {
        const response = await startOcr(ctx, jar, id);
        outcomes.push(response.status);
        if (response.status !== 202) expect((await response.json()).error).toMatchObject({ code: "STATE_LIMIT_REACHED", retryable: false });
      }
    } else {
      expect((await grant.json()).error.code).toBe("STATE_LIMIT_REACHED");
      expect(readingGrants(ctx)).toHaveLength(0);
    }
    // Every answer is either success or the coded refusal, never a crash.
    expect(outcomes.every((status) => status === 201 || status === 202 || status === 409)).toBe(true);
    expect(outcomes.some((status) => status === 409)).toBe(true);
    // Every job the backend started is one the BFF remembers.
    expect(Object.keys(stateOf(jar).ocrJobs)).toHaveLength(jobCalls(ctx).length);
    expect(Buffer.byteLength(jar.get("kv_state") ?? "")).toBeLessThanOrEqual(3800);
  });
});
