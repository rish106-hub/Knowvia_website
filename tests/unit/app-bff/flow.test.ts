import { describe, expect, it } from "vitest";
import { composeDocumentView } from "@/server/app/document-view";
import { buildConsentGrant } from "@/server/app/consent-scopes";
import { applyCookies, makeApp, request, signIn, uploadRequest, type Jar } from "./helpers";

type Ctx = ReturnType<typeof makeApp>;
const post = (ctx: Ctx, name: Parameters<Ctx["app"]["dispatch"]>[0], path: string, jar: Jar, json?: unknown, params: Record<string, string> = {}, headers: Record<string, string> = {}) =>
  ctx.app.dispatch(name, request(path, { method: "POST", json: json ?? {}, jar, headers }), params).then((response) => {
    applyCookies(jar, response);
    return response;
  });

async function withDocument() {
  const ctx = makeApp();
  const { jar } = await signIn(ctx);
  const collect = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" });
  expect(collect.status).toBe(201);
  const consent = (await collect.json()).consent;
  const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": consent.grantId }), { caseId: "case-1" });
  const documentId = (await upload.json()).document.id as string;
  return { ctx, jar, documentId };
}

describe("consent scopes", () => {
  it("builds the real backend scope shapes", () => {
    const base = { adultId: "adult-1", householdId: "household-1" };
    expect(buildConsentGrant("collect", { ...base, caseId: "case-1" })).toMatchObject({
      purpose: "document_processing",
      scopes: [
        { resourceType: "document", action: "collect", dataCategory: "insurance_document" },
        { resourceType: "case", resourceId: "case-1", action: "read", dataCategory: "source_pack_metadata", recipient: "adult-1" },
      ],
    });
    expect(buildConsentGrant("ocr_sarvam", { ...base, documentId: "doc-1" })).toMatchObject({
      grantedToActor: "sarvam",
      scopes: [{ resourceType: "document", resourceId: "doc-1", action: "derive", dataCategory: "insurance_document", recipient: "sarvam" }],
    });
    expect(buildConsentGrant("question_gemini", { ...base, documentIds: ["a", "b"] })).toMatchObject({
      grantedToActor: "google-gemini",
      scopes: [
        { resourceType: "document", resourceId: "a", action: "derive", dataCategory: "insurance_question", recipient: "google-gemini" },
        { resourceType: "document", resourceId: "b", action: "derive", dataCategory: "insurance_question", recipient: "google-gemini" },
      ],
    });
  });
});

describe("document stages", () => {
  const doc = (status: string) => ({ id: "d", caseId: "c", documentKind: "policy_schedule", byteSize: 1, uploadedAt: null, status }) as never;
  const job = (status: string, errorCode: string | null = null) => ({ id: "j", documentId: "d", status, errorCode, pageCount: null }) as never;
  it.each([
    ["received_pending_checks", null, false, true, "received"],
    ["received_pending_checks", null, false, false, "awaiting_checks"],
    ["accepted", null, false, false, "awaiting_ocr_consent"],
    ["accepted", null, true, false, "awaiting_ocr_consent"],
    ["accepted", "queued", true, false, "processing"],
    ["accepted", "submitted", true, false, "processing"],
    ["accepted", "processing", true, false, "processing"],
    ["accepted", "succeeded", true, false, "readable"],
    ["accepted", "failed", true, false, "unreadable"],
    ["accepted", "cancelled", true, false, "unreadable"],
    ["rejected", null, false, false, "rejected"],
    ["deletion_pending", null, false, false, "deleting"],
    ["deleted", null, false, false, "deleted"],
  ] as const)("backend %s + job %s (consent %s, justUploaded %s) => %s", (status, jobStatus, consent, justUploaded, stage) => {
    const view = composeDocumentView({ document: doc(status), ocrJob: jobStatus ? job(jobStatus) : null, ocrConsent: consent, justUploaded });
    expect(view.stage).toBe(stage);
  });

  it("only says scan_state_not_visible while checks are pending", () => {
    expect(composeDocumentView({ document: doc("received_pending_checks"), ocrJob: null, ocrConsent: false }).note).toBe("scan_state_not_visible");
    expect(composeDocumentView({ document: doc("accepted"), ocrJob: null, ocrConsent: false }).note).toBeNull();
  });
});

