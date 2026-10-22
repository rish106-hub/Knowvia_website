// Pure view model: parsed answer + parsed decision handoff -> what the evidence screen renders.
// Invariants (each has a test in tests/unit/app-evidence/):
//  - "known" is only produced for a documented state WITH a citation, a verified association and (for open-ended
//    findings) an independent accepted review. Everything else is downgraded, never upgraded.
//  - A missing or ambiguous item is "not_confirmed" with a reason that never reads as an exclusion.
//  - A dynamic_check is "not_checked", never complete.
//  - No line numbers anywhere. A page is shown only when the backend gave an integer page.
//  - Model/extracted output is "from_document" unless a household or independent review says otherwise.
import { documentKindLabel, effectLabel, humanise, notConfirmedReason, policyKindLabel, ruleLabel } from "./labels";
import { MONEY_LIKE_RULES, formatValue } from "./format";
import type { AnswerEntry, AnswerSource, CitationRef, EvidenceAnswer, Handoff, HandoffFinding, HandoffItem } from "./schemas";

export type StateKind = "known" | "confirmed_by_you" | "from_document" | "conflicting" | "not_confirmed" | "not_checked";

export const STATE_LABELS: Record<StateKind, string> = {
  known: "Known",
  confirmed_by_you: "Confirmed by you",
  from_document: "From the document, not yet confirmed",
  conflicting: "Documents disagree",
  not_confirmed: "Not confirmed",
  not_checked: "Not checked",
};

export type DocumentLite = { id: string; documentKind: string; uploadedAt: string | null };

export type CitationView = {
  key: string;
  documentId: string;
  documentLabel: string;
  page: number | null;
  pageLabel: string;
  clauseId: string | null;
  quote: string | null;
  /** false when the stored text carries privacy placeholders and is not the verbatim page text. */
  verbatim: boolean | null;
};

export type FactCard = {
  id: string;
  kind: StateKind;
  stateLabel: string;
  /** Extra words after the state label, e.g. "Documented: not offered". */
  stateDetail: string | null;
  statement: string;
  effect: string | null;
  why: string | null;
  citations: CitationView[];
  qualifiers: Array<{ title: string; items: string[] }>;
  note: string | null;
  /** Present only where "Confirm this from the document" may be offered. */
  confirm: { factId: string } | null;
};

export type PolicyGroup = { id: string; title: string; note: string | null; facts: FactCard[]; notConfirmed: FactCard[] };

export type EvidenceView = {
  mode: "handoff" | "answer_only";
  answerNote: string | null;
  groups: PolicyGroup[];
  unknowns: string[];
  notices: string[];
  counts: Record<StateKind, number>;
  documentsRead: Array<{ id: string; label: string }>;
};

const EMPTY_COUNTS = (): Record<StateKind, number> => ({ known: 0, confirmed_by_you: 0, from_document: 0, conflicting: 0, not_confirmed: 0, not_checked: 0 });

export function documentLabeller(documents: DocumentLite[]): (documentId: string) => string {
  const byKind = new Map<string, number>();
  for (const d of documents) byKind.set(d.documentKind, (byKind.get(d.documentKind) ?? 0) + 1);
  return (documentId) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return documentKindLabel(null);
    const base = documentKindLabel(doc.documentKind);
    if ((byKind.get(doc.documentKind) ?? 0) < 2 || !doc.uploadedAt) return base;
    const when = new Date(doc.uploadedAt);
    if (Number.isNaN(when.getTime())) return base;
    return `${base}, uploaded ${when.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}`;
  };
}

type QuoteIndex = Map<string, AnswerSource>;
const quoteIndexOf = (answer: EvidenceAnswer | null): QuoteIndex => {
  const index: QuoteIndex = new Map();
  for (const s of answer?.sources ?? []) if (s.clauseId && !index.has(s.clauseId)) index.set(s.clauseId, s);
  return index;
};

export function pageLabel(page: number | null): string {
  return Number.isInteger(page) && (page as number) >= 1 ? `Page ${page}` : "Page not recorded";
}

