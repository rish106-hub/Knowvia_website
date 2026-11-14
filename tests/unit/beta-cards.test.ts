import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerCard } from "@/components/beta/AnswerCard";
import { BUSY_MESSAGE, MicButton } from "@/components/beta/MicButton";
import { isVoiceBusy, mockAdapter } from "@/lib/beta/adapter";
import { PolicyCard } from "@/components/beta/PolicyCard";
import { QuestionScreen, questionOptions, toggleSelection } from "@/components/beta/QuestionScreen";
import { answerEvent } from "@/lib/beta/analytics";
import { MOCK_CATALOGUE, MOCK_MEMBERS, MOCK_PRODUCTS, MOCK_TILES, MOCK_UNKNOWN, mockAnswer, planQuestions } from "@/lib/beta/mock";
import { BADGE_LABEL, badgeFor } from "@/lib/beta/tiles";
import type { InputKind } from "@/lib/beta/types";

const OUTCOME = /will be paid|will pay|approved|guarantee|pakka|claim will|you will get/i;
const render = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("QuestionScreen", () => {
  const kinds: InputKind[] = ["yes_no_unsure", "single_choice", "multi_choice_chips", "amount_presets", "date_presets", "member_pick"];
  for (const kind of kinds) {
    it(`renders ${kind} with N of M, the why line and Not sure`, () => {
      const q = MOCK_CATALOGUE.find(c => c.input.kind === kind)!;
      expect(q).toBeTruthy();
      const html = render(createElement(QuestionScreen, { question: q, index: 0, total: 2, members: MOCK_MEMBERS, onAnswer: () => undefined }));
      expect(html).toContain("1 of 2");
      expect(html).toContain(q.why.en);
      expect(html).toContain("Not sure");
      expect(questionOptions(q, MOCK_MEMBERS).some(o => o.id === "not_sure")).toBe(true);
    });
  }
  it("member_pick options come from members", () => {
    const q = MOCK_CATALOGUE.find(c => c.input.kind === "member_pick")!;
    expect(questionOptions(q, MOCK_MEMBERS).map(o => o.id)).toEqual(["m1", "m2", "not_sure"]);
  });
  it("multi select toggles and Not sure is exclusive", () => {
    let s = toggleSelection("multi_choice_chips", [], "diabetes");
    s = toggleSelection("multi_choice_chips", s, "thyroid");
    expect(s).toEqual(["diabetes", "thyroid"]);
    expect(toggleSelection("multi_choice_chips", s, "diabetes")).toEqual(["thyroid"]);
    expect(toggleSelection("multi_choice_chips", s, "not_sure")).toEqual(["not_sure"]);
    expect(toggleSelection("multi_choice_chips", ["not_sure"], "heart")).toEqual(["heart"]);
  });
  it("plans at most 2 before the card and the rest in the strip, per member", () => {
    const first = planQuestions(MOCK_CATALOGUE, "before_card");
    expect(first).toHaveLength(2);
    expect(first.map(i => i.member?.label)).toEqual(["Asha, spouse", "Kabir, child"]);
    const keys = new Set(first.map(i => i.key));
    expect(planQuestions(MOCK_CATALOGUE, "strip").every(i => !keys.has(i.key))).toBe(true);
  });
  it("shows the member chip above a per-member prompt", () => {
    const item = planQuestions(MOCK_CATALOGUE, "before_card")[0];
    const html = render(createElement(QuestionScreen, { question: item.question, member: item.member, index: 0, total: 2, onAnswer: () => undefined }));
    expect(html).toContain("Asha, spouse");
    expect(html.indexOf("Asha, spouse")).toBeLessThan(html.indexOf(item.question.prompt.en));
  });
  it("followups appear only after their trigger answer", () => {
    const has = (a: Record<string, string[]>) => planQuestions(MOCK_CATALOGUE, "strip", a).some(i => i.question.id === "ped.which_conditions" && i.member?.id === "m1");
    expect(has({})).toBe(false);
    expect(has({ "ped.has_any:m1": ["not_sure"] })).toBe(false);
    expect(has({ "ped.has_any:m1": ["no"] })).toBe(false);
    expect(has({ "ped.has_any:m1": ["yes"] })).toBe(true);
    expect(has({ "ped.has_any:m2": ["yes"] })).toBe(false);
  });
  it("Not sure is not asked again in the strip", () => {
    expect(planQuestions(MOCK_CATALOGUE, "strip", { "ped.has_any:m1": ["not_sure"] }).some(i => i.key === "ped.has_any:m1")).toBe(false);
  });
  it("mock products avoid sample-style names", () => {
    expect(MOCK_PRODUCTS.every(p => !/example|sample|demo/i.test(p.productName + p.insurerName))).toBe(true);
    expect(MOCK_PRODUCTS.every(p => p.uinSource !== "pdf_text")).toBe(true);
  });
});

