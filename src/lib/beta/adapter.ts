// The beta flow talks to this adapter only. `realAdapter` calls the existing /api/beta/* routes; `mockAdapter` runs the whole flow with no backend.
import { api, type ChatAnswer, formatValue, readAnswer } from "./client";
import { type Answers, itemKey, MOCK_CATALOGUE, MOCK_PRODUCTS, MOCK_TILES, MOCK_TRANSCRIPT, MOCK_UNKNOWN_NO_CONTACT, mockAnswer, type PlanItem, planQuestions } from "./mock";
import { TILE_ORDER, badgeFor } from "./tiles";
import type { AnswerCardData, CardTileData, CatalogueQuestion, Phase, TileId } from "./types";

/** uinSource "pdf_text" means the UIN came from the document itself; anything else is a weaker tag and is always confirmed by the person. */
export type Candidate = { candidateId: string; insurerName: string; productName: string; uinSource?: string };
export type SessionState = { signedIn: boolean; hasDocument: boolean; hasHolding: boolean };
// ASSUMED code: the backend voice-busy code (queue full or breaker open) is not defined yet; align when the route exists.
export const VOICE_BUSY = "VOICE_BUSY";
export const isVoiceBusy = (e: unknown) => (e as { code?: string } | null)?.code === VOICE_BUSY;
export type CardState = { productLine: string; tiles: CardTileData[] };

export type Adapter = {
  mock: boolean;
  voiceEnabled: boolean;
  session(): Promise<SessionState>;
  start(name: string, email: string): Promise<void>;
  upload(file: File): Promise<void>;
  status(): Promise<{ stage: string; code?: string }>;
  product(): Promise<{ profileVersion: number; candidates: Candidate[] }>;
  confirmProduct(candidateId: string, expectedVersion: number): Promise<void>;
  searchProduct(fragment: string): Promise<Candidate[]>;
  questions(phase: Phase): Promise<PlanItem[]>;
  lookup(questionId: string): Promise<PlanItem | null>;
  answer(item: PlanItem, optionIds: string[]): Promise<void>;
  /** null while the policy is still being read. */
  card(): Promise<CardState | null>;
  resolveConflict(tileId: TileId, pick: 0 | 1): Promise<void>;
  openThread(): Promise<void>;
  ask(question: string): Promise<AnswerCardData>;
  feedback(helpful: boolean, reason?: string): Promise<void>;
  correct(sourceId: string, value: string): Promise<void>;
  transcribe(blob: Blob | null): Promise<string>;
};

const json = (body: unknown) => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

type Fact = { factKey: string; status: string; value: unknown; unit?: string | null; sources?: { quote?: string | null; page?: { pageId?: string; documentKind?: string | null } | null }[] };

const TILE_KEYS: Record<TileId, RegExp> = {
  sum_insured: /sum_insured/, room_rent: /room/, waiting_periods: /waiting/, copay_deductible: /co_?pay|deductible/, exclusions: /exclusion/, cashless: /cashless|network/,
};

/** Maps backend facts to the six fixed tiles. A tile with no matching fact is "Not checked yet". */
export function tilesFromFacts(facts: Fact[]): CardTileData[] {
  return TILE_ORDER.map(({ id, title }) => {
    const f = facts.find(x => TILE_KEYS[id].test(x.factKey));
    if (!f) return { id, title, value: null, badge: "not_checked" as const };
    if (f.status === "unknown" || f.value == null) return { id, title, value: null, badge: badgeFor("own_pdf", "unknown") };
    const quote = f.sources?.find(s => s.quote)?.quote;
    return {
      id, title, value: formatValue(f.value, f.unit), badge: badgeFor("own_pdf", f.status),
      source: quote ? { tier: "own_pdf" as const, quote } : undefined,
      note: f.status === "conflicting" ? "Your documents differ here. Check with your insurer." : undefined,
    };
  });
}

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);
const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");
const VERDICTS = ["covered", "not_covered", "partly_covered", "depends", "unknown"] as const;
const TIERS = ["own_pdf", "ida_wording", "user_declaration"] as const;
const STATUSES = ["extracted_unverified", "reviewed_reference", "user_confirmed", "conflicting", "unknown"] as const;
const CONDITIONS = ["waiting_period", "sublimit", "copay", "deductible", "exclusion", "room_rent", "document_needed"] as const;
const ACTIONS = ["answer_question", "find_hospital", "call_insurer", "upload_document", "ask_followup", "grievance_path"] as const;

/**
 * The backend's guard-released answer-card/v1, re-checked field by field (never trusted as-is). Null when it is not a card, so the
 * caller falls back to the text mapping. A contact is kept only on call_insurer / grievance_path, as the guard attached it.
 */
