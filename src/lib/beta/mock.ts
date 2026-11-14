// Synthetic data for the beta flow when no backend is configured. Invented names and numbers only. FOR LEGAL REVIEW: all wording.
import { type AnswerCardData, type CardTileData, type CatalogueOption, type CatalogueQuestion, type InputKind, type Member, NOT_SURE, OTHER, type Phase, type Sensitivity } from "./types";

const l = (en: string) => ({ en, hi: null });
const opt = (id: string, en: string): CatalogueOption => ({ id, label: l(en) });
const NS = opt(NOT_SURE, "Not sure");
const YES_NO = [opt("yes", "Yes"), opt("no", "No"), NS];
const DATES = [opt("this_year", "This year"), opt("last_year", "Last year"), opt("two_to_four_years", "2 to 4 years ago"), opt("longer", "Longer ago"), NS];

const q = (id: string, prompt: string, why: string, kind: InputKind, options: CatalogueOption[] | undefined, x: { phase?: Phase; sensitivity?: Sensitivity; perMember?: boolean; weight: number; followups?: Record<string, string[]> }): CatalogueQuestion => ({
  id, prompt: l(prompt), why: l(why), input: { kind, options }, sensitivity: x.sensitivity ?? "none", phase: x.phase ?? "strip", perMember: x.perMember ?? false, weight: x.weight, followups: x.followups ?? {},
});

export const MOCK_CATALOGUE: CatalogueQuestion[] = [
  q("members.confirm", "Is this person covered under this policy?", "We show cover for each person on the policy.", "yes_no_unsure", YES_NO, { phase: "before_card", perMember: true, weight: 0.95 }),
  q("ped.has_any", "When you bought this policy, did you tell the insurer about any illness?", "Illnesses you told them about have their own waiting period.", "yes_no_unsure", YES_NO, { phase: "before_card", sensitivity: "health", perMember: true, weight: 0.9, followups: { yes: ["ped.which_conditions"] } }),
  q("ped.which_conditions", "Which illnesses did you tell them about?", "Each illness can have a different waiting period.", "multi_choice_chips",
    [opt("diabetes", "Diabetes"), opt("high_bp", "High blood pressure"), opt("thyroid", "Thyroid"), opt("heart", "Heart"), opt("asthma", "Asthma"), opt(OTHER, "Other")], { sensitivity: "health", perMember: true, weight: 0.8 }),
  q("portability.prior_cover_years", "Did you move from another insurer? When did you first get health cover?", "Time on earlier cover can count toward waiting periods.", "date_presets", DATES, { sensitivity: "money", weight: 0.8 }),
  q("home.city", "Which city do you live in?", "We use it to find hospitals near you.", "single_choice",
    [opt("delhi", "Delhi"), opt("mumbai", "Mumbai"), opt("bengaluru", "Bengaluru"), opt("kolkata", "Kolkata"), opt(OTHER, "Another city"), NS], { weight: 0.7 }),
  q("cover.other_amount", "Roughly how much other health cover do you have?", "Other cover can pay first or share a claim.", "amount_presets",
    [opt("3_lakh", "Rs 3 lakh"), opt("5_lakh", "Rs 5 lakh"), opt("10_lakh", "Rs 10 lakh"), opt("25_lakh", "Rs 25 lakh"), opt("other_amount", "Another amount")], { sensitivity: "money", weight: 0.5 }),
  q("members.main", "Who is this policy mainly for?", "It tells us whose cover to show first.", "member_pick", undefined, { weight: 0.4 }),
  q("pref.cashless", "In a hospital stay, what matters more to you?", "It decides which steps we show first.", "single_choice",
    [opt("cashless_always", "No upfront payment"), opt("reimburse_ok", "I can pay and claim later"), opt("depends", "Depends on the hospital"), NS], { weight: 0.35 }),
];

export type PlanItem = { key: string; question: CatalogueQuestion; member?: Member };
export type Answers = Record<string, string[]>;
export const itemKey = (q: CatalogueQuestion, m?: Member) => `${q.id}:${m?.id ?? ""}`;

/**
 * Deterministic planner stub. Per-member questions expand to one item per member. Before the card: at most 2 items; the strip (shown with the card) lists every unanswered item.
 * Any answer, "Not sure" included, keeps an item from being asked again. A followup question appears only after its trigger answer
 * ("*" means any real answer, never "Not sure"); "Not sure" and "No" never open followups.
 */
export function planQuestions(catalogue: CatalogueQuestion[], phase: Phase, answers: Answers = {}, members: Member[] = MOCK_MEMBERS): PlanItem[] {
  const targets = new Set(catalogue.flatMap(c => Object.values(c.followups).flat()));
  const triggered = (q: CatalogueQuestion, m?: Member) => !targets.has(q.id) || catalogue.some(p => {
    const given = answers[itemKey(p, p.perMember ? m : undefined)];
    return given && Object.entries(p.followups).some(([trigger, ids]) => ids.includes(q.id) && (trigger === "*" ? given.some(g => g !== NOT_SURE) : given.includes(trigger)));
  });
  const items: PlanItem[] = [];
  for (const q of [...catalogue].sort((a, b) => b.weight - a.weight)) {
    for (const m of q.perMember ? members : [undefined]) {
      const key = itemKey(q, m);
      if (!(key in answers) && triggered(q, m)) items.push({ key, question: q, member: m });
    }
  }
  // Strip runs after the card: every unanswered item, including before-card items the 2-item cap left out.
  return phase === "before_card" ? items.filter(i => i.question.phase === "before_card").slice(0, 2) : items;
}

