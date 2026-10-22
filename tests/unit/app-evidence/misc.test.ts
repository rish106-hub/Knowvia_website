import { describe, expect, it } from "vitest";
import { answerIsGone, deriveQuestionKey, deriveReviewKey, describeError, documentSetKey, formatRupees, formatValue, loadStoredAnswer, saveStoredAnswer, clearStoredAnswer, bumpGeneration, loadGeneration, type StorageLike } from "@/lib/app-evidence";

const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};

describe("idempotency keys", () => {
  it("is stable for the same case, documents (any order, duplicates) and generation", async () => {
    const a = await deriveQuestionKey("c1", ["d2", "d1", "d1"]);
    expect(a).toBe(await deriveQuestionKey("c1", ["d1", "d2"]));
    expect(a).toMatch(/^kv-q-[0-9a-f]{48}$/);
    expect(a.length).toBeGreaterThanOrEqual(8);
    expect(a.length).toBeLessThanOrEqual(200);
  });
  it("changes with the case, the documents or the generation", async () => {
    const base = await deriveQuestionKey("c1", ["d1"]);
    expect(await deriveQuestionKey("c2", ["d1"])).not.toBe(base);
    expect(await deriveQuestionKey("c1", ["d1", "d2"])).not.toBe(base);
    expect(await deriveQuestionKey("c1", ["d1"], 1)).not.toBe(base);
    expect(await documentSetKey("c1", ["d1"])).not.toBe(await documentSetKey("c1", ["d2"]));
  });
  it("review keys are stable per fact and decision", async () => {
    expect(await deriveReviewKey("c", "a", "f", "accepted")).toBe(await deriveReviewKey("c", "a", "f", "accepted"));
    expect(await deriveReviewKey("c", "a", "f", "accepted")).not.toBe(await deriveReviewKey("c", "a", "f", "rejected"));
  });
});

describe("storage", () => {
  it("round-trips, clears and survives corrupt or missing storage", () => {
    const s = memory();
    saveStoredAnswer(s, "c1", { answerId: "a1", docSet: "x" });
    expect(loadStoredAnswer(s, "c1")).toEqual({ answerId: "a1", docSet: "x" });
    clearStoredAnswer(s, "c1");
    expect(loadStoredAnswer(s, "c1")).toBeNull();
    s.data.set("kv.cover.answer.c2", "{not json");
    expect(loadStoredAnswer(s, "c2")).toBeNull();
    expect(loadStoredAnswer(null, "c1")).toBeNull();
    expect(() => saveStoredAnswer(null, "c1", { answerId: "a", docSet: "b" })).not.toThrow();
    expect(bumpGeneration(s, "c1")).toBe(1);
    expect(loadGeneration(s, "c1")).toBe(1);
  });
});

describe("errors", () => {
  it("maps consent and not-found to recovery paths and never shows backend text", () => {
    expect(describeError({ status: 403, code: "CONSENT_REQUIRED", message: "SECRET backend text" }, "answer").recovery).toBe("consent");
    expect(describeError({ status: 404, code: "POLICY_EVIDENCE_NOT_FOUND" }, "handoff").recovery).toBe("ask_again");
    expect(describeError({ status: 0, code: "NETWORK_UNREACHABLE", retryable: true }, "ask").recovery).toBe("retry");
    expect(describeError({ status: 401, code: "SESSION_EXPIRED" }, "overview").recovery).toBe("sign_in");
    expect(describeError({ status: 400, code: "HOUSEHOLD_SCENARIO_CONTRADICTORY" }, "preview").recovery).toBe("change_answer");
    expect(describeError({ status: 404, code: "NOT_FOUND" }, "review").recovery).toBe("none");
    expect(JSON.stringify(describeError({ code: "X", message: "SECRET backend text" }, "ask"))).not.toContain("SECRET");
    expect(describeError(new Error("boom"), "ask").recovery).toBe("retry");
    expect(answerIsGone({ code: "POLICY_EVIDENCE_NOT_FOUND" })).toBe(true);
    expect(answerIsGone({ code: "BACKEND_TIMEOUT" })).toBe(false);
  });
});

describe("format", () => {
  it("groups rupees the Indian way and refuses bad input", () => {
    expect(formatRupees(50000000)).toBe("₹5,00,000");
    expect(formatRupees(30000000)).toBe("₹3,00,000");
    expect(formatRupees(12345678)).toBe("₹1,23,456.78");
    expect(formatRupees(-1)).toBeNull();
    expect(formatRupees(1.5)).toBeNull();
  });
  it("returns null for an unrecognised value shape instead of guessing", () => {
    expect(formatValue("sum_insured", { amountMinor: "5" })).toBeNull();
    expect(formatValue("sum_insured", "500000")).toBeNull();
    expect(formatValue("mystery_rule", { a: 1 })).toBeNull();
    expect(formatValue("waiting_period", { months: 36 })).toBe("Waiting period 36 months");
    expect(formatValue("copay", { basisPoints: 1000 })).toBe("Co-payment 10%");
  });
});