export function fromCard(raw: unknown): AnswerCardData | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  if (c.contract !== "answer-card/v1" || typeof c.headline !== "string" || !c.headline) return null;
  const list = (value: unknown, max: number) => (Array.isArray(value) ? value.slice(0, max) : []) as Record<string, unknown>[];
  return {
    contract: "answer-card/v1",
    status: oneOf(c.status, ["evidence_found", "unknown", "out_of_scope"] as const, "unknown"),
    verdict: oneOf(c.verdict, VERDICTS, "unknown"),
    ruleResultId: typeof c.ruleResultId === "string" ? c.ruleResultId : null,
    headline: str(c.headline, 90),
    explanation: str(c.explanation, 280),
    conditions: list(c.conditions, 6).filter(x => typeof x.text === "string").map(x => ({ kind: oneOf(x.kind, CONDITIONS, "document_needed"), text: str(x.text, 280), sourceIds: Array.isArray(x.sourceIds) ? x.sourceIds.filter((id): id is string => typeof id === "string") : [] })),
    sources: list(c.sources, 8).filter(x => typeof x.id === "string").map(x => ({ id: String(x.id), factIds: Array.isArray(x.factIds) ? x.factIds.filter((id): id is string => typeof id === "string") : [], tier: oneOf(x.tier, TIERS, "own_pdf"), status: oneOf(x.status, STATUSES, "extracted_unverified"), page: typeof x.page === "number" ? x.page : null, clause: typeof x.clause === "string" ? x.clause : null, quote: str(x.quote, 160) })),
    actions: list(c.actions, 3).filter(x => typeof x.label === "string").map(x => {
      const kind = oneOf(x.kind, ACTIONS, "ask_followup");
      const contact = x.contact as { kind?: unknown; value?: unknown } | undefined;
      const keep = (kind === "call_insurer" || kind === "grievance_path") && typeof x.contactId === "string" && contact && (contact.kind === "phone" || contact.kind === "email") && typeof contact.value === "string";
      return { kind, label: str(x.label, 80), ...(keep ? { contactId: x.contactId as string, contact: { kind: contact!.kind as "phone" | "email", value: contact!.value as string } } : {}) };
    }),
    followups: (Array.isArray(c.followups) ? c.followups : []).filter((f): f is string => typeof f === "string").slice(0, 3),
  };
}

/** Maps a free-text chat answer (older backends, no `card`) into the card shape. */
export function fromLegacyAnswer(a: ChatAnswer): AnswerCardData {
  if (a.status === "unknown") return { ...MOCK_UNKNOWN_NO_CONTACT, explanation: a.answer || MOCK_UNKNOWN_NO_CONTACT.explanation, followups: [] };
  const text = a.answer.trim();
  const headline = text.length <= 90 ? text : `${text.slice(0, 87).trimEnd()}...`;
  return {
    contract: "answer-card/v1", status: "evidence_found", verdict: "unknown",
    headline, explanation: text.length <= 90 ? "" : text.slice(0, 280),
    conditions: [],
    sources: a.sources.filter(s => s.quote || s.page).slice(0, 8).map((s, i) => ({ id: `s${i}`, factIds: s.fact_key ? [s.fact_key] : [], tier: "own_pdf" as const, status: "extracted_unverified" as const, page: s.page ?? null, quote: (s.quote || "").slice(0, 160) })),
    actions: [], followups: [],
  };
}

type PlanResponse = {
  catalogueVersion: string;
  questions: { questionId: string; memberId: string | null; memberLabel: string | null }[];
  catalogue: Record<string, Omit<CatalogueQuestion, "weight"> | null>;
};

/** Planner output from the backend into plan items. The wording is the backend's reviewed catalogue entry; unknown ids are dropped. */
export function planFromBackend(plan: PlanResponse): PlanItem[] {
  const items: PlanItem[] = [];
  for (const q of plan.questions) {
    const entry = plan.catalogue[q.questionId];
    if (!entry) continue;
    const question: CatalogueQuestion = { ...entry, weight: 0 };
    const member = q.memberId ? { id: q.memberId, label: q.memberLabel ?? "Family member" } : undefined;
    items.push({ key: itemKey(question, member), question, member });
  }
  return items;
}

