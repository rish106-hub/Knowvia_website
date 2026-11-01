// The four evidence chips, as data. Pure: unit tested in tests/unit/app-ui/state-chip.test.ts.
// A chip is never colour alone: each state has its own border style, its own icon AND words.
// DRAFT wording, FOR LEGAL AND MEDICAL REVIEW. The words follow the plan's token block, not the shorter words on the boards.
//
// "verified" exists here only so the wording is in one place. Nothing in the BFF produces it: the backend caps read-back at
// "extracted_unverified", so no code path in the dashboard renders the "Confirmed in your documents" chip today.
import type { EvidenceState } from "@/lib/app-contract";

export type ChipState = "verified" | EvidenceState;
/** `four`: one treatment per state. `two`: only "Confirmed in your documents" and "Check this" (S01, S14 and W14). */
export type ChipTreatment = "four" | "two";
export type ChipBorder = "solid" | "dashed" | "thick" | "dotted";
export type ChipIcon = "check" | "question" | "alert" | "clock";

export const CHIP_WORDS: Record<ChipState, string> = {
  verified: "Confirmed in your documents",
  extracted_unverified: "Read, not checked",
  conflicting: "Your documents disagree",
  unknown: "Not found yet",
};

export const CHECK_THIS = "Check this";
/** Shown on a topic card when nothing has been read back yet. It is not an evidence state: nothing was looked for. */
export const NOT_READ_YET = "Not read yet";

export type ChipModel = { state: ChipState; label: string; border: ChipBorder; icon: ChipIcon };

const FOUR: Record<ChipState, Omit<ChipModel, "label">> = {
  verified: { state: "verified", border: "solid", icon: "check" },
  extracted_unverified: { state: "extracted_unverified", border: "dashed", icon: "question" },
  conflicting: { state: "conflicting", border: "thick", icon: "alert" },
  unknown: { state: "unknown", border: "dotted", icon: "clock" },
};

/**
 * What a chip shows. In the two-treatment mode every state except "verified" is "Check this" (dashed, question mark): the
 * short card says only that the person should look at the document themselves, never that something is wrong or right.
 */
export function chipModel(state: ChipState, treatment: ChipTreatment = "four"): ChipModel {
  if (treatment === "two" && state !== "verified") return { state, label: CHECK_THIS, border: "dashed", icon: "question" };
  return { ...FOUR[state], label: CHIP_WORDS[state] };
}
