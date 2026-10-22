// SYNTHETIC fixtures shaped like the real CoverSaath payloads (block4/household-reasoning): policy-evidence answer,
// decision-handoff/v1 and household-coverage-preview/v1. No real person, policy or document data.
export const CASE_ID = "case-synth-1";
export const ANSWER_ID = "ans-synth-1";
export const DOC_ID = "doc-synth-wording";
export const DOC_ID_2 = "doc-synth-schedule";
export const MEMBER_ID = "mem-synth-owner";
export const ADULT_ID = "adult-synth-owner";

export const QUOTE_ROOM = "Room rent is limited to 1% of the sum insured per day, subject to the plan schedule.";
export const QUOTE_WAIT = "Pre-existing conditions are covered after a waiting period of 36 months of continuous cover.";
export const QUOTE_EXCL = "Treatment for cosmetic procedures is excluded unless required after an accident.";

export function answerEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    answerId: ANSWER_ID,
    replayed: false,
    answer: {
      question: "What does this policy document say?",
      state: "conditional",
      covered: [
        { findingId: "f-wait", subject: "Pre-existing conditions", quote: QUOTE_WAIT, clauseIds: ["cl-wait"], pages: [7], effect: "covers", conditions: ["After 36 months of continuous cover"], exceptions: [], overrides: [] },
      ],
      limited_or_excluded: [
        { findingId: "f-room", subject: "Room rent", quote: QUOTE_ROOM, clauseIds: ["cl-room"], pages: [4], effect: "limits", conditions: [], exceptions: [], overrides: [] },
        { findingId: "f-cos", subject: "Cosmetic procedures", quote: QUOTE_EXCL, clauseIds: ["cl-cos"], pages: [12], effect: "excludes", conditions: [], exceptions: ["Accident-related treatment"], overrides: [] },
      ],
      conditions: [],
      overrides_checked: [{ kind: "override_sweep", status: "completed" }],
      unknowns: ["No clause labelled endorsement by the keyword classifier was retrieved; such terms may be in policy text that was not read."],
      calculations: [],
      sources: [
        { documentId: DOC_ID, page: 7, quote: QUOTE_WAIT, clauseId: "cl-wait", verbatim: true },
        { documentId: DOC_ID, page: 4, quote: QUOTE_ROOM, clauseId: "cl-room", verbatim: true },
        { documentId: DOC_ID, page: 12, quote: QUOTE_EXCL, clauseId: "cl-cos", verbatim: false },
      ],
      documentIds: [DOC_ID],
      pipelineVersion: "v-synth",
      legalReview: "required",
      ...overrides,
    },
  };
}

const cite = (clauseId: string, page: number, factId = "fact-x") => ({ factId, documentId: DOC_ID, sourceVersion: "1", page, clauseIds: [clauseId], sourceType: "user_statement" });

export const missingItem = (rule: string, topic = "") => ({
  policyId: "pol-1", rule, topic, state: "missing", value: null, candidateValue: null, reason: "no_applicable_evidence", citations: [], conditions: [], exceptions: [], overrides: [],
  conflicting: [], discrepancies: [], associationVerified: false, conditional: false,
});

export function openFinding(factId: string, topic: string, effect: string, clauseId: string, page: number, extra: Record<string, unknown> = {}) {
  return {
    factId, policyId: "pol-1", factType: `finding.${effect}`, topic: topic.toLowerCase(), state: "extracted_unverified", verified: false, effect,
    citations: [{ clauseId, documentId: DOC_ID, sourceVersion: "1", page, digest: "d" }], conditions: [], exceptions: [], overrides: [], ...extra,
  };
}

