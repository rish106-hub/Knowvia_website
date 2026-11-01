// BFF request pipeline and route implementations. Framework-agnostic: takes a Web Request, returns a Web Response,
// so it is testable without Next. The Next route files in src/app/api/app/** are thin wrappers (see runtime.ts).
// PROVISIONAL: identity (D1) and topology (D2) are OPEN. Verified against a FAKE backend only.
import { z } from "zod";
import { createBackendClient, type BackendClient, type BackendConsentRecord, type BackendOcrJob, type FetchLike } from "./backend-client";
import { findConnector, listConnectors } from "./connectors";
import { buildConsentGrant, CONSENT_NOTICES, GEMINI_RECIPIENT, MAX_READING_DOCUMENTS, SARVAM_RECIPIENT } from "./consent-scopes";
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
  type PermissionKind,
  type PermissionView,
  type SessionView,
} from "./contract";
import { assertCsrf } from "./csrf";
import { buildDemoDashboard, isDemoScenario } from "./demo-data";
import { buildDashboardView, toPassagesView, toReadFactsView, type ReadFactsInput } from "./dashboard-view";
import { composeDocumentView } from "./document-view";
import { AppConfigError, loadAppConfig, type AppConfig, type EnvSource } from "./env";
import { AppError, appError, errorBody } from "./errors";
import { resolveIdentityProvider, signInWithVerifiedGoogleIdentity } from "./identity";
import { createGoogleOidc, OidcError, safeEqual, type GoogleOidc } from "./oidc-google";
import { randomBytes } from "node:crypto";
import { clientKey, createRateLimiter, type RateLimiter } from "./rate-limit";
import {
  clearCookie,
  cookieNames,
  loadSession,
  MAX_STATE_ITEMS,
  parseCookieHeader,
  sessionCookie,
  stateCookie,
  emptyState,
  loadOidcFlow,
  oidcCookie,
  parseOidcMode,
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
  /** Used only for calls to Google (discovery, keys, token exchange). Defaults to the global fetch. Tests inject a fake. */
  oidcFetch?: FetchLike;
  now: () => number;
  rateLimiter: RateLimiter;
};

type InternalDeps = AppDeps & { uploadsInFlight: Map<string, number>; oidc: GoogleOidc; passagesLimiter: RateLimiter };

type EnabledConfig = Extract<AppConfig, { enabled: true }>;
/** `redirect` makes the pipeline answer 302 with no body. It must be an /app path or the discovered Google authorization URL. */
type Result = { status: number; body?: unknown; redirect?: string };

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
  /** Set with `issued` when a returning person's state could be rebuilt. The pipeline uses it instead of an empty state. */
  issuedState: AppState | null;
  /** Cookies a route sets itself (the sign-in flow cookie). Serialised with serializeCookie or clearCookie only. */
  cookies: string[];
  /** The one external URL (without its query) a redirect may point to: Google's discovered authorization endpoint. */
  trustedRedirect: string | null;
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

/** The documents a consent request names, as the BFF records them: deduplicated and sorted. Empty for the storage permission. */
function consentDocuments(body: { scope: ConsentScopeName; documentId?: string; documentIds?: string[] }): string[] {
  if (body.scope === "ocr_sarvam") return [...new Set(body.documentIds ?? (body.documentId ? [body.documentId] : []))].sort();
  if (body.scope === "question_gemini") return [...new Set(body.documentIds ?? [])].sort();
  return [];
}

/** The newest held permission of this scope that names the document (or any, when no document is given). */
const findConsent = (state: AppState, scope: ConsentScopeName, documentId?: string): StateConsent | undefined =>
  [...state.consents].reverse().find((c) => c.scope === scope && (documentId === undefined || c.docs.includes(documentId)));

function toConsentView(consent: StateConsent): ConsentView {
  return { scope: consent.scope, grantId: consent.id, documentIds: consent.docs, grantedAt: consent.at, noticeStatus: "draft_needs_legal_review" };
}

/**
 * The documents a reading permission names must be documents of this session's case. Unknown ids are refused (400)
 * before the backend creates anything. The backend separately refuses a document of another household.
 */
async function assertDocumentsInCase(ctx: Ctx, docs: string[]): Promise<void> {
  const caseId = ctx.state.caseId;
  const known = caseId ? new Set((await ctx.backend.listDocuments(ctx.session.token, caseId)).documents.map((document) => document.id)) : new Set<string>();
  if (docs.some((documentId) => !known.has(documentId))) throw appError(400, "INVALID_REQUEST", { fields: ["documentIds"] });
}

/**
 * documentScan.mode from the backend integrations report, or null when it cannot be read. This only decides which words
 * the UI shows for a document that is still waiting for checks, so a failure to read it must not break the screen.
 */