describe("overview, OCR and consent lifecycle", () => {
  it("drives stages only from the backend: pending checks -> awaiting consent -> processing -> readable", async () => {
    const { ctx, jar, documentId } = await withDocument();
    ctx.backend.control.documentStatus = "received_pending_checks";
    const overview = (name = "overview.get" as const) => ctx.app.dispatch(name, request("/api/app/overview", { jar })).then((r) => r.json());

    let view = await overview();
    expect(view.documents[0].stage).toBe("awaiting_checks");
    expect(view.cases).toEqual([{ id: "case-1" }]);
    expect(view.consents).toHaveLength(1);
    expect(JSON.stringify(view)).not.toMatch(/token/i);

    ctx.backend.control.documentStatus = "accepted";
    view = await overview();
    expect(view.documents[0]).toMatchObject({ stage: "awaiting_ocr_consent", nextAction: "grant_ocr_consent" });

    const start = await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
    expect(start.status).toBe(403);

    const grant = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId });
    expect(grant.status).toBe(201);
    view = await overview();
    expect(view.documents[0]).toMatchObject({ stage: "awaiting_ocr_consent", nextAction: "start_ocr" });

    ctx.backend.control.ocrFinalStatus = "processing";
    const started = await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
    expect(started.status).toBe(202);
    expect((await started.json()).document.stage).toBe("processing");

    ctx.backend.control.ocrFinalStatus = "succeeded";
    view = await overview();
    expect(view.documents[0]).toMatchObject({ stage: "readable", ocr: { status: "succeeded", pageCount: 3 } });

    // The OCR calls used the OCR grant, not the collect grant.
    const ocrCall = ctx.backend.calls.find((c) => c.path.endsWith("/ocr-jobs"));
    expect((ocrCall?.body as { consentGrantId: string }).consentGrantId).toMatch(/^consent-/);
  });

  it("reuses an existing grant instead of creating another, and keeps one case per household", async () => {
    const { ctx, jar } = await withDocument();
    const again = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" });
    expect((await again.json()).reused).toBe(true);
    const c1 = await post(ctx, "cases.create", "/api/app/cases", jar, {});
    const c2 = await post(ctx, "cases.create", "/api/app/cases", jar, {});
    expect(await c1.json()).toEqual({ caseId: "case-1", created: false });
    expect(await c2.json()).toEqual({ caseId: "case-1", created: false });
    expect(ctx.backend.calls.filter((c) => c.path === "/api/v1/cases")).toHaveLength(1);
  });

  it("revoking OCR consent revokes on the backend and returns the document to awaiting_ocr_consent", async () => {
    const { ctx, jar, documentId } = await withDocument();
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId });
    await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
    const revoke = await post(ctx, "consents.revoke", "/api/app/consents/revoke", jar, { scope: "ocr_sarvam", documentId });
    expect(await revoke.json()).toEqual({ revoked: 1 });
    expect(ctx.backend.calls.some((c) => /\/consents\/consent-\d+\/revoke$/.test(c.path))).toBe(true);
    const overview = await (await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar }))).json();
    expect(overview.documents[0]).toMatchObject({ stage: "awaiting_ocr_consent", nextAction: "grant_ocr_consent", ocr: null });
    const missing = await post(ctx, "consents.revoke", "/api/app/consents/revoke", jar, { scope: "ocr_sarvam", documentId });
    expect(missing.status).toBe(404);
  });

  it("deletes a document and forgets its OCR job", async () => {
    const { ctx, jar, documentId } = await withDocument();
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentId });
    await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
    const del = await ctx.app.dispatch("documents.delete", request(`/api/app/documents/${documentId}`, { method: "DELETE", jar }), { documentId });
    applyCookies(jar, del);
    expect(del.status).toBe(202);
    expect((await del.json()).document.stage).toBe("deleting");
    const refresh = await post(ctx, "ocr.refresh", `/api/app/documents/${documentId}/ocr/refresh`, jar, {}, { documentId });
    expect(refresh.status).toBe(409);
  });

  it("asks a question with the Gemini grant and the caller's Idempotency-Key, and refuses without a grant", async () => {
    const { ctx, jar, documentId } = await withDocument();
    const refused = await post(ctx, "questions.ask", "/api/app/cases/case-1/questions", jar, { question: "Room rent?" }, { caseId: "case-1" }, { "idempotency-key": "question-key-1234" });
    expect(refused.status).toBe(403);
    expect((await refused.json()).error.code).toBe("CONSENT_REQUIRED");
    await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "question_gemini", documentIds: [documentId] });
    const missingKey = await post(ctx, "questions.ask", "/api/app/cases/case-1/questions", jar, { question: "Room rent?" }, { caseId: "case-1" });
    expect(missingKey.status).toBe(400);
    const ok = await post(ctx, "questions.ask", "/api/app/cases/case-1/questions", jar, { question: "Room rent?" }, { caseId: "case-1" }, { "idempotency-key": "question-key-1234" });
    expect(ok.status).toBe(200);
    expect((await ok.json()).answerId).toBe("answer-1");
    const call = ctx.backend.calls.find((c) => c.path.endsWith("/questions"));
    expect(call?.headers["idempotency-key"]).toBe("question-key-1234");
    expect(call?.body).toMatchObject({ documentIds: [documentId] });
  });

  it("validates request bodies without leaking input values", async () => {
    const { ctx, jar } = await withDocument();
    const bad = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam" });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toMatchObject({ code: "INVALID_REQUEST", fields: ["documentId"] });
    const unknown = await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "everything" });
    expect(unknown.status).toBe(400);
    const notJson = await ctx.app.dispatch("consents.grant", request("/api/app/consents", { method: "POST", jar, headers: { "content-type": "text/plain" }, body: "x" }));
    expect(notJson.status).toBe(415);
  });

  it("serves the draft consent notices without a session, all marked as needing legal review", async () => {
    const ctx = makeApp();
    const response = await ctx.app.dispatch("consents.notices", request("/api/app/consents/notices"));
    const body = await response.json();
    expect(body.notices).toHaveLength(3);
    for (const notice of body.notices) {
      expect(notice.status).toBe("draft_needs_legal_review");
      expect(notice.body).toMatch(/needs legal review/i);
    }
  });
});
