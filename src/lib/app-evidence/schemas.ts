// Defensive client-boundary parsing of backend payloads that the BFF passes through unchanged.
// Rules: be strict about the contract VERSION and structural invariants that guard authority (fail closed: the whole
// payload is refused), be lenient about everything else (a malformed element is dropped and counted, never guessed).
// Shapes were read from CoverSaath `block4/household-reasoning`: policy-evidence.js (answer), handoff.js
// (decision-handoff/v1), household-reasoning/* (household-coverage-preview/v1). Not exercised against a live backend.
import { z } from "zod";

export const HANDOFF_VERSION = "decision-handoff/v1";
export const PREVIEW_VERSION = "household-coverage-preview/v1";
export const SCENARIO_VERSION = "household-scenario/v1";

export type ParseNotes = { dropped: number };

const text = z.string();
const nullableText = z.string().nullable().optional().transform((v) => v ?? null);
const bool = z.boolean().catch(false);

function listOf<T extends z.ZodType>(schema: T, notes: ParseNotes) {
  return z
    .unknown()
    .transform((value): Array<z.output<T>> => {
      if (value === undefined || value === null) return [];
      if (!Array.isArray(value)) {
        notes.dropped += 1;
        return [];
      }
      const out: Array<z.output<T>> = [];
      for (const item of value) {
        const result = schema.safeParse(item);
        if (result.success) out.push(result.data);
        else notes.dropped += 1;
      }
      return out;
    });
}

const stringList = z.unknown().transform((value): string[] => (Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : []));

// ---- citations ----

export type CitationRef = { documentId: string; page: number | null; clauseIds: string[]; sourceType: string | null };

const citationSchema = z
  .looseObject({
    documentId: z.string().min(1),
    page: z.number().int().positive().nullable().optional(),
    clauseIds: z.array(z.string()).optional(),
    clauseId: z.string().nullable().optional(),
    sourceType: z.string().nullable().optional(),
  })
  .transform((c): CitationRef => ({
    documentId: c.documentId,
    page: c.page ?? null,
    clauseIds: [...new Set([...(c.clauseIds ?? []), ...(c.clauseId ? [c.clauseId] : [])])],
    sourceType: c.sourceType ?? null,
  }));

// ---- answer (POST /questions, GET /answers/{id}) ----

export type AnswerSource = { documentId: string; page: number | null; quote: string; clauseId: string | null; verbatim: boolean | null };
export type AnswerEntry = {
  findingId: string | null;
  subject: string;
  quote: string | null;
  clauseIds: string[];
  pages: number[];
  effect: string | null;
  conditions: string[];
  exceptions: string[];
  overrides: string[];
};
export type EvidenceAnswer = {
  question: string;
  state: "evidence_found" | "conditional" | "insufficient_evidence" | "unrecognised";
  covered: AnswerEntry[];
  limited: AnswerEntry[];
  conditions: AnswerEntry[];
  unknowns: string[];
  sources: AnswerSource[];
  documentIds: string[];
  documentAssociationVerified: boolean | null;
  dropped: number;
};
export type AnswerEnvelope = { answerId: string; current: boolean | null; replayed: boolean | null; answer: EvidenceAnswer };

