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

export const DOCUMENT_KINDS = ["member_card", "policy_wording", "policy_schedule", "endorsement"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const NEXT_ACTIONS = ["none", "wait", "grant_ocr_consent", "start_ocr", "retry_ocr", "delete"] as const;
export type NextAction = (typeof NEXT_ACTIONS)[number];

export const CONSENT_SCOPE_NAMES = ["collect", "ocr_sarvam", "question_gemini"] as const;
export type ConsentScope = (typeof CONSENT_SCOPE_NAMES)[number];

// microsoft, apple and phone_otp are typed stubs: every one answers 501 IDENTITY_NOT_IMPLEMENTED (identity.ts). google is a
// real redirect sign-in (V1b) when configured and a 501 stub otherwise; it is never started by posting an email.
export const IDENTITY_PROVIDERS = ["dev", "otp", "magic_link", "oidc", "google", "microsoft", "apple", "phone_otp"] as const;
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
   * `scan_disabled` on awaiting_checks: the backend integrations report says document scanning is switched off, so the
   * document will stay unread. Only set when that report was read.
   */
  note: z.enum(["scan_state_not_visible", "scan_disabled"]).nullable(),
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

// ---- connectors (descriptors only; mirrors CoverSaath src/contracts/intake-connectors.js) ----

export const CONNECTOR_IDS = [
  "upload",
  "camera",
  "email_forward",
  "gmail",
  "outlook",
  "insurer_portal",
  "hr_portal",
  "digilocker",
  "whatsapp",
  "voice",
] as const;
export type ConnectorId = (typeof CONNECTOR_IDS)[number];

export const CONNECTOR_AVAILABILITY = ["available", "stub", "later"] as const;
export type ConnectorAvailability = (typeof CONNECTOR_AVAILABILITY)[number];

export const connectorViewSchema = z.object({
  id: z.enum(CONNECTOR_IDS),
  kind: z.string(),
  label: z.string(),
  availability: z.enum(CONNECTOR_AVAILABILITY),
  intakeChannel: z.enum(CONNECTOR_IDS),
  consentPurpose: z.enum(["document_processing", "voice_intake"]),
  scopesRequested: z.array(z.string()),
  dataReturned: z.array(z.string()),
  /** Ends in `-draft-legal-review`: the notice for this connector is not written yet. */
  noticeKey: z.string(),
});
export type ConnectorView = z.infer<typeof connectorViewSchema>;

export const connectorListSchema = z.object({
  demo: z.boolean(),
  connectors: z.array(connectorViewSchema),
  /** Which sign-in methods this deployment offers. Absent means the development form only. */
  signIn: z.object({ google: z.boolean(), dev: z.boolean() }).optional(),
});
export type ConnectorList = z.infer<typeof connectorListSchema>;

// ---- permissions (what the person has allowed, from the backend list; no raw scopes, no household id) ----

export const PERMISSION_KINDS = ["store_documents", "read_document", "answer_questions", "other"] as const;
export type PermissionKind = (typeof PERMISSION_KINDS)[number];

export const permissionViewSchema = z.object({
  /** The backend consent id. The revoke-by-id route takes this. Useless without the session. */
  id: z.string(),
  kind: z.enum(PERMISSION_KINDS),
  /** DRAFT wording, needs legal review. */
  label: z.string(),
  grantedAt: z.string(),
  expiresAt: z.string().nullable(),
  status: z.enum(["active", "expired", "revoked"]),
  /** Documents this permission is limited to. Empty for the store-documents permission. */
  documentIds: z.array(z.string()),
  noticeStatus: z.literal("draft_needs_legal_review"),
});
export type PermissionView = z.infer<typeof permissionViewSchema>;

export const permissionListSchema = z.object({ permissions: z.array(permissionViewSchema), truncated: z.boolean() });
export type PermissionList = z.infer<typeof permissionListSchema>;

// ---- read-back and dashboard (run V5) ----
// What the person's documents say, as read by a rule. Never a claim decision. Only three evidence states exist here: the
// backend caps read-back at "extracted_unverified", and this BFF has no "verified" state at all.

export const EVIDENCE_STATES = ["extracted_unverified", "conflicting", "unknown"] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

/** DRAFT wording, needs legal review. */
export const EVIDENCE_CHIP_LABELS: Record<EvidenceState, string> = {
  extracted_unverified: "Read, not checked",
  conflicting: "Your documents disagree",
  unknown: "Not found yet",
};

export const DASHBOARD_TOPICS = ["sum_insured", "room_rent", "co_payment", "waiting_period", "pre_authorisation", "policy_period"] as const;
export type DashboardTopic = (typeof DASHBOARD_TOPICS)[number];

export const READBACK_EXCLUDED_REASONS = ["not_read", "reading_permission_withdrawn", "reading_permission_expired", "superseded"] as const;
export type ReadbackExcludedReason = (typeof READBACK_EXCLUDED_REASONS)[number];

const excludedSchema = z.object({ documentId: z.string(), reason: z.enum(READBACK_EXCLUDED_REASONS) });

/** GET /api/app/cases/{caseId}/read-facts: the backend body reduced to the fields below. Unknown backend fields never pass. */
export const readFactsViewSchema = z.object({
  label: z.literal("read_not_checked"),
  notice: z.string(),
  documents: z.array(
    z.object({
      documentId: z.string(),
      documentKind: z.string(),
      fields: z.array(
        z.object({
          field: z.string(),
          topic: z.string().nullable(),
          value: z.string().nullable(),
          state: z.enum(EVIDENCE_STATES),
          page: z.number().nullable(),
          quote: z.string().nullable(),
        }),
      ),
    }),
  ),
  excluded: z.array(excludedSchema),
});
export type ReadFactsView = z.infer<typeof readFactsViewSchema>;

/** GET /api/app/cases/{caseId}/passages?q=: passages are text from the person's document, not an answer. */
export const passagesViewSchema = z.object({
  label: z.literal("passage_not_answer"),
  notice: z.string(),
  passages: z.array(
    z.object({
      clauseId: z.string(),
      documentId: z.string(),
      page: z.number().nullable(),
      kind: z.string(),
      title: z.string().nullable(),
      snippet: z.string(),
    }),
  ),
  excluded: z.array(excludedSchema),
});
export type PassagesView = z.infer<typeof passagesViewSchema>;

export const evidenceChipSchema = z.object({ state: z.enum(EVIDENCE_STATES), label: z.string() });
export type EvidenceChip = z.infer<typeof evidenceChipSchema>;

export const dashboardValueSchema = z.object({
  field: z.string(),
  label: z.string(),
  value: z.string(),
  state: z.enum(["extracted_unverified", "conflicting"]),
  chip: evidenceChipSchema,
  page: z.number().nullable(),
  /** 160 characters or fewer, cut by the backend and again here. */
  quote: z.string().nullable(),
  documentId: z.string(),
  documentKind: z.string(),
});
export type DashboardValue = z.infer<typeof dashboardValueSchema>;

export const READBACK_STATUSES = ["ok", "off", "unavailable", "none"] as const;
export type ReadbackStatus = (typeof READBACK_STATUSES)[number];

export const dashboardTopicSchema = z.object({
  topic: z.enum(DASHBOARD_TOPICS),
  title: z.string(),
  /** DRAFT, FOR LEGAL AND MEDICAL REVIEW. */
  explainer: z.string(),
  /** False until at least one document has been read back: the chip is then not shown and the card says "Not read yet". */
  enabled: z.boolean(),
  chip: evidenceChipSchema.nullable(),
  values: z.array(dashboardValueSchema),
  /** `one_value`: the backend reports a disagreement inside one document but gives only one of the values. `no_value`: none is given. */
  conflictDetail: z.enum(["both_values", "one_value", "no_value"]).nullable(),
  /** The query for "See where your documents mention this" (GET .../passages?q=). */
  passageQuery: z.string(),
});
export type DashboardTopicView = z.infer<typeof dashboardTopicSchema>;

export const WIDGET_STATES = ["empty", "partial", "full", "conflicting"] as const;
export type WidgetState = (typeof WIDGET_STATES)[number];

export const DASHBOARD_KINDS = ["member_card", "policy_schedule", "policy_wording"] as const;
export type DashboardKind = (typeof DASHBOARD_KINDS)[number];

const kindItem = z.object({ kind: z.enum(DASHBOARD_KINDS), label: z.string() });

export const dashboardViewSchema = z.object({
  caseId: z.string().nullable(),
  documentsAccess: z.enum(["full", "permission_withdrawn"]),
  /** `unavailable`: the permission list could not be read, so nothing is claimed about permissions. `truncated`: the list was cut short. */
  permissions: z.object({ status: z.enum(["ok", "unavailable"]), truncated: z.boolean() }),
  /** Present only when scanning is switched off and a document is waiting for its checks. */
  scanNotice: z.string().nullable(),
  /** DRAFT copy throughout: FOR LEGAL AND MEDICAL REVIEW. */
  copyStatus: z.literal("draft_needs_medical_and_legal_review"),
  widgets: z.object({
    w01: z.object({
      state: z.enum(["empty", "partial", "full"]),
      data: z.object({
        done: z.number(),
        total: z.literal(5),
        emptyLabel: z.string().nullable(),
        /** `known` is false for a step that could not be checked right now (the permission list was unavailable); it is not counted as done. */
        steps: z.array(z.object({ id: z.enum(["member_card", "policy_schedule", "policy_wording", "document_read", "reading_permission"]), label: z.string(), done: z.boolean(), known: z.boolean() })),
      }),
    }),
    w07: z.object({ state: z.enum(["empty", "partial", "full"]), data: z.object({ kinds: z.array(kindItem.extend({ present: z.boolean(), count: z.number() })) }) }),
    w15: z.object({
      state: z.enum(["empty", "partial", "full"]),
      data: z.object({
        documents: z.array(
          z.object({
            documentId: z.string(),
            documentKind: z.string(),
            uploadedAt: z.string().nullable(),
            stage: z.enum(DOCUMENT_STAGES),
            label: z.string(),
            pagesLabel: z.string().nullable(),
          }),
        ),
      }),
    }),
    w16: z.object({ state: z.enum(["empty", "partial", "full"]), data: z.object({ missing: z.array(kindItem), fullLabel: z.string().nullable() }) }),
    w17: z.object({
      state: z.enum(WIDGET_STATES),
      data: z.object({
        readback: z.enum(READBACK_STATUSES),
        notice: z.string().nullable(),
        excluded: z.array(excludedSchema),
        topics: z.array(dashboardTopicSchema),
      }),
    }),
    w04: z.object({
      state: z.enum(WIDGET_STATES),
      data: z.object({
        /** About the policy end date only: "Read, not checked", "Your documents disagree" or "Not found yet". Null until a document is read. */
        chip: evidenceChipSchema.nullable(),
        /** The policy_period values (policy_period_start and policy_period_end). Two entries for one field when the documents disagree. */
        values: z.array(dashboardValueSchema),
        /** Always false: a date read from a document is never stored as confirmed. */
        stored: z.literal(false),
      }),
    }),
    w12: z.object({
      state: z.enum(["empty", "full"]),
      data: z.object({
        action: z.enum(["none", "wait", "grant_ocr_consent", "start_ocr", "retry_ocr", "add_document"]),
        label: z.string(),
        documentId: z.string().nullable(),
        documentKind: z.string().nullable(),
      }),
    }),
    w13: z.object({
      state: z.enum(["empty", "full"]),
      data: z.object({ status: z.enum(["ok", "unavailable"]), truncated: z.boolean(), items: z.array(z.object({ kind: z.enum(PERMISSION_KINDS), label: z.string(), documentCount: z.number() })) }),
    }),
    w14: z.object({
      state: z.literal("full"),
      data: z.object({
        tel: z.literal("tel:112"),
        callLabel: z.string(),
        helplineNote: z.string(),
        eCard: z.object({ saved: z.boolean(), documentId: z.string().nullable() }),
      }),
    }),
    w09: z.object({
      state: z.literal("full"),
      data: z.object({
        items: z.array(z.object({ id: z.string(), label: z.string(), source: z.enum(["your_files", "general_list"]) })),
        /** Ticks are not stored anywhere. The screen says so. */
        ticksStored: z.literal(false),
        note: z.string(),
      }),
    }),
    /** Model-backed widgets: nothing is shown until an answer exists. */
    w02: z.object({ state: z.literal("unknown"), reason: z.literal("needs_answer") }),
    w03: z.object({ state: z.literal("unknown"), reason: z.literal("needs_answer") }),
    w05: z.object({ state: z.literal("unknown"), reason: z.literal("needs_answer") }),
    w06: z.object({ state: z.literal("unknown"), reason: z.literal("needs_answer") }),
    w11: z.object({ state: z.literal("unknown"), reason: z.literal("needs_answer") }),
  }),
});
export type DashboardView = z.infer<typeof dashboardViewSchema>;

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
    /** ocr_sarvam only: one document. Kept so a single-document request still works; same as documentIds with one entry. */
    documentId: id.optional(),
    /** ocr_sarvam and question_gemini: 1 to 10 documents. Duplicates are removed and the list is sorted by the BFF. */
    documentIds: z.array(id).min(1).max(10).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.scope === "ocr_sarvam") {
      if (!value.documentId && !value.documentIds) ctx.addIssue({ code: "custom", path: ["documentId"], message: "required" });
      if (value.documentId && value.documentIds) ctx.addIssue({ code: "custom", path: ["documentIds"], message: "use documentId or documentIds, not both" });
    }
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
