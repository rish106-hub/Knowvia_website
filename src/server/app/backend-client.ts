// Typed client for the CoverSaath /api/v1 backend. Server-only. PROVISIONAL: topology (D2) is OPEN.
// Verified against a FAKE backend (injected fetch) only. Never logs tokens, bodies or filenames.
import { z } from "zod";
import { AppError, isTransientStatus, normalizeBackendFailure } from "./errors";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type BackendClientOptions = {
  baseUrl: string;
  bootstrapToken: string;
  fetch?: FetchLike;
  timeoutMs?: number;
  uploadTimeoutMs?: number;
};

// ---- backend response shapes we depend on (validated; unknown extras are ignored) ----

const backendSession = z.object({
  token: z.string().min(32).max(256),
  sessionId: z.string(),
  adultUserId: z.string(),
  expiresAt: z.string(),
});

const createHouseholdResponse = z.object({
  household: z.object({ id: z.string(), display_name: z.string().optional() }).loose(),
  owner: z.object({ id: z.string(), display_name: z.string().optional() }).loose(),
  ownerMember: z.object({ id: z.string() }).loose(),
  session: backendSession,
});
export type BackendHouseholdSession = {
  householdId: string;
  adultId: string;
  memberId: string;
  session: { token: string; sessionId: string; expiresAt: string };
};

export const BACKEND_DOCUMENT_STATUSES = [
  "received_pending_checks",
  "accepted",
  "rejected",
  "deletion_pending",
  "deleted",
] as const;
export type BackendDocumentStatus = (typeof BACKEND_DOCUMENT_STATUSES)[number];

const backendDocument = z
  .object({
    id: z.string(),
    caseId: z.string().nullable().optional(),
    documentKind: z.string(),
    byteSize: z.number(),
    status: z.enum(BACKEND_DOCUMENT_STATUSES),
    uploadedAt: z.string().nullable().optional(),
  })
  .loose();
export type BackendDocument = z.infer<typeof backendDocument>;

const documentEnvelope = z.object({ document: backendDocument }).loose();
const uploadEnvelope = z.object({ document: backendDocument, idempotentReplay: z.boolean().optional() }).loose();
const documentList = z.object({ caseId: z.string(), documents: z.array(backendDocument) }).loose();

export const OCR_STATUSES = ["queued", "submitted", "processing", "succeeded", "failed", "cancelled"] as const;
const ocrJob = z
  .object({
    id: z.string(),
    documentId: z.string(),
    status: z.enum(OCR_STATUSES),
    errorCode: z.string().nullable().optional(),
    pageCount: z.number().nullable().optional(),
  })
  .loose();
export type BackendOcrJob = z.infer<typeof ocrJob>;
const ocrEnvelope = z.object({ job: ocrJob }).loose();

const caseRecord = z.object({ id: z.string() }).loose();
const grantRecord = z.object({ id: z.string() }).loose();

export type ConsentGrantBody = {
  householdId: string;
  subjectAdultId: string;
  grantedToActor?: string;
  purpose: "document_processing";
  noticeVersion: string;
  evidenceMethod: "typed";
  expiresAt?: string | null;
  scopes: Array<{
    resourceType: string;
    resourceId?: string;
    action: string;
    dataCategory: string;
    recipient?: string;
  }>;
};

export type UploadInput = {
  bytes: Uint8Array;
  idempotencyKey: string;
  documentKind: string;
  consentGrantId: string;
  filename: string; // already percent-encoded by the caller; forwarded unchanged, never logged
};

export type Json = unknown;

export type BackendClient = ReturnType<typeof createBackendClient>;

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

