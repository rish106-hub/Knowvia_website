// A stateful fake of the /api/app BFF for the S2 specs. No real backend, no real BFF logic: page.route answers every
// call, so these tests prove the UI against the CONTRACT (src/server/app/contract.ts), not the BFF or CoverSaath.
import type { Page, Route } from "@playwright/test";
import type { ConsentNotice, ConsentView, DocumentStage, DocumentView, NextAction, Overview, SessionView } from "../../../src/lib/app-contract";

export type ErrorSpec = { status: number; code: string; retryable?: boolean; fields?: string[] } | "abort";
export type Call = { method: string; path: string; key: string; headers: Record<string, string>; body: Buffer | null };

export const NOTICES: ConsentNotice[] = [
  { scope: "collect", version: "draft-v0-needs-legal-review", status: "draft_needs_legal_review", title: "Store your PDF", body: "Draft: Knowvia keeps the PDF you add so it can be checked and read for your case.\n\nYou can withdraw this at any time." },
  { scope: "ocr_sarvam", version: "draft-v0-needs-legal-review", status: "draft_needs_legal_review", title: "Read this PDF with an outside service", body: "Draft: this PDF is sent to an outside OCR provider to turn its pages into text." },
  { scope: "question_gemini", version: "draft-v0-needs-legal-review", status: "draft_needs_legal_review", title: "Answer questions from your documents", body: "Draft: selected documents are sent to a language model service to answer your question." },
];

let counter = 0;
export function makeDoc(over: Partial<DocumentView> = {}): DocumentView {
  counter += 1;
  return {
    id: `doc-${counter}`, caseId: "case-1", documentKind: "policy_schedule", byteSize: 1_258_291, uploadedAt: "2026-10-20T10:30:00.000Z",
    stage: "readable", nextAction: "none", label: "x", backendStatus: "accepted", ocr: null, structuring: null, note: null, ...over,
  };
}

const NEXT: Record<DocumentStage, NextAction> = {
  received: "wait", awaiting_checks: "wait", awaiting_ocr_consent: "grant_ocr_consent", processing: "wait", readable: "none",
  unreadable: "retry_ocr", rejected: "none", deleting: "wait", deleted: "none",
};
export function docAt(stage: DocumentStage, over: Partial<DocumentView> = {}): DocumentView {
  const backendStatus = stage === "rejected" ? "rejected" : stage === "deleting" ? "deletion_pending" : stage === "deleted" ? "deleted" : stage === "received" || stage === "awaiting_checks" ? "received_pending_checks" : "accepted";
  const ocr = stage === "processing" ? { status: "processing" as const, errorCode: null, pageCount: null } : stage === "readable" ? { status: "succeeded" as const, errorCode: null, pageCount: 12 } : stage === "unreadable" ? { status: "failed" as const, errorCode: "OCR_FAILED", pageCount: null } : null;
  return makeDoc({ stage, nextAction: NEXT[stage], backendStatus, ocr, note: stage === "awaiting_checks" ? "scan_state_not_visible" : null, ...over });
}

export type Options = {
  signedIn?: boolean;
  sessionReason?: "none" | "expired";
  /** What POST /session answers. */
  signIn?: "ok" | "not_implemented" | "disabled" | "rate_limited";
  caseId?: string | null;
  documents?: DocumentView[];
  consents?: ConsentView[];
  /** Stages a refresh walks through for a processing document before it settles. Default: one more poll, then readable. */
  refreshScript?: Record<string, DocumentStage[]>;
};

export class FakeBff {
  calls: Call[] = [];
  signedIn: boolean;
  expired = false;
  caseId: string | null;
  documents: DocumentView[];
  consents: ConsentView[];
  private signInMode: NonNullable<Options["signIn"]>;
  private sessionReason: "none" | "expired";
  private failures = new Map<string, ErrorSpec[]>();
  private refreshScript: Record<string, DocumentStage[]>;
  private seq = 0;

  constructor(options: Options = {}) {
    this.signedIn = options.signedIn ?? true;
    this.sessionReason = options.sessionReason ?? "none";
    this.signInMode = options.signIn ?? "ok";
    this.caseId = options.caseId === undefined ? (options.documents?.length ? "case-1" : null) : options.caseId;
    this.documents = options.documents ?? [];
    this.consents = options.consents ?? [];
    this.refreshScript = options.refreshScript ?? {};
  }

