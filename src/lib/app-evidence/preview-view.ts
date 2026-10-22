// Pure view model: parsed household-coverage-preview/v1 -> what the preview screen renders.
// Invariants (tested): known only with reviewed provenance + citation + verified association; unverified is never
// "known"; dynamic checks and external checks are always "Not checked"; an action is never shown as completed;
// exactly ONE prioritised next action; at most 2 questions; nothing computes money.
import { formatValue, MONEY_LIKE_RULES } from "./format";
import { citationViews, documentLabeller, STATE_LABELS, type CitationView, type DocumentLite, type FactCard, type StateKind } from "./evidence-view";
import { notConfirmedReason, policyKindLabel, ruleLabel } from "./labels";
import type { AnswerSource, EvidenceAnswer, Preview, PreviewAction, PreviewPolicy, PreviewQuestion, PreviewTerm } from "./schemas";
import { budgetText, visibleQuestions, type ScenarioState } from "./scenario";

export type NextActionView = {
  actionType: string;
  title: string;
  text: string;
  /** Always "Not done yet" except for "nothing more to add". Never "completed". */
  statusLabel: string | null;
  target: "questions" | "documents" | "none";
  reasonCode: string;
};

export type Banner = { tone: "summary" | "partial" | "empty" | "conflict" | "recover"; title: string; body: string };

export type PolicyView = {
  id: string;
  title: string;
  association: string | null;
  memberCard: FactCard;
  facts: FactCard[];
  uncertainties: FactCard[];
  notChecked: FactCard[];
  limitations: string[];
};

export type PreviewView = {
  banner: Banner;
  needsRecovery: boolean;
  nextAction: NextActionView | null;
  otherActions: NextActionView[];
  memberLabel: string;
  policies: PolicyView[];
  externalChecks: Array<{ id: string; text: string }>;
  questions: PreviewQuestion[];
  budget: { used: number; limit: number; exhausted: boolean };
  overlaps: string[];
  coordinationNotes: string[];
  limitations: string[];
  notices: string[];
};

const BANNERS: Record<Preview["assessmentState"], Banner> = {
  evidence_summary_available: { tone: "summary", title: "Here is what your documents establish", body: "This is a summary of the documents, not a decision on any claim." },
  conditional_evidence_summary: { tone: "partial", title: "Some of it is documented, some is still open", body: "What is missing could change the answer. Nothing here is a claim decision." },
  insufficient_evidence: { tone: "empty", title: "Your documents do not settle this yet", body: "Nothing has been confirmed that answers your question. That is not the same as being excluded." },
  conflicting_evidence: { tone: "conflict", title: "Your documents disagree on something that matters", body: "We are not choosing between them. This needs a person to check the cited text." },
  source_revalidation_required: { tone: "recover", title: "A document behind this needs reading again", body: "It changed, was deleted, or permission ended. Read it again to see what it says now." },
  unrecognised: { tone: "empty", title: "We could not tell how complete this is", body: "Every item stays unconfirmed until we can." },
};

const ACTION_ORDER = ["provide_context", "upload_document", "identify_existing_document", "independent_review", "insurer_or_tpa_confirmation", "hospital_confirmation", "no_further_context_needed"];
const ACTION_TITLES: Record<string, string> = {
  provide_context: "Answer a short question",
  upload_document: "Add the document",
  identify_existing_document: "Look for a document you already have",
  independent_review: "This needs a review. No reviewer is assigned yet",
  insurer_or_tpa_confirmation: "Confirm with your insurer or TPA",
  hospital_confirmation: "Confirm with the hospital",
  no_further_context_needed: "Nothing more to add",
};
const PRIORITY: Record<string, number> = { P0: 0, P1: 1, P2: 2 };

function actionView(a: PreviewAction, hasQuestions: boolean): NextActionView {
  const title = ACTION_TITLES[a.actionType] ?? "Another step";
  const target: NextActionView["target"] = a.actionType === "provide_context" && hasQuestions ? "questions" : a.actionType === "upload_document" || a.actionType === "identify_existing_document" ? "documents" : "none";
  return { actionType: a.actionType, title, text: a.text, statusLabel: a.actionType === "no_further_context_needed" ? null : "Not done yet", target, reasonCode: a.reasonCode };
}

/** One prioritised next action: best gap priority (P0 first), blocking gaps first, then a fixed action order. */
export function prioritiseActions(preview: Preview): { primary: PreviewAction | null; rest: PreviewAction[] } {
  const gapByKey = new Map(preview.gaps.map((g) => [g.gapKey, g]));
  const rank = (a: PreviewAction) => {
    const gaps = a.relatedGapKeys.map((k) => gapByKey.get(k)).filter((g): g is NonNullable<typeof g> => Boolean(g));
    const priority = gaps.length ? Math.min(...gaps.map((g) => PRIORITY[g.priority] ?? 3)) : 4;
    const blocking = gaps.some((g) => g.blocking) ? 0 : 1;
    const order = ACTION_ORDER.indexOf(a.actionType);
    return [priority, blocking, order < 0 ? 99 : order, a.reasonCode] as const;
  };
  const sorted = [...preview.actions].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < 3; i += 1) if (ra[i] !== rb[i]) return (ra[i] as number) - (rb[i] as number);
    return ra[3] < rb[3] ? -1 : ra[3] > rb[3] ? 1 : 0;
  });
  // "Nothing more to add" is only the primary action when it is the only one.
  const real = sorted.filter((a) => a.actionType !== "no_further_context_needed");
  const primary = real[0] ?? sorted[0] ?? null;
  return { primary, rest: sorted.filter((a) => a !== primary) };
}