async function readScanMode(ctx: Ctx): Promise<string | null> {
  try {
    const parsed = z.object({ documentScan: z.object({ mode: z.string() }).loose() }).loose().safeParse(await ctx.backend.getIntegrations(ctx.session.token));
    return parsed.success ? parsed.data.documentScan.mode : null;
  } catch (error) {
    if (error instanceof AppError) {
      if (error.clearSession) throw error;
      return null;
    }
    throw error;
  }
}

const needsScanMode = (documents: Array<{ status: string }>) => documents.some((document) => document.status === "received_pending_checks");

const CONSENT_LOST_CODES = new Set(["CONSENT_REQUIRED", "CONSENT_SCOPE_REQUIRED", "OCR_AUTHORIZATION_REQUIRED", "DOCUMENT_NOT_OCR_READY"]);
/**
 * The backend no longer honours this permission (withdrawn, expired or never valid). The BFF forgets it so a stale grant is
 * never reused, never offered as "already given" and never picked to start reading. DOCUMENT_NOT_OCR_READY is left out: it
 * can mean one document is not ready, which must not drop the permission for the others in the batch.
 */
const GRANT_GONE_CODES = new Set(["CONSENT_REQUIRED", "CONSENT_SCOPE_REQUIRED", "OCR_AUTHORIZATION_REQUIRED"]);

/** Lists the case documents and composes UI stages, refreshing each known OCR job (idempotent, read-like). */
async function loadDocumentViews(ctx: Ctx, caseId: string): Promise<{ documents: DocumentView[]; restricted: boolean; scanMode: string | null }> {
  const { backend, session, state } = ctx;
  let list;
  try {
    list = await backend.listDocuments(session.token, caseId);
  } catch (error) {
    // Withdrawing the storage permission removes read access to the case (FIELD_ACCESS_REQUIRED) but the person must still
    // see and delete what is held, so fall back to the consent-independent deletion inventory.
    if (!(error instanceof AppError && error.code === "FIELD_ACCESS_REQUIRED")) throw error;
    const inventory = await backend.getDeletionInventory(session.token, caseId);
    return { documents: inventory.documents.map((document) => composeDocumentView({ document, ocrJob: null, ocrConsent: false })), restricted: true, scanMode: null };
  }
  const scanMode = needsScanMode(list.documents) ? await readScanMode(ctx) : null;
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
          if (error instanceof AppError && CONSENT_LOST_CODES.has(error.code)) {
            ocrConsent = false;
            if (GRANT_GONE_CODES.has(error.code)) forgetConsent(ctx, grant.id);
          } else if (!(error instanceof AppError && error.code === "OCR_JOB_NOT_FOUND")) throw error;
        }
      }
      return composeDocumentView({ document, ocrJob, ocrConsent, scanMode });
    }),
  );
  return { documents, restricted: false, scanMode };
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

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function permissionKind(record: BackendConsentRecord): PermissionKind {
  const hasRecipient = (recipient: string) => record.grantedToActor === recipient || record.scopes.some((scope) => scope.recipient === recipient);
  if (hasRecipient(SARVAM_RECIPIENT)) return "read_document";
  if (hasRecipient(GEMINI_RECIPIENT)) return "answer_questions";
  if (record.scopes.some((scope) => scope.resourceType === "document" && scope.action === "collect")) return "store_documents";
  return "other";
}

/** DRAFT wording, needs legal review. */
function permissionLabel(kind: PermissionKind, documentCount: number): string {
  const documents = `${documentCount} ${documentCount === 1 ? "document" : "documents"}`;
  if (kind === "store_documents") return "Keep the PDFs you add";
  if (kind === "read_document") return documentCount > 0 ? `Read ${documents} with the reading service (OCR)` : "Read a document with the reading service (OCR)";
  if (kind === "answer_questions") return documentCount > 0 ? `Use ${documents} to answer your questions` : "Use documents to answer your questions";
  return "A permission you gave earlier";
}

/** Turns a backend consent into a labelled view. The raw scopes, recipients and household id stay in the BFF. */
function toPermissionView(record: BackendConsentRecord): PermissionView {
  const kind = permissionKind(record);
  const documentIds = [
    ...new Set(
      record.scopes
        .filter((scope) => scope.resourceType === "document" && typeof scope.resourceId === "string" && SAFE_ID.test(scope.resourceId))
        .map((scope) => scope.resourceId as string),
    ),
  ];
  return {
    id: record.id,
    kind,
    label: permissionLabel(kind, documentIds.length),
    grantedAt: record.grantedAt,
    expiresAt: record.expiresAt ?? null,
    status: record.status,
    documentIds,
    noticeStatus: "draft_needs_legal_review",
  };
}

