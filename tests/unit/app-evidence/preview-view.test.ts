import { describe, expect, it } from "vitest";
import { buildPreviewView, initialScenario, parseAnswerEnvelope, parsePreview, prioritiseActions, type DocumentLite } from "@/lib/app-evidence";
import { DOC_ID, MEMBER_ID, answerEnvelope, previewBase, previewConditional, previewConflicting, previewPolicy, previewStale, qDate, qMember, qSchedule } from "./fixtures";

const docs: DocumentLite[] = [{ id: DOC_ID, documentKind: "policy_wording", uploadedAt: null }];
const members = [{ id: MEMBER_ID, displayName: "Asha (example)" }];
const answer = parseAnswerEnvelope(answerEnvelope())!.answer;
const build = (raw: unknown, scenario = initialScenario()) => buildPreviewView({ preview: parsePreview(raw)!, scenario, documents: docs, members, answer });

describe("preview view: states", () => {
  it("insufficient_evidence: no known facts, unverified is not known, dynamic is Not checked", () => {
    const v = build(previewBase());
    expect(v.banner.tone).toBe("empty");
    const p = v.policies[0];
    expect(p.facts).toHaveLength(0);
    expect(p.uncertainties.find((c) => c.statement === "Room rent limit")!.kind).toBe("from_document");
    expect(p.uncertainties.find((c) => c.statement === "Sum insured")!.kind).toBe("not_confirmed");
    expect(p.notChecked.map((c) => c.stateLabel)).toEqual(["Not checked"]);
    expect(p.notChecked[0].why).toMatch(/Confirm with your insurer or hospital/);
    expect(p.memberCard.kind).toBe("not_confirmed");
  });
  it("conditional: shows documented terms with citations and the member as listed, plus the limit-is-not-cash note", () => {
    const v = build(previewConditional());
    expect(v.banner.tone).toBe("partial");
    const p = v.policies[0];
    expect(p.memberCard).toMatchObject({ kind: "known" });
    expect(p.memberCard.statement).toBe("Asha (example) is listed as insured");
    const sum = p.facts.find((c) => c.statement.startsWith("Sum insured"))!;
    expect(sum.kind).toBe("known");
    expect(sum.statement).toBe("Sum insured ₹5,00,000");
    expect(sum.note).toMatch(/not cash/i);
    expect(sum.citations[0].pageLabel).toBe("Page 4");
    expect(p.facts.find((c) => c.statement.startsWith("Waiting period"))!.stateDetail).toMatch(/Documented limit or condition/);
  });
  it("conflicting evidence is shown as a conflict and the banner says we are not choosing", () => {
    const v = build(previewConflicting());
    expect(v.banner.tone).toBe("conflict");
    expect(v.policies[0].uncertainties[0].kind).toBe("conflicting");
    expect(v.nextAction?.actionType).toBe("independent_review");
  });
  it("a stale source gives a recovery path and no questions or next action", () => {
    const v = build(previewStale());
    expect(v.needsRecovery).toBe(true);
    expect(v.banner.tone).toBe("recover");
    expect(v.questions).toEqual([]);
    expect(v.nextAction).toBeNull();
  });
  it("an unusable source in the summary forces recovery even if the state looks fine", () => {
    const raw = previewBase({ assessmentState: "evidence_summary_available", sourceSummary: { sources: [{ sourceIndex: 0, status: "invalid", reasonCode: "scope_mismatch" }] } });
    expect(build(raw).needsRecovery).toBe(true);
  });
});