const DECISIVE = new Set(["known", "not_permitted", "not_selected", "available_not_selected"]);
const RESTRICTION_LABELS: Record<string, string> = {
  exclusion: "Documented exclusion in this policy",
  limit_or_condition: "Documented limit or condition in this policy",
  non_enrolment: "Documented: not listed as insured",
  not_permitted: "Documented: not permitted in this policy",
};

function termCard(term: PreviewTerm, policy: PreviewPolicy, restriction: boolean, index: Map<string, AnswerSource>, label: (id: string) => string, id: string): FactCard {
  const citations = citationViews(term.citations, index, label);
  const decisive = DECISIVE.has(term.state) && term.provenance === "reviewed_contractual_evidence" && citations.length > 0 && policy.associationState === "verified";
  const statementBase = term.topic ? `${ruleLabel(term.rule)}: ${term.topic.charAt(0).toUpperCase()}${term.topic.slice(1)}` : ruleLabel(term.rule);
  const common = {
    id,
    effect: null,
    qualifiers: [
      { title: "Conditions the document mentions", items: term.conditions },
      { title: "Exceptions the document mentions", items: term.exceptions },
      { title: "Overrides the document mentions", items: term.overrides },
    ].filter((q) => q.items.length > 0),
    confirm: null,
  };
  if (!decisive) {
    // Never upgrade: a documented entry that lacks its evidence is shown as an unconfirmed reading.
    return { ...common, kind: "from_document", stateLabel: STATE_LABELS.from_document, stateDetail: null, statement: statementBase, why: notConfirmedReason("known_evidence_incomplete"), citations, note: null };
  }
  const value = term.state === "known" ? formatValue(term.rule, term.value) : null;
  const detail = restriction ? (term.restrictionKind && RESTRICTION_LABELS[term.restrictionKind]) || "Documented restriction in this policy" : term.state === "known" ? null : term.state === "not_selected" ? "Documented: not selected" : term.state === "available_not_selected" ? "Documented: offered, not selected" : "Documented: not permitted";
  const appliesNote = term.appliesToMember && term.appliesToMember !== "established" ? "We have not confirmed that this applies to the person you chose." : null;
  const note = [MONEY_LIKE_RULES.has(term.rule) ? "A limit in this policy. It is not cash and is not added to any other policy." : null, appliesNote].filter(Boolean).join(" ") || null;
  return { ...common, kind: "known", stateLabel: STATE_LABELS.known, stateDetail: detail, statement: value ?? statementBase, why: null, citations, note };
}

function memberCard(policy: PreviewPolicy, index: Map<string, AnswerSource>, label: (id: string) => string, memberLabel: string, id: string): FactCard {
  const m = policy.memberApplicability;
  const citations = citationViews(m.citations, index, label);
  const base = { id, effect: null, qualifiers: [], note: null, confirm: null, citations };
  if ((m.state === "established" || m.state === "not_enrolled") && citations.length > 0 && policy.associationState === "verified") {
    return { ...base, kind: "known", stateLabel: STATE_LABELS.known, stateDetail: null, statement: m.state === "established" ? `${memberLabel} is listed as insured` : `${memberLabel} is not listed as insured`, why: null };
  }
  const reason = m.state === "member_not_specified" ? "member_not_identified" : m.reasonCode ?? "enrolment_not_evidenced";
  return { ...base, citations: [], kind: "not_confirmed", stateLabel: STATE_LABELS.not_confirmed, stateDetail: null, statement: m.state === "member_not_specified" ? "Which family member this is about" : `Whether ${memberLabel} is insured under this policy`, why: notConfirmedReason(reason) };
}

function uncertaintyKind(state: string, gapType: string): StateKind {
  if (state === "dynamic_check" || gapType === "dynamic_verification_needed") return "not_checked";
  if (state === "conflicting") return "conflicting";
  if (state === "unverified") return "from_document";
  return "not_confirmed";
}