/** After a revoke (or a backend "already gone"): forget the grant here and the OCR jobs that depended on it. */
function forgetConsent(ctx: Ctx, consentId: string) {
  const known = ctx.state.consents.find((c) => c.id === consentId);
  dropConsent(ctx, consentId);
  // The backend erases derived data when consent is revoked (backend invariant, not verified here).
  if (known?.scope === "ocr_sarvam") for (const doc of known.docs) delete ctx.state.ocrJobs[doc];
  // Taking back the store-documents permission (the last one) marks every document uploaded under it for deletion on the
  // backend, so nothing document-scoped is worth keeping here: no OCR job, no reading or question grant.
  if (known?.scope === "collect" && !ctx.state.consents.some((c) => c.scope === "collect")) {
    ctx.state.ocrJobs = {};
    ctx.state.consents = ctx.state.consents.filter((c) => c.scope === "collect");
  }
}

/** A signed-in adult whose state cookie lost the case: take the newest case that is still open from the backend. */
async function adoptOpenCase(ctx: Ctx): Promise<void> {
  let cases;
  try {
    ({ cases } = await ctx.backend.listCases(ctx.session.token, ctx.session.householdId));
  } catch (error) {
    // Recovery is a convenience: if the list cannot be read, carry on with no case rather than failing the whole overview.
    if (error instanceof AppError && !error.clearSession) return;
    throw error;
  }
  const caseId = newestOpenCaseId(cases);
  if (!caseId) return;
  ctx.state.caseId = caseId;
  ctx.markState();
}

/** The newest case that is not closed or revoked, or null. */
function newestOpenCaseId(cases: Array<{ id: string; status: string; createdAt?: string | null }>): string | null {
  const open = cases
    .filter((candidate) => candidate.status !== "closed" && candidate.status !== "revoked" && SAFE_ID.test(candidate.id))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return open[0]?.id ?? null;
}

/**
 * Starts (or fetches, the backend's createOrGetJob) the reading job for one document under the held reading permission, and
 * remembers the job. Used by the ocr.start route and by the returning-person rebuild after sign-in.
 */
async function startOcrFor(ctx: Ctx, documentId: string): Promise<BackendOcrJob> {
  const grant = findConsent(ctx.state, "ocr_sarvam", documentId);
  if (!grant) throw appError(403, "CONSENT_REQUIRED");
  // Room to remember the job is checked BEFORE the backend starts it, so a started job is never forgotten.
  if (!jobIdFor(ctx.state, documentId)) {
    if (Object.keys(ctx.state.ocrJobs).length >= MAX_STATE_ITEMS) throw appError(409, "STATE_LIMIT_REACHED");
    // The sealed cookie has a byte cap too: prove a worst-case job entry fits before the backend starts the job.
    const probe: AppState = { ...ctx.state, ocrJobs: { ...ctx.state.ocrJobs, [documentId]: "x".repeat(96) } };
    stateCookie(probe, ctx.session, ctx.config.sessionSecret, ctx.config.production, ctx.nowMs);
  }
  let job;
  try {
    job = await ctx.backend.startOcr(ctx.session.token, documentId, { consentGrantId: grant.id });
  } catch (error) {
    if (error instanceof AppError && GRANT_GONE_CODES.has(error.code)) forgetConsent(ctx, grant.id);
    throw error;
  }
  if (jobIdFor(ctx.state, documentId) !== job.id) {
    ctx.state.ocrJobs[documentId] = job.id;
    ctx.markState();
  }
  return job;
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

/** The overview the screens start from, plus the scan mode read while composing it. Shared by overview.get and dashboard.get. */
async function loadOverview(ctx: Ctx): Promise<{ overview: Overview; scanMode: string | null }> {
  const { session, state } = ctx;
  const parsedMatrix = householdMatrix.safeParse(await ctx.backend.getHousehold(session.token, session.householdId));
  if (!parsedMatrix.success) throw appError(502, "BACKEND_BAD_RESPONSE", { retryable: false });
  const matrix = parsedMatrix.data;
  if (!state.caseId) await adoptOpenCase(ctx);
  const loaded = state.caseId ? await loadDocumentViews(ctx, state.caseId) : { documents: [], restricted: false, scanMode: null };
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
    documents: loaded.documents,
    documentsAccess: loaded.restricted ? "permission_withdrawn" : "full",
    consents: state.consents.map(toConsentView),
  };
  return { overview, scanMode: loaded.scanMode };
}

/**
 * The person's active permissions for the dashboard. Like the read-back this is a convenience: only an ended session fails the
 * screen. Any other failure gives `unavailable`, which the dashboard shows as "could not check" and never as "not held".
 */
async function loadPermissions(ctx: Ctx): Promise<{ status: "ok" | "unavailable"; consents: PermissionView[]; truncated: boolean }> {
  try {
    const { consents, truncated } = await ctx.backend.listConsents(ctx.session.token, ctx.session.householdId);
    return { status: "ok", consents: consents.filter((record) => record.status === "active").map(toPermissionView), truncated };
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    if (error.clearSession) throw error;
    return { status: "unavailable", consents: [], truncated: false };
  }
}

