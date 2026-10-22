// Client-facing contract of the BFF (zod schemas and inferred types). PROVISIONAL (D1/D2).
// SAFE FOR THE BROWSER TO TYPE-IMPORT through src/lib/app-contract.ts: this file imports only zod and holds no
// secrets, no backend tokens and no consent grant bearer material. Do not import server modules here.
import { z } from "zod";

// ---- vocabulary ----

export const DOCUMENT_STAGES = [
  "received",
  "awaiting_checks",
  "awaiting_ocr_consent",
  "processing",
  "readable",
  "unreadable",
  "rejected",
  "deleting",
  "deleted",
] as const;
export type DocumentStage = (typeof DOCUMENT_STAGES)[number];

export const DOCUMENT_KINDS = ["policy_wording", "policy_schedule", "endorsement"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const NEXT_ACTIONS = ["none", "wait", "grant_ocr_consent", "start_ocr", "retry_ocr", "delete"] as const;
export type NextAction = (typeof NEXT_ACTIONS)[number];

export const CONSENT_SCOPE_NAMES = ["collect", "ocr_sarvam", "question_gemini"] as const;
export type ConsentScope = (typeof CONSENT_SCOPE_NAMES)[number];

export const IDENTITY_PROVIDERS = ["dev", "otp", "magic_link", "oidc"] as const;
export type IdentityProviderKind = (typeof IDENTITY_PROVIDERS)[number];

export const TRIGGER_TYPES = [
  "renewal",
  "workforce_entry",
  "family_change",
  "planned_care",
  "emergency",
  "user_requested_review",
] as const;

// ---- responses ----

export const documentViewSchema = z.object({
  id: z.string(),
  caseId: z.string().nullable(),
  documentKind: z.string(),
  byteSize: z.number(),
  uploadedAt: z.string().nullable(),
  /** The one value the UI should switch on. Composed from backend document status, OCR job and structuring. */
  stage: z.enum(DOCUMENT_STAGES),
  nextAction: z.enum(NEXT_ACTIONS),
  /** DRAFT copy, needs legal review. */
  label: z.string(),
  /** Raw backend document status, for diagnostics only. */
  backendStatus: z.enum(["received_pending_checks", "accepted", "rejected", "deletion_pending", "deleted"]),
  ocr: z
    .object({
      status: z.enum(["queued", "submitted", "processing", "succeeded", "failed", "cancelled"]),
      errorCode: z.string().nullable(),
      pageCount: z.number().nullable(),
    })
    .nullable(),
  structuring: z.enum(["running", "finished", "failed"]).nullable(),
  /**
   * `scan_state_not_visible` on awaiting_checks: the backend cannot tell "scanning" from "scan disabled",
   * so the UI must not promise a completion time.
   */
  note: z.enum(["scan_state_not_visible"]).nullable(),
});
export type DocumentView = z.infer<typeof documentViewSchema>;

export const consentViewSchema = z.object({
  scope: z.enum(CONSENT_SCOPE_NAMES),
  /** Handle for X-Consent-Grant-Id on upload. Not a secret; useless without the session. */
  grantId: z.string(),
  documentIds: z.array(z.string()),
  grantedAt: z.string(),
  /** Always draft until legal review signs off. */
  noticeStatus: z.literal("draft_needs_legal_review"),
});
export type ConsentView = z.infer<typeof consentViewSchema>;

export const sessionViewSchema = z.object({
  authenticated: z.boolean(),
  expiresAt: z.string().nullable(),
  householdId: z.string().nullable(),
  adultId: z.string().nullable(),
  memberId: z.string().nullable(),
  identity: z.object({ provider: z.enum(IDENTITY_PROVIDERS), provisional: z.literal(true) }).nullable(),
  /** Only on an unauthenticated GET: why there is no session. `expired` means recovery is NOT_IMPLEMENTED (needs D1). */
  reason: z.enum(["none", "expired"]).optional(),
});
export type SessionView = z.infer<typeof sessionViewSchema>;

export const overviewSchema = z.object({
  session: z.object({ expiresAt: z.string() }),
  household: z.object({ id: z.string(), viewerRole: z.string().nullable() }),
  owner: z.object({ adultId: z.string(), memberId: z.string() }),
  members: z.array(
    z.object({
      id: z.string(),
      displayName: z.string(),
      memberKind: z.string().nullable(),
      relationshipLabel: z.string().nullable(),
      policiesFound: z.number(),
    }),
  ),
  cases: z.array(z.object({ id: z.string() })),
  documents: z.array(documentViewSchema),
  /**
   * `permission_withdrawn`: the storage permission was withdrawn, so the document list comes from the deletion inventory
   * (what is still held, and can be deleted). Absent or `full` means the normal list.
   */
  documentsAccess: z.enum(["full", "permission_withdrawn"]).optional(),
  consents: z.array(consentViewSchema),
});
export type Overview = z.infer<typeof overviewSchema>;

export const errorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
    fields: z.array(z.string()).optional(),
  }),
});
export type ErrorBody = z.infer<typeof errorBodySchema>;

