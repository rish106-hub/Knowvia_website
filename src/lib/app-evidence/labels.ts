// Plain-language labels for the evidence and preview screens. Pure data, no React.
// ALL copy that makes a statement about consent, coverage, review or checks NEEDS LEGAL REVIEW (see docs/block5/s34-ui.md).

export const RULE_LABELS: Record<string, string> = {
  sum_insured: "Sum insured",
  room_rent_limit: "Room rent limit",
  icu_limit: "ICU limit",
  copay: "Co-payment",
  deductible: "Deductible",
  sublimit: "Sub-limit",
  waiting_period: "Waiting period",
  exclusion: "Exclusion",
  add_on: "Add-on",
  restoration: "Restoration of cover",
  bonus: "No-claim bonus",
  policy_identity: "Insurer and product",
  member_enrolment: "Who is insured",
  network_status: "Hospital network",
  claim_documents: "Claim documents",
  renewal_portability: "Renewal and portability",
  continuous_cover: "Continuous cover",
  policy_period: "Policy period",
  topic_specific_terms: "Terms for your topic",
  waiting_period_completion: "Waiting period completed",
  policy_type: "Policy type",
};

export function humanise(code: string): string {
  const cleaned = code.replace(/^finding\./, "").replace(/[_./-]+/g, " ").trim();
  if (!cleaned) return "This item";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function ruleLabel(rule: string): string {
  return RULE_LABELS[rule] ?? humanise(rule);
}

export const DOCUMENT_KIND_LABELS: Record<string, string> = {
  policy_wording: "Policy wording",
  policy_schedule: "Policy schedule",
  endorsement: "Endorsement",
  employer_benefit_booklet: "Employer benefit booklet",
};

export function documentKindLabel(kind: string | null | undefined): string {
  if (!kind) return "Document you uploaded";
  return DOCUMENT_KIND_LABELS[kind] ?? "Document you uploaded";
}

/** What an open-ended finding says about the topic. Never "you are covered". */
export const EFFECT_LABELS: Record<string, string> = {
  covers: "The document describes a benefit",
  limits: "The document describes a limit",
  excludes: "The document describes an exclusion",
  conditions: "The document describes a condition",
  waives: "The document describes a waiver",
  overrides: "The document describes an override",
};

export function effectLabel(effect: string | null | undefined): string {
  if (!effect) return "The document mentions this";
  return EFFECT_LABELS[effect] ?? "The document mentions this";
}

const NOT_FOUND_NOT_EXCLUDED = "That does not mean it is excluded or not covered.";

/** Why something is "Not confirmed". Every reason says what is missing; none reads as an exclusion. */
export const NOT_CONFIRMED_REASONS: Record<string, string> = {
  no_applicable_evidence: `We did not find this in the part of the document we read. ${NOT_FOUND_NOT_EXCLUDED}`,
  only_non_contractual_sources: "Only summary or advisory text mentions this, not the policy terms themselves.",
  as_of_required: "This depends on a date we do not have yet.",
  fact_unknown: "The document does not state this clearly enough for us to confirm it.",
  value_not_verified: "We read a possible value from the document, but nobody has confirmed it yet.",
  policy_association_unverified: "We have not confirmed which policy this document belongs to.",
  association_not_verified: "We have not confirmed which policy this document belongs to.",
  known_evidence_incomplete: "The evidence for this was incomplete, so we cannot treat it as confirmed.",
  decisive_evidence_incomplete: "The evidence for this was incomplete, so we cannot treat it as confirmed.",
  value_malformed: "The value we read is not in a form we can show safely.",
  needs_current_confirmation: "This changes over time. Confirm it with your insurer or hospital.",
  controlling_sources_disagree: "Two parts of your documents disagree.",
  cross_input_conflict: "Your answer and your documents disagree.",
  waiting_period_not_established: "The waiting period itself is not confirmed yet.",
  continuity_not_evidenced: "Nothing confirms that your cover ran without a break.",
  as_of_date_missing: "This needs an exact date to work out.",
  cover_interrupted: "The documents suggest a break in cover.",
  continuity_citations_missing: "Nothing citable confirms that your cover ran without a break.",
  completion_not_established: "We cannot tell whether this waiting period is over.",
  member_not_identified: "We do not know which family member this is about.",
  relation_reported_member_not_selected: "You named a relation, but not which family member it is.",
  member_enrolment_not_evidenced: "Nothing in the documents we read shows this person is insured.",
  insured_members_not_evidenced: "Nothing in the documents we read lists who is insured.",
  enrolment_unverified: "We read something about who is insured, but nobody has confirmed it.",
  enrolment_not_evidenced: "Nothing in the documents we read shows this person is insured.",
  enrolment_evidence_conflicting: "The documents disagree about whether this person is insured.",
  topic_evidence_absent: `We did not find terms for your topic in the document we read. ${NOT_FOUND_NOT_EXCLUDED}`,
  reported_policy_type_unverified: "You told us the policy type, but the document does not confirm it.",
  reported_policy_type_differs_from_evidence: "The policy type you told us differs from what the document shows.",
  open_ended_finding_unreviewed: "We read this from the document, but it has not been confirmed.",
  open_ended_finding_member_and_date_scope_not_established: "We cannot tell which person or dates this applies to.",
  no_reviewed_contractual_evidence: "Nothing has been reviewed or confirmed yet.",
  not_stated_in_this_policys_evidence: `This policy's evidence does not state it. ${NOT_FOUND_NOT_EXCLUDED}`,
  source_stale_or_invalid: "A document behind this changed or needs reading again.",
  no_eligible_current_source: "There is no current document we can use.",
  processing_version_not_current: "This was read by an older version of our reader and needs reading again.",
  scope_mismatch: "This was prepared for a different person or date.",
  handoff_contract_failed: "We could not read this evidence safely.",
  source_unavailable: "The document behind this is not available now.",
};

export function notConfirmedReason(code: string | null | undefined): string {
  if (!code) return "We could not confirm this from the document.";
  return NOT_CONFIRMED_REASONS[code] ?? "We could not confirm this from the document.";
}

export const POLICY_KIND_LABELS: Record<string, string> = {
  personal: "Individual policy",
  family_floater: "Family floater",
  group: "Group policy",
  top_up: "Top-up policy",
  super_top_up: "Super top-up policy",
  unresolved: "Policy type not confirmed",
};

export function policyKindLabel(kind: string | null | undefined): string {
  return (kind && POLICY_KIND_LABELS[kind]) || POLICY_KIND_LABELS.unresolved;
}

export const SCENARIO_OPTIONS = [
  { value: "general_benefit", label: "A benefit or situation", hint: "For example a treatment, a room type or a waiting period." },
  { value: "planned_procedure", label: "A planned procedure", hint: "An operation or treatment you are planning." },
  { value: "cashless_information", label: "Cashless treatment at a hospital", hint: "We cannot check hospital networks. We can tell you what to ask." },
  { value: "emergency_admission", label: "An emergency admission", hint: "Seek care first. Nothing here delays care." },
  { value: "policy_comparison", label: "Comparing my policies", hint: "Needs two policy documents." },
] as const;
export type ScenarioType = (typeof SCENARIO_OPTIONS)[number]["value"];