/**
 * Read-back routes name a case in the path. If this session already knows its case, any other id is refused here (404, no backend
 * call). A session that has lost its case (cookie) forwards the id, and the backend's household ownership check decides.
 */
function assertOwnCase(ctx: Ctx, caseId: string): void {
  if (ctx.state.caseId && ctx.state.caseId !== caseId) throw appError(404, "CASE_NOT_FOUND");
}

/**
 * What the dashboard knows about the values read from the person's documents. The read-back is a convenience on the
 * dashboard, so any failure except an ended session degrades to "not read yet" instead of failing the whole screen.
 * `off` is the backend switch (503 READBACK_DISABLED); everything else that goes wrong is `unavailable`.
 */
async function loadReadFacts(ctx: Ctx, overview: Overview): Promise<ReadFactsInput> {
  const caseId = overview.cases[0]?.id;
  if (!caseId || overview.documents.length === 0) return { status: "none" };
  if (overview.documentsAccess === "permission_withdrawn") return { status: "unavailable" };
  try {
    return { status: "ok", data: toReadFactsView(await ctx.backend.getReadFacts(ctx.session.token, caseId)) };
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    if (error.clearSession) throw error;
    return { status: error.code === "READBACK_DISABLED" ? "off" : "unavailable" };
  }
}

const sessionView = (session: SessionData | null): SessionView =>
  session
    ? { authenticated: true, expiresAt: session.expiresAt, householdId: session.householdId, adultId: session.adultId, memberId: session.memberId, identity: { provider: session.provider ?? "dev", provisional: true } }
    : { authenticated: false, expiresAt: null, householdId: null, adultId: null, memberId: null, identity: null };

// ---------- Google sign-in (V1b) ----------

const SIGN_IN_FAILED = "/app/sign-in?reason=failed";
/** A failed sign-in says nothing about why: not to the person, not in the URL. */
const signInFailed = (): Result => ({ status: 302, redirect: SIGN_IN_FAILED });
const randomToken = () => randomBytes(32).toString("base64url");
/** Longest authorization code accepted before any outbound call. Google's are far shorter. */
const MAX_AUTH_CODE_CHARS = 2048;
/** At most this many accepted documents are checked for a reading job after sign-in, so sign-in stays quick. */
const MAX_OCR_RESUME_DOCUMENTS = 10;

/** Class name or fixed reason code only. Never a message, which could carry a response fragment, and never a token. */
function logSignInFailure(error: unknown) {
  const label = error instanceof OidcError ? `oidc:${error.reason}` : error instanceof AppError ? `app:${error.code}` : error instanceof Error ? error.name : "unknown";
  console.error("app-bff: google sign-in failed", label);
}

/**
 * Turns the person's active backend permissions into the BFF's own record of them. A permission that cannot be described
 * (no known recipient) is left out; the permissions screen still lists it from the backend.
 */
function consentsToState(records: BackendConsentRecord[]): StateConsent[] {
  const consents: StateConsent[] = [];
  // The backend lists newest first; the BFF looks for the newest grant at the end of its list.
  for (const record of [...records].reverse()) {
    if (record.status !== "active" || !SAFE_ID.test(record.id)) continue;
    const kind = permissionKind(record);
    const scope: ConsentScopeName | null = kind === "store_documents" ? "collect" : kind === "read_document" ? "ocr_sarvam" : kind === "answer_questions" ? "question_gemini" : null;
    if (!scope) continue;
    const docs = scope === "collect" ? [] : toPermissionView(record).documentIds.slice(0, MAX_READING_DOCUMENTS).sort();
    consents.push({ id: record.id, scope, docs, at: record.grantedAt.slice(0, 40) });
  }
  return consents.slice(-MAX_STATE_ITEMS);
}

/** The largest version of the state that still fits the sealed cookie. A sign-in never fails because the state is big. */
function fitState(ctx: Ctx, issued: SessionData, state: AppState): AppState {
  const newest = state.consents.slice(-8);
  const attempts: AppState[] = [state, { ...state, ocrJobs: {} }, { ...state, consents: newest, ocrJobs: {} }, { ...emptyState(state.hid), caseId: state.caseId }];
  for (const attempt of attempts) {
    try {
      stateCookie(attempt, issued, ctx.config.sessionSecret, ctx.config.production, ctx.nowMs);
      return attempt;
    } catch {
      continue;
    }
  }
  return emptyState(state.hid);
}

/**
 * Rebuilds what the state cookie would have held for a person who has signed in before, so they are not asked again for
 * permissions they already gave. Every step is best effort: a failure gives a smaller state and never fails sign-in.
 *
 * Starting reading here is deliberate: a held, exact reading grant is standing permission the person gave on an earlier visit,
 * and the backend bounds it (createOrGetJob returns an existing job, so a repeat sign-in never pays twice, and it refuses when
 * reading is off). The wording of that permission is DRAFT and needs legal review.
 */