export function buildPreviewView(input: {
  preview: Preview;
  scenario: ScenarioState;
  documents: DocumentLite[];
  members: Array<{ id: string; displayName: string }>;
  answer: EvidenceAnswer | null;
}): PreviewView {
  const { preview, scenario, documents, members, answer } = input;
  const label = documentLabeller(documents);
  const index = new Map<string, AnswerSource>();
  for (const s of answer?.sources ?? []) if (s.clauseId && !index.has(s.clauseId)) index.set(s.clauseId, s);

  const memberName = members.find((m) => m.id === preview.memberId)?.displayName ?? null;
  const memberLabel = memberName ?? "This person";
  const unusableSource = preview.sources.some((s) => s.status !== "usable");
  const needsRecovery = preview.assessmentState === "source_revalidation_required" || unusableSource;
  const banner = BANNERS[preview.assessmentState] ?? BANNERS.unrecognised;

  const policies: PolicyView[] = preview.policies.map((p, i) => {
    const pid = `pv${i}`;
    const facts = [
      ...p.documentedTerms.map((t, j) => termCard(t, p, false, index, label, `${pid}/t${j}`)),
      ...p.documentedRestrictions.map((t, j) => termCard(t, p, true, index, label, `${pid}/r${j}`)),
    ];
    const uncertainties: FactCard[] = [];
    const notChecked: FactCard[] = [];
    const seenDynamic = new Set<string>();
    p.uncertainties.forEach((u, j) => {
      const kind = uncertaintyKind(u.state, u.gapType);
      const statement = u.topic ? `${ruleLabel(u.rule)}: ${u.topic.charAt(0).toUpperCase()}${u.topic.slice(1)}` : ruleLabel(u.rule);
      const card: FactCard = {
        id: `${pid}/u${j}`,
        kind,
        stateLabel: STATE_LABELS[kind],
        stateDetail: null,
        statement,
        effect: null,
        why: kind === "not_checked" ? "Not checked. Confirm with your insurer or hospital." : u.candidateAvailable && kind === "from_document" ? "This was read from the document but nobody has confirmed it." : notConfirmedReason(u.reasonCode),
        citations: [],
        qualifiers: [],
        note: u.candidateAvailable ? "A possible value was read from the document. It is not shown because nobody has confirmed it." : null,
        // (the reason line already says it is unconfirmed; the note only explains why no value is shown)
        confirm: null,
      };
      if (kind === "not_checked") {
        seenDynamic.add(`${u.rule}/${u.topic}`);
        notChecked.push(card);
      } else uncertainties.push(card);
    });
    p.dynamicChecks.forEach((d, j) => {
      if (seenDynamic.has(`${d.rule}/${d.topic}`)) return; // status is ignored on purpose: it is never shown as performed
      notChecked.push({
        id: `${pid}/d${j}`,
        kind: "not_checked",
        stateLabel: STATE_LABELS.not_checked,
        stateDetail: null,
        statement: d.topic ? `${ruleLabel(d.rule)}: ${d.topic.charAt(0).toUpperCase()}${d.topic.slice(1)}` : ruleLabel(d.rule),
        effect: null,
        why: "Not checked. Confirm with your insurer or hospital.",
        citations: [],
        qualifiers: [],
        note: null,
        confirm: null,
      });
    });
    const order: StateKind[] = ["conflicting", "known", "from_document", "not_confirmed"];
    uncertainties.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
    return {
      id: p.policyId,
      title: preview.policies.length > 1 ? `Policy ${i + 1}: ${policyKindLabel(p.kind)}` : policyKindLabel(p.kind),
      association: p.associationState === "verified" ? null : "We have not confirmed which policy your document belongs to.",
      memberCard: memberCard(p, index, label, memberLabel, `${pid}/member`),
      facts,
      uncertainties,
      notChecked,
      limitations: p.limitations,
    };
  });

  const questions = needsRecovery ? [] : visibleQuestions(preview, scenario);
  const { primary, rest } = prioritiseActions(preview);
  const nextAction = needsRecovery ? null : primary ? actionView(primary, questions.length > 0) : null;

  const externalChecks = preview.externalChecks.map((c) => ({
    id: c.checkId,
    text: `Not checked. ${c.requires ? `Needs ${c.requires}.` : "Confirm with your insurer or hospital."}${c.note ? ` ${c.note}` : ""}`,
  }));

  const notices: string[] = [];
  if (preview.dropped > 0) notices.push("Some entries in the response could not be read and are not shown.");
  if (preview.memberScope === "not_specified" && preview.policies.length > 0) notices.push("No family member is chosen yet, so nothing here is tied to a person.");
  if (!preview.policies.length) notices.push("No policy could be built from your documents yet.");

  return {
    banner,
    needsRecovery,
    nextAction,
    otherActions: rest.map((a) => actionView(a, questions.length > 0)),
    memberLabel,
    policies,
    externalChecks,
    questions,
    budget: budgetText(preview, scenario),
    overlaps: preview.overlaps.map((o) => `${ruleLabel(o.rule)}${o.topic ? `: ${o.topic}` : ""} is documented in ${o.policyCount} policies. This does not mean they pay together, and limits are not added.`),
    coordinationNotes: preview.coordinationNotes,
    limitations: preview.limitations,
    notices,
  };
}

export type { CitationView };
