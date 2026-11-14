import { randomUUID } from "node:crypto";
import { BackendError, backend, backendJson, type Ctx, jsonResponse, route } from "./backend";

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const DECLARATION_KINDS = ["pre_existing_disease", "prior_condition", "habit", "occupation", "nominee", "other"] as const;

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});
const str = (v: unknown) => (typeof v === "string" ? v : "");

async function readJson(ctx: Ctx): Promise<Json> {
  try {
    return obj(await ctx.request.json());
  } catch {
    throw new BackendError(400, "INVALID_REQUEST", "The request could not be read.");
  }
}

/** POST /api/beta/session: one household per e-mail, through the bootstrap credential held only here. */
export const startSession = route(async ctx => {
  const body = await readJson(ctx);
  const name = str(body.name).trim().slice(0, 80);
  const email = str(body.email).trim().slice(0, 254);
  if (!name || !email) throw new BackendError(400, "INVALID_REQUEST", "Enter your name and e-mail.");
  const bootstrap = ctx.deps.env.KNOWVIA_BOOTSTRAP_TOKEN || "";
  if (bootstrap.length < 32) throw new BackendError(503, "BETA_NOT_CONFIGURED", "The beta is not available right now.");
  const result = await backendJson<{ household: { id: string }; owner: { id: string }; ownerMember: { id: string }; session: { token: string } }>(ctx, "/api/v1/access", {
    token: bootstrap, body: { displayName: name, contactEmail: email },
  });
  ctx.set({ token: result.session.token, householdId: result.household.id, adultId: result.owner.id, memberId: result.ownerMember.id });
  return jsonResponse(ctx, { ok: true });
});

/** GET /api/beta/session: which step the person is on. Ids only as booleans; never the token. */
export const sessionState = route(async ctx => {
  const s = ctx.session;
  return jsonResponse(ctx, { signedIn: Boolean(s), hasDocument: Boolean(s?.documentId), hasHolding: Boolean(s?.holdingId) });
});