export function parseAnswerEnvelope(raw: unknown): AnswerEnvelope | null {
  const notes: ParseNotes = { dropped: 0 };
  const source = z.looseObject({
    documentId: z.string().min(1),
    page: z.number().int().positive().nullable().optional(),
    quote: z.string().min(1),
    clauseId: z.string().nullable().optional(),
    verbatim: z.boolean().optional(),
  });
  const entry = z.looseObject({
    findingId: z.string().nullable().optional(),
    subject: z.string().min(1),
    quote: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    clauseIds: z.array(z.string()).default([]),
    pages: z.array(z.number().int().positive()).default([]),
    effect: z.string().nullable().optional(),
    conditions: stringList,
    exceptions: stringList,
    overrides: stringList,
  });
  const schema = z.looseObject({
    answerId: z.string().min(1),
    current: z.boolean().optional(),
    replayed: z.boolean().optional(),
    answer: z.looseObject({
      question: text.catch(""),
      state: z.string().catch("unrecognised"),
      covered: listOf(entry, notes),
      limited_or_excluded: listOf(entry, notes),
      conditions: listOf(entry, notes),
      unknowns: stringList,
      sources: listOf(source, notes),
      documentIds: stringList,
      documentAssociation: z.looseObject({ verified: z.boolean().optional() }).optional(),
    }),
  });
  const result = schema.safeParse(raw);
  if (!result.success) return null;
  const { answer } = result.data;
  const toEntry = (e: z.output<typeof entry>): AnswerEntry => ({
    findingId: e.findingId ?? null,
    subject: e.subject,
    quote: e.quote ?? e.text ?? null,
    clauseIds: e.clauseIds,
    pages: e.pages,
    effect: e.effect ?? null,
    conditions: e.conditions,
    exceptions: e.exceptions,
    overrides: e.overrides,
  });
  const state = answer.state === "evidence_found" || answer.state === "conditional" || answer.state === "insufficient_evidence" ? answer.state : "unrecognised";
  return {
    answerId: result.data.answerId,
    current: result.data.current ?? null,
    replayed: result.data.replayed ?? null,
    answer: {
      question: answer.question,
      state,
      covered: answer.covered.map(toEntry),
      limited: answer.limited_or_excluded.map(toEntry),
      conditions: answer.conditions.map(toEntry),
      unknowns: answer.unknowns,
      sources: answer.sources.map((s) => ({ documentId: s.documentId, page: s.page ?? null, quote: s.quote, clauseId: s.clauseId ?? null, verbatim: s.verbatim ?? null })),
      documentIds: answer.documentIds,
      documentAssociationVerified: answer.documentAssociation?.verified ?? null,
      dropped: notes.dropped,
    },
  };
}

// ---- decision-handoff/v1 ----

export type HandoffItem = {
  rule: string;
  topic: string;
  state: string; // raw; mapped (closed) by the view model
  value: unknown;
  reason: string | null;
  citations: CitationRef[];
  conditions: string[];
  exceptions: string[];
  overrides: string[];
  associationVerified: boolean;
  conditional: boolean;
};
export type HandoffPolicy = { policyId: string; kind: string; associationVerified: boolean; items: HandoffItem[] };
export type HandoffFinding = {
  factId: string;
  policyId: string | null;
  factType: string;
  topic: string;
  state: string;
  verified: boolean;
  effect: string | null;
  citations: CitationRef[];
  conditions: string[];
  exceptions: string[];
  overrides: string[];
};
export type HandoffReview = { reviewId: string | null; factId: string | null; decision: string; state: string; authority: string; reasonCode: string | null };
export type Handoff = {
  policies: HandoffPolicy[];
  findings: HandoffFinding[];
  conflictCount: number;
  conflicts: Array<{ rule: string; policyId: string | null }>;
  unassociatedFactCount: number;
  reviews: HandoffReview[];
  dynamicChecks: Array<{ policyId: string | null; rule: string; topic: string }>;
  limitations: string[];
  dropped: number;
};

