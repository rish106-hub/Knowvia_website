// Wording for permissions that exist, and for withdrawing them. Pure: unit tested in tests/unit/app-ui.
// DRAFT: all of this needs legal review before launch (docs/block5/s2-ui.md).
import type { ConsentView, DocumentView } from "@/lib/app-contract";
import { documentKindLabel } from "../documents/stage";

export function consentTitle(consent: ConsentView, documents: DocumentView[]): string {
  if (consent.scope === "collect") return "Store the PDFs you add";
  if (consent.scope === "ocr_sarvam") {
    const doc = documents.find((d) => d.id === consent.documentIds[0]);
    return `Read ${doc ? documentKindLabel(doc.documentKind).toLowerCase() : "one PDF"} with the reading service (OCR)`;
  }
  const n = consent.documentIds.length;
  return `Use ${n} ${n === 1 ? "document" : "documents"} to answer your questions`;
}

/** What stops when the permission is withdrawn. Draft wording; it also says that derived answers are erased. */
export function revokeExplanation(consent: ConsentView): string[] {
  if (consent.scope === "collect") {
    return [
      "Knowvia stops storing new PDFs for you and will ask again before you add another.",
      "Withdrawing also erases answers Knowvia worked out using this permission.",
      "PDFs you already added are not removed by this. Delete a PDF from the Documents page to remove it.",
    ];
  }
  if (consent.scope === "ocr_sarvam") {
    return [
      "Knowvia stops sending this PDF to the reading service.",
      "Withdrawing erases the text and answers Knowvia derived from this PDF. To use it again, you would allow reading again.",
    ];
  }
  return [
    "Knowvia stops using these documents to answer your questions.",
    "Withdrawing erases the answers already given from them.",
  ];
}
