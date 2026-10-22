// Builds the real backend consent scope shapes from the client's named scope. PROVISIONAL.
// Shapes copied from CoverSaath tests/support/household-api-harness.mjs (branch block4/household-reasoning) and
// src/contracts/policy-evidence.js. All notice text below is DRAFT and NEEDS LEGAL REVIEW. Never final wording.
import type { ConsentGrantBody } from "./backend-client";
import type { ConsentNotice, ConsentScope } from "./contract";

export const NOTICE_VERSION = "draft-v0-needs-legal-review";
export const SARVAM_RECIPIENT = "sarvam";
export const GEMINI_RECIPIENT = "google-gemini";

export const CONSENT_NOTICES: ConsentNotice[] = [
  {
    scope: "collect",
    version: NOTICE_VERSION,
    status: "draft_needs_legal_review",
    title: "Keep your policy documents (DRAFT)",
    body: "DRAFT, needs legal review. You allow Knowvia to store the policy PDFs you add so you can read them here.",
  },
  {
    scope: "ocr_sarvam",
    version: NOTICE_VERSION,
    status: "draft_needs_legal_review",
    title: "Read this document with a reading service (DRAFT)",
    body: "DRAFT, needs legal review. You allow this one document to be sent to a text-reading service so Knowvia can read it.",
  },
  {
    scope: "question_gemini",
    version: NOTICE_VERSION,
    status: "draft_needs_legal_review",
    title: "Answer questions from these documents (DRAFT)",
    body: "DRAFT, needs legal review. You allow text from the listed documents to be sent to an AI model to answer your questions with quotes.",
  },
];

type ScopeInput = { adultId: string; householdId: string; caseId?: string | null; documentId?: string; documentIds?: string[] };

export function buildConsentGrant(scope: ConsentScope, input: ScopeInput): ConsentGrantBody {
  const base = {
    householdId: input.householdId,
    subjectAdultId: input.adultId,
    purpose: "document_processing" as const,
    noticeVersion: NOTICE_VERSION,
    evidenceMethod: "typed" as const,
    expiresAt: null,
  };
  if (scope === "collect") {
    if (!input.caseId) throw new TypeError("collect consent needs a case");
    return {
      ...base,
      scopes: [
        { resourceType: "document", action: "collect", dataCategory: "insurance_document" },
        // The case-field read gate (source_pack_metadata) is a separate scope the backend checks on list/get/question routes.
        { resourceType: "case", resourceId: input.caseId, action: "read", dataCategory: "source_pack_metadata", recipient: input.adultId },
      ],
    };
  }
  if (scope === "ocr_sarvam") {
    if (!input.documentId) throw new TypeError("ocr_sarvam consent needs a document");
    return {
      ...base,
      grantedToActor: SARVAM_RECIPIENT,
      scopes: [{ resourceType: "document", resourceId: input.documentId, action: "derive", dataCategory: "insurance_document", recipient: SARVAM_RECIPIENT }],
    };
  }
  const documents = input.documentIds ?? [];
  if (documents.length === 0) throw new TypeError("question_gemini consent needs documents");
  return {
    ...base,
    grantedToActor: GEMINI_RECIPIENT,
    scopes: documents.map((documentId) => ({
      resourceType: "document",
      resourceId: documentId,
      action: "derive",
      dataCategory: "insurance_question",
      recipient: GEMINI_RECIPIENT,
    })),
  };
}
