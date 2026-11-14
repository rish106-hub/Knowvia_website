import { describe, expect, it } from "vitest";
import { fromCard, fromLegacyAnswer } from "@/lib/beta/adapter";

// The backend's guard-released answer-card/v1 is used as-is after a field-by-field re-check; anything else falls back to text.
const card = {
  contract: "answer-card/v1", status: "evidence_found", verdict: "unknown", ruleResultId: null,
  headline: "Listed surgeries have a waiting period of 24 months.", explanation: "It runs from the policy start date.",
  conditions: [], sources: [{ id: "w-1", factIds: [], tier: "own_pdf", status: "extracted_unverified", page: 4, clause: null, quote: "covered after a waiting period of 24 months" }],
  actions: [], followups: [], speech: null, answer: "x", legalReview: "pending",
};

describe("fromCard", () => {
  it("keeps a released card's fields", () => {
    const c = fromCard(card)!;
    expect(c.headline).toBe(card.headline);
    expect(c.sources[0]).toMatchObject({ id: "w-1", page: 4, tier: "own_pdf" });
  });
  it("returns null for anything that is not an answer-card/v1", () => {
    for (const bad of [null, "text", {}, { ...card, contract: "v2" }, { ...card, headline: "" }]) expect(fromCard(bad)).toBeNull();
  });
  it("clamps sizes and unknown enum values", () => {
    const c = fromCard({ ...card, headline: "h".repeat(200), verdict: "approved", sources: Array.from({ length: 12 }, (_, i) => ({ ...card.sources[0], id: `s${i}`, tier: "web" })) })!;
    expect(c.headline.length).toBe(90);
    expect(c.verdict).toBe("unknown");
    expect(c.sources).toHaveLength(8);
    expect(c.sources[0].tier).toBe("own_pdf");
  });
  it("keeps a contact only on call_insurer with a guard contactId", () => {
    const contact = { kind: "phone", value: "1800-000-0001" };
    const c = fromCard({ ...card, actions: [
      { kind: "call_insurer", label: "Call your insurer", contactId: "c1", contact },
      { kind: "find_hospital", label: "Find a hospital", contactId: "c1", contact },
      { kind: "call_insurer", label: "Call", contact },
    ] })!;
    expect(c.actions[0].contact).toEqual(contact);
    expect(c.actions[1].contact).toBeUndefined();
    expect(c.actions[2].contact).toBeUndefined();
  });
  it("older backends with no card still map from text", () => {
    expect(fromLegacyAnswer({ status: "unknown", answer: "", sources: [] }).status).toBe("unknown");
  });
});