export const endSession = route(async ctx => {
  const headers = ctx.headers({ "content-type": "application/json" });
  headers.append("set-cookie", "kv_beta=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
});

/** POST /api/beta/documents: raw PDF body. Consent for document processing and reading is confirmed on screen first. */
export const uploadDocument = route(async ctx => {
  const s = ctx.require();
  if (ctx.request.headers.get("x-consent-confirmed") !== "true") throw new BackendError(400, "CONSENT_NOT_CONFIRMED", "Please confirm permission to read your document first.");
  const bytes = await ctx.request.arrayBuffer();
  if (bytes.byteLength === 0) throw new BackendError(400, "INVALID_REQUEST", "No file received.");
  if (bytes.byteLength > MAX_PDF_BYTES) throw new BackendError(413, "DOCUMENT_TOO_LARGE", "That file is larger than 15 MB.");
  let caseId = s.caseId;
  if (!caseId) {
    const created = await backendJson<{ id: string }>(ctx, "/api/v1/cases", { body: { householdId: s.householdId, subjectMemberId: s.memberId, triggerType: "planned_care" } });
    caseId = created.id;
    ctx.update({ caseId });
  }
  // FOR LEGAL REVIEW: consent scopes and the on-screen wording that grants them.
  const grant = await backendJson<{ id: string }>(ctx, "/api/v1/consents", {
    headers: { "idempotency-key": `doc-${s.householdId}-${caseId}` },
    body: {
      householdId: s.householdId, subjectAdultId: s.adultId, purpose: "document_processing",
      scopes: [
        { resourceType: "document", action: "collect", dataCategory: "insurance_document" },
        { resourceType: "case", resourceId: caseId, action: "read", dataCategory: "source_pack_metadata", recipient: s.adultId },
      ],
    },
  });
  const filename = (ctx.request.headers.get("x-filename") || "policy.pdf").replace(/[^\w.\- ]/g, "_").slice(0, 100) || "policy.pdf";
  const uploaded = await backendJson<{ document?: { id: string }; id?: string }>(ctx, `/api/v1/cases/${encodeURIComponent(caseId)}/documents`, {
    headers: { "content-type": "application/pdf", "idempotency-key": randomUUID(), "x-document-kind": "policy_schedule", "x-consent-grant-id": grant.id, "x-filename": filename },
    raw: bytes,
  });
  const documentId = uploaded.document?.id ?? uploaded.id;
  if (!documentId) throw new BackendError(502, "BACKEND_ERROR", "Upload was not confirmed.");
  ctx.update({ documentId, ocrJobId: undefined, ocrGrantId: undefined, holdingId: undefined });
  return jsonResponse(ctx, { stage: "scanning" }, 201);
});

/**
 * GET /api/beta/status: advances the pipeline one step per poll (scan -> read -> holding) and reports the stage.
 * stage: none | scanning | reading | ready | rejected | failed (failed and rejected carry a backend code).
 */
export const processingStatus = route(async ctx => {
  const s = ctx.require();
  if (!s.documentId || !s.caseId) return jsonResponse(ctx, { stage: "none" });
  const list = await backendJson<{ documents: Json[] }>(ctx, `/api/v1/cases/${encodeURIComponent(s.caseId)}/documents`);
  const doc = list.documents.find(d => d.id === s.documentId);
  if (!doc || doc.status === "rejected" || doc.status === "deleted") return jsonResponse(ctx, { stage: "rejected", code: "DOCUMENT_REJECTED" });
  if (doc.status !== "accepted") return jsonResponse(ctx, { stage: "scanning" });

  let jobId = s.ocrJobId;
  let grantId = s.ocrGrantId;
  if (!jobId || !grantId) {
    // FOR LEGAL REVIEW: sending the document to the reading provider needs its own grant.
    const grant = await backendJson<{ id: string }>(ctx, "/api/v1/consents", {
      headers: { "idempotency-key": `ocr-${s.documentId}` },
      body: {
        householdId: s.householdId, subjectAdultId: s.adultId, grantedToActor: "sarvam", purpose: "document_processing",
        scopes: [{ resourceType: "document", resourceId: s.documentId, action: "derive", dataCategory: "insurance_document", recipient: "sarvam" }],
      },
    });
    grantId = grant.id;
    const started = await backendJson<{ job: { id: string; status: string; errorCode?: string } }>(ctx, `/api/v1/documents/${encodeURIComponent(s.documentId)}/ocr-jobs`, { body: { consentGrantId: grantId } });
    jobId = started.job.id;
    ctx.update({ ocrJobId: jobId, ocrGrantId: grantId });
    if (started.job.status === "failed") return jsonResponse(ctx, { stage: "failed", code: started.job.errorCode || "OCR_FAILED" });
    if (started.job.status !== "succeeded") return jsonResponse(ctx, { stage: "reading" });
  } else {
    const refreshed = await backendJson<{ job: { status: string; errorCode?: string } }>(ctx, `/api/v1/ocr-jobs/${encodeURIComponent(jobId)}/refresh`, { body: { consentGrantId: grantId } });
    if (refreshed.job.status === "failed" || refreshed.job.status === "cancelled") return jsonResponse(ctx, { stage: "failed", code: refreshed.job.errorCode || "OCR_FAILED" });
    if (refreshed.job.status !== "succeeded") return jsonResponse(ctx, { stage: "reading" });
  }
  const holdings = await backendJson<{ holdings: Json[]; creation_issues?: Json[] }>(ctx, `/api/v1/households/${encodeURIComponent(s.householdId)}/holdings`);
  const holding = holdings.holdings.find(h => h.documentId === s.documentId || h.document_id === s.documentId);
  if (!holding) {
    const failed = (holdings.creation_issues || []).find(i => i.state === "failed");
    return jsonResponse(ctx, failed ? { stage: "failed", code: str(failed.code) || "HOLDING_CREATE_FAILED" } : { stage: "reading" });
  }
  ctx.update({ holdingId: str(holding.id) });
  return jsonResponse(ctx, { stage: "ready" });
});

/** GET: product candidates (UIN never present). POST: owner confirms one. */
export const productCandidates = route(async ctx => {
  const s = ctx.require();
  if (!s.holdingId) throw new BackendError(409, "HOLDING_NOT_READY", "Your policy is still being read.");
  return jsonResponse(ctx, await backendJson(ctx, `/api/v1/holdings/${encodeURIComponent(s.holdingId)}/product-candidates`));
});

/** GET /api/beta/product/search?q=: a typed product name fragment, matched on the server against the cached registry. */
export const productSearch = route(async ctx => {
  const s = ctx.require();
  if (!s.holdingId) throw new BackendError(409, "HOLDING_NOT_READY", "Your policy is still being read.");
  const q = (new URL(ctx.request.url).searchParams.get("q") ?? "").replace(/\s+/g, " ").trim();
  if (q.length < 2 || q.length > 80 || q.split(" ").length > 8) throw new BackendError(400, "INVALID_REQUEST", "Type 2 to 80 characters of the product name.");
  return jsonResponse(ctx, await backendJson(ctx, `/api/v1/holdings/${encodeURIComponent(s.holdingId)}/product-search?q=${encodeURIComponent(q)}`));
});

export const confirmProduct = route(async ctx => {
  const s = ctx.require();
  if (!s.holdingId) throw new BackendError(409, "HOLDING_NOT_READY", "Your policy is still being read.");
  const body = await readJson(ctx);
  const candidateId = str(body.candidateId);
  const expectedVersion = body.expectedVersion;
  if (!candidateId || typeof expectedVersion !== "number") throw new BackendError(400, "INVALID_REQUEST", "Pick one of the options.");
  const result = await backendJson(ctx, `/api/v1/holdings/${encodeURIComponent(s.holdingId)}/confirm-product`, {
    headers: { "idempotency-key": `confirm-${s.holdingId}-${candidateId}-${expectedVersion}` }, body: { candidateId, expectedVersion },
  });
  return jsonResponse(ctx, result);
});

async function profileGrant(ctx: Ctx) {
  const s = ctx.require();
  if (s.profileGrantId) return s.profileGrantId;
  // FOR LEGAL REVIEW: permission to keep what the person declared at purchase.
  const grant = await backendJson<{ id: string }>(ctx, "/api/v1/consents", {
    headers: { "idempotency-key": `profile-${s.householdId}` },
    body: { householdId: s.householdId, subjectAdultId: s.adultId, purpose: "profile_intake", scopes: [{ resourceType: "profile_field", action: "collect", dataCategory: "health_profile" }] },
  });
  ctx.update({ profileGrantId: grant.id });
  return grant.id;
}

/** GET lists; POST { items: [{ kind, label, declaredOn?, declaredToInsurer? }] } saves what was declared at purchase. */
export const listDeclarations = route(async ctx => {
  const s = ctx.require();
  return jsonResponse(ctx, await backendJson(ctx, `/api/v1/households/${encodeURIComponent(s.householdId)}/declarations`));
});

export const saveDeclarations = route(async ctx => {
  const s = ctx.require();
  const body = await readJson(ctx);
  const items = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  const grantId = await profileGrant(ctx);
  const saved: unknown[] = [];
  for (const raw of items) {
    const item = obj(raw);
    const kind = str(item.kind);
    const label = str(item.label).trim().slice(0, 300);
    if (!(DECLARATION_KINDS as readonly string[]).includes(kind) || !label) throw new BackendError(400, "INVALID_REQUEST", "Each item needs a type and a short description.");
    saved.push(await backendJson(ctx, `/api/v1/households/${encodeURIComponent(s.householdId)}/declarations`, {
      body: {
        memberId: s.memberId, kind, label, holdingId: s.holdingId ?? null, consentGrantId: grantId,
        declaredOn: str(item.declaredOn) || null, declaredToInsurer: typeof item.declaredToInsurer === "boolean" ? item.declaredToInsurer : null,
      },
    }));
  }
  return jsonResponse(ctx, { saved: saved.length }, 201);
});

/** GET /api/beta/facts: the policy card source (facts with page citations). */
export const holdingFacts = route(async ctx => {
  const s = ctx.require();
  if (!s.holdingId) throw new BackendError(409, "HOLDING_NOT_READY", "Your policy is still being read.");
  const [facts, holding] = await Promise.all([
    backendJson(ctx, `/api/v1/holdings/${encodeURIComponent(s.holdingId)}/facts`),
    backendJson(ctx, `/api/v1/households/${encodeURIComponent(s.householdId)}/holdings/${encodeURIComponent(s.holdingId)}`),
  ]);
  return jsonResponse(ctx, { facts, holding });
});

/** POST /api/beta/chat/threads: open a thread on the policy. */
export const createThread = route(async ctx => {
  const s = ctx.require();
  const result = await backendJson<{ thread: { id: string } }>(ctx, "/api/v1/chat/threads", { body: { household_id: s.householdId, holding_id: s.holdingId ?? undefined } });
  return jsonResponse(ctx, { threadId: result.thread.id }, 201);
});

/** POST /api/beta/chat/turn { threadId, message }: proxies the backend event stream byte for byte. */
export const chatTurn = route(async ctx => {
  const body = await readJson(ctx);
  const threadId = str(body.threadId);
  const message = str(body.message).trim().slice(0, 1000);
  if (!/^[A-Za-z0-9_.:-]{1,100}$/.test(threadId) || !message) throw new BackendError(400, "INVALID_REQUEST", "Ask a question to continue.");
  const res = await backend(ctx, `/api/v1/chat/threads/${encodeURIComponent(threadId)}/turns`, { body: { message }, headers: { accept: "text/event-stream" } });
  if (!(res.headers.get("content-type") || "").includes("text/event-stream") || !res.body) throw new BackendError(502, "BACKEND_ERROR", "No answer came back.");
  return new Response(res.body, { status: 200, headers: ctx.headers({ "content-type": "text/event-stream; charset=utf-8", "x-accel-buffering": "no" }) });
});

/** GET /api/beta/memory-document: optional. { available: false } when the backend does not have it yet. */
export const memoryDocument = route(async ctx => {
  const s = ctx.require();
  if (!s.holdingId) return jsonResponse(ctx, { available: false });
  try {
    const res = await backend(ctx, `/api/v1/holdings/${encodeURIComponent(s.holdingId)}/memory-document`);
    const type = res.headers.get("content-type") || "";
    if (type.includes("application/json")) return jsonResponse(ctx, { available: true, document: await res.json() });
    return jsonResponse(ctx, { available: true, text: (await res.text()).slice(0, 200_000) });
  } catch (error) {
    if (error instanceof BackendError && [404, 501, 503].includes(error.status)) return jsonResponse(ctx, { available: false });
    throw error;
  }
});