describe("preview view: never upgrade", () => {
  it("a documented term lacking reviewed provenance, citation or a verified association is not 'known'", () => {
    const term = (extra: Record<string, unknown>) => ({ rule: "sum_insured", topic: "", state: "known", value: { amountMinor: 100, currency: "INR" }, conditions: [], exceptions: [], overrides: [], conditional: false, provenance: "reviewed_contractual_evidence", citations: [{ documentId: DOC_ID, page: 1, clauseIds: ["cl-room"], sourceType: "x" }], ...extra });
    const cases: Array<[Record<string, unknown>, Record<string, unknown>]> = [
      [{ provenance: "unverified_extraction" }, { associationState: "verified" }],
      [{ citations: [] }, { associationState: "verified" }],
      [{}, { associationState: "candidate_unverified" }],
      [{}, { associationState: "unresolved" }],
    ];
    for (const [t, pol] of cases) {
      const raw = previewBase({ policies: [previewPolicy({ documentedTerms: [term(t)], ...pol })] });
      expect(build(raw).policies[0].facts[0].kind).toBe("from_document");
    }
  });
  it("a member is 'established' only with citations and a verified association", () => {
    const raw = previewBase({ policies: [previewPolicy({ associationState: "verified", memberApplicability: { state: "established", reasonCode: "x", citations: [] } })] });
    expect(build(raw).policies[0].memberCard.kind).toBe("not_confirmed");
  });
  it("dynamic checks and external checks are never shown as performed, even if the server says so", () => {
    const raw = previewBase({
      policies: [previewPolicy({ uncertainties: [], dynamicChecks: [{ rule: "network_status", topic: "", requires: "x", status: "performed", provenance: "x" }] })],
      externalChecks: [{ checkId: "hospital_network_status", status: "completed", requires: "current confirmation", note: null }],
    });
    const v = build(raw);
    expect(v.policies[0].notChecked[0].kind).toBe("not_checked");
    expect(v.externalChecks[0].text).toMatch(/^Not checked\./);
    expect(JSON.stringify(v)).not.toMatch(/\b(completed|performed)\b/i);
  });
  it("an action reported as completed is still shown as 'Not done yet'", () => {
    const raw = previewBase({ nextActions: [{ actionType: "insurer_or_tpa_confirmation", reasonCode: "x", text: "Ask the insurer.", status: "completed", relatedGapKeys: [] }], nextQuestions: [] });
    expect(build(raw).nextAction?.statusLabel).toBe("Not done yet");
  });
  it("never states a payout, approval or cash figure", () => {
    const text = JSON.stringify(build(previewConditional()));
    expect(text).not.toMatch(/will be (approved|paid)|cashless is available|you will receive|spendable|expected reimbursement|payable amount/i);
  });
});

describe("preview view: next action and questions", () => {
  it("picks exactly one primary action by gap priority (P0 before P1), the rest are secondary", () => {
    const parsed = parsePreview(previewBase())!;
    const { primary, rest } = prioritiseActions(parsed);
    expect(primary?.actionType).toBe("provide_context"); // P0 gap beats the P1 review gap
    expect(rest.map((a) => a.actionType)).toEqual(["independent_review", "insurer_or_tpa_confirmation"]);
    const v = build(previewBase());
    expect(v.nextAction?.target).toBe("questions");
    expect(v.otherActions).toHaveLength(2);
  });
  it("'nothing more to add' is primary only when it is the only action", () => {
    const only = previewBase({ nextActions: [{ actionType: "no_further_context_needed", reasonCode: "no_open_context_gaps", text: "No further context is needed.", status: "pending", relatedGapKeys: [] }], nextQuestions: [] });
    expect(build(only).nextAction?.statusLabel).toBeNull();
    const both = previewBase({ nextActions: [...(previewBase().nextActions as unknown[]), { actionType: "no_further_context_needed", reasonCode: "r", text: "t", status: "pending", relatedGapKeys: [] }] });
    expect(build(both).nextAction?.actionType).not.toBe("no_further_context_needed");
  });
  it("shows at most two questions", () => {
    const raw = previewBase({ nextQuestions: [qMember, qDate, qSchedule] });
    expect(build(raw).questions.map((q) => q.questionId)).toEqual(["Q_MEMBER", "Q_EXACT_DATE"]);
  });
  it("drops a question already answered locally, an unknown question and a mismatched id", () => {
    const raw = previewBase({ nextQuestions: [qMember, { ...qDate, questionKey: "totally_new" }, { ...qSchedule, questionId: "Q_MEMBER" }] });
    const v = build(raw, { scenarioType: "general_benefit", answers: { member_id: "SKIPPED" } });
    expect(v.questions).toEqual([]);
  });
  it("shows no question once the journey budget is spent", () => {
    const answers = { member_id: "SKIPPED", exact_date: "SKIPPED", topic_detail: "x", hospital_name: "y", hospital_city: "z" };
    expect(build(previewBase({ nextQuestions: [qSchedule] }), { scenarioType: "general_benefit", answers }).questions).toEqual([]);
    const v = build(previewBase(), { scenarioType: "general_benefit", answers });
    expect(v.budget).toMatchObject({ used: 5, limit: 5, exhausted: true });
  });
  it("overlap text never combines limits", () => {
    const raw = previewBase({ comparisons: { possibleOverlap: [{ rule: "room_rent_limit", topic: "", policies: [{}, {}], note: "x" }], unresolvedCoordination: [{ text: "Limits are not added." }] } });
    const v = build(raw);
    expect(v.overlaps[0]).toMatch(/limits are not added/);
    expect(v.coordinationNotes).toEqual(["Limits are not added."]);
  });
});