async function rebuildReturningState(ctx: Ctx, issued: SessionData): Promise<AppState> {
  const state = emptyState(issued.householdId);
  try {
    const { consents } = await ctx.backend.listConsents(issued.token, issued.householdId);
    state.consents = consentsToState(consents);
  } catch (error) {
    logSignInFailure(error);
  }
  try {
    const { cases } = await ctx.backend.listCases(issued.token, issued.householdId);
    state.caseId = newestOpenCaseId(cases);
  } catch (error) {
    logSignInFailure(error);
  }
  if (state.caseId && state.consents.some((consent) => consent.scope === "ocr_sarvam")) {
    // The existing start: with a job already there the backend returns it (no provider call); without one it starts one, which
    // is allowed only because this person already pressed Allow, and only if reading is switched on. Each document is on its own.
    const rebuilt: Ctx = { ...ctx, session: issued, state, markState: () => undefined, issued: null, issuedState: null };
    try {
      const { documents } = await ctx.backend.listDocuments(issued.token, state.caseId);
      const candidates = documents.filter((document) => document.status === "accepted" && findConsent(state, "ocr_sarvam", document.id));
      for (const document of candidates.slice(0, MAX_OCR_RESUME_DOCUMENTS)) {
        try {
          await startOcrFor(rebuilt, document.id);
        } catch (error) {
          // For example 503 OCR_PROVIDER_DISABLED: leave this document without a job entry and carry on.
          logSignInFailure(error);
        }
      }
    } catch (error) {
      logSignInFailure(error);
    }
  }
  return fitState(ctx, issued, state);
}

const OIDC_ROUTES = {
  "oidc.google.start": {
    auth: false,
    async run(ctx) {
      const google = ctx.config.google;
      if (!google) throw appError(501, "IDENTITY_NOT_IMPLEMENTED", { retryable: false });
      try {
        ctx.deps.rateLimiter.check(clientKey(ctx.request, ctx.config.trustedProxyHops), ctx.nowMs);
        const flow = { state: randomToken(), nonce: randomToken(), verifier: randomToken(), mode: parseOidcMode(new URL(ctx.request.url).searchParams.get("mode")) };
        const discovery = await ctx.deps.oidc.discover();
        const redirect = ctx.deps.oidc.authorizationUrl(discovery, { clientId: google.clientId, redirectUrl: google.redirectUrl, ...flow });
        ctx.cookies.push(oidcCookie(flow, ctx.config.sessionSecret, ctx.config.production, ctx.nowMs));
        ctx.trustedRedirect = discovery.authorizationEndpoint;
        return { status: 302, redirect };
      } catch (error) {
        logSignInFailure(error);
        return signInFailed();
      }
    },
  },
  "oidc.google.callback": {
    auth: false,
    // CSRF: this GET is exempt from the X-Knowvia-App marker, because the browser arrives here from Google as a top-level
    // navigation and cannot add a custom header. The control is the OIDC state: the value in the query must equal the one in
    // the sealed, httpOnly kv_oidc cookie that THIS browser received from /auth/google/start, so a forged or replayed callback
    // from another browser or another flow is refused. PKCE and the nonce bind the code and the ID token to the same flow.
    async run(ctx) {
      const google = ctx.config.google;
      if (!google) throw appError(501, "IDENTITY_NOT_IMPLEMENTED", { retryable: false });
      // The flow cookie is single-use: cleared on every path, success or not.
      ctx.cookies.push(clearCookie(cookieNames(ctx.config.production).oidc, ctx.config.production));
      let granted: Awaited<ReturnType<typeof signInWithVerifiedGoogleIdentity>>;
      let issued: SessionData;
      try {
        ctx.deps.rateLimiter.check(clientKey(ctx.request, ctx.config.trustedProxyHops), ctx.nowMs);
        const flow = loadOidcFlow(ctx.request.headers.get("cookie"), { secret: ctx.config.sessionSecret, production: ctx.config.production, nowMs: ctx.nowMs });
        if (!flow) return signInFailed();
        const query = new URL(ctx.request.url).searchParams;
        if (query.has("error")) return signInFailed();
        const states = query.getAll("state");
        const codes = query.getAll("code");
        if (states.length !== 1 || codes.length !== 1 || !codes[0] || codes[0].length > MAX_AUTH_CODE_CHARS) return signInFailed();
        if (!safeEqual(states[0], flow.state)) return signInFailed();

        const idToken = await ctx.deps.oidc.exchangeCode({ code: codes[0], verifier: flow.verifier, clientId: google.clientId, clientSecret: google.clientSecret, redirectUrl: google.redirectUrl });
        const identity = await ctx.deps.oidc.verifyIdToken(idToken, { clientId: google.clientId, nonce: flow.nonce });
        granted = await signInWithVerifiedGoogleIdentity({ issuer: identity.issuer, subject: identity.subject, name: identity.name, email: identity.email }, ctx.backend);
        issued = {
          token: granted.session.token,
          expiresAt: granted.session.expiresAt,
          householdId: granted.householdId,
          adultId: granted.adultId,
          memberId: granted.memberId,
          provider: "google",
        };
        // A re-sign-in must not leave the previous backend session alive (the backend caps active sessions globally).
        const previous = looseSessionToken(ctx.request.headers.get("cookie"), ctx.config);
        if (previous) {
          try {
            await ctx.backend.revokeSession(previous);
          } catch (error) {
            // Already gone on the backend is fine. Anything else: do not issue a cookie while a copied old one may still work.
            if (!(error instanceof AppError && error.code === "SESSION_EXPIRED")) {
              await ctx.backend.revokeSession(issued.token).catch(() => undefined);
              throw error;
            }
          }
        }
      } catch (error) {
        logSignInFailure(error);
        return signInFailed();
      }
      ctx.issued = issued;
      // Everything below is a convenience. It can make the state smaller; it can never fail the sign-in.
      if (granted.returning) {
        try {
          ctx.issuedState = await rebuildReturningState(ctx, issued);
        } catch (error) {
          logSignInFailure(error);
          ctx.issuedState = null;
        }
      }
      // The entry mode (E, P or A) only decides which view the dashboard shows first; every mode lands on /app.
      return { status: 302, redirect: "/app" };
    },
  },
} satisfies Record<string, Route>;