export function parseHandoff(raw: unknown): Handoff | null {
  const notes: ParseNotes = { dropped: 0 };
  const item = z.looseObject({
    rule: z.string().min(1),
    topic: z.string().catch(""),
    state: z.string().catch("missing"),
    value: z.unknown().optional(),
    reason: nullableText,
    citations: listOf(citationSchema, notes),
    conditions: stringList,
    exceptions: stringList,
    overrides: stringList,
    associationVerified: bool,
    conditional: bool,
  });
  const policy = z.looseObject({
    policyId: z.string().min(1),
    kind: z.string().catch("unresolved"),
    spendableCash: z.unknown().optional(),
    association: z.looseObject({ verified: bool }).optional(),
    items: listOf(item, notes),
  });
  const finding = z.looseObject({
    factId: z.string().min(1),
    policyId: nullableText,
    factType: z.string().catch("finding"),
    topic: z.string().catch(""),
    state: z.string().catch("unknown"),
    verified: bool,
    effect: nullableText,
    citations: listOf(citationSchema, notes),
    conditions: stringList,
    exceptions: stringList,
    overrides: stringList,
  });
  const review = z.looseObject({
    reviewId: nullableText,
    factId: nullableText,
    decision: z.string().catch(""),
    state: z.string().catch(""),
    authority: z.string().catch(""),
    reasonCode: nullableText,
  });
  const schema = z.looseObject({
    handoffVersion: z.literal(HANDOFF_VERSION),
    combinedConfirmedCover: z.unknown().optional(),
    policies: z.array(z.unknown()),
    openEndedFindings: listOf(finding, notes),
    conflicts: z.unknown().optional(),
    unassociatedFactIds: z.unknown().optional(),
    reviews: listOf(review, notes),
    dynamicChecks: z.unknown().optional(),
    limitations: stringList,
  });
  const result = schema.safeParse(raw);
  if (!result.success) return null;
  const data = result.data;
  // Same invariants as the backend assertHandoffContract: a payload that sums cover is refused whole.
  if (data.combinedConfirmedCover !== null && data.combinedConfirmedCover !== undefined) return null;
  const policies: HandoffPolicy[] = [];
  for (const rawPolicy of data.policies) {
    const parsed = policy.safeParse(rawPolicy);
    if (!parsed.success) {
      notes.dropped += 1;
      continue;
    }
    if (parsed.data.spendableCash !== false) return null; // limits are never spendable cash: refuse the payload
    policies.push({
      policyId: parsed.data.policyId,
      kind: parsed.data.kind,
      associationVerified: parsed.data.association?.verified === true,
      items: parsed.data.items.map((i) => ({
        rule: i.rule,
        topic: i.topic,
        state: i.state,
        value: i.value ?? null,
        reason: i.reason,
        citations: i.citations,
        conditions: i.conditions,
        exceptions: i.exceptions,
        overrides: i.overrides,
        associationVerified: i.associationVerified,
        conditional: i.conditional,
      })),
    });
  }
  const conflictsRaw = Array.isArray(data.conflicts) ? data.conflicts : [];
  const conflicts = conflictsRaw.flatMap((c) => {
    if (c === null || typeof c !== "object") return [];
    const rec = c as Record<string, unknown>;
    return [{ rule: typeof rec.rule === "string" ? rec.rule : "conflict", policyId: typeof rec.policyId === "string" ? rec.policyId : null }];
  });
  const dynamicRaw = Array.isArray(data.dynamicChecks) ? data.dynamicChecks : [];
  const dynamicChecks = dynamicRaw.flatMap((c) => {
    if (c === null || typeof c !== "object") return [];
    const rec = c as Record<string, unknown>;
    if (typeof rec.rule !== "string") return [];
    return [{ policyId: typeof rec.policyId === "string" ? rec.policyId : null, rule: rec.rule, topic: typeof rec.topic === "string" ? rec.topic : "" }];
  });
  return {
    policies,
    findings: data.openEndedFindings.map((f) => ({
      factId: f.factId,
      policyId: f.policyId,
      factType: f.factType,
      topic: f.topic,
      state: f.state,
      verified: f.verified,
      effect: f.effect,
      citations: f.citations,
      conditions: f.conditions,
      exceptions: f.exceptions,
      overrides: f.overrides,
    })),
    conflictCount: conflictsRaw.length,
    conflicts,
    unassociatedFactCount: Array.isArray(data.unassociatedFactIds) ? data.unassociatedFactIds.length : 0,
    reviews: data.reviews.map((r) => ({ reviewId: r.reviewId, factId: r.factId, decision: r.decision, state: r.state, authority: r.authority, reasonCode: r.reasonCode })),
    dynamicChecks,
    limitations: data.limitations,
    dropped: notes.dropped,
  };
}

