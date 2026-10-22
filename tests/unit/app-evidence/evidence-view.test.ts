import { describe, expect, it } from "vitest";
import { buildEvidenceView, documentLabeller, parseAnswerEnvelope, parseHandoff, type DocumentLite } from "@/lib/app-evidence";
import { ANSWER_ID, DOC_ID, answerEnvelope, handoffMixed, handoffUnverified, missingItem, reviewHousehold, reviewIndependent } from "./fixtures";

const docs: DocumentLite[] = [{ id: DOC_ID, documentKind: "policy_wording", uploadedAt: "2026-10-13T09:00:00.000Z" }];
const answer = () => parseAnswerEnvelope(answerEnvelope())!.answer;
const view = (handoff: unknown, ans = answer()) => buildEvidenceView({ answer: ans, handoff: parseHandoff(handoff), documents: docs });
const allCards = (v: ReturnType<typeof view>) => v.groups.flatMap((g) => [...g.facts, ...g.notConfirmed]);

describe("evidence view: states", () => {
  it("shows model extractions as 'From the document, not yet confirmed' with quote and page, never known", () => {
    const v = view(handoffUnverified());
    const cards = allCards(v);
    const room = cards.find((c) => c.statement === "Room rent" && c.id.startsWith("finding/"))!;
    expect(room.kind).toBe("from_document");
    expect(room.stateLabel).toBe("From the document, not yet confirmed");
    expect(room.citations[0]).toMatchObject({ pageLabel: "Page 4", clauseId: "cl-room", documentLabel: "Policy wording" });
    expect(room.citations[0].quote).toContain("1% of the sum insured");
    expect(v.counts.known).toBe(0);
    expect(cards.every((c) => c.kind !== "known")).toBe(true);
  });

  it("an unverified item is never rendered as known even when it carries a candidate value", () => {
    const v = view(handoffUnverified());
    const rent = allCards(v).find((c) => c.id === "p0/room_rent_limit/")!;
    expect(rent.kind).toBe("from_document");
    expect(rent.statement).not.toMatch(/\d/); // the candidate value is not displayed
  });

  it("missing items are 'Not confirmed' with a reason that never reads as an exclusion", () => {
    const v = view(handoffUnverified());
    const miss = v.groups[0].notConfirmed;
    expect(miss.map((c) => c.statement)).toEqual(expect.arrayContaining(["Sum insured", "Co-payment"]));
    for (const c of miss) {
      expect(c.kind).toBe("not_confirmed");
      expect(c.stateLabel).toBe("Not confirmed");
      expect(c.why).toMatch(/did not find|does not mean|could not confirm/i);
      expect(c.why).not.toMatch(/\bexcluded\b(?! or)/i);
    }
  });

  it("dynamic_check is 'Not checked', never complete", () => {
    const v = view(handoffUnverified());
    const net = allCards(v).filter((c) => c.id.includes("network_status"));
    expect(net.length).toBeGreaterThan(0);
    expect(net.every((c) => c.kind === "not_checked" && c.stateLabel === "Not checked")).toBe(true);
    expect(net[0].why).toMatch(/confirm it with your insurer or hospital/i);
  });

  it("renders a genuinely known value with its citation, a conflict and a decisive not-selected", () => {
    const v = view(handoffMixed());
    const cards = allCards(v);
    const sum = cards.find((c) => c.id === "p0/sum_insured/")!;
    expect(sum.kind).toBe("known");
    expect(sum.statement).toBe("Sum insured ₹5,00,000");
    expect(sum.note).toMatch(/not cash/i);
    expect(sum.citations.length).toBe(1);
    expect(cards.find((c) => c.id === "p0/copay/")!.kind).toBe("conflicting");
    expect(cards.find((c) => c.id === "p0/add_on/maternity")!).toMatchObject({ kind: "known", stateDetail: "Documented: not selected on your schedule" });
    expect(v.groups[0].facts[0].kind).toBe("conflicting"); // conflicts sort first
  });
});

