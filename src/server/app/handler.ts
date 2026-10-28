// BFF request pipeline and route implementations. Framework-agnostic: takes a Web Request, returns a Web Response,
// so it is testable without Next. The Next route files in src/app/api/app/** are thin wrappers (see runtime.ts).
// PROVISIONAL: identity (D1) and topology (D2) are OPEN. Verified against a FAKE backend only.
import { z } from "zod";
import { createBackendClient, type BackendClient, type FetchLike } from "./backend-client";
import { buildConsentGrant, CONSENT_NOTICES } from "./consent-scopes";
import {
  askQuestionRequestSchema,
  catalogueReviewRequestSchema,
  coveragePreviewRequestSchema,
  createCaseRequestSchema,
  createSessionRequestSchema,
  designateConfirmerRequestSchema,
  grantConsentRequestSchema,
  revokeConsentRequestSchema,
  type ConsentView,
  type DocumentView,
  type Overview,
  type SessionView,
} from "./contract";
import { assertCsrf } from "./csrf";
import { composeDocumentView } from "./document-view";
import { AppConfigError, loadAppConfig, type AppConfig, type EnvSource } from "./env";
import { AppError, appError, errorBody } from "./errors";
import { resolveIdentityProvider } from "./identity";
import { clientKey, type RateLimiter } from "./rate-limit";
import {
  clearCookie,
  cookieNames,
  loadSession,
  MAX_STATE_ITEMS,
  parseCookieHeader,
  sessionCookie,
  stateCookie,
  emptyState,
  type AppState,
  type ConsentScopeName,
  type SessionData,
  type StateConsent,
} from "./session";
import { readPdfBody, validateUploadHeaders } from "./upload";
import { openCookie } from "./cookie-crypto";

/** The backend token in a session cookie that is authentic, even if expired (it may still be live on the backend). */
function looseSessionToken(cookieHeader: string | null, config: { sessionSecret: string; production: boolean }): string | null {
  const raw = parseCookieHeader(cookieHeader).get(cookieNames(config.production).session);
  if (!raw) return null;
  const opened = openCookie<SessionData>("session", raw, config.sessionSecret, 0);
  return opened.ok && typeof opened.value?.token === "string" ? opened.value.token : null;
}

export type AppDeps = {
  env: () => EnvSource;
  fetch: FetchLike;
  now: () => number;
  rateLimiter: RateLimiter;
};

type InternalDeps = AppDeps & { uploadsInFlight: Map<string, number> };

type EnabledConfig = Extract<AppConfig, { enabled: true }>;
type Result = { status: number; body: unknown };

type Ctx = {
  request: Request;
  params: Record<string, string>;
  config: EnabledConfig;
  deps: InternalDeps;
  backend: BackendClient;
  nowMs: number;
  /** Present on authenticated routes. */
  session: SessionData;
  state: AppState;
  markState(): void;
  /** Set by session creation: replaces the session and starts a fresh state. */
  issued: SessionData | null;
};

/** `markerOnGet`: the route has a backend side effect on GET (an OCR refresh), so it needs X-Knowvia-App like a write. */
type Route = { auth: boolean; markerOnGet?: boolean; run: (ctx: Ctx) => Promise<Result> };

// ---------- helpers ----------

const MAX_JSON_BYTES = 64 * 1024;

/** Reads a body with a running byte cap, so a chunked or lying Content-Length body is cut off at the cap. */
async function readBoundedText(request: Request, maxBytes: number): Promise<string> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw appError(413, "INVALID_REQUEST");
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw appError(413, "INVALID_REQUEST");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function readJson<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") throw appError(415, "INVALID_REQUEST");
  const text = await readBoundedText(request, MAX_JSON_BYTES);
  let value: unknown;
  try {
    value = text ? JSON.parse(text) : {};
  } catch {
    throw appError(400, "INVALID_REQUEST");
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".") || "body"))].slice(0, 10);
    throw appError(400, "INVALID_REQUEST", { fields });
  }
  return parsed.data;
}

