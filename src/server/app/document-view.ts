// Composes backend document status + OCR job + structuring into one UI stage. PROVISIONAL, DRAFT labels.
import type { BackendDocument, BackendOcrJob } from "./backend-client";
import type { DocumentStage, DocumentView, NextAction } from "./contract";

const LABELS: Record<DocumentStage, string> = {
  received: "Received",
  awaiting_checks: "Waiting for security checks",
  awaiting_ocr_consent: "Waiting for your permission to read it",
  processing: "Reading",
  readable: "Read",
  unreadable: "Could not be read",
  rejected: "Could not be accepted",
  deleting: "Being deleted",
  deleted: "Deleted",
};

export type ComposeInput = {
  document: BackendDocument;
  ocrJob: BackendOcrJob | null;
  /** The OCR (ocr_sarvam) consent for this document is currently held. */
  ocrConsent: boolean;
  /** True only for the response to the upload itself. Later reads report awaiting_checks. */
  justUploaded?: boolean;
  structuring?: "running" | "finished" | "failed" | null;
};

export function composeDocumentView(input: ComposeInput): DocumentView {
  const { document, ocrJob, ocrConsent } = input;
  let stage: DocumentStage;
  let nextAction: NextAction = "none";
  let note: DocumentView["note"] = null;

  switch (document.status) {
    case "deleted":
      stage = "deleted";
      break;
    case "deletion_pending":
      stage = "deleting";
      nextAction = "wait";
      break;
    case "rejected":
      stage = "rejected";
      break;
    case "received_pending_checks":
      // Quarantine, scanning, scan-disabled and scan-failed are all this one status. The backend cannot tell
      // them apart, so we never promise progress.
      stage = input.justUploaded ? "received" : "awaiting_checks";
      nextAction = "wait";
      note = "scan_state_not_visible";
      break;
    default: {
      // accepted
      if (!ocrConsent) {
        stage = "awaiting_ocr_consent";
        nextAction = "grant_ocr_consent";
      } else if (!ocrJob) {
        // Permission is held but no job was started. Not "processing": nothing is running.
        stage = "awaiting_ocr_consent";
        nextAction = "start_ocr";
      } else if (ocrJob.status === "succeeded") {
        stage = "readable";
      } else if (ocrJob.status === "failed" || ocrJob.status === "cancelled") {
        stage = "unreadable";
        nextAction = "retry_ocr";
      } else {
        stage = "processing";
        nextAction = "wait";
      }
    }
  }

  return {
    id: document.id,
    caseId: document.caseId ?? null,
    documentKind: document.documentKind,
    byteSize: document.byteSize,
    uploadedAt: document.uploadedAt ?? null,
    stage,
    nextAction,
    label: LABELS[stage],
    backendStatus: document.status,
    ocr: ocrJob ? { status: ocrJob.status, errorCode: ocrJob.errorCode ?? null, pageCount: ocrJob.pageCount ?? null } : null,
    structuring: input.structuring ?? null,
    note,
  };
}