describe("evidence view: never upgrade", () => {
  const withItem = (item: Record<string, unknown>, policyVerified = true) => {
    const h = handoffMixed();
    h.policies[0] = { ...h.policies[0], association: { verified: policyVerified, documents: [] }, items: [item as never] } as never;
    return view(h);
  };
  const known = { ...missingItem("sum_insured"), state: "known", value: { amountMinor: 100, currency: "INR" }, reason: null, associationVerified: true, citations: [{ documentId: DOC_ID, page: 2, clauseIds: ["cl-room"], sourceType: "x" }] };

  it("known without citations is downgraded", () => {
    expect(allCards(withItem({ ...known, citations: [] }))[0].kind).toBe("from_document");
  });
  it("known without associationVerified is downgraded", () => {
    expect(allCards(withItem({ ...known, associationVerified: false }))[0].kind).toBe("from_document");
  });
  it("known under an unverified policy association is downgraded", () => {
    expect(allCards(withItem(known, false))[0].kind).toBe("from_document");
  });
  it("known with a null value is downgraded", () => {
    expect(allCards(withItem({ ...known, value: null }))[0].kind).toBe("from_document");
  });
  it("decisive not_permitted without a citation is downgraded", () => {
    expect(allCards(withItem({ ...known, state: "not_permitted", value: null, citations: [] }))[0].kind).toBe("from_document");
  });
  it("an unrecognised state becomes 'Not confirmed'", () => {
    const c = allCards(withItem({ ...known, state: "approved_by_insurer", value: null })).find((card) => card.id === "p0/sum_insured/")!;
    expect(c.kind).toBe("not_confirmed");
  });
  it("an unverified finding stays unconfirmed even if the backend sets state 'proven' without an independent review", () => {
    const h = handoffUnverified();
    h.openEndedFindings[0] = { ...h.openEndedFindings[0], state: "proven", verified: true } as never;
    const card = allCards(view(h)).find((c) => c.id === `finding/fact-wait`)!;
    expect(card.kind).toBe("from_document");
  });
});

describe("evidence view: reviews", () => {
  it("household acceptance is labelled 'Confirmed by you', not verified", () => {
    const h = handoffUnverified({ reviews: [reviewHousehold("fact-room")] });
    const card = allCards(view(h)).find((c) => c.id === "finding/fact-room")!;
    expect(card.kind).toBe("confirmed_by_you");
    expect(card.stateLabel).toBe("Confirmed by you");
    expect(card.stateDetail).toMatch(/not verified by Knowvia or your insurer/);
    expect(card.confirm).toBeNull();
    expect(JSON.stringify(card)).not.toMatch(/\bverified\b(?! by Knowvia)/i);
  });
  it("a stale or reviewer_revoked review does not count", () => {
    const h = handoffUnverified({ reviews: [reviewHousehold("fact-room", "stale"), reviewHousehold("fact-wait", "reviewer_revoked")] });
    const cards = allCards(view(h));
    expect(cards.find((c) => c.id === "finding/fact-room")!.kind).toBe("from_document");
    expect(cards.find((c) => c.id === "finding/fact-wait")!.kind).toBe("from_document");
  });
  it("independent acceptance is known only when the backend also marks the fact verified", () => {
    const base = handoffUnverified({ reviews: [reviewIndependent("fact-room")] });
    expect(allCards(view(base)).find((c) => c.id === "finding/fact-room")!.kind).toBe("from_document");
    base.openEndedFindings[1] = { ...base.openEndedFindings[1], state: "proven", verified: true } as never;
    expect(allCards(view(base)).find((c) => c.id === "finding/fact-room")!.kind).toBe("known");
  });
  it("a disputed review shows as conflicting", () => {
    const h = handoffUnverified({ reviews: [{ ...reviewHousehold("fact-room"), decision: "disputed", state: "disputed" }] });
    expect(allCards(view(h)).find((c) => c.id === "finding/fact-room")!.kind).toBe("conflicting");
  });
  it("offers 'Confirm' only for an unreviewed finding that has a visible quote", () => {
    const v = view(handoffUnverified());
    const cards = allCards(v).filter((c) => c.id.startsWith("finding/"));
    expect(cards.every((c) => c.confirm !== null)).toBe(true);
    const noQuote = parseAnswerEnvelope(answerEnvelope({ sources: [] }))!.answer;
    const v2 = view(handoffUnverified(), noQuote);
    expect(allCards(v2).filter((c) => c.id.startsWith("finding/")).every((c) => c.confirm === null)).toBe(true);
  });
});