function idempotencyKey(request: Request): string {
  const key = request.headers.get("idempotency-key")?.trim() ?? "";
  if (key.length < 8 || key.length > 200) throw appError(400, "IDEMPOTENCY_KEY_REQUIRED", { fields: ["Idempotency-Key"] });
  return key;
}

/** The key is optional where a repeat is harmless without it: a malformed one is refused, an absent one is not invented. */
function optionalIdempotencyKey(request: Request): string | undefined {
  return request.headers.get("idempotency-key") === null ? undefined : idempotencyKey(request);
}

const PATH_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
function pathId(ctx: Ctx, name: string): string {
  const value = ctx.params[name];
  if (!value || !PATH_ID.test(value)) throw appError(400, "INVALID_REQUEST", { fields: [name] });
  return value;
}

const jobIdFor = (state: AppState, documentId: string): string | undefined =>
  Object.hasOwn(state.ocrJobs, documentId) ? state.ocrJobs[documentId] : undefined;

const findConsent = (state: AppState, scope: ConsentScopeName, documentId?: string): StateConsent | undefined =>
  state.consents.find((c) => c.scope === scope && (documentId === undefined || c.docs.includes(documentId)));

function toConsentView(consent: StateConsent): ConsentView {
  return { scope: consent.scope, grantId: consent.id, documentIds: consent.docs, grantedAt: consent.at, noticeStatus: "draft_needs_legal_review" };
}

const CONSENT_LOST_CODES = new Set(["CONSENT_REQUIRED", "CONSENT_SCOPE_REQUIRED", "OCR_AUTHORIZATION_REQUIRED", "DOCUMENT_NOT_OCR_READY"]);

/** Lists the case documents and composes UI stages, refreshing each known OCR job (idempotent, read-like). */
async function loadDocumentViews(ctx: Ctx, caseId: string): Promise<{ documents: DocumentView[]; restricted: boolean }> {
  const { backend, session, state } = ctx;
  let list;
  try {
    list = await backend.listDocuments(session.token, caseId);
  } catch (error) {
    // Withdrawing the storage permission removes read access to the case (FIELD_ACCESS_REQUIRED) but the person must still
    // see and delete what is held, so fall back to the consent-independent deletion inventory.
    if (!(error instanceof AppError && error.code === "FIELD_ACCESS_REQUIRED")) throw error;
    const inventory = await backend.getDeletionInventory(session.token, caseId);
    return { documents: inventory.documents.map((document) => composeDocumentView({ document, ocrJob: null, ocrConsent: false })), restricted: true };
  }
  const documents = await Promise.all(
    list.documents.map(async (document) => {
      const grant = findConsent(state, "ocr_sarvam", document.id);
      const jobId = jobIdFor(state, document.id);
      let ocrConsent = Boolean(grant);
      let ocrJob = null;
      if (document.status === "accepted" && grant && jobId) {
        try {
          ocrJob = await backend.refreshOcr(session.token, jobId, { consentGrantId: grant.id });
        } catch (error) {
          if (error instanceof AppError && CONSENT_LOST_CODES.has(error.code)) ocrConsent = false;
          else if (!(error instanceof AppError && error.code === "OCR_JOB_NOT_FOUND")) throw error;
        }
      }
      return composeDocumentView({ document, ocrJob, ocrConsent });
    }),
  );
  return { documents, restricted: false };
}

/**
 * A backend grant that the BFF cannot record can never be revoked through it, so room for the grant is proven BEFORE the
 * backend creates it: the count cap and the sealed-cookie size cap, using a worst-case grant id.
 */
function assertRoomForConsent(ctx: Ctx, docs: string[]) {
  if (ctx.state.consents.length >= MAX_STATE_ITEMS) throw appError(409, "STATE_LIMIT_REACHED");
  const probe: AppState = { ...ctx.state, consents: [...ctx.state.consents, { id: "x".repeat(96), scope: "question_gemini", docs, at: new Date(ctx.nowMs).toISOString() }] };
  stateCookie(probe, ctx.session, ctx.config.sessionSecret, ctx.config.production, ctx.nowMs);
}

