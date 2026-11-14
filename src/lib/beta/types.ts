// Client-side copies of the CoverSaath contracts the beta screens use (question-catalogue/v1, answer-card/v1).
// Copied by hand, never imported across repos. All wording is FOR LEGAL REVIEW.
export const NOT_SURE = "not_sure";
export const OTHER = "other";

export type InputKind = "yes_no_unsure" | "single_choice" | "multi_choice_chips" | "amount_presets" | "date_presets" | "member_pick";
export type Sensitivity = "health" | "money" | "none";
export type Phase = "before_card" | "strip";
export type Localised = { en: string; hi: string | null };
export type CatalogueOption = { id: string; label: Localised };
export type CatalogueQuestion = {
  id: string;
  prompt: Localised;
  why: Localised;
  input: { kind: InputKind; options?: CatalogueOption[] };
  sensitivity: Sensitivity;
  phase: Phase;
  perMember: boolean;
  weight: number;
  followups: Record<string, string[]>;
};
export type Member = { id: string; label: string };

export type Verdict = "covered" | "not_covered" | "partly_covered" | "depends" | "unknown";
export type SourceTier = "own_pdf" | "ida_wording" | "user_declaration";
export type SourceStatus = "extracted_unverified" | "reviewed_reference" | "user_confirmed" | "conflicting" | "unknown";
export type ConditionKind = "waiting_period" | "sublimit" | "copay" | "deductible" | "exclusion" | "room_rent" | "document_needed";
export type ActionKind = "answer_question" | "find_hospital" | "call_insurer" | "upload_document" | "ask_followup" | "grievance_path";

export type CardSource = { id: string; factIds: string[]; tier: SourceTier; status: SourceStatus; page?: number | null; clause?: string | null; quote: string };
export type CardCondition = { kind: ConditionKind; text: string; sourceIds: string[] };
// questionId is a client extension: an answer_question action opens that catalogue question inline.
export type CardAction = { kind: ActionKind; label: string; questionId?: string };
export type AnswerCardData = {
  contract: "answer-card/v1";
  status: "evidence_found" | "unknown" | "out_of_scope";
  verdict: Verdict;
  ruleResultId?: string | null;
  headline: string;
  explanation: string;
  conditions: CardCondition[];
  sources: CardSource[];
  actions: CardAction[];
  followups: string[];
};

export type TileId = "sum_insured" | "room_rent" | "waiting_periods" | "copay_deductible" | "exclusions" | "cashless";
export type TileBadge = "own_pdf" | "ida_wording" | "user_declaration" | "not_checked" | "unknown";
export type TileSource = { tier: SourceTier; page?: number | null; clause?: string | null; quote: string };
export type TileValue = { label: string; value: string; source: TileSource };
export type CardTileData = {
  id: TileId;
  title: string;
  value: string | null;
  badge: TileBadge;
  source?: TileSource;
  conflict?: [TileValue, TileValue];
  note?: string;
};