// ---- household-coverage-preview/v1 ----

export type PreviewTerm = {
  rule: string;
  topic: string;
  state: string;
  value: unknown;
  provenance: string | null;
  citations: CitationRef[];
  conditions: string[];
  exceptions: string[];
  overrides: string[];
  conditional: boolean;
  appliesToMember: string | null;
  relevantToScenario: boolean | null;
  restrictionKind: string | null;
};
export type PreviewUncertainty = { gapType: string; rule: string; topic: string; state: string; reasonCode: string | null; provenance: string | null; candidateAvailable: boolean };
export type PreviewDynamicCheck = { rule: string; topic: string; requires: string | null; status: string };
export type PreviewPolicy = {
  policyId: string;
  kind: string;
  kindResolved: boolean;
  associationState: string;
  memberApplicability: { state: string; reasonCode: string | null; citations: CitationRef[] };
  documentedTerms: PreviewTerm[];
  documentedRestrictions: PreviewTerm[];
  uncertainties: PreviewUncertainty[];
  dynamicChecks: PreviewDynamicCheck[];
  limitations: string[];
};
export type PreviewQuestion = {
  questionId: string;
  questionKey: string;
  text: string;
  answerType: string;
  allowedOptions: string[];
  priority: string | null;
  alreadyAnswered: boolean;
};
export type PreviewAction = { actionType: string; reasonCode: string; text: string; status: string; relatedGapKeys: string[]; questionId: string | null };
export type PreviewGap = { gapKey: string; reason: string; impact: string | null; priority: string; blocking: boolean; expectedResolver: string | null };
export type PreviewExternalCheck = { checkId: string; status: string; requires: string | null; note: string | null; policyId: string | null; topic: string | null };
export type PreviewBudget = { perTurnLimit: number; journeyLimit: number; usedInJourney: number; remainingInJourney: number; exhausted: boolean };
export type PreviewSource = { sourceIndex: number; status: string; reasonCode: string | null };
export type Preview = {
  assessmentState: "evidence_summary_available" | "conditional_evidence_summary" | "insufficient_evidence" | "conflicting_evidence" | "source_revalidation_required" | "unrecognised";
  scenarioType: string | null;
  memberId: string | null;
  memberScope: string | null;
  sources: PreviewSource[];
  policies: PreviewPolicy[];
  overlaps: Array<{ rule: string; topic: string; note: string | null; policyCount: number }>;
  coordinationNotes: string[];
  gaps: PreviewGap[];
  questions: PreviewQuestion[];
  externalChecks: PreviewExternalCheck[];
  actions: PreviewAction[];
  budget: PreviewBudget | null;
  openBlockingGaps: number;
  limitations: string[];
  dropped: number;
};

const ASSESSMENT = ["evidence_summary_available", "conditional_evidence_summary", "insufficient_evidence", "conflicting_evidence", "source_revalidation_required"] as const;