function addConsent(ctx: Ctx, consent: StateConsent) {
  if (ctx.state.consents.length >= MAX_STATE_ITEMS) throw appError(409, "STATE_LIMIT_REACHED");
  ctx.state.consents.push(consent);
  ctx.markState();
}

function dropConsent(ctx: Ctx, id: string) {
  ctx.state.consents = ctx.state.consents.filter((c) => c.id !== id);
  ctx.markState();
}

async function ensureCase(ctx: Ctx, triggerType: string): Promise<{ caseId: string; created: boolean }> {
  if (ctx.state.caseId) return { caseId: ctx.state.caseId, created: false };
  const created = await ctx.backend.createCase(ctx.session.token, {
    householdId: ctx.session.householdId,
    subjectMemberId: ctx.session.memberId,
    triggerType,
  });
  ctx.state.caseId = created.id;
  ctx.markState();
  return { caseId: created.id, created: true };
}

const householdMatrix = z
  .object({
    viewerRole: z.string().nullable().optional(),
    members: z.array(
      z.object({ id: z.string(), displayName: z.string(), memberKind: z.string().nullish(), relationshipLabel: z.string().nullish(), policiesFound: z.number().optional() }).loose(),
    ),
  })
  .loose();

const sessionView = (session: SessionData | null, provider: "dev" = "dev"): SessionView =>
  session
    ? { authenticated: true, expiresAt: session.expiresAt, householdId: session.householdId, adultId: session.adultId, memberId: session.memberId, identity: { provider, provisional: true } }
    : { authenticated: false, expiresAt: null, householdId: null, adultId: null, memberId: null, identity: null };

// ---------- routes ----------

