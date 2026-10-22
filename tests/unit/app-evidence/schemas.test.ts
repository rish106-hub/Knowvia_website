import { describe, expect, it } from "vitest";
import { parseAnswerEnvelope, parseHandoff, parsePreview } from "@/lib/app-evidence";
import { answerEnvelope, handoffUnverified, previewBase } from "./fixtures";

describe("parseHandoff fails closed", () => {
  it("accepts the real shape", () => expect(parseHandoff(handoffUnverified())).not.toBeNull());
  it.each([null, undefined, "x", 7, [], {}, { handoffVersion: "decision-handoff/v2", policies: [] }])("refuses %j", (raw) => expect(parseHandoff(raw)).toBeNull());
  it("refuses a handoff that sums cover", () => expect(parseHandoff(handoffUnverified({ combinedConfirmedCover: { amountMinor: 1 } }))).toBeNull());
  it("refuses a policy that is not marked non-spendable", () => {
    const h = handoffUnverified();
    (h.policies[0] as Record<string, unknown>).spendableCash = true;
    expect(parseHandoff(h)).toBeNull();
  });
  it("drops and counts a malformed item instead of guessing", () => {
    const h = handoffUnverified();
    h.policies[0].items.push({ rule: 5 } as never);
    const parsed = parseHandoff(h)!;
    expect(parsed.dropped).toBe(1);
    expect(parsed.policies[0].items.length).toBe(4);
  });
  it("ignores unknown extra keys", () => {
    const h = handoffUnverified({ somethingNew: { a: 1 } });
    expect(parseHandoff(h)).not.toBeNull();
  });
});

describe("parseAnswerEnvelope", () => {
  it("accepts the real shape", () => expect(parseAnswerEnvelope(answerEnvelope())?.answerId).toBe("ans-synth-1"));
  it.each([null, "x", {}, { answerId: "a" }, { answerId: "", answer: {} }])("refuses %j", (raw) => expect(parseAnswerEnvelope(raw)).toBeNull());
  it("drops sources without a quote rather than inventing one", () => {
    const parsed = parseAnswerEnvelope(answerEnvelope({ sources: [{ documentId: "d", page: 1 }, { documentId: "d", page: 2, quote: "q", clauseId: "c" }] }))!;
    expect(parsed.answer.sources.length).toBe(1);
    expect(parsed.answer.dropped).toBe(1);
  });
});

describe("parsePreview fails closed", () => {
  it("accepts the real shape", () => expect(parsePreview(previewBase())).not.toBeNull());
  it.each([null, "x", {}, { contractVersion: "household-coverage-preview/v2" }])("refuses %j", (raw) => expect(parsePreview(raw)).toBeNull());
  it("maps an unknown assessment state to 'unrecognised'", () => expect(parsePreview(previewBase({ assessmentState: "covered" }))!.assessmentState).toBe("unrecognised"));
});