export function parsePreview(raw: unknown): Preview | null {
  const notes: ParseNotes = { dropped: 0 };
  const term = z.looseObject({
    rule: z.string().min(1),
    topic: z.string().catch(""),
    state: z.string().catch("missing"),
    value: z.unknown().optional(),
    provenance: nullableText,
    citations: listOf(citationSchema, notes),
    conditions: stringList,
    exceptions: stringList,
    overrides: stringList,
    conditional: bool,
    appliesToMember: nullableText,
    relevantToScenario: z.boolean().nullable().optional().catch(null),
    restrictionKind: nullableText,
  });
  const uncertainty = z.looseObject({
    gapType: z.string().catch("evidence_gap"),
    rule: z.string().catch("unknown"),
    topic: z.string().catch(""),
    state: z.string().catch("missing"),
    reasonCode: nullableText,
    provenance: nullableText,
    candidateAvailable: bool,
  });
  const dyn = z.looseObject({ rule: z.string().min(1), topic: z.string().catch(""), requires: nullableText, status: z.string().catch("not_performed") });
  const policy = z.looseObject({
    policyId: z.string().min(1),
    policyType: z.looseObject({ kind: z.string().catch("unresolved"), resolved: bool }).catch({ kind: "unresolved", resolved: false }),
    associationState: z.string().catch("unresolved"),
    memberApplicability: z
      .looseObject({ state: z.string().catch("unresolved"), reasonCode: nullableText, citations: listOf(citationSchema, notes) })
      .catch({ state: "unresolved", reasonCode: null, citations: [] }),
    documentedTerms: listOf(term, notes),
    documentedRestrictions: listOf(term, notes),
    uncertainties: listOf(uncertainty, notes),
    dynamicChecks: listOf(dyn, notes),
    limitations: stringList,
  });
  const question = z.looseObject({
    questionId: z.string().min(1),
    questionKey: z.string().min(1),
    text: z.string().min(1),
    answerType: z.string().catch("text"),
    allowedOptions: stringList,
    priority: nullableText,
    alreadyAnswered: bool,
  });
  const action = z.looseObject({
    actionType: z.string().min(1),
    reasonCode: z.string().catch(""),
    text: z.string().catch(""),
    status: z.string().catch("pending"),
    relatedGapKeys: stringList,
    questionId: nullableText,
  });
  const gap = z.looseObject({
    gapKey: z.string().min(1),
    reason: z.string().catch(""),
    impact: nullableText,
    priority: z.string().catch("P2"),
    blocking: bool,
    expectedResolver: nullableText,
  });
  const check = z.looseObject({ checkId: z.string().min(1), status: z.string().catch("not_performed"), requires: nullableText, note: nullableText, policyId: nullableText, topic: nullableText });
  const sourceEntry = z.looseObject({ sourceIndex: z.number().int(), status: z.string().catch("invalid"), reasonCode: nullableText });
  const budget = z.looseObject({
    perTurnLimit: z.number().int().min(0),
    journeyLimit: z.number().int().min(0),
    usedInJourney: z.number().int().min(0),
    remainingInJourney: z.number().int().min(0),
    exhausted: z.boolean(),
  });
  const schema = z.looseObject({
    contractVersion: z.literal(PREVIEW_VERSION),
    assessmentState: z.string(),
    scenario: z.looseObject({ scenarioType: nullableText, memberId: nullableText, memberScope: nullableText }).catch({ scenarioType: null, memberId: null, memberScope: null }),
    sourceSummary: z.looseObject({ sources: listOf(sourceEntry, notes) }).catch({ sources: [] }),
    policies: listOf(policy, notes),
    comparisons: z.unknown().optional(),
    contextGaps: listOf(gap, notes),
    nextQuestions: listOf(question, notes),
    externalChecks: listOf(check, notes),
    nextActions: listOf(action, notes),
    completeness: z.looseObject({ questionBudget: budget.nullable().optional().catch(null), openBlockingGaps: z.number().int().optional().catch(0) }).catch({ questionBudget: null, openBlockingGaps: 0 }),
    limitations: stringList,
  });
  const result = schema.safeParse(raw);
  if (!result.success) return null;
  const data = result.data;
  const assessmentState = (ASSESSMENT as readonly string[]).includes(data.assessmentState) ? (data.assessmentState as (typeof ASSESSMENT)[number]) : "unrecognised";
  const comparisons = data.comparisons && typeof data.comparisons === "object" ? (data.comparisons as Record<string, unknown>) : {};
  const overlaps = (Array.isArray(comparisons.possibleOverlap) ? comparisons.possibleOverlap : []).flatMap((o) => {
    if (o === null || typeof o !== "object") return [];
    const rec = o as Record<string, unknown>;
    return [{ rule: typeof rec.rule === "string" ? rec.rule : "unknown", topic: typeof rec.topic === "string" ? rec.topic : "", note: typeof rec.note === "string" ? rec.note : null, policyCount: Array.isArray(rec.policies) ? rec.policies.length : 0 }];
  });
  const coordinationNotes = (Array.isArray(comparisons.unresolvedCoordination) ? comparisons.unresolvedCoordination : []).flatMap((c) => {
    const rec = c as Record<string, unknown> | null;
    return rec && typeof rec.text === "string" ? [rec.text] : [];
  });
  return {
    assessmentState,
    scenarioType: data.scenario.scenarioType ?? null,
    memberId: data.scenario.memberId ?? null,
    memberScope: data.scenario.memberScope ?? null,
    sources: data.sourceSummary.sources.map((s) => ({ sourceIndex: s.sourceIndex, status: s.status, reasonCode: s.reasonCode })),
    policies: data.policies.map((p) => ({
      policyId: p.policyId,
      kind: p.policyType.kind,
      kindResolved: p.policyType.resolved,
      associationState: p.associationState,
      memberApplicability: { state: p.memberApplicability.state, reasonCode: p.memberApplicability.reasonCode, citations: p.memberApplicability.citations },
      documentedTerms: p.documentedTerms.map(mapTerm),
      documentedRestrictions: p.documentedRestrictions.map(mapTerm),
      uncertainties: p.uncertainties.map((u) => ({ gapType: u.gapType, rule: u.rule, topic: u.topic, state: u.state, reasonCode: u.reasonCode, provenance: u.provenance, candidateAvailable: u.candidateAvailable })),
      dynamicChecks: p.dynamicChecks.map((d) => ({ rule: d.rule, topic: d.topic, requires: d.requires, status: d.status })),
      limitations: p.limitations,
    })),
    overlaps,
    coordinationNotes,
    gaps: data.contextGaps.map((g) => ({ gapKey: g.gapKey, reason: g.reason, impact: g.impact, priority: g.priority, blocking: g.blocking, expectedResolver: g.expectedResolver })),
    questions: data.nextQuestions.map((q) => ({ questionId: q.questionId, questionKey: q.questionKey, text: q.text, answerType: q.answerType, allowedOptions: q.allowedOptions, priority: q.priority, alreadyAnswered: q.alreadyAnswered })),
    externalChecks: data.externalChecks.map((c) => ({ checkId: c.checkId, status: c.status, requires: c.requires, note: c.note, policyId: c.policyId, topic: c.topic })),
    actions: data.nextActions.map((a) => ({ actionType: a.actionType, reasonCode: a.reasonCode, text: a.text, status: a.status, relatedGapKeys: a.relatedGapKeys, questionId: a.questionId })),
    budget: data.completeness.questionBudget ?? null,
    openBlockingGaps: data.completeness.openBlockingGaps ?? 0,
    limitations: data.limitations,
    dropped: notes.dropped,
  };
}

type RawTerm = {
  rule: string;
  topic: string;
  state: string;
  value?: unknown;
  provenance: string | null;
  citations: CitationRef[];
  conditions: string[];
  exceptions: string[];
  overrides: string[];
  conditional: boolean;
  appliesToMember: string | null;
  relevantToScenario?: boolean | null;
  restrictionKind: string | null;
};

function mapTerm(t: RawTerm): PreviewTerm {
  return {
    rule: t.rule,
    topic: t.topic,
    state: t.state,
    value: t.value ?? null,
    provenance: t.provenance,
    citations: t.citations,
    conditions: t.conditions,
    exceptions: t.exceptions,
    overrides: t.overrides,
    conditional: t.conditional,
    appliesToMember: t.appliesToMember,
    relevantToScenario: t.relevantToScenario ?? null,
    restrictionKind: t.restrictionKind,
  };
}