describe("AnswerCard", () => {
  it("never shows outcome words for any mock card", () => {
    for (const t of ["cataract", "knee", "maternity"]) {
      const html = render(createElement(AnswerCard, { card: mockAnswer(t) }));
      expect(html).not.toMatch(OUTCOME);
    }
  });
  it("covered: verdict line, typed chips, sources, followups, thumbs", () => {
    const html = render(createElement(AnswerCard, { card: mockAnswer("cataract") }));
    expect(html).toContain("Your policy says: covered");
    expect(html).toContain("Waiting period");
    expect(html).toContain("Sources (1)");
    expect(html).toContain("Helpful");
    expect((html.match(/class="beta-chip"/g) || []).length).toBeGreaterThanOrEqual(5);
  });
  it("depends shows Is this right?", () => {
    expect(render(createElement(AnswerCard, { card: mockAnswer("knee") }))).toContain("Is this right?");
  });
  it("unknown card says the documents don't say and offers the insurer call", () => {
    const html = render(createElement(AnswerCard, { card: { ...MOCK_UNKNOWN, actions: [] } }));
    expect(html).toContain("Your documents don&#x27;t say.");
    expect(html).toContain("Call your insurer");
  });
});

describe("PolicyCard", () => {
  it("maps source tier and status to the five badges", () => {
    expect(BADGE_LABEL[badgeFor("own_pdf", "extracted_unverified")]).toBe("From your policy");
    expect(BADGE_LABEL[badgeFor("ida_wording", "reviewed_reference")]).toBe("From insurer wording");
    expect(BADGE_LABEL[badgeFor("user_declaration", "user_confirmed")]).toBe("You told us");
    expect(BADGE_LABEL[badgeFor(null, null)]).toBe("Not checked yet");
    expect(BADGE_LABEL[badgeFor("own_pdf", "unknown")]).toBe("Your documents don't say");
  });
  it("renders six tiles with badges and a conflict with both values and Which is right?", () => {
    const html = render(createElement(PolicyCard, { tiles: MOCK_TILES }));
    expect((html.match(/class="beta-tile"/g) || []).length).toBe(6);
    expect(html).toContain("From insurer wording");
    expect(html).toContain("You told us");
    expect(html).toContain("Not checked yet");
    expect(html).toContain("1% of sum insured per day");
    expect(html).toContain("Rs 5,000 per day");
    expect(html).toContain("Which is right?");
  });
});

describe("voice busy fallback", () => {
  it("mock mode: busy transcribe yields the busy code and no transcript; normal mock returns the canned one", async () => {
    const busy = mockAdapter({ voiceBusy: true });
    let err: unknown = null; let text: string | null = null;
    try { text = await busy.transcribe(null); } catch (e) { err = e; }
    expect(text).toBeNull();
    expect(isVoiceBusy(err)).toBe(true);
    expect(BUSY_MESSAGE).toBe("Busy, type instead");
    expect(await mockAdapter().transcribe(null)).toBe("Is cataract surgery covered?");
  });
  it("mic is hidden when voice is disabled", () => {
    expect(render(createElement(MicButton, { voiceEnabled: false, transcribe: async () => "", onSend: () => undefined }))).toBe("");
    expect(render(createElement(MicButton, { voiceEnabled: true, transcribe: async () => "", onSend: () => undefined }))).toContain("Hold to talk");
  });
});

describe("analytics", () => {
  it("never sends option ids for health or money questions", () => {
    expect(answerEvent("ped.has_any", ["yes"], "health")).toEqual({ questionId: "ped.has_any", answered: true });
    expect(answerEvent("cover.other_amount", ["5_lakh"], "money")).toEqual({ questionId: "cover.other_amount", answered: true });
    expect(answerEvent("home.city", ["delhi"], "none").optionIds).toEqual(["delhi"]);
  });
});
