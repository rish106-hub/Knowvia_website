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

export const AWAITING_CHECKS_TEXT = "Waiting for security checks. This can take a while.";

const STAGES: Record<DocumentStage, StageInfo> = {
  received: { label: "Received", tone: "pending", description: "Received. Security checks come next.", indeterminate: false },
  awaiting_checks: { label: "Waiting for checks", tone: "pending", description: AWAITING_CHECKS_TEXT, indeterminate: false },
  awaiting_ocr_consent: {
    label: "Needs your permission",
    tone: "attention",
    description: "To read the text in this PDF, Knowvia sends it to an outside reading service (OCR). That needs your permission.",
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
    description: "Knowvia could read the text of this PDF. Nothing has been checked or confirmed from it yet.",
    indeterminate: false,
  },
  unreadable: {
    label: "Could not read",
    tone: "problem",
    description: "Knowvia could not read the text in this PDF. You can try again, or delete it and add a different file.",
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
  policy_wording: "Policy wording",
  policy_schedule: "Policy schedule",
  endorsement: "Endorsement",
};

export const KIND_CHOICES: ReadonlyArray<{ value: DocumentKind; label: string; hint: string }> = [
  { value: "policy_schedule", label: "Policy schedule", hint: "The summary page: who is covered, the sum insured, dates." },
  { value: "policy_wording", label: "Policy wording", hint: "The full terms and conditions." },
  { value: "endorsement", label: "Endorsement", hint: "A change added to a policy after it was issued." },
];

export function documentKindLabel(kind: string): string {
  return KIND_LABELS[kind as DocumentKind] ?? "Document";
}

export type DocumentActions = {
  /** The one main action the row offers, from nextAction. */
  primary: "grant_ocr_consent" | "start_ocr" | "retry_ocr" | null;
  canDelete: boolean;
  /** Offer a manual "Check again" (no ETA stages). */
  canRecheck: boolean;
  /** Which background refresh keeps the row current. */
  polls: "ocr_refresh" | "read" | null;
};

export function documentActions(doc: Pick<DocumentView, "stage" | "nextAction">): DocumentActions {
  const primary =
    doc.nextAction === "grant_ocr_consent" || doc.nextAction === "start_ocr" || doc.nextAction === "retry_ocr" ? doc.nextAction : null;
  const gone = doc.stage === "deleting" || doc.stage === "deleted";
  return {
    primary: gone ? null : primary,
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