  /** Make the next `times` calls to `key` (for example "POST /cases/:id/documents") fail. */
  failNext(key: string, spec: ErrorSpec, times = 1) {
    this.failures.set(key, [...(this.failures.get(key) ?? []), ...Array.from({ length: times }, () => spec)]);
  }

  calledKeys() {
    return this.calls.map((call) => call.key);
  }

  callsTo(key: string) {
    return this.calls.filter((call) => call.key === key);
  }

  async install(page: Page) {
    await page.route("**/api/app/**", (route) => this.handle(route));
  }

  private session(): SessionView {
    if (!this.signedIn) return { authenticated: false, expiresAt: null, householdId: null, adultId: null, memberId: null, identity: null, reason: this.sessionReason };
    return { authenticated: true, expiresAt: "2026-10-21T10:00:00.000Z", householdId: "hh-1", adultId: "adult-1", memberId: "member-1", identity: { provider: "dev", provisional: true } };
  }

  private overview(): Overview {
    return {
      session: { expiresAt: "2026-10-21T10:00:00.000Z" },
      household: { id: "hh-1", viewerRole: "owner" },
      owner: { adultId: "adult-1", memberId: "member-1" },
      members: [{ id: "member-1", displayName: "Asha Test", memberKind: "adult", relationshipLabel: null, policiesFound: 0 }],
      cases: this.caseId ? [{ id: this.caseId }] : [],
      documents: this.documents,
      consents: this.consents,
    };
  }

  private find(id: string) {
    return this.documents.find((doc) => doc.id === id);
  }

