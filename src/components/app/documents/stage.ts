// Stage -> UI vocabulary. Pure: unit tested in tests/unit/app-ui.
// The UI switches on DocumentView.stage and nextAction only. Nothing here implies insurer approval, a cashless
// decision or a successful extraction: `readable` means the OCR provider returned text, nothing more.
import type { DocumentKind, DocumentStage, DocumentView } from "@/lib/app-contract";

export type StageTone = "done" | "pending" | "attention" | "problem" | "neutral";

export type StageInfo = {
  label: string;
  tone: StageTone;
  /** One plain sentence under the row. */
  description: string;
  /** Show an indeterminate "working" indicator. Never a percentage. */
  indeterminate: boolean;
};

export const AWAITING_CHECKS_TEXT = "Waiting for security checks. This usually needs no action.";

/** DRAFT, needs legal review. Shown when the backend reports that scanning is switched off (DocumentView.note = scan_disabled). */
export const SCAN_OFF_TEXT =
  "Security checks are switched off on this preview. Your document is stored safely but cannot be read yet. You can delete it at any time.";

/** The sentence under a document row. Only awaiting_checks differs from stageInfo(): it can say that scanning is off. */
export function stageDescription(doc: Pick<DocumentView, "stage" | "note">): string {
  if (doc.stage === "awaiting_checks") return doc.note === "scan_disabled" ? SCAN_OFF_TEXT : AWAITING_CHECKS_TEXT;
  return stageInfo(doc.stage).description;
}

const STAGES: Record<DocumentStage, StageInfo> = {
  received: { label: "Received", tone: "pending", description: "Received. Security checks come next.", indeterminate: false },
  awaiting_checks: { label: "Waiting for checks", tone: "pending", description: AWAITING_CHECKS_TEXT, indeterminate: false },
  awaiting_ocr_consent: {
    label: "Needs your permission",
    tone: "attention",
    description: "To read the text in this PDF, CoverSaath sends it to an outside reading service (OCR). That needs your permission.",
    indeterminate: false,
  },
  processing: {
    label: "Reading",
    tone: "pending",
    description: "Reading this PDF. This page updates by itself. You can leave it open.",
    indeterminate: true,
  },
  readable: {
    label: "Readable",
    tone: "done",
    description: "CoverSaath could read the text of this PDF. Nothing has been checked or confirmed from it yet.",
    indeterminate: false,
  },
  unreadable: {
    label: "Could not read",
    tone: "problem",
    description: "CoverSaath could not read the text in this PDF. You can try again, or delete it and add a different file.",
    indeterminate: false,
  },
  rejected: {
    label: "Not accepted",
    tone: "problem",
    description: "The checks did not accept this file. Delete it and try a different PDF.",
    indeterminate: false,
  },
  deleting: { label: "Deleting", tone: "pending", description: "Being deleted. This can take a moment.", indeterminate: true },
  deleted: { label: "Deleted", tone: "neutral", description: "This document was deleted.", indeterminate: false },
};

export function stageInfo(stage: DocumentStage): StageInfo {
  return STAGES[stage];
}

const KIND_LABELS: Record<DocumentKind, string> = {
  member_card: "Health card (e-card)",
  policy_wording: "Policy wording",
  policy_schedule: "Policy schedule",
  endorsement: "Endorsement",
};

export const KIND_CHOICES: ReadonlyArray<{ value: DocumentKind; label: string; hint: string }> = [
  { value: "member_card", label: "Health card (e-card)", hint: "The card from your insurer or employer. It shows your member number." },
  { value: "policy_schedule", label: "Policy schedule", hint: "The summary page: who is covered, the sum insured, dates." },
  { value: "policy_wording", label: "Policy wording", hint: "The full terms and conditions." },
  { value: "endorsement", label: "Endorsement", hint: "A change added to a policy after it was issued." },
];

export function documentKindLabel(kind: string): string {
  return KIND_LABELS[kind as DocumentKind] ?? "Document";
}

/** Most documents one reading permission may name. Matches the BFF limit (consent-scopes.ts MAX_READING_DOCUMENTS). */
export const MAX_READING_DOCUMENTS = 10;

/**
 * The documents the next reading permission would cover: the ones still waiting for it, oldest first, at most 10.
 * Nothing is offered when the storage permission was withdrawn (the list then comes from the deletion inventory), and a
 * document whose checks are switched off is left out because it will not be read.
 */
export function documentsAwaitingReadingPermission(documents: DocumentView[], access: "full" | "permission_withdrawn" | undefined): DocumentView[] {
  if (access === "permission_withdrawn") return [];
  return documents
    .filter(
      (doc) =>
        doc.nextAction === "grant_ocr_consent" &&
        (doc.stage === "received" || doc.stage === "awaiting_checks" || doc.stage === "awaiting_ocr_consent") &&
        !(doc.stage !== "awaiting_ocr_consent" && doc.note === "scan_disabled"),
    )
    .sort((a, b) => (a.uploadedAt ?? "").localeCompare(b.uploadedAt ?? "") || a.id.localeCompare(b.id))
    .slice(0, MAX_READING_DOCUMENTS);
}

/** DRAFT, needs legal review. The one sentence that says what the batch reading permission does. */
export function readingSheetLead(count: number): string {
  return count === 1
    ? "Read this document with a text-reading service so CoverSaath can show you what it says."
    : `Read these ${count} documents with a text-reading service so CoverSaath can show you what they say.`;
}

/** The documents whose reading can start now: accepted, permission held, no job yet. */
export function documentsReadyToStartReading(documents: DocumentView[]): DocumentView[] {
  return documents.filter((doc) => doc.backendStatus === "accepted" && doc.stage === "awaiting_ocr_consent" && doc.nextAction === "start_ocr");
}

export type DocumentActions = {
  /** The one main action the row offers, from nextAction. */
  primary: "grant_ocr_consent" | "start_ocr" | "retry_ocr" | null;
  canDelete: boolean;
  /** Offer a manual "Check again" (no ETA stages). */
  canRecheck: boolean;
  /** Which background refresh keeps the row current. */
  polls: "ocr_refresh" | "read" | null;
  /**
   * Reading permission is held and the document is still in its security checks: re-read it until it is accepted, so
   * reading can start by itself. False when checks are switched off (it would never move).
   */
  waitsForChecks: boolean;
};

export function documentActions(doc: Pick<DocumentView, "stage" | "nextAction"> & { note?: DocumentView["note"] }): DocumentActions {
  const checking = doc.stage === "received" || doc.stage === "awaiting_checks";
  const primary =
    doc.nextAction === "grant_ocr_consent" || doc.nextAction === "start_ocr" || doc.nextAction === "retry_ocr" ? doc.nextAction : null;
  const gone = doc.stage === "deleting" || doc.stage === "deleted";
  // A document whose checks are switched off will never be read, so asking to allow reading it would promise nothing.
  const pointless = checking && doc.note === "scan_disabled" && primary === "grant_ocr_consent";
  return {
    primary: gone || pointless ? null : primary,
    waitsForChecks: checking && doc.nextAction === "wait" && doc.note !== "scan_disabled",
    canDelete: !gone,
    canRecheck: doc.stage === "received" || doc.stage === "awaiting_checks",
    polls: doc.stage === "processing" ? "ocr_refresh" : doc.stage === "deleting" ? "read" : null,
  };
}

export function primaryActionLabel(action: NonNullable<DocumentActions["primary"]>): string {
  if (action === "grant_ocr_consent") return "Allow reading";
  if (action === "start_ocr") return "Start reading";
  return "Try reading again";
}