/** The realistic case today: one unresolved, unverified policy; nothing is known; findings are model extractions. */
export function handoffUnverified(overrides: Record<string, unknown> = {}) {
  return {
    handoffVersion: "decision-handoff/v1",
    catalogueVersion: "decision-catalogue/v1",
    processing: { sourceAnswerId: ANSWER_ID, pipelineCurrent: true },
    asOf: null,
    memberId: null,
    policies: [
      {
        policyId: "pol-1", kind: "unresolved", coverBasis: "unknown", spendableCash: false, association: { verified: false, documents: [{ documentId: DOC_ID, status: "candidate", basis: "single_policy_number" }] },
        items: [
          missingItem("sum_insured"),
          { ...missingItem("room_rent_limit"), state: "unverified", candidateValue: { kind: "percent_of_sum_insured", basisPoints: 100 }, reason: "value_not_verified", citations: [cite("cl-room", 4)] },
          missingItem("copay"),
          { ...missingItem("network_status"), state: "dynamic_check", candidateValue: { provider: "x", status: "network" }, reason: "needs_current_confirmation" },
        ],
      },
    ],
    openEndedFindings: [
      openFinding("fact-wait", "Pre-existing conditions", "covers", "cl-wait", 7, { conditions: ["After 36 months of continuous cover"] }),
      openFinding("fact-room", "Room rent", "limits", "cl-room", 4),
      openFinding("fact-cos", "Cosmetic procedures", "excludes", "cl-cos", 12, { exceptions: ["Accident-related treatment"] }),
    ],
    conflicts: [],
    unassociatedFactIds: [],
    reviews: [],
    reviewRequired: true,
    dynamicChecks: [{ policyId: "pol-1", rule: "network_status", topic: "", requires: "current confirmation from the insurer, TPA or hospital" }],
    officialSources: [],
    coordination: [],
    combinedConfirmedCover: null,
    completeness: { retrievalComplete: false, itemCounts: {}, openEndedFindings: 3, unverifiedFacts: 3 },
    limitations: ["Derived from the evidence supplied; retrieval completeness is not established."],
    ...overrides,
  };
}

/** A handoff with one genuinely known sum insured, a conflict and a decisive "not selected". */
export function handoffMixed() {
  const base = handoffUnverified();
  const policy = base.policies[0];
  return {
    ...base,
    policies: [
      {
        ...policy,
        kind: "group",
        association: { verified: true, documents: [] },
        items: [
          { ...missingItem("sum_insured"), state: "known", value: { amountMinor: 50000000, currency: "INR" }, reason: null, citations: [cite("cl-room", 4)], associationVerified: true },
          { ...missingItem("copay"), state: "conflicting", reason: "controlling_sources_disagree", citations: [cite("cl-wait", 7)], conflicting: [cite("cl-wait", 7)] },
          { ...missingItem("add_on", "maternity"), state: "not_selected", reason: null, citations: [cite("cl-cos", 12)], associationVerified: true },
          missingItem("deductible"),
          { ...missingItem("network_status"), state: "dynamic_check", reason: "needs_current_confirmation" },
        ],
      },
    ],
    openEndedFindings: [],
  };
}

export const reviewHousehold = (factId: string, state = "accepted") => ({ reviewId: `rev-${factId}`, factId, decision: "accepted", state, authority: "household", reasonCode: "matches_clause", reviewedAt: "2026-10-21T10:00:00Z" });
export const reviewIndependent = (factId: string) => ({ ...reviewHousehold(factId), authority: "independent", reviewId: `rev-ind-${factId}` });

// ---- preview ----

const budget = (used = 0) => ({ perTurnLimit: 2, journeyLimit: 5, usedInJourney: used, remainingInJourney: 5 - used, exhausted: used >= 5 });
export const qMember = { questionId: "Q_MEMBER", questionKey: "member_id", text: "Which insured family member is receiving treatment?", answerType: "member_id", allowedOptions: ["I_DO_NOT_KNOW", "SKIPPED"], required: false, skippable: true, priority: "P0", reasonCode: "member_not_identified", resolver: "USER", expectedEffect: "scopes_every_finding_to_one_member", alreadyAnswered: false };
export const qDate = { questionId: "Q_EXACT_DATE", questionKey: "exact_date", text: "Do you have an exact planned date for the procedure? If so, enter it as YYYY-MM-DD.", answerType: "date", allowedOptions: ["I_DO_NOT_KNOW", "SKIPPED"], required: false, skippable: true, priority: "P1", reasonCode: "date_could_change_applicability", resolver: "USER", expectedEffect: "lets_date_dependent_terms_be_checked", alreadyAnswered: false };
export const qSchedule = { questionId: "Q_POLICY_SCHEDULE", questionKey: "policy_schedule_available", text: "Do you have the policy schedule or insured-member list?", answerType: "yes_no", allowedOptions: ["YES", "NO", "I_DO_NOT_KNOW", "SKIPPED"], required: false, skippable: true, priority: "P0", reasonCode: "member_enrolment_not_evidenced", resolver: "DOCUMENT", expectedEffect: "identifies_a_document_that_can_establish_membership", alreadyAnswered: false };