  private async handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/app/, "");
    const method = request.method();
    const pattern = path.replace(/^\/cases\/[^/]+/, "/cases/:id").replace(/^\/documents\/[^/]+/, "/documents/:id");
    const key = `${method} ${pattern}`;
    this.calls.push({ method, path, key, headers: request.headers(), body: request.postDataBuffer() });

    const queued = this.failures.get(key);
    if (queued?.length) {
      const spec = queued.shift()!;
      if (spec === "abort") return route.abort("failed");
      return this.error(route, spec.status, spec.code, spec.retryable ?? false, spec.fields);
    }

    const needsSession = !(path === "/session" || path === "/consents/notices");
    if (needsSession && this.expired) return this.error(route, 401, "SESSION_EXPIRED", false);
    if (needsSession && !this.signedIn) return this.error(route, 401, "SESSION_REQUIRED", false);

    if (key === "GET /session") return this.json(route, 200, this.session());
    if (key === "POST /session") return this.postSession(route);
    if (key === "DELETE /session") {
      this.signedIn = false;
      return this.json(route, 200, { signedOut: true, backendRevoked: true });
    }
    if (key === "GET /overview") return this.json(route, 200, this.overview());
    if (key === "GET /consents/notices") return this.json(route, 200, { notices: NOTICES });
    if (key === "POST /cases") {
      const created = !this.caseId;
      this.caseId ??= "case-1";
      return this.json(route, created ? 201 : 200, { caseId: this.caseId, created });
    }
    if (key === "POST /consents") return this.grant(route, JSON.parse(request.postData() ?? "{}"));
    if (key === "POST /consents/revoke") return this.revoke(route, JSON.parse(request.postData() ?? "{}"));
    if (key === "POST /cases/:id/documents") return this.upload(route, request.headers());
    if (key === "GET /cases/:id/documents") return this.json(route, 200, { caseId: this.caseId, documents: this.documents });

    const id = path.split("/")[2];
    const doc = this.find(id);
    if (pattern.startsWith("/documents/:id")) {
      if (!doc) return this.error(route, 404, "DOCUMENT_NOT_FOUND", false);
      if (key === "GET /documents/:id") return this.json(route, 200, { document: doc });
      if (key === "DELETE /documents/:id") return this.set(route, doc, docAt("deleting", { id: doc.id, byteSize: doc.byteSize, documentKind: doc.documentKind, uploadedAt: doc.uploadedAt }), 202);
      if (key === "POST /documents/:id/ocr") {
        if (!this.consents.some((c) => c.scope === "ocr_sarvam" && c.documentIds.includes(doc.id))) return this.error(route, 403, "CONSENT_REQUIRED", false);
        return this.set(route, doc, { ...doc, stage: "processing", nextAction: "wait", ocr: { status: "queued", errorCode: null, pageCount: null } }, 202);
      }
      if (key === "POST /documents/:id/ocr/refresh") {
        const script = this.refreshScript[doc.id];
        const next: DocumentStage = script?.length ? script.shift()! : "readable";
        return this.set(route, doc, docAt(next, { id: doc.id, byteSize: doc.byteSize, documentKind: doc.documentKind, uploadedAt: doc.uploadedAt }), 200);
      }
    }
    return this.error(route, 404, "NOT_FOUND", false);
  }

  private set(route: Route, current: DocumentView, next: DocumentView, status: number) {
    this.documents = this.documents.map((doc) => (doc.id === current.id ? next : doc));
    return this.json(route, status, { document: next });
  }

  private postSession(route: Route) {
    if (this.signInMode === "not_implemented") return this.error(route, 501, "IDENTITY_NOT_IMPLEMENTED", false);
    if (this.signInMode === "disabled") return this.error(route, 404, "APP_DISABLED", false);
    if (this.signInMode === "rate_limited") return this.error(route, 429, "RATE_LIMITED", true);
    this.signedIn = true;
    this.expired = false;
    return this.json(route, 201, this.session());
  }

  private grant(route: Route, body: { scope: ConsentView["scope"]; documentId?: string; documentIds?: string[] }) {
    this.seq += 1;
    const documentIds = body.documentId ? [body.documentId] : (body.documentIds ?? []);
    const existing = this.consents.find((c) => c.scope === body.scope && c.documentIds.join() === documentIds.join());
    const consent: ConsentView = existing ?? { scope: body.scope, grantId: `grant-${body.scope}-${this.seq}`, documentIds, grantedAt: "2026-10-20T10:31:00.000Z", noticeStatus: "draft_needs_legal_review" };
    if (!existing) this.consents = [...this.consents, consent];
    if (body.scope === "collect") this.caseId ??= "case-1";
    if (body.scope === "ocr_sarvam" && body.documentId) {
      this.documents = this.documents.map((doc) => (doc.id === body.documentId && doc.stage === "awaiting_ocr_consent" ? { ...doc, nextAction: "start_ocr" } : doc));
    }
    return this.json(route, existing ? 200 : 201, { consent, reused: Boolean(existing) });
  }

  private revoke(route: Route, body: { scope: ConsentView["scope"]; documentId?: string; documentIds?: string[] }) {
    const before = this.consents.length;
    const documentIds = body.documentId ? [body.documentId] : (body.documentIds ?? []);
    this.consents = this.consents.filter((c) => !(c.scope === body.scope && c.documentIds.join() === documentIds.join()));
    if (before === this.consents.length) return this.error(route, 404, "CONSENT_NOT_FOUND", false);
    if (body.scope === "ocr_sarvam") {
      this.documents = this.documents.map((doc) => (doc.id === body.documentId ? docAt("awaiting_ocr_consent", { id: doc.id, byteSize: doc.byteSize, documentKind: doc.documentKind, uploadedAt: doc.uploadedAt }) : doc));
    }
    return this.json(route, 200, { revoked: 1 });
  }

  private upload(route: Route, headers: Record<string, string>) {
    if (!this.consents.some((c) => c.scope === "collect" && c.grantId === headers["x-consent-grant-id"])) return this.error(route, 403, "CONSENT_SCOPE_REQUIRED", false);
    const replay = this.documents.find((doc) => (doc as DocumentView & { _key?: string })._key === headers["idempotency-key"]);
    if (replay) return this.json(route, 200, { document: replay, idempotentReplay: true });
    const doc = { ...docAt("received", { documentKind: headers["x-document-kind"] ?? "policy_schedule", byteSize: Number(headers["content-length"] ?? 0) || 1000, uploadedAt: "2026-10-20T10:35:00.000Z" }), _key: headers["idempotency-key"] } as DocumentView;
    this.documents = [...this.documents, doc];
    return this.json(route, 201, { document: doc, idempotentReplay: false });
  }

  private json(route: Route, status: number, body: unknown) {
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  }

  private error(route: Route, status: number, code: string, retryable: boolean, fields?: string[]) {
    return this.json(route, status, { error: { code, message: `BFF message for ${code}`, retryable, ...(fields ? { fields } : {}) } });
  }
}

export const PDF = (bytes = 2048) => Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(bytes, 0x20), Buffer.from("\n%%EOF")]);
export const PDF_FILE = (name = "Family floater schedule.pdf", bytes = 2048) => ({ name, mimeType: "application/pdf", buffer: PDF(bytes) });

/** role=alert elements of the app (Next adds its own route announcer with role=alert). */
export const alerts = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');
