// Wording for permissions that exist, and for withdrawing them. Pure: unit tested in tests/unit/app-ui.
// DRAFT: all of this needs legal review before launch. The store-documents lines describe the backend: revoking the
// collect grant marks every document uploaded under it for deletion (tests/unit/app-ui/blocks.test.ts ties the wording to that).
import type { ConsentView, DocumentView, PermissionKind } from "@/lib/app-contract";
import { documentKindLabel } from "../documents/stage";

export function consentTitle(consent: ConsentView, documents: DocumentView[]): string {
  if (consent.scope === "collect") return "Store the PDFs you add";
  if (consent.scope === "ocr_sarvam") {
    if (consent.documentIds.length > 1) return `Read ${consent.documentIds.length} documents with the reading service (OCR)`;
    const doc = documents.find((d) => d.id === consent.documentIds[0]);
    return `Read ${doc ? documentKindLabel(doc.documentKind).toLowerCase() : "one PDF"} with the reading service (OCR)`;
  }
  const n = consent.documentIds.length;
  return `Use ${n} ${n === 1 ? "document" : "documents"} to answer your questions`;
}

/** What stops when the permission is withdrawn. Draft wording; it also says that derived answers are erased. */
export function revokeExplanation(consent: ConsentView, documentCount = consent.documentIds?.length ?? 1): string[] {
  if (consent.scope === "collect") {
    return [
      "CoverSaath stops storing PDFs for you and will ask again before you add another.",
      "The PDFs you added under this permission will be deleted, together with the text and answers CoverSaath built from them.",
      "Withdrawing also erases answers CoverSaath worked out using this permission.",
    ];
  }
  if (consent.scope === "ocr_sarvam" && documentCount > 1) {
    return [
      `Withdrawing stops reading for all ${documentCount} documents and erases what was read from them.`,
      "CoverSaath stops sending them to the reading service. To use them again, you would allow reading again.",
    ];
  }
  if (consent.scope === "ocr_sarvam") {
    return [
      "CoverSaath stops sending this PDF to the reading service.",
      "Withdrawing erases the text and answers CoverSaath derived from this PDF. To use it again, you would allow reading again.",
    ];
  }
  return [
    "CoverSaath stops using these documents to answer your questions.",
    "Withdrawing erases the answers already given from them.",
  ];
}

/** The same promise as revokeExplanation, for the backend permission list (kinds instead of scopes). Draft wording. */
export function permissionRevokeExplanation(kind: PermissionKind, documentCount = 1): string[] {
  if (kind === "store_documents") return revokeExplanation({ scope: "collect" } as ConsentView);
  if (kind === "read_document") return revokeExplanation({ scope: "ocr_sarvam" } as ConsentView, documentCount);
  if (kind === "answer_questions") return revokeExplanation({ scope: "question_gemini" } as ConsentView);
  return ["CoverSaath stops using this permission.", "CoverSaath will not use it for anything new."];
}