const ROUTES = {
  // --- session ---
  "session.create": {
    auth: false,
    async run(ctx) {
      // Rate limit before any parsing or backend call.
      ctx.deps.rateLimiter.check(clientKey(ctx.request, ctx.config.trustedProxyHops), ctx.nowMs);
      const body = await readJson(ctx.request, createSessionRequestSchema);
      const provider = resolveIdentityProvider(body.provider, { devIdentity: ctx.config.devIdentity });
      const granted = await provider.signIn({ email: body.email, displayName: body.displayName }, ctx.backend);
      // A re-sign-in must not leave the previous backend session alive: the backend caps active sessions globally.
      const previous = looseSessionToken(ctx.request.headers.get("cookie"), ctx.config);
      if (previous) {
        try {
          await ctx.backend.revokeSession(previous);
        } catch {
          // Do not issue a replacement cookie while a copied old cookie may still be valid.
          // The provider has already created this replacement token, so release it as well.
          await ctx.backend.revokeSession(granted.session.token).catch(() => undefined);
          throw appError(503, "BACKEND_REQUEST_FAILED", { retryable: true });
        }
      }
      ctx.issued = {
        token: granted.session.token,
        expiresAt: granted.session.expiresAt,
        householdId: granted.householdId,
        adultId: granted.adultId,
        memberId: granted.memberId,
      };
      return { status: 201, body: sessionView(ctx.issued) };
    },
  },
  "overview.get": {
    auth: true,
    markerOnGet: true,
    async run(ctx) {
      const { session, state } = ctx;
      const parsedMatrix = householdMatrix.safeParse(await ctx.backend.getHousehold(session.token, session.householdId));
      if (!parsedMatrix.success) throw appError(502, "BACKEND_BAD_RESPONSE", { retryable: false });
      const matrix = parsedMatrix.data;
      const loaded = state.caseId ? await loadDocumentViews(ctx, state.caseId) : { documents: [], restricted: false };
      const documents = loaded.documents;
      const overview: Overview = {
        session: { expiresAt: session.expiresAt },
        household: { id: session.householdId, viewerRole: matrix.viewerRole ?? null },
        owner: { adultId: session.adultId, memberId: session.memberId },
        members: matrix.members.map((m) => ({
          id: m.id,
          displayName: m.displayName,
          memberKind: m.memberKind ?? null,
          relationshipLabel: m.relationshipLabel ?? null,
          policiesFound: m.policiesFound ?? 0,
        })),
        cases: state.caseId ? [{ id: state.caseId }] : [],
        documents,
        documentsAccess: loaded.restricted ? "permission_withdrawn" : "full",
        consents: state.consents.map(toConsentView),
      };
      return { status: 200, body: overview };
    },
  },
  "integrations.get": {
    auth: true,
    async run(ctx) {
      return { status: 200, body: await ctx.backend.getIntegrations(ctx.session.token) };
    },
  },

  // --- case ---
  "cases.create": {
    auth: true,
    async run(ctx) {
      const body = await readJson(ctx.request, createCaseRequestSchema);
      const { caseId, created } = await ensureCase(ctx, body.triggerType);
      return { status: created ? 201 : 200, body: { caseId, created } };
    },
  },

  // --- consent ---
  "consents.notices": {
    auth: false,
    async run() {
      return { status: 200, body: { notices: CONSENT_NOTICES } };
    },
  },
  "consents.grant": {
    auth: true,
    async run(ctx) {
      const key = optionalIdempotencyKey(ctx.request);
      const body = await readJson(ctx.request, grantConsentRequestSchema);
      const { session, state } = ctx;
      const docs = body.scope === "ocr_sarvam" ? [body.documentId as string] : body.scope === "question_gemini" ? [...new Set(body.documentIds as string[])].sort() : [];
      const existing = state.consents.find((c) => c.scope === body.scope && c.docs.length === docs.length && c.docs.every((d, i) => d === docs[i]));
      if (existing) return { status: 200, body: { consent: toConsentView(existing), reused: true } };

      assertRoomForConsent(ctx, docs);
      let caseId: string | null = null;
      if (body.scope === "collect") caseId = (await ensureCase(ctx, "planned_care")).caseId;
      const grant = buildConsentGrant(body.scope, { adultId: session.adultId, householdId: session.householdId, caseId, documentId: body.documentId, documentIds: docs });
      const created = await ctx.backend.grantConsent(session.token, grant, key);
      const consent: StateConsent = { id: created.id, scope: body.scope, docs, at: new Date(ctx.nowMs).toISOString() };
      addConsent(ctx, consent);
      return { status: 201, body: { consent: toConsentView(consent), reused: false } };
    },
  },
  "consents.revoke": {
    auth: true,
    async run(ctx) {
      const body = await readJson(ctx.request, revokeConsentRequestSchema);
      const docs = body.scope === "ocr_sarvam" ? [body.documentId as string] : body.scope === "question_gemini" ? [...new Set(body.documentIds as string[])].sort() : [];
      const matches = ctx.state.consents.filter((c) => c.scope === body.scope && c.docs.length === docs.length && c.docs.every((d, i) => d === docs[i]));
      if (matches.length === 0) throw appError(404, "CONSENT_NOT_FOUND");
      let revoked = 0;
      for (const consent of matches) {
        try {
          await ctx.backend.revokeConsent(ctx.session.token, consent.id, "user_revoked");
        } catch (error) {
          // Already gone on the backend: forget it locally. Anything else keeps the grant so the user can retry.
          if (!(error instanceof AppError && error.code === "CONSENT_NOT_FOUND")) throw error;
        }
        dropConsent(ctx, consent.id);
        revoked += 1;
        // The backend erases derived data when consent is revoked (backend invariant, not verified here).
        if (consent.scope === "ocr_sarvam") for (const doc of consent.docs) delete ctx.state.ocrJobs[doc];
      }
      return { status: 200, body: { revoked } };
    },
  },

  // --- documents ---
  "documents.list": {
    auth: true,
    markerOnGet: true,
    async run(ctx) {
      const loaded = await loadDocumentViews(ctx, pathId(ctx, "caseId"));
      return { status: 200, body: { caseId: pathId(ctx, "caseId"), documents: loaded.documents, documentsAccess: loaded.restricted ? "permission_withdrawn" : "full" } };
    },
  },
  "documents.upload": {
    auth: true,
    async run(ctx) {
      const caseId = pathId(ctx, "caseId");
      // 1. Validate everything cheap first, then the body, BEFORE contacting the backend.
      const headers = validateUploadHeaders(ctx.request);
      const open = ctx.deps.uploadsInFlight.get(ctx.session.adultId) ?? 0;
      if (open >= MAX_CONCURRENT_UPLOADS_PER_ADULT) throw appError(429, "UPLOAD_IN_PROGRESS");
      ctx.deps.uploadsInFlight.set(ctx.session.adultId, open + 1);
      let result;
      try {
        const bytes = await readPdfBody(ctx.request);
        // 2. Forward with the client's Idempotency-Key unchanged (retries reuse it).
        result = await ctx.backend.uploadDocument(ctx.session.token, caseId, { bytes, ...headers });
      } finally {
        const remaining = (ctx.deps.uploadsInFlight.get(ctx.session.adultId) ?? 1) - 1;
        if (remaining <= 0) ctx.deps.uploadsInFlight.delete(ctx.session.adultId);
        else ctx.deps.uploadsInFlight.set(ctx.session.adultId, remaining);
      }
      const view = composeDocumentView({ document: result.document, ocrJob: null, ocrConsent: false, justUploaded: !result.idempotentReplay });
      return { status: result.idempotentReplay ? 200 : 201, body: { document: view, idempotentReplay: result.idempotentReplay } };
    },
  },
  "documents.get": {
    auth: true,
    markerOnGet: true,
    async run(ctx) {
      const documentId = pathId(ctx, "documentId");
      let document;
      try {
        document = await ctx.backend.getDocument(ctx.session.token, documentId);
      } catch (error) {
        if (!(error instanceof AppError && error.code === "FIELD_ACCESS_REQUIRED") || !ctx.state.caseId) throw error;
        // Permission withdrawn: answer from the deletion inventory, or say the document is gone.
        const inventory = await ctx.backend.getDeletionInventory(ctx.session.token, ctx.state.caseId);
        const held = inventory.documents.find((candidate) => candidate.id === documentId);
        if (!held) throw appError(404, "DOCUMENT_NOT_FOUND");
        return { status: 200, body: { document: composeDocumentView({ document: held, ocrJob: null, ocrConsent: false }) } };
      }
      const grant = findConsent(ctx.state, "ocr_sarvam", documentId);
      const jobId = jobIdFor(ctx.state, documentId);
      let ocrJob = null;
      let ocrConsent = Boolean(grant);
      if (grant && jobId && document.status === "accepted") {
        try {
          ocrJob = await ctx.backend.refreshOcr(ctx.session.token, jobId, { consentGrantId: grant.id });
        } catch (error) {
          // Only "the job or the permission is gone" changes what we report. Anything else is a real failure to surface.
          if (error instanceof AppError && CONSENT_LOST_CODES.has(error.code)) ocrConsent = false;
          else if (!(error instanceof AppError && error.code === "OCR_JOB_NOT_FOUND")) throw error;
        }
      }
      return { status: 200, body: { document: composeDocumentView({ document, ocrJob, ocrConsent }) } };
    },
  },
  "documents.delete": {
    auth: true,
    async run(ctx) {
      const documentId = pathId(ctx, "documentId");
      const document = await ctx.backend.deleteDocument(ctx.session.token, documentId);
      // Derived OCR state for this document is gone with it.
      if (jobIdFor(ctx.state, documentId)) {
        delete ctx.state.ocrJobs[documentId];
        ctx.markState();
      }
      return { status: document.status === "deleted" ? 200 : 202, body: { document: composeDocumentView({ document, ocrJob: null, ocrConsent: false }) } };
    },
  },
  "documents.deletionInventory": {
    auth: true,
    async run(ctx) {
      const inventory = await ctx.backend.getDeletionInventory(ctx.session.token, pathId(ctx, "caseId"));
      return {
        status: 200,
        body: { caseId: inventory.caseId, documents: inventory.documents.map((document) => composeDocumentView({ document, ocrJob: null, ocrConsent: false })) },
      };
    },
  },

  // --- OCR ---
  "ocr.start": {
    auth: true,
    async run(ctx) {
      const documentId = pathId(ctx, "documentId");
      const grant = findConsent(ctx.state, "ocr_sarvam", documentId);
      if (!grant) throw appError(403, "CONSENT_REQUIRED");
      // Room to remember the job is checked BEFORE the backend starts it, so a started job is never forgotten.
      if (!jobIdFor(ctx.state, documentId)) {
        if (Object.keys(ctx.state.ocrJobs).length >= MAX_STATE_ITEMS) throw appError(409, "STATE_LIMIT_REACHED");
        // The sealed cookie has a byte cap too: prove a worst-case job entry fits before the backend starts the job.
        const probe: AppState = { ...ctx.state, ocrJobs: { ...ctx.state.ocrJobs, [documentId]: "x".repeat(96) } };
        stateCookie(probe, ctx.session, ctx.config.sessionSecret, ctx.config.production, ctx.nowMs);
      }
      const job = await ctx.backend.startOcr(ctx.session.token, documentId, { consentGrantId: grant.id });
      if (jobIdFor(ctx.state, documentId) !== job.id) {
        ctx.state.ocrJobs[documentId] = job.id;
        ctx.markState();
      }
      const document = await ctx.backend.getDocument(ctx.session.token, documentId);
      return { status: 202, body: { document: composeDocumentView({ document, ocrJob: job, ocrConsent: true }) } };
    },
  },
  "ocr.refresh": {
    auth: true,
    async run(ctx) {
      const documentId = pathId(ctx, "documentId");
      const grant = findConsent(ctx.state, "ocr_sarvam", documentId);
      const jobId = jobIdFor(ctx.state, documentId);
      if (!grant) throw appError(403, "CONSENT_REQUIRED");
      if (!jobId) throw appError(409, "OCR_JOB_NOT_STARTED");
      const job = await ctx.backend.refreshOcr(ctx.session.token, jobId, { consentGrantId: grant.id });
      const document = await ctx.backend.getDocument(ctx.session.token, documentId);
      return { status: 200, body: { document: composeDocumentView({ document, ocrJob: job, ocrConsent: true }) } };
    },
  },

  // --- questions, catalogue, preview (pass-through bodies) ---
  "questions.ask": {
    auth: true,
    async run(ctx) {
      const caseId = pathId(ctx, "caseId");
      const key = idempotencyKey(ctx.request);
      const body = await readJson(ctx.request, askQuestionRequestSchema);
      const grant = body.documentIds
        ? ctx.state.consents.find((c) => c.scope === "question_gemini" && body.documentIds!.every((d) => c.docs.includes(d)))
        : [...ctx.state.consents].reverse().find((c) => c.scope === "question_gemini");
      if (!grant) throw appError(403, "CONSENT_REQUIRED");
      const documentIds = body.documentIds ?? grant.docs;
      const answer = await ctx.backend.askQuestion(ctx.session.token, caseId, { question: body.question, consentGrantId: grant.id, documentIds }, key);
      return { status: 200, body: answer };
    },
  },
  "answers.get": {
    auth: true,
    async run(ctx) {
      return { status: 200, body: await ctx.backend.getAnswer(ctx.session.token, pathId(ctx, "caseId"), pathId(ctx, "answerId")) };
    },
  },
  "catalogue.handoff": {
    auth: true,
    async run(ctx) {
      const url = new URL(ctx.request.url);
      const query = z
        .object({ answerId: z.string().max(128).nullable(), asOf: z.string().max(40).nullable(), memberId: z.string().max(128).nullable() })
        .safeParse({ answerId: url.searchParams.get("answerId"), asOf: url.searchParams.get("asOf"), memberId: url.searchParams.get("memberId") });
      if (!query.success) throw appError(400, "INVALID_REQUEST");
      return { status: 200, body: await ctx.backend.getCatalogueHandoff(ctx.session.token, pathId(ctx, "caseId"), query.data) };
    },
  },
  "catalogue.review": {
    auth: true,
    async run(ctx) {
      const key = idempotencyKey(ctx.request);
      const body = await readJson(ctx.request, catalogueReviewRequestSchema);
      return { status: 200, body: await ctx.backend.reviewCatalogue(ctx.session.token, pathId(ctx, "caseId"), body, key) };
    },
  },
  "catalogue.confirmer": {
    auth: true,
    async run(ctx) {
      const body = await readJson(ctx.request, designateConfirmerRequestSchema);
      return { status: 201, body: await ctx.backend.designateConfirmer(ctx.session.token, ctx.session.householdId, body.adultUserId) };
    },
  },
  "preview.create": {
    auth: true,
    async run(ctx) {
      const body = await readJson(ctx.request, coveragePreviewRequestSchema);
      return { status: 200, body: await ctx.backend.coveragePreview(ctx.session.token, ctx.session.householdId, body) };
    },
  },
  "sourcePack.get": {
    auth: true,
    async run(ctx) {
      return { status: 200, body: await ctx.backend.getSourcePack(ctx.session.token, pathId(ctx, "caseId")) };
    },
  },
} satisfies Record<string, Route>;