// ---------- routes ----------

const ROUTES = {
  // --- session ---
  "session.create": {
    auth: false,
    async run(ctx) {
      // Rate limit before any parsing or backend call.
      ctx.deps.rateLimiter.check(clientKey(ctx.request, ctx.config.trustedProxyHops), ctx.nowMs);
      const body = await readJson(ctx.request, createSessionRequestSchema);
      const provider = resolveIdentityProvider(body.provider, { devIdentity: ctx.config.devIdentity, google: ctx.config.google !== null });
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
        provider: "dev",
      };
      return { status: 201, body: sessionView(ctx.issued) };
    },
  },
  ...OIDC_ROUTES,
  "overview.get": {
    auth: true,
    markerOnGet: true,
    async run(ctx) {
      return { status: 200, body: (await loadOverview(ctx)).overview };
    },
  },
  "dashboard.get": {
    auth: true,
    markerOnGet: true,
    async run(ctx) {
      const { overview, scanMode } = await loadOverview(ctx);
      const [permissions, readFacts] = await Promise.all([loadPermissions(ctx), loadReadFacts(ctx, overview)]);
      return { status: 200, body: buildDashboardView({ overview, consents: permissions.consents, permissionsStatus: permissions.status, permissionsTruncated: permissions.truncated, scanMode, readFacts }) };
    },
  },
  // Synthetic dashboards for looking at every state without real data. No session, no backend. Only while APP_DEMO_DATA is on
  // (env.ts refuses it in production); otherwise it answers exactly like a path that does not exist.
  "demo.get": {
    auth: false,
    async run(ctx) {
      const scenario = ctx.params.scenario;
      if (!ctx.config.demoData || !isDemoScenario(scenario)) throw appError(404, "NOT_FOUND", { retryable: false });
      return { status: 200, body: buildDemoDashboard(scenario) };
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

  // --- connectors (descriptors only; nothing here contacts a provider) ---
  "connectors.list": {
    auth: false,
    async run(ctx) {
      return {
        status: 200,
        body: {
          demo: ctx.config.demoData,
          connectors: listConnectors(ctx.config.demoData),
          signIn: { google: ctx.config.google !== null, dev: ctx.config.devIdentity },
        },
      };
    },
  },
  "connectors.grant": {
    auth: true,
    async run(ctx) {
      const connector = findConnector(pathId(ctx, "connectorId"));
      if (!connector) throw appError(404, "CONNECTOR_NOT_FOUND", { retryable: false });
      // NOT_IMPLEMENTED: no connector grants anything yet. Uploads go through the document route, not through here.
      throw appError(501, "CONNECTOR_NOT_AVAILABLE", { retryable: false });
    },
  },
  "voice.intake": {
    auth: false,
    async run() {
      // NOT_IMPLEMENTED: no audio is accepted, stored or sent anywhere.
      throw appError(501, "VOICE_INTAKE_NOT_IMPLEMENTED", { retryable: false });
    },
  },

  // --- consent ---
  "consents.list": {
    auth: true,
    markerOnGet: true,
    async run(ctx) {
      const { consents, truncated } = await ctx.backend.listConsents(ctx.session.token, ctx.session.householdId);
      // Only what can still be taken back. Newest first, as the backend returns it.
      return { status: 200, body: { permissions: consents.filter((record) => record.status === "active").map(toPermissionView), truncated } };
    },
  },
  "consents.revokeById": {
    auth: true,
    async run(ctx) {
      const consentId = pathId(ctx, "consentId");
      try {
        // The backend checks that this adult is the subject and has write access to the household (404 CONSENT_NOT_FOUND otherwise).
        await ctx.backend.revokeConsent(ctx.session.token, consentId, "user_revoked");
      } catch (error) {
        // Not found on the backend: the record here is stale, so forget it, but still tell the caller it was not found.
        if (error instanceof AppError && error.code === "CONSENT_NOT_FOUND") forgetConsent(ctx, consentId);
        throw error;
      }
      forgetConsent(ctx, consentId);
      return { status: 200, body: { revoked: 1 } };
    },
  },
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
      const docs = consentDocuments(body);
      const existing = state.consents.find((c) => c.scope === body.scope && c.docs.length === docs.length && c.docs.every((d, i) => d === docs[i]));
      if (existing) return { status: 200, body: { consent: toConsentView(existing), reused: true } };

      if (body.scope === "ocr_sarvam") {
        await assertDocumentsInCase(ctx, docs);
        // One document, one reading permission. A second, overlapping one would outlive the withdrawal of the first and
        // let reading start again for a document the person had just taken back.
        if (docs.some((documentId) => findConsent(state, "ocr_sarvam", documentId))) throw appError(409, "CONSENT_ALREADY_HELD", { fields: ["documentIds"] });
      }
      assertRoomForConsent(ctx, docs);
      let caseId: string | null = null;
      if (body.scope === "collect") caseId = (await ensureCase(ctx, "planned_care")).caseId;
      const grant = buildConsentGrant(body.scope, { adultId: session.adultId, householdId: session.householdId, caseId, documentIds: docs });
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
      const docs = consentDocuments(body);
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
          if (error instanceof AppError && CONSENT_LOST_CODES.has(error.code)) {
            ocrConsent = false;
            if (GRANT_GONE_CODES.has(error.code)) forgetConsent(ctx, grant.id);
          } else if (!(error instanceof AppError && error.code === "OCR_JOB_NOT_FOUND")) throw error;
        }
      }
      const scanMode = needsScanMode([document]) ? await readScanMode(ctx) : null;
      return { status: 200, body: { document: composeDocumentView({ document, ocrJob, ocrConsent, scanMode }) } };
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
      const job = await startOcrFor(ctx, documentId);
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

  // --- read-back (run V5): what the person's own read documents say. Pass-through of the known fields only. ---
  // markerOnGet: the passages search derives clauses on first use (an erasable derived store), so both GETs are treated like
  // writes for CSRF. While the backend switch is off these answer 503 READBACK_DISABLED, which the UI shows as "not read yet".
  "readFacts.get": {
    auth: true,
    markerOnGet: true,
    async run(ctx) {
      const caseId = pathId(ctx, "caseId");
      assertOwnCase(ctx, caseId);
      return { status: 200, body: toReadFactsView(await ctx.backend.getReadFacts(ctx.session.token, caseId)) };
    },
  },
  "passages.get": {
    auth: true,
    markerOnGet: true,
    async run(ctx) {
      const caseId = pathId(ctx, "caseId");
      assertOwnCase(ctx, caseId);
      const url = new URL(ctx.request.url);
      // The query is the person's own words: bounded here, forwarded, never logged or echoed back.
      const rawQ = url.searchParams.get("q") ?? "";
      const q = rawQ.trim();
      if (url.searchParams.getAll("q").length !== 1 || q.length < 2 || q.length > 120 || /[\u0000-\u001f\u007f]/.test(rawQ)) throw appError(400, "INVALID_REQUEST", { fields: ["q"] });
      const rawLimit = url.searchParams.get("limit");
      if (url.searchParams.getAll("limit").length > 1 || (rawLimit !== null && !/^[0-9]{1,2}$/.test(rawLimit))) throw appError(400, "INVALID_REQUEST", { fields: ["limit"] });
      const limit = rawLimit === null ? undefined : Number(rawLimit);
      if (limit !== undefined && (limit < 1 || limit > 10)) throw appError(400, "INVALID_REQUEST", { fields: ["limit"] });
      ctx.deps.passagesLimiter.check(`passages:${ctx.session.adultId}`, ctx.nowMs);
      return { status: 200, body: toPassagesView(await ctx.backend.searchPassages(ctx.session.token, caseId, { q, ...(limit === undefined ? {} : { limit }) })) };
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

/** A redirect is either inside the app or the one Google authorization URL the start route just discovered. Nothing else. */
export function redirectAllowed(redirect: string, trustedExternal: string | null): boolean {
  if (/[\\\u0000-\u001f\u007f]/.test(redirect)) return false;
  if (redirect === "/app" || redirect.startsWith("/app/") || redirect.startsWith("/app?")) return true;
  if (!trustedExternal || !redirect.startsWith(`${trustedExternal}?`)) return false;
  try {
    const url = new URL(redirect);
    return url.protocol === "https:" && `${url.origin}${url.pathname}` === trustedExternal;
  } catch {
    return false;
  }
}

class RedirectRefused extends Error {
  constructor() {
    super("redirect refused");
    this.name = "RedirectRefused";
  }
}

function redirectResponse(location: string, cookies: string[]): Response {
  const headers = new Headers({ location, "cache-control": "no-store", "referrer-policy": "no-referrer" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function errorResponse(error: AppError, cookies: string[] = []): Response {
  return jsonResponse(error.status, errorBody(error), cookies);
}

const MAX_CONCURRENT_UPLOADS_PER_ADULT = 2;

export function createApp(deps: AppDeps) {
  // Uploads are buffered in memory (up to 15 MiB each), so one signed-in adult may only hold a few open at once.
  const uploadsInFlight = new Map<string, number>();
  // Discovery and signing keys are cached for the life of this app (one per process).
  // Passages search derives clauses on the backend, so it is limited per signed-in adult. It has its own limiter: sharing the
  // sign-in limiter would let a few searches lock everyone out of signing in.
  const passagesLimiter = createRateLimiter({ limit: 30, windowMs: 60_000, globalLimit: 600 });
  const oidc = createGoogleOidc({ fetch: deps.oidcFetch ?? ((input, init) => globalThis.fetch(input, init)), now: deps.now });
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
    // Kept outside the try so a late failure can still clear the route's cookies and release a session it had issued.
    let routeCtx: Ctx | null = null;
    const clearAll = () => [clearCookie(names.session, production), clearCookie(names.state, production)];

    try {
      assertCsrf(request, config.allowedOrigins, { markerOnGet: route.markerOnGet });
      if (route.auth) loaded = loadSession(request.headers.get("cookie"), { secret: config.sessionSecret, production, nowMs });

      const backend = createBackendClient({ baseUrl: config.apiUrl, bootstrapToken: config.bootstrapToken, identityToken: config.google?.identityToken, fetch: deps.fetch });
      const ctx: Ctx = {
        request,
        params,
        config,
        deps: { ...deps, uploadsInFlight, oidc, passagesLimiter },
        backend,
        nowMs,
        session: loaded?.session as SessionData,
        state: loaded?.state as AppState,
        markState: () => {
          dirty = true;
        },
        issued: null,
        issuedState: null,
        cookies: [],
        trustedRedirect: null,
      };
      routeCtx = ctx;
      const result = await route.run(ctx);

      const cookies: string[] = [];
      if (ctx.issued) {
        cookies.push(sessionCookie(ctx.issued, config.sessionSecret, production, nowMs));
        cookies.push(stateCookie(ctx.issuedState ?? emptyState(ctx.issued.householdId), ctx.issued, config.sessionSecret, production, nowMs));
      } else if (dirty && loaded) {
        cookies.push(stateCookie(ctx.state, loaded.session, config.sessionSecret, production, nowMs));
      }
      cookies.push(...ctx.cookies);
      if (result.redirect !== undefined) {
        // A route can only redirect inside /app or to the Google URL it just discovered. Anything else is a bug: 500, class name logged.
        if (!redirectAllowed(result.redirect, ctx.trustedRedirect)) throw new RedirectRefused();
        return redirectResponse(result.redirect, cookies);
      }
      return jsonResponse(result.status, result.body, cookies);
    } catch (error) {
      // A route may have set cookies (the sign-in flow cookie clear) or issued a backend session before something threw.
      // The cookies still go out, and a session that will never reach the browser is released on the backend, best effort.
      const routeCookies = routeCtx?.cookies ?? [];
      const orphan = routeCtx?.issued?.token;
      if (orphan) {
        try {
          await routeCtx?.backend.revokeSession(orphan);
        } catch {
          // Nothing more can be done here; the session expires on its own.
        }
      }
      if (error instanceof AppError && error.clearSession) return errorResponse(error, [...clearAll(), ...routeCookies]);
      // Keep what was already created on the backend (a case, a started OCR job) recorded, so it is never orphaned.
      // This holds for an unexpected failure too: a later step may throw after a backend side effect.
      let kept: string[] = [];
      try {
        if (dirty && loaded) kept = [stateCookie(loaded.state, loaded.session, config.sessionSecret, production, nowMs)];
      } catch {
        kept = [];
      }
      if (error instanceof AppError) return errorResponse(error, [...kept, ...routeCookies]);
      // Unknown failure: log the error name only. Never the message, which could carry a body fragment.
      console.error("app-bff: unexpected failure", error instanceof Error ? error.name : "unknown");
      return errorResponse(appError(500, "INTERNAL", { retryable: false }), [...kept, ...routeCookies]);
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