const action = (actionType: string, reasonCode: string, text: string, relatedGapKeys: string[], extra: Record<string, unknown> = {}) => ({ actionType, reasonCode, text, status: "pending", relatedGapKeys, ...extra });

export function previewPolicy(overrides: Record<string, unknown> = {}) {
  return {
    policyId: "pol-0123456789abcdef",
    policyType: { kind: "unresolved", coverBasis: "unknown", resolved: false },
    associationState: "candidate_unverified",
    memberApplicability: { state: "member_not_specified", reasonCode: "member_not_identified", citations: [] },
    documentedTerms: [],
    documentedRestrictions: [],
    uncertainties: [
      { gapType: "evidence_gap", rule: "room_rent_limit", topic: "", state: "unverified", reasonCode: "value_not_verified", provenance: "unverified_extraction", candidateAvailable: true },
      { gapType: "evidence_gap", rule: "sum_insured", topic: "", state: "missing", reasonCode: "no_applicable_evidence", provenance: "unavailable" },
      { gapType: "dynamic_verification_needed", rule: "network_status", topic: "", state: "dynamic_check", reasonCode: "needs_current_confirmation", provenance: "dynamic_external_confirmation_required" },
    ],
    dynamicChecks: [{ rule: "network_status", topic: "", requires: "current confirmation from the insurer, TPA or hospital", status: "not_performed", provenance: "dynamic_external_confirmation_required" }],
    citations: [],
    limitations: ["Retrieval completeness is not established; absence of a term is not evidence that it does not exist."],
    sourceIndexes: [0],
    ...overrides,
  };
}

export function previewBase(overrides: Record<string, unknown> = {}) {
  return {
    contractVersion: "household-coverage-preview/v1",
    scenario: { scenarioType: "general_benefit", provenance: "user_reported", memberId: null, memberScope: "not_specified", answers: {} },
    sourceSummary: { requested: 1, usable: 1, revalidationRequired: 0, invalid: 0, policiesFound: 1, retrievalComplete: false, sources: [{ sourceIndex: 0, status: "usable", reasonCode: null, policyCount: 1 }] },
    policies: [previewPolicy()],
    comparisons: { possibleOverlap: [], unresolvedCoordination: [], documentedRestrictions: [], evidenceGaps: [] },
    contextGaps: [
      { gapKey: "member_unidentified", sourceClass: "user_context", expectedResolver: "USER", reason: "member_not_identified", impact: "applicability", priority: "P0", currentState: "unanswered", blocking: true, eligibleQuestionId: "Q_MEMBER", relatedPolicyIds: [], relatedRuleKeys: [] },
      { gapKey: "no_reviewed_evidence", sourceClass: "independent_review", expectedResolver: "REVIEW", reason: "no_reviewed_contractual_evidence", impact: "major_restriction", priority: "P1", currentState: "unreviewed_or_absent", blocking: true, eligibleQuestionId: null, relatedPolicyIds: [], relatedRuleKeys: [] },
      { gapKey: "policy_dynamic_checks_pending", sourceClass: "external_confirmation", expectedResolver: "DYNAMIC_EXTERNAL", reason: "policy_items_need_current_confirmation", impact: "dynamic_check_readiness", priority: "P2", currentState: "not_performed", blocking: false, eligibleQuestionId: null, relatedPolicyIds: [], relatedRuleKeys: [] },
    ],
    nextQuestions: [qMember, qDate],
    externalChecks: [{ checkId: "policy_item/network_status", status: "not_performed", resolver: "DYNAMIC_EXTERNAL", provenance: "dynamic_external_confirmation_required", requires: "current confirmation from the insurer, TPA or hospital", policyId: "pol-0123456789abcdef", topic: "", facility: null, note: null }],
    nextActions: [
      action("independent_review", "no_reviewed_contractual_evidence", "This needs independent human review of the cited evidence. No reviewer has been assigned by this preview.", ["no_reviewed_evidence"]),
      action("provide_context", "member_not_identified", "Answer the follow-up question; the answer is recorded as reported context only.", ["member_unidentified"], { questionId: "Q_MEMBER" }),
      action("insurer_or_tpa_confirmation", "policy_items_need_current_confirmation", "These items change over time and need current confirmation from the insurer or TPA. Not yet done.", ["policy_dynamic_checks_pending"]),
    ],
    assessmentState: "insufficient_evidence",
    completeness: { retrievalComplete: false, evidenceScope: "authorized_sources_only", questionBudget: budget(0), openBlockingGaps: 2, pendingExternalChecks: 1, unassociatedFacts: 0, reviewRequired: true },
    limitations: ["Evidence summary only. It is not a claim decision, an approval, a reimbursement estimate or advice on whether to buy a policy.", "Consent and privacy wording is pending legal review."],
    ...overrides,
  };
}