export function createBackendClient(options: BackendClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const doFetch: FetchLike = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const timeoutMs = options.timeoutMs ?? 20_000;
  const uploadTimeoutMs = options.uploadTimeoutMs ?? 60_000;

  type RequestOptions = {
    method: "GET" | "POST" | "DELETE";
    path: string;
    token?: string;
    bootstrap?: boolean;
    json?: unknown;
    headers?: Record<string, string>;
    raw?: { body: Uint8Array; headers: Record<string, string> };
    timeoutMs?: number;
    /** One retry on network failure / timeout / 502-504, with the same headers (and therefore the same Idempotency-Key). */
    retryOnTransient?: boolean;
  };

  async function attempt(req: RequestOptions): Promise<{ status: number; body: unknown }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? timeoutMs);
    const headers: Record<string, string> = { accept: "application/json", ...req.headers };
    if (req.bootstrap) Object.assign(headers, bearer(options.bootstrapToken));
    else if (req.token) Object.assign(headers, bearer(req.token));
    let body: BodyInit | undefined;
    if (req.raw) {
      Object.assign(headers, req.raw.headers);
      body = req.raw.body as unknown as BodyInit;
    } else if (req.json !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(req.json);
    }
    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${req.path}`, { method: req.method, headers, body, signal: controller.signal, cache: "no-store", redirect: "error" });
    } catch (error) {
      clearTimeout(timer);
      const aborted = controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
      throw aborted
        ? new AppError({ status: 504, code: "BACKEND_TIMEOUT", retryable: true })
        : new AppError({ status: 503, code: "BACKEND_UNREACHABLE", retryable: true });
    }
    // The timer keeps running while the body is read, so a slow body cannot hold the request open.
    let parsed: unknown = null;
    try {
      const text = await response.text();
      parsed = text ? JSON.parse(text) : null;
    } catch {
      if (controller.signal.aborted) throw new AppError({ status: 504, code: "BACKEND_TIMEOUT", retryable: true });
      if (response.ok) throw new AppError({ status: 502, code: "BACKEND_BAD_RESPONSE", retryable: false });
    } finally {
      clearTimeout(timer);
    }
    return { status: response.status, body: parsed };
  }

  async function send(req: RequestOptions): Promise<unknown> {
    const authenticated = !req.bootstrap;
    let lastError: AppError | null = null;
    const attempts = req.retryOnTransient ? 2 : 1;
    for (let index = 0; index < attempts; index += 1) {
      try {
        const { status, body } = await attempt(req);
        if (status >= 200 && status < 300) return body;
        const failure = normalizeBackendFailure(status, body, { authenticated });
        if (req.retryOnTransient && failure.retryable && [502, 503, 504].includes(status) && index + 1 < attempts) {
          lastError = failure;
          continue;
        }
        throw failure;
      } catch (error) {
        if (error instanceof AppError && error.retryable && req.retryOnTransient && error.status >= 500 && index + 1 < attempts) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new AppError({ status: 502, code: "BACKEND_BAD_RESPONSE", retryable: false });
  }

  function parse<T>(schema: z.ZodType<T>, value: unknown): T {
    const result = schema.safeParse(value);
    if (!result.success) throw new AppError({ status: 502, code: "BACKEND_BAD_RESPONSE", retryable: false });
    return result.data;
  }

  const enc = encodeURIComponent;

  return {
    // --- session / household ---
    async createHousehold(input: { displayName: string; ownerDisplayName: string; contactEmail: string | null }): Promise<BackendHouseholdSession> {
      const body = parse(
        createHouseholdResponse,
        await send({
          method: "POST",
          path: "/api/v1/households",
          bootstrap: true,
          json: { displayName: input.displayName, owner: { displayName: input.ownerDisplayName, contactEmail: input.contactEmail } },
        }),
      );
      return {
        householdId: body.household.id,
        adultId: body.owner.id,
        memberId: body.ownerMember.id,
        session: { token: body.session.token, sessionId: body.session.sessionId, expiresAt: body.session.expiresAt },
      };
    },
    getHousehold: (token: string, householdId: string): Promise<Json> =>
      send({ method: "GET", path: `/api/v1/households/${enc(householdId)}`, token }),
    revokeSession: async (token: string): Promise<void> => {
      await send({ method: "POST", path: "/api/v1/sessions/current/revoke", token, json: {} });
    },
    getIntegrations: (token: string): Promise<Json> => send({ method: "GET", path: "/api/v1/integrations", token }),

    // --- consent ---
    async grantConsent(token: string, body: ConsentGrantBody): Promise<{ id: string }> {
      return parse(grantRecord, await send({ method: "POST", path: "/api/v1/consents", token, json: body }));
    },
    revokeConsent: async (token: string, grantId: string, reason?: string): Promise<void> => {
      await send({ method: "POST", path: `/api/v1/consents/${enc(grantId)}/revoke`, token, json: { reason: reason ?? null } });
    },

    // --- cases ---
    async createCase(token: string, body: { householdId: string; subjectMemberId: string; triggerType: string }): Promise<{ id: string }> {
      return parse(caseRecord, await send({ method: "POST", path: "/api/v1/cases", token, json: body }));
    },
    getCase: (token: string, caseId: string): Promise<Json> => send({ method: "GET", path: `/api/v1/cases/${enc(caseId)}`, token }),
    getSourcePack: (token: string, caseId: string): Promise<Json> =>
      send({ method: "GET", path: `/api/v1/cases/${enc(caseId)}/source-pack`, token }),

    // --- documents ---
    async listDocuments(token: string, caseId: string) {
      return parse(documentList, await send({ method: "GET", path: `/api/v1/cases/${enc(caseId)}/documents`, token }));
    },
    async getDocument(token: string, documentId: string): Promise<BackendDocument> {
      return parse(backendDocument, await send({ method: "GET", path: `/api/v1/documents/${enc(documentId)}`, token }));
    },
    async uploadDocument(token: string, caseId: string, input: UploadInput) {
      const result = parse(
        uploadEnvelope,
        await send({
          method: "POST",
          path: `/api/v1/cases/${enc(caseId)}/documents`,
          token,
          timeoutMs: uploadTimeoutMs,
          retryOnTransient: true,
          raw: {
            body: input.bytes,
            headers: {
              "content-type": "application/pdf",
              "idempotency-key": input.idempotencyKey,
              "x-document-kind": input.documentKind,
              "x-consent-grant-id": input.consentGrantId,
              "x-filename": input.filename,
            },
          },
        }),
      );
      return { document: result.document, idempotentReplay: result.idempotentReplay === true };
    },
    async deleteDocument(token: string, documentId: string): Promise<BackendDocument> {
      return parse(documentEnvelope, await send({ method: "DELETE", path: `/api/v1/documents/${enc(documentId)}`, token })).document;
    },
    async getDeletionInventory(token: string, caseId: string) {
      return parse(documentList, await send({ method: "GET", path: `/api/v1/cases/${enc(caseId)}/documents/deletion-inventory`, token }));
    },

    // --- OCR and structuring ---
    async startOcr(token: string, documentId: string, body: { consentGrantId: string }): Promise<BackendOcrJob> {
      return parse(
        ocrEnvelope,
        await send({ method: "POST", path: `/api/v1/documents/${enc(documentId)}/ocr-jobs`, token, json: body }),
      ).job;
    },
    async refreshOcr(token: string, jobId: string, body: { consentGrantId: string }): Promise<BackendOcrJob> {
      return parse(ocrEnvelope, await send({ method: "POST", path: `/api/v1/ocr-jobs/${enc(jobId)}/refresh`, token, json: body })).job;
    },
    // Structuring needs an analysis workflowRunId the BFF does not own. Client function only; no BFF route yet.
    startStructuring: (token: string, documentId: string, body: { workflowRunId: string; consentGrantId: string; restart?: boolean }): Promise<Json> =>
      send({ method: "POST", path: `/api/v1/documents/${enc(documentId)}/structuring-runs`, token, json: body }),
    getStructuring: (token: string, documentId: string, workflowRunId: string): Promise<Json> =>
      send({ method: "GET", path: `/api/v1/documents/${enc(documentId)}/structuring-runs?workflowRunId=${enc(workflowRunId)}`, token }),

    // --- questions, catalogue, preview ---
    askQuestion: (
      token: string,
      caseId: string,
      body: { question: string; consentGrantId: string; documentIds?: string[] },
      idempotencyKey: string,
    ): Promise<Json> =>
      send({
        method: "POST",
        path: `/api/v1/cases/${enc(caseId)}/questions`,
        token,
        json: body,
        timeoutMs: uploadTimeoutMs,
        headers: { "idempotency-key": idempotencyKey },
        retryOnTransient: true,
      }),
    getAnswer: (token: string, caseId: string, answerId: string): Promise<Json> =>
      send({ method: "GET", path: `/api/v1/cases/${enc(caseId)}/questions/${enc(answerId)}`, token }),
    getCatalogueHandoff: (token: string, caseId: string, query: { answerId?: string | null; asOf?: string | null; memberId?: string | null }): Promise<Json> => {
      const params = new URLSearchParams({ format: "handoff" });
      for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
      return send({ method: "GET", path: `/api/v1/cases/${enc(caseId)}/decision-catalogue?${params}`, token });
    },
    reviewCatalogue: (token: string, caseId: string, body: Record<string, unknown>, idempotencyKey: string): Promise<Json> =>
      send({ method: "POST", path: `/api/v1/cases/${enc(caseId)}/decision-catalogue/reviews`, token, json: body, headers: { "idempotency-key": idempotencyKey }, retryOnTransient: true }),
    designateConfirmer: (token: string, householdId: string, adultUserId: string): Promise<Json> =>
      send({ method: "POST", path: `/api/v1/households/${enc(householdId)}/catalogue-reviewers`, token, json: { adultUserId } }),
    coveragePreview: (token: string, householdId: string, body: unknown): Promise<Json> =>
      send({ method: "POST", path: `/api/v1/households/${enc(householdId)}/coverage-preview`, token, json: body }),
  };
}

export { isTransientStatus };