export type RouteName = keyof typeof ROUTES;

// ---------- pipeline ----------

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function jsonResponse(status: number, body: unknown, cookies: string[] = []): Response {
  const headers = new Headers(JSON_HEADERS);
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(error: AppError, cookies: string[] = []): Response {
  return jsonResponse(error.status, errorBody(error), cookies);
}

const MAX_CONCURRENT_UPLOADS_PER_ADULT = 2;

export function createApp(deps: AppDeps) {
  // Uploads are buffered in memory (up to 15 MiB each), so one signed-in adult may only hold a few open at once.
  const uploadsInFlight = new Map<string, number>();
  async function handle(name: RouteName, request: Request, params: Record<string, string> = {}): Promise<Response> {
    let config: AppConfig;
    try {
      config = loadAppConfig(deps.env());
    } catch (error) {
      if (error instanceof AppConfigError) {
        // Field names only, never values.
        console.error("app-bff: misconfigured", error.fields);
        return errorResponse(appError(500, "APP_MISCONFIGURED", { retryable: false }));
      }
      throw error;
    }
    if (!config.enabled) return errorResponse(appError(404, "APP_DISABLED", { retryable: false }));

    const production = config.production;
    const names = cookieNames(production);
    const nowMs = deps.now();
    const route: Route = ROUTES[name];
    let loaded: { session: SessionData; state: AppState } | null = null;
    let dirty = false;
    const clearAll = () => [clearCookie(names.session, production), clearCookie(names.state, production)];

    try {
      assertCsrf(request, config.allowedOrigins, { markerOnGet: route.markerOnGet });
      if (route.auth) loaded = loadSession(request.headers.get("cookie"), { secret: config.sessionSecret, production, nowMs });

      const backend = createBackendClient({ baseUrl: config.apiUrl, bootstrapToken: config.bootstrapToken, fetch: deps.fetch });
      const ctx: Ctx = {
        request,
        params,
        config,
        deps: { ...deps, uploadsInFlight },
        backend,
        nowMs,
        session: loaded?.session as SessionData,
        state: loaded?.state as AppState,
        markState: () => {
          dirty = true;
        },
        issued: null,
      };
      const result = await route.run(ctx);

      const cookies: string[] = [];
      if (ctx.issued) {
        cookies.push(sessionCookie(ctx.issued, config.sessionSecret, production, nowMs));
        cookies.push(stateCookie(emptyState(ctx.issued.householdId), ctx.issued, config.sessionSecret, production, nowMs));
      } else if (dirty && loaded) {
        cookies.push(stateCookie(ctx.state, loaded.session, config.sessionSecret, production, nowMs));
      }
      return jsonResponse(result.status, result.body, cookies);
    } catch (error) {
      if (error instanceof AppError && error.clearSession) return errorResponse(error, clearAll());
      // Keep what was already created on the backend (a case, a started OCR job) recorded, so it is never orphaned.
      // This holds for an unexpected failure too: a later step may throw after a backend side effect.
      let kept: string[] = [];
      try {
        if (dirty && loaded) kept = [stateCookie(loaded.state, loaded.session, config.sessionSecret, production, nowMs)];
      } catch {
        kept = [];
      }
      if (error instanceof AppError) return errorResponse(error, kept);
      // Unknown failure: log the error name only. Never the message, which could carry a body fragment.
      console.error("app-bff: unexpected failure", error instanceof Error ? error.name : "unknown");
      return errorResponse(appError(500, "INTERNAL", { retryable: false }), kept);
    }
  }

  /** GET /api/app/session: never an error for "not signed in". */
  async function sessionGet(request: Request): Promise<Response> {
    const config = safeConfig(deps);
    if (config instanceof Response) return config;
    const production = config.production;
    try {
      const { session } = loadSession(request.headers.get("cookie"), { secret: config.sessionSecret, production, nowMs: deps.now() });
      return jsonResponse(200, sessionView(session));
    } catch (error) {
      const cookies = error instanceof AppError && error.clearSession ? [clearCookie(cookieNames(production).session, production), clearCookie(cookieNames(production).state, production)] : [];
      if (error instanceof AppError) {
        // Surface an expiry distinctly so the UI can say so.
        return jsonResponse(200, { ...sessionView(null), reason: error.code === "SESSION_EXPIRED" ? "expired" : "none" }, cookies);
      }
      throw error;
    }
  }

  /** DELETE /api/app/session: revoke on the backend, then clear the cookies in every case. */
  async function sessionDelete(request: Request): Promise<Response> {
    const config = safeConfig(deps);
    if (config instanceof Response) return config;
    const production = config.production;
    const names = cookieNames(production);
    try {
      assertCsrf(request, config.allowedOrigins);
    } catch (error) {
      if (error instanceof AppError) return errorResponse(error);
      throw error;
    }
    let backendRevoked = false;
    // Expired cookies are still opened for the revoke attempt: the token may still be live on the backend.
    const token = looseSessionToken(request.headers.get("cookie"), config);
    if (token) {
      const backend = createBackendClient({ baseUrl: config.apiUrl, bootstrapToken: config.bootstrapToken, fetch: deps.fetch });
      // One retry: a copied cookie stays usable until the backend revokes, so a transient failure should not decide it.
      for (let attempt = 0; attempt < 2 && !backendRevoked; attempt += 1) {
        try {
          await backend.revokeSession(token);
          backendRevoked = true;
        } catch {
          backendRevoked = false;
        }
      }
    }
    return jsonResponse(200, { signedOut: true, backendRevoked }, [clearCookie(names.session, production), clearCookie(names.state, production)]);
  }

  type DispatchName = RouteName | "session.get" | "session.delete";
  async function dispatch(name: DispatchName, request: Request, params: Record<string, string> = {}): Promise<Response> {
    if (name === "session.get") return sessionGet(request);
    if (name === "session.delete") return sessionDelete(request);
    return handle(name, request, params);
  }

  /** Any method/path without an implementation: APP_DISABLED when off, otherwise a JSON 404/405. */
  async function fallback(kind: "not_found" | "method_not_allowed"): Promise<Response> {
    const config = safeConfig(deps);
    if (config instanceof Response) return config;
    return kind === "not_found" ? errorResponse(appError(404, "NOT_FOUND", { retryable: false })) : errorResponse(appError(405, "METHOD_NOT_ALLOWED", { retryable: false }));
  }

  return { handle, dispatch, fallback };
}

function safeConfig(deps: AppDeps): EnabledConfig | Response {
  try {
    const config = loadAppConfig(deps.env());
    if (!config.enabled) return errorResponse(appError(404, "APP_DISABLED", { retryable: false }));
    return config;
  } catch (error) {
    if (error instanceof AppConfigError) return errorResponse(appError(500, "APP_MISCONFIGURED", { retryable: false }));
    throw error;
  }
}

export type App = ReturnType<typeof createApp>;