export function previewConditional() {
  const policy = previewPolicy({
    associationState: "verified",
    memberApplicability: { state: "established", reasonCode: "enrolment_documented", citations: [cite("cl-room", 4)] },
    documentedTerms: [
      { rule: "sum_insured", topic: "", state: "known", value: { amountMinor: 50000000, currency: "INR" }, selection: "selected_or_unspecified", conditions: [], exceptions: [], overrides: [], conditional: false, citations: [cite("cl-room", 4)], provenance: "reviewed_contractual_evidence", appliesToMember: "established", relevantToScenario: true },
    ],
    documentedRestrictions: [
      { rule: "waiting_period", topic: "pre-existing", state: "known", value: { months: 36 }, selection: "selected_or_unspecified", conditions: ["Continuous cover"], exceptions: [], overrides: [], conditional: true, citations: [cite("cl-wait", 7)], provenance: "reviewed_contractual_evidence", appliesToMember: "established", relevantToScenario: true, restrictionKind: "limit_or_condition" },
    ],
  });
  return previewBase({
    scenario: { scenarioType: "general_benefit", memberId: MEMBER_ID, memberScope: "specified", answers: { member_id: { state: "answered", value: MEMBER_ID, provenance: "user_reported" } } },
    policies: [policy],
    assessmentState: "conditional_evidence_summary",
    nextQuestions: [qDate],
    completeness: { retrievalComplete: false, questionBudget: budget(1), openBlockingGaps: 1 },
  });
}

export function previewConflicting() {
  return previewBase({
    assessmentState: "conflicting_evidence",
    policies: [previewPolicy({ uncertainties: [{ gapType: "evidence_gap", rule: "copay", topic: "", state: "conflicting", reasonCode: "controlling_sources_disagree", provenance: "unavailable" }] })],
    nextQuestions: [],
    nextActions: [action("independent_review", "conflicting_contract_evidence", "This needs independent human review of the cited evidence. No reviewer has been assigned by this preview.", ["source_conflict"])],
    contextGaps: [{ gapKey: "source_conflict", expectedResolver: "REVIEW", reason: "conflicting_contract_evidence", impact: "major_restriction", priority: "P0", currentState: "conflicting", blocking: true }],
  });
}

export function previewStale() {
  return previewBase({
    assessmentState: "source_revalidation_required",
    sourceSummary: { requested: 1, usable: 0, revalidationRequired: 1, invalid: 0, policiesFound: 0, retrievalComplete: false, sources: [{ sourceIndex: 0, status: "revalidation_required", reasonCode: "source_unavailable", policyCount: 0 }] },
    policies: [],
    nextQuestions: [],
    nextActions: [action("upload_document", "source_stale_or_invalid", "Upload the current version of the policy document so the evidence can be read again.", ["source_revalidation_required"])],
    contextGaps: [{ gapKey: "source_revalidation_required", expectedResolver: "DOCUMENT", reason: "source_stale_or_invalid", impact: "applicability", priority: "P0", currentState: "revalidation_required", blocking: true }],
  });
}

export const overviewFixture = (overrides: Record<string, unknown> = {}) => ({
  session: { expiresAt: "2026-10-22T20:00:00.000Z" },
  household: { id: "hh-synth-1", viewerRole: "owner" },
  owner: { adultId: ADULT_ID, memberId: MEMBER_ID },
  members: [{ id: MEMBER_ID, displayName: "Asha (example)", memberKind: "adult", relationshipLabel: "You", policiesFound: 1 }],
  cases: [{ id: CASE_ID }],
  documents: [{ id: DOC_ID, caseId: CASE_ID, documentKind: "policy_wording", byteSize: 120000, uploadedAt: "2026-10-13T09:00:00.000Z", stage: "readable", nextAction: "none", label: "Ready", backendStatus: "accepted", ocr: { status: "succeeded", errorCode: null, pageCount: 14 }, structuring: null, note: null }],
  consents: [],
  ...overrides,
});