export const MOCK_MEMBERS: Member[] = [{ id: "m1", label: "Asha, spouse" }, { id: "m2", label: "Kabir, child" }];
// uinSource "link_page" is a weaker tag, so the product screen is shown. Only "pdf_text" (the document's own UIN) skips it.
export const MOCK_PRODUCTS = [
  { candidateId: "c1", insurerName: "Suraksha Health", productName: "Care Plus 360", uinSource: "link_page" },
  { candidateId: "c2", insurerName: "Suraksha Health", productName: "Care Plus 180", uinSource: "link_page" },
  { candidateId: "c3", insurerName: "Suraksha Health", productName: "Care Plus Senior", uinSource: "link_page" },
];
export const MOCK_PRODUCT = MOCK_PRODUCTS[0];
export const MOCK_PRODUCT_LINE = `${MOCK_PRODUCT.insurerName} ${MOCK_PRODUCT.productName}`;

export const MOCK_TILES: CardTileData[] = [
  { id: "sum_insured", title: "Sum insured left", value: "Rs 10,00,000", badge: "own_pdf", source: { tier: "own_pdf", page: 2, clause: "Schedule", quote: "Sum Insured: Rs 10,00,000 per policy year" } },
  { id: "room_rent", title: "Room rent limit", value: null, badge: "own_pdf",
    conflict: [
      { label: "Your policy schedule", value: "1% of sum insured per day", source: { tier: "own_pdf", page: 2, clause: "Schedule", quote: "Room rent: 1% of Sum Insured per day" } },
      { label: "Insurer wording", value: "Rs 5,000 per day", source: { tier: "ida_wording", page: 9, clause: "3.1", quote: "Room rent is limited to Rs 5,000 per day" } },
    ] },
  { id: "waiting_periods", title: "Waiting periods still running", value: "Depends: did you move from another insurer?", badge: "not_checked" },
  { id: "copay_deductible", title: "Co-pay and deductible", value: null, badge: "unknown" },
  { id: "exclusions", title: "Top exclusions for your household", value: "Cosmetic treatment, dental unless from an accident, and war injuries", badge: "ida_wording", source: { tier: "ida_wording", page: 14, clause: "5", quote: "We will not pay for cosmetic or plastic surgery, dental treatment unless due to accident, or injury due to war" } },
  { id: "cashless", title: "Cashless hospitals in your city", value: "Bengaluru: 3 hospitals near you", badge: "user_declaration", source: { tier: "user_declaration", quote: "You said you live in Bengaluru" } },
];

const base = { contract: "answer-card/v1" as const, ruleResultId: null };
const COVERED: AnswerCardData = {
  ...base, status: "evidence_found", verdict: "covered", ruleResultId: "rule-demo-1",
  headline: "Cataract surgery is listed in your cover.",
  explanation: "Your policy lists cataract surgery as a covered treatment after a 24 month waiting period.",
  conditions: [{ kind: "waiting_period", text: "24 month waiting period from the policy start", sourceIds: ["s1"] }, { kind: "sublimit", text: "Limit of Rs 40,000 per eye", sourceIds: ["s1"] }],
  sources: [{ id: "s1", factIds: ["f1"], tier: "own_pdf", status: "user_confirmed", page: 12, clause: "4.2", quote: "Cataract surgery is covered after a waiting period of 24 months, up to Rs 40,000 per eye." }],
  actions: [{ kind: "find_hospital", label: "Find a cashless hospital" }],
  followups: ["How long is the waiting period?", "Is my knee surgery covered?", "Does it cover maternity?"],
};
const DEPENDS: AnswerCardData = {
  ...base, status: "evidence_found", verdict: "depends",
  headline: "This depends on one thing we have not checked.",
  explanation: "Knee surgery is listed, but the waiting period depends on whether you moved from another insurer.",
  conditions: [{ kind: "waiting_period", text: "Up to 48 months, less any time on earlier cover", sourceIds: ["s2"] }],
  sources: [{ id: "s2", factIds: ["f2"], tier: "own_pdf", status: "extracted_unverified", page: 11, clause: "4.1", quote: "Joint replacement is covered after 48 months of continuous cover." }],
  actions: [{ kind: "answer_question", label: "Is this right?", questionId: "portability.prior_cover_years" }],
  followups: ["Is cataract surgery covered?", "How long is the waiting period?", "Does it cover maternity?"],
};
export const MOCK_UNKNOWN: AnswerCardData = {
  ...base, status: "unknown", verdict: "unknown",
  headline: "Your documents don't say.",
  explanation: "We did not find this in your policy or the insurer wording. Your insurer can tell you.",
  conditions: [], sources: [],
  actions: [{ kind: "call_insurer", label: "Call your insurer" }],
  followups: ["Is cataract surgery covered?", "Is my knee surgery covered?", "How long is the waiting period?"],
};

export const SUGGESTED_QUESTIONS = ["Is cataract surgery covered?", "Is my knee surgery covered?", "Does it cover maternity?"];

export function mockAnswer(question: string): AnswerCardData {
  const t = question.toLowerCase();
  if (/cataract|waiting/.test(t)) return COVERED;
  if (/knee|joint|diabet|pre-?exist/.test(t)) return DEPENDS;
  return MOCK_UNKNOWN;
}

export const MOCK_TRANSCRIPT = "Is cataract surgery covered?";
export const CORRECTION_PRESETS = ["Rs 3 lakh", "Rs 5 lakh", "Rs 10 lakh", "Rs 25 lakh"];