export function realAdapter(): Adapter {
  let thread: string | null = null;
  let catalogueVersion = "";
  const seen = new Map<string, CatalogueQuestion>();
  return {
    mock: false,
    voiceEnabled: false, // TODO(backend): voice status + POST /api/v1/voice/turns do not exist yet. Mic stays hidden until the backend reports it enabled.
    session: () => api("/api/beta/session"),
    start: async (name, email) => { await api("/api/beta/session", json({ name, email })); },
    upload: async file => { await api("/api/beta/documents", { method: "POST", headers: { "content-type": "application/pdf", "x-consent-confirmed": "true", "x-filename": file.name }, body: file }); },
    status: () => api("/api/beta/status"),
    product: () => api("/api/beta/product"),
    confirmProduct: async (candidateId, expectedVersion) => { await api("/api/beta/product", json({ candidateId, expectedVersion })); },
    searchProduct: async fragment => {
      const q = fragment.trim();
      if (q.length < 2) return [];
      return (await api<{ candidates: Candidate[] }>(`/api/beta/product/search?q=${encodeURIComponent(q)}`)).candidates;
    },
    questions: async phase => {
      const plan = await api<PlanResponse>(`/api/beta/questions?phase=${phase}`);
      catalogueVersion = plan.catalogueVersion;
      const items = planFromBackend(plan);
      for (const item of items) seen.set(item.question.id, item.question);
      return items;
    },
    // Only questions the planner already served can be looked up; anything else stays closed rather than guessed.
    lookup: async id => { const q = seen.get(id); return q && !q.perMember ? { key: itemKey(q), question: q } : null; },
    answer: async (item, optionIds) => {
      await api("/api/beta/answers", json({ questionId: item.question.id, memberId: item.member?.id ?? null, optionIds, catalogueVersion }));
    },
    card: async () => {
      const r = await api<{ facts: { facts: Fact[] }; holding: { summary?: { insurerName?: string; productName?: string } } }>("/api/beta/facts");
      if (r.facts.facts.length === 0) return null;
      const s = r.holding.summary;
      return { productLine: s?.insurerName ? `${s.insurerName} ${s.productName || ""}`.trim() : "", tiles: tilesFromFacts(r.facts.facts) };
    },
    resolveConflict: async () => undefined, // TODO(backend): conflict resolution route.
    openThread: async () => { if (!thread) thread = (await api<{ threadId: string }>("/api/beta/chat/threads", { method: "POST" })).threadId; },
    ask: async question => {
      const res = await fetch("/api/beta/chat/turn", { credentials: "same-origin", ...json({ threadId: thread, message: question }) });
      const answer = await readAnswer(res);
      return fromCard(answer.card) ?? fromLegacyAnswer(answer);
    },
    feedback: async () => undefined, // TODO(backend): feedback route.
    correct: async () => undefined, // TODO(backend): correction writes a user_declaration and re-renders.
    transcribe: async () => { throw { code: "VOICE_DISABLED", message: "Voice is not available.", status: 503 }; },
  };
}

export function mockAdapter(opts: { voiceBusy?: boolean; uinFromPdf?: boolean } = {}): Adapter {
  const answers: Answers = {};
  const tiles = MOCK_TILES.map(t => ({ ...t }));
  let picked = MOCK_PRODUCTS[0];
  return {
    mock: true,
    voiceEnabled: true,
    session: async () => ({ signedIn: false, hasDocument: false, hasHolding: false }),
    start: async () => { await delay(150); },
    upload: async () => { await delay(150); },
    status: async () => { await delay(600); return { stage: "ready" }; },
    product: async () => ({ profileVersion: 1, candidates: opts.uinFromPdf ? [{ ...MOCK_PRODUCTS[0], uinSource: "pdf_text" }] : MOCK_PRODUCTS }),
    confirmProduct: async candidateId => { picked = MOCK_PRODUCTS.find(p => p.candidateId === candidateId) ?? picked; },
    searchProduct: async fragment => MOCK_PRODUCTS.filter(p => `${p.productName} ${p.insurerName}`.toLowerCase().includes(fragment.trim().toLowerCase())),
    questions: async phase => planQuestions(MOCK_CATALOGUE, phase, answers),
    lookup: async id => { const q = MOCK_CATALOGUE.find(c => c.id === id); return q ? { key: q.id + ":", question: q } : null; },
    answer: async (item, optionIds) => { answers[item.key] = optionIds; },
    card: async () => { await delay(400); return { productLine: `${picked.insurerName} ${picked.productName}`, tiles: tiles.map(t => ({ ...t })) }; },
    resolveConflict: async (tileId, pick) => {
      const t = tiles.find(x => x.id === tileId);
      if (!t?.conflict) return;
      const chosen = t.conflict[pick];
      Object.assign(t, { value: chosen.value, source: chosen.source, badge: chosen.source.tier, conflict: undefined });
    },
    openThread: async () => undefined,
    ask: async question => { await delay(700); return mockAnswer(question); },
    feedback: async () => undefined,
    correct: async () => undefined,
    transcribe: async () => { await delay(300); if (opts.voiceBusy) throw { code: VOICE_BUSY, message: "Busy", status: 503 }; return MOCK_TRANSCRIPT; }, // canned: no real Gnani call
  };
}

export function pickAdapter(): Adapter {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const flag = params?.get("mock") === "1";
  return flag || process.env.NEXT_PUBLIC_BETA_MOCK === "1" ? mockAdapter({ voiceBusy: params?.get("voicebusy") === "1", uinFromPdf: params?.get("uinpdf") === "1" }) : realAdapter();
}