/** Evidence answers, catalogue handoffs and previews are passed through from the backend unchanged. */
export type PassThrough = Record<string, unknown>;

// ---- requests ----

export const createSessionRequestSchema = z.object({
  provider: z.enum(IDENTITY_PROVIDERS).default("dev"),
  email: z.email().max(320),
  displayName: z.string().trim().min(1).max(80).optional(),
});
export type CreateSessionRequest = z.input<typeof createSessionRequestSchema>;

export const createCaseRequestSchema = z.object({ triggerType: z.enum(TRIGGER_TYPES).default("planned_care") });
export type CreateCaseRequest = z.input<typeof createCaseRequestSchema>;

const id = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

export const grantConsentRequestSchema = z
  .object({
    scope: z.enum(CONSENT_SCOPE_NAMES),
    documentId: id.optional(),
    documentIds: z.array(id).min(1).max(10).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.scope === "ocr_sarvam" && !value.documentId) ctx.addIssue({ code: "custom", path: ["documentId"], message: "required" });
    if (value.scope === "question_gemini" && !value.documentIds) ctx.addIssue({ code: "custom", path: ["documentIds"], message: "required" });
  });
export type GrantConsentRequest = z.input<typeof grantConsentRequestSchema>;

export const revokeConsentRequestSchema = grantConsentRequestSchema;
export type RevokeConsentRequest = GrantConsentRequest;

export const askQuestionRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  documentIds: z.array(id).min(1).max(10).optional(),
});
export type AskQuestionRequest = z.infer<typeof askQuestionRequestSchema>;

export const catalogueReviewRequestSchema = z.object({
  answerId: z.string().min(1).max(128),
  factId: z.string().min(1).max(128),
  decision: z.string().min(1).max(20),
  reasonCode: z.string().min(1).max(40),
  attestedSourceType: z.string().max(60).nullable().optional(),
  attestsPolicyAssociation: z.boolean().optional(),
  asOf: z.string().max(40).nullable().optional(),
  memberId: z.string().max(128).nullable().optional(),
});
export type CatalogueReviewRequest = z.infer<typeof catalogueReviewRequestSchema>;

export const designateConfirmerRequestSchema = z.object({ adultUserId: z.string().min(1).max(128) });
export type DesignateConfirmerRequest = z.infer<typeof designateConfirmerRequestSchema>;

export const coveragePreviewRequestSchema = z.object({
  contractVersion: z.literal("household-scenario/v1"),
  sources: z.array(z.object({ caseId: z.string().min(1).max(128), answerId: z.string().min(1).max(128) })).min(1).max(5),
  scenario: z.record(z.string(), z.unknown()),
});
export type CoveragePreviewRequest = z.infer<typeof coveragePreviewRequestSchema>;

/** Draft consent notices. NEEDS LEGAL REVIEW. Not final wording. */
export const consentNoticeSchema = z.object({
  scope: z.enum(CONSENT_SCOPE_NAMES),
  version: z.string(),
  status: z.literal("draft_needs_legal_review"),
  title: z.string(),
  body: z.string(),
});
export type ConsentNotice = z.infer<typeof consentNoticeSchema>;