describe("evidence view: citations", () => {
  it("never shows line numbers or invents a page", () => {
    const h = handoffUnverified();
    h.openEndedFindings[1] = { ...h.openEndedFindings[1], citations: [{ clauseId: "cl-room", documentId: DOC_ID, sourceVersion: "1", page: null, digest: "d" }] } as never;
    const ans = parseAnswerEnvelope(answerEnvelope({ sources: [{ documentId: DOC_ID, quote: "Room rent is limited.", clauseId: "cl-room" }] }))!.answer;
    const card = allCards(view(h, ans)).find((c) => c.id === "finding/fact-room")!;
    expect(card.citations[0].pageLabel).toBe("Page not recorded");
    expect(JSON.stringify(view(handoffUnverified()))).not.toMatch(/\bline\s*\d/i);
  });
  it("flags a non-verbatim quote", () => {
    const card = allCards(view(handoffUnverified())).find((c) => c.id === "finding/fact-cos")!;
    expect(card.citations[0].verbatim).toBe(false);
  });
  it("labels duplicate document kinds by upload date", () => {
    const label = documentLabeller([
      { id: "a", documentKind: "policy_wording", uploadedAt: "2026-10-13T09:00:00.000Z" },
      { id: "b", documentKind: "policy_wording", uploadedAt: "2026-10-15T09:00:00.000Z" },
    ]);
    expect(label("a")).toMatch(/Policy wording, uploaded 13 Oct 2026/);
    expect(label("zzz")).toBe("Document you uploaded");
  });
});

describe("evidence view: fail closed", () => {
  it("answer-only mode (unreadable handoff) shows every item unconfirmed and says why", () => {
    const v = buildEvidenceView({ answer: answer(), handoff: null, documents: docs });
    expect(v.mode).toBe("answer_only");
    const cards = allCards(v);
    expect(cards.length).toBe(3);
    expect(cards.every((c) => c.kind === "from_document" && c.confirm === null)).toBe(true);
    expect(v.notices.join(" ")).toMatch(/none of them is shown as confirmed/);
  });
  it("insufficient_evidence is stated without implying an exclusion", () => {
    const ans = parseAnswerEnvelope(answerEnvelope({ state: "insufficient_evidence", covered: [], limited_or_excluded: [] }))!.answer;
    const v = buildEvidenceView({ answer: ans, handoff: null, documents: docs });
    expect(v.answerNote).toMatch(/could not find text/i);
    expect(v.answerNote).toMatch(/not .*exclusion/i);
  });
  it("an unrecognised answer state is not treated as evidence_found", () => {
    const ans = parseAnswerEnvelope(answerEnvelope({ state: "fully_covered" }))!.answer;
    expect(ans.state).toBe("unrecognised");
    expect(buildEvidenceView({ answer: ans, handoff: null, documents: docs }).answerNote).toMatch(/every item below stays unconfirmed/);
  });
  it("includes the answer's own unknowns and the retrieval caveat", () => {
    const v = view(handoffUnverified());
    expect(v.unknowns.length).toBe(1);
    expect(v.notices.join(" ")).toMatch(/may not have read every part/);
  });
  it("answer id fixture is stable", () => expect(ANSWER_ID).toBe("ans-synth-1"));
});
