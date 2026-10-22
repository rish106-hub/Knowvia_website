import { describe, expect, it } from "vitest";
import { buildPreviewRequest, initialScenario, sanitiseScenario, scenarioReducer, validateAnswerValue, visibleQuestions, journeyCount, parsePreview } from "@/lib/app-evidence";
import { MEMBER_ID, previewBase, qDate, qMember } from "./fixtures";

const apply = (s = initialScenario(), ...actions: Parameters<typeof scenarioReducer>[1][]) => actions.reduce(scenarioReducer, s);

describe("scenario reducer", () => {
  it("accumulates answers, skips and 'I do not know' with the wire sentinels", () => {
    const s = apply(initialScenario(), { type: "answer", key: "member_id", value: MEMBER_ID }, { type: "skip", key: "exact_date" }, { type: "unknown", key: "hospital_name" });
    expect(s.answers).toEqual({ member_id: MEMBER_ID, exact_date: "SKIPPED", hospital_name: "I_DO_NOT_KNOW" });
  });
  it("rejects invalid values and unsupported keys without changing state", () => {
    const s0 = initialScenario();
    expect(scenarioReducer(s0, { type: "answer", key: "exact_date", value: "2026-02-30" })).toBe(s0);
    expect(scenarioReducer(s0, { type: "answer", key: "exact_date", value: "tomorrow" })).toBe(s0);
    expect(scenarioReducer(s0, { type: "answer", key: "policy_schedule_available", value: "MAYBE" })).toBe(s0);
    expect(scenarioReducer(s0, { type: "answer", key: "verified", value: "YES" })).toBe(s0);
    expect(scenarioReducer(s0, { type: "answer", key: "topic_detail", value: "x".repeat(161) })).toBe(s0);
    expect(scenarioReducer(s0, { type: "answer", key: "topic_detail", value: "ab" + String.fromCharCode(0x202e) + "cd" })).toBe(s0);
    expect(scenarioReducer(s0, { type: "answer", key: "topic_detail", value: "SKIPPED" })).toBe(s0);
  });
  it("enforces the 5-question journey budget but still lets a known key be changed", () => {
    let s = apply(initialScenario(), ...(["member_id", "exact_date", "topic_detail", "hospital_name", "hospital_city"] as const).map((key) => ({ type: "skip" as const, key })));
    expect(journeyCount(s.answers)).toBe(5);
    expect(scenarioReducer(s, { type: "skip", key: "hospital_branch" })).toBe(s);
    s = scenarioReducer(s, { type: "answer", key: "exact_date", value: "2026-12-01" });
    expect(s.answers.exact_date).toBe("2026-12-01");
  });
  it("a volunteered-only key does not count against the budget", () => {
    const s = apply(initialScenario(), { type: "answer", key: "uninterrupted_cover_reported", value: "YES" });
    expect(journeyCount(s.answers)).toBe(0);
  });
  it("undo removes an answer so a contradiction can be fixed", () => {
    const s = apply(initialScenario(), { type: "skip", key: "exact_date" }, { type: "undo", key: "exact_date" });
    expect(s.answers).toEqual({});
  });
  it("sanitises a restored state and drops anything unexpected", () => {
    expect(sanitiseScenario({ scenarioType: "planned_procedure", answers: { exact_date: "2026-12-01", evil: "x", member_id: 5, topic_detail: "ok" } })).toEqual({ scenarioType: "planned_procedure", answers: { exact_date: "2026-12-01", topic_detail: "ok" } });
    expect(sanitiseScenario({ scenarioType: "bogus", answers: {} })).toBeNull();
    expect(sanitiseScenario("x")).toBeNull();
  });
  it("validates by type", () => {
    expect(validateAnswerValue("exact_date", "2026-12-01").ok).toBe(true);
    expect(validateAnswerValue("member_id", "bad id!").ok).toBe(false);
    expect(validateAnswerValue("other_policy_available", "YES").ok).toBe(true);
    expect(validateAnswerValue("nope", "x").ok).toBe(false);
  });
});

describe("request building", () => {
  it("sends only the closed contract fields: version, sources, scenarioType and answers", () => {
    const body = buildPreviewRequest([{ caseId: "c", answerId: "a" }], apply(initialScenario("planned_procedure"), { type: "skip", key: "exact_date" }));
    expect(body).toEqual({ contractVersion: "household-scenario/v1", sources: [{ caseId: "c", answerId: "a" }], scenario: { scenarioType: "planned_procedure", answers: { exact_date: "SKIPPED" } } });
  });
  it("sends at most five sources", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ caseId: `c${i}`, answerId: `a${i}` }));
    expect(buildPreviewRequest(many, initialScenario()).sources).toHaveLength(5);
  });
});

describe("visibleQuestions", () => {
  it("returns at most two and uses the preview budget", () => {
    const p = parsePreview(previewBase({ nextQuestions: [qMember, qDate] }))!;
    expect(visibleQuestions(p, initialScenario()).map((q) => q.questionId)).toEqual(["Q_MEMBER", "Q_EXACT_DATE"]);
    const exhausted = parsePreview(previewBase({ completeness: { questionBudget: { perTurnLimit: 2, journeyLimit: 5, usedInJourney: 5, remainingInJourney: 0, exhausted: true } } }))!;
    expect(visibleQuestions(exhausted, initialScenario())).toEqual([]);
  });
});