export function citationViews(refs: CitationRef[], index: QuoteIndex, label: (id: string) => string): CitationView[] {
  const out: CitationView[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    const ids = ref.clauseIds.length ? ref.clauseIds : [null];
    for (const clauseId of ids) {
      const source = clauseId ? index.get(clauseId) : undefined;
      const page = ref.page ?? source?.page ?? null;
      const key = `${ref.documentId}|${clauseId ?? "-"}|${page ?? "-"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        key,
        documentId: ref.documentId,
        documentLabel: label(ref.documentId),
        page,
        pageLabel: pageLabel(page),
        clauseId,
        quote: source?.quote ?? null,
        verbatim: source?.verbatim ?? null,
      });
    }
  }
  return out;
}

const sentence = (text: string): string => {
  const t = text.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "This item";
};

const qualifiersOf = (x: { conditions: string[]; exceptions: string[]; overrides: string[] }): FactCard["qualifiers"] =>
  [
    { title: "Conditions the document mentions", items: x.conditions },
    { title: "Exceptions the document mentions", items: x.exceptions },
    { title: "Overrides the document mentions", items: x.overrides },
  ].filter((q) => q.items.length > 0);

const MONEY_NOTE = "A limit in the policy. It is not cash and is not added to any other policy.";

/** Decisive documented states other than "known". They still need a citation and a verified association. */
const DECISIVE_LABELS: Record<string, string> = {
  not_permitted: "Documented: not permitted",
  not_selected: "Documented: not selected on your schedule",
  available_not_selected: "Documented: offered, not selected",
};

export function itemCard(item: HandoffItem, policyVerified: boolean, index: QuoteIndex, label: (id: string) => string, idPrefix: string): FactCard {
  const citations = citationViews(item.citations, index, label);
  const base = (kind: StateKind, extra: Partial<FactCard>): FactCard => ({
    id: `${idPrefix}/${item.rule}/${item.topic}`,
    kind,
    stateLabel: STATE_LABELS[kind],
    stateDetail: null,
    statement: item.topic ? `${ruleLabel(item.rule)}: ${sentence(item.topic)}` : ruleLabel(item.rule),
    effect: null,
    why: null,
    citations,
    qualifiers: qualifiersOf(item),
    note: null,
    confirm: null,
    ...extra,
  });
  const documented = citations.length > 0 && item.associationVerified === true && policyVerified;
  switch (item.state) {
    case "known": {
      if (!documented || item.value === null || item.value === undefined) {
        // Never upgrade: a "known" that lacks its evidence is shown as an unconfirmed reading.
        return base("from_document", { why: notConfirmedReason(!documented ? "known_evidence_incomplete" : "value_malformed") });
      }
      const formatted = formatValue(item.rule, item.value);
      const withTopic = formatted && item.topic ? `${formatted} (${item.topic})` : formatted;
      return base("known", { statement: withTopic ?? (item.topic ? `${ruleLabel(item.rule)}: ${sentence(item.topic)}` : ruleLabel(item.rule)), note: MONEY_LIKE_RULES.has(item.rule) ? MONEY_NOTE : null });
    }
    case "not_permitted":
    case "not_selected":
    case "available_not_selected": {
      if (!documented) return base("from_document", { why: notConfirmedReason("decisive_evidence_incomplete") });
      return base("known", { stateDetail: DECISIVE_LABELS[item.state] });
    }
    case "unverified":
      return base("from_document", { why: notConfirmedReason(item.reason ?? "value_not_verified") });
    case "conflicting":
      return base("conflicting", { why: notConfirmedReason(item.reason ?? "controlling_sources_disagree") });
    case "dynamic_check":
      return base("not_checked", { why: "This changes over time. Confirm it with your insurer or hospital." });
    case "missing":
      return base("not_confirmed", { why: notConfirmedReason(item.reason ?? "no_applicable_evidence"), citations: [] });
    default:
      // An unrecognised state is never read as known.
      return base("not_confirmed", { why: notConfirmedReason(null), citations: [] });
  }
}

type ReviewState = { independentAccepted: boolean; householdAccepted: boolean; disputed: boolean; anyCurrent: boolean };
function reviewStateOf(handoff: Handoff, factId: string): ReviewState {
  const mine = handoff.reviews.filter((r) => r.factId === factId);
  const current = mine.filter((r) => r.state === "accepted" || r.state === "disputed" || r.state === "rejected");
  return {
    independentAccepted: mine.some((r) => r.state === "accepted" && r.authority === "independent"),
    householdAccepted: mine.some((r) => r.state === "accepted" && r.authority === "household"),
    disputed: mine.some((r) => r.state === "disputed"),
    anyCurrent: current.length > 0,
  };
}

function matchEntry(finding: HandoffFinding, answer: EvidenceAnswer | null): AnswerEntry | null {
  if (!answer) return null;
  const clauseIds = new Set(finding.citations.flatMap((c) => c.clauseIds));
  const topic = finding.topic.trim().toLowerCase();
  const all = [...answer.covered, ...answer.limited, ...answer.conditions];
  return (
    all.find((e) => e.subject.trim().toLowerCase().slice(0, 120) === topic && e.clauseIds.some((id) => clauseIds.has(id))) ??
    all.find((e) => e.clauseIds.some((id) => clauseIds.has(id)) && e.subject.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 120) === topic) ??
    null
  );
}

export function findingCard(finding: HandoffFinding, handoff: Handoff, answer: EvidenceAnswer | null, index: QuoteIndex, label: (id: string) => string): FactCard {
  const citations = citationViews(finding.citations, index, label);
  const review = reviewStateOf(handoff, finding.factId);
  const entry = matchEntry(finding, answer);
  const statement = sentence(entry?.subject ?? (finding.topic || humanise(finding.factType)));
  const effect = effectLabel(finding.effect ?? entry?.effect ?? null);
  const qualifiers = qualifiersOf({
    conditions: finding.conditions.length ? finding.conditions : (entry?.conditions ?? []),
    exceptions: finding.exceptions.length ? finding.exceptions : (entry?.exceptions ?? []),
    overrides: finding.overrides.length ? finding.overrides : (entry?.overrides ?? []),
  });
  const card = (kind: StateKind, extra: Partial<FactCard> = {}): FactCard => ({
    id: `finding/${finding.factId}`,
    kind,
    stateLabel: STATE_LABELS[kind],
    stateDetail: null,
    statement,
    effect,
    why: null,
    citations,
    qualifiers,
    note: null,
    confirm: null,
    ...extra,
  });
  if (review.disputed) return card("conflicting", { why: "You marked this as unclear or not matching the document." });
  // Known requires an independent accepted review AND the backend marking the fact verified AND a citation.
  if (review.independentAccepted && finding.verified === true && citations.length > 0) return card("known", { stateDetail: "Reviewed by an independent reviewer" });
  if (review.householdAccepted && finding.verified !== true) return card("confirmed_by_you", { stateDetail: "You checked this against the quoted text. It is not verified by Knowvia or your insurer." });
  const canConfirm = !review.anyCurrent && citations.some((c) => c.quote !== null) && finding.verified !== true;
  return card("from_document", { confirm: canConfirm ? { factId: finding.factId } : null });
}

const KIND_ORDER: StateKind[] = ["conflicting", "known", "confirmed_by_you", "from_document", "not_checked", "not_confirmed"];
const byKind = (a: FactCard, b: FactCard) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);

function answerOnlyCards(answer: EvidenceAnswer, index: QuoteIndex, label: (id: string) => string): FactCard[] {
  const cards: FactCard[] = [];
  const push = (entry: AnswerEntry, bucket: string) => {
    const refs: CitationRef[] = entry.clauseIds.map((clauseId) => {
      const source = index.get(clauseId);
      return { documentId: source?.documentId ?? answer.documentIds[0] ?? "", page: source?.page ?? entry.pages[0] ?? null, clauseIds: [clauseId], sourceType: null };
    }).filter((r) => r.documentId);
    cards.push({
      id: `answer/${bucket}/${entry.findingId ?? cards.length}`,
      kind: "from_document",
      stateLabel: STATE_LABELS.from_document,
      stateDetail: null,
      statement: sentence(entry.subject),
      effect: effectLabel(entry.effect ?? (bucket === "covered" ? "covers" : null)),
      why: null,
      citations: citationViews(refs, index, label),
      qualifiers: qualifiersOf(entry),
      note: null,
      confirm: null,
    });
  };
  answer.covered.forEach((e) => push(e, "covered"));
  answer.limited.forEach((e) => push(e, "limited"));
  answer.conditions.forEach((e) => push(e, "conditions"));
  return cards;
}

export function buildEvidenceView(input: { answer: EvidenceAnswer | null; handoff: Handoff | null; documents: DocumentLite[] }): EvidenceView {
  const { answer, handoff, documents } = input;
  const label = documentLabeller(documents);
  const index = quoteIndexOf(answer);
  const notices: string[] = [];
  const unknowns = answer?.unknowns ?? [];
  if (answer && answer.dropped > 0) notices.push("Some entries in the response could not be read and are not shown.");
  if (answer?.documentAssociationVerified === false && (answer.documentIds.length ?? 0) > 1) {
    notices.push("Several documents were read together. We have not confirmed that they belong to one policy.");
  }
  notices.push("We may not have read every part of your documents. Something we did not find is not the same as something that is excluded.");

  const documentsRead = (answer?.documentIds ?? []).map((id) => ({ id, label: label(id) }));
  let answerNote: string | null = null;
  if (answer?.state === "insufficient_evidence") answerNote = "We could not find text in your document that answers this. Nothing below should be read as an exclusion.";
  else if (answer?.state === "unrecognised") answerNote = "We could not tell how complete this reading is, so every item below stays unconfirmed.";

  let groups: PolicyGroup[];
  let mode: EvidenceView["mode"];
  if (handoff) {
    mode = "handoff";
    if (handoff.dropped > 0) notices.push("Some entries in the response could not be read and are not shown.");
    if (handoff.unassociatedFactCount > 0) notices.push(`${handoff.unassociatedFactCount} item${handoff.unassociatedFactCount === 1 ? " is" : "s are"} not linked to a policy yet, so ${handoff.unassociatedFactCount === 1 ? "it is" : "they are"} not shown as facts.`);
    const findingsFor = (policyId: string) => handoff.findings.filter((f) => f.policyId === policyId);
    groups = handoff.policies.map((policy, i) => {
      const prefix = `p${i}`;
      const cards = policy.items.map((item) => itemCard(item, policy.associationVerified, index, label, prefix));
      const findings = findingsFor(policy.policyId).map((f) => findingCard(f, handoff, answer, index, label));
      const facts = [...cards.filter((c) => c.kind !== "not_confirmed"), ...findings].sort(byKind);
      const notConfirmed = cards.filter((c) => c.kind === "not_confirmed");
      return {
        id: policy.policyId,
        title: handoff.policies.length > 1 ? `Policy ${i + 1}: ${policyKindLabel(policy.kind)}` : policyKindLabel(policy.kind),
        note: policy.associationVerified ? null : "We have not confirmed which policy your document belongs to.",
        facts,
        notConfirmed,
      };
    });
    const known = new Set(handoff.policies.map((p) => p.policyId));
    const orphans = handoff.findings.filter((f) => !f.policyId || !known.has(f.policyId)).map((f) => findingCard(f, handoff, answer, index, label)).sort(byKind);
    if (orphans.length) groups.push({ id: "unlinked", title: "Not linked to a policy yet", note: "We read these from your document but have not linked them to a policy.", facts: orphans, notConfirmed: [] });
    // A conflict reported by the catalogue that has no card of its own is still shown, never dropped.
    handoff.conflicts.forEach((c, i) => {
      const exists = groups.some((g) => g.facts.some((f) => f.kind === "conflicting" && f.id.includes(`/${c.rule}/`)));
      if (exists) return;
      const target = groups.find((g) => g.id === c.policyId) ?? groups[0];
      const card: FactCard = {
        id: `conflict/${i}/${c.rule}`,
        kind: "conflicting",
        stateLabel: STATE_LABELS.conflicting,
        stateDetail: null,
        statement: c.rule.startsWith("review_disputed") ? "A reading you marked as unclear" : ruleLabel(c.rule),
        effect: null,
        why: notConfirmedReason("controlling_sources_disagree"),
        citations: [],
        qualifiers: [],
        note: null,
        confirm: null,
      };
      if (target) target.facts.unshift(card);
      else groups.push({ id: "conflicts", title: "Documents disagree", note: null, facts: [card], notConfirmed: [] });
    });
    // Dynamic checks that the policy items did not already surface.
    for (const check of handoff.dynamicChecks) {
      const target = groups.find((g) => g.id === check.policyId);
      if (!target) continue;
      const exists = target.facts.some((f) => f.kind === "not_checked" && f.id.includes(`/${check.rule}/`));
      if (exists) continue;
      target.facts.push({
        id: `dynamic/${check.rule}/${check.topic}`,
        kind: "not_checked",
        stateLabel: STATE_LABELS.not_checked,
        stateDetail: null,
        statement: check.topic ? `${ruleLabel(check.rule)}: ${sentence(check.topic)}` : ruleLabel(check.rule),
        effect: null,
        why: "This changes over time. Confirm it with your insurer or hospital.",
        citations: [],
        qualifiers: [],
        note: null,
        confirm: null,
      });
    }
    groups.forEach((g) => g.facts.sort(byKind));
  } else {
    mode = "answer_only";
    if (answer) notices.unshift("We could not load the review status of these items, so none of them is shown as confirmed.");
    groups = [{ id: "answer", title: "From your document", note: null, facts: answerOnlyCards(answer ?? ({ covered: [], limited: [], conditions: [], documentIds: [], sources: [], unknowns: [], dropped: 0 } as unknown as EvidenceAnswer), index, label), notConfirmed: [] }];
  }

  const counts = EMPTY_COUNTS();
  for (const g of groups) {
    g.facts.forEach((f) => (counts[f.kind] += 1));
    g.notConfirmed.forEach((f) => (counts[f.kind] += 1));
  }
  return { mode, answerNote, groups, unknowns, notices, counts, documentsRead };
}
