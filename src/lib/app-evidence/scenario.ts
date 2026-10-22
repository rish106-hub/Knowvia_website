// Client-held coverage-preview scenario. The backend contract is STATELESS: nothing is stored, and the follow-up
// answers come back in the next request as `scenario.answers`. So this reducer IS the memory of the journey.
// Mirrors CoverSaath household-reasoning/contracts.js (ANSWER_KEYS, LIMITS); the server remains the authority and
// re-validates everything.
import type { PreviewQuestion, Preview } from "./schemas";
import { SCENARIO_VERSION } from "./schemas";
import type { ScenarioType } from "./labels";

export const NOT_KNOWN = "I_DO_NOT_KNOW";
export const SKIPPED = "SKIPPED";
export const QUESTIONS_PER_TURN = 2;
export const QUESTIONS_PER_JOURNEY = 5;
export const MAX_ANSWERS = 50;
export const MAX_TEXT = 160;

export type AnswerType = "member_id" | "date" | "text" | "yes_no";
/** `question: null` means the key is volunteered only and never asked (it does not count against the journey budget). */
export const ANSWER_KEYS: Readonly<Record<string, { type: AnswerType; question: string | null }>> = Object.freeze({
  member_id: { type: "member_id", question: "Q_MEMBER" },
  exact_date: { type: "date", question: "Q_EXACT_DATE" },
  procedure_detail: { type: "text", question: "Q_PROCEDURE_DETAIL" },
  topic_detail: { type: "text", question: "Q_BENEFIT_TOPIC" },
  hospital_name: { type: "text", question: "Q_HOSPITAL_NAME" },
  hospital_city: { type: "text", question: "Q_HOSPITAL_CITY" },
  hospital_branch: { type: "text", question: "Q_HOSPITAL_BRANCH" },
  policy_schedule_available: { type: "yes_no", question: "Q_POLICY_SCHEDULE" },
  continuity_document_available: { type: "yes_no", question: "Q_CONTINUITY_DOCUMENT" },
  other_policy_available: { type: "yes_no", question: "Q_OTHER_POLICY" },
  uninterrupted_cover_reported: { type: "yes_no", question: null },
});

export type ScenarioState = { scenarioType: ScenarioType; answers: Record<string, string> };
export const initialScenario = (scenarioType: ScenarioType = "general_benefit"): ScenarioState => ({ scenarioType, answers: {} });

export type ScenarioAction =
  | { type: "set_scenario"; scenarioType: ScenarioType }
  | { type: "answer"; key: string; value: string }
  | { type: "skip"; key: string }
  | { type: "unknown"; key: string }
  | { type: "undo"; key: string }
  | { type: "restore"; state: ScenarioState }
  | { type: "reset" };

// Control characters, invisible formatting and bidi overrides are refused (the server refuses them too).
function hasForbiddenCharacters(value: string): boolean {
  for (const ch of value) {
    const cp = ch.codePointAt(0) as number;
    if (cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f) || cp === 0xad || cp === 0x61c || cp === 0x180e || (cp >= 0x200b && cp <= 0x200f) || cp === 0x2028 || cp === 0x2029
      || (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2060 && cp <= 0x206f) || cp === 0xfeff || (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0000 && cp <= 0xe007f)) return true;
  }
  return false;
}
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "2000-01-01" || value > "2100-12-31") return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export type AnswerCheck = { ok: true; value: string } | { ok: false; reason: string };

export function validateAnswerValue(key: string, raw: string): AnswerCheck {
  const spec = Object.hasOwn(ANSWER_KEYS, key) ? ANSWER_KEYS[key] : undefined;
  if (!spec) return { ok: false, reason: "This question is not supported." };
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return { ok: false, reason: "Type an answer, or choose Skip or I do not know." };
  if (value === NOT_KNOWN || value === SKIPPED) return { ok: false, reason: "Use the Skip or I do not know buttons." };
  switch (spec.type) {
    case "member_id":
      return IDENTIFIER.test(value) ? { ok: true, value } : { ok: false, reason: "Choose a person from the list." };
    case "date":
      return isIsoDate(value) ? { ok: true, value } : { ok: false, reason: "Enter a real date as day, month and year." };
    case "yes_no":
      return value === "YES" || value === "NO" ? { ok: true, value } : { ok: false, reason: "Choose Yes or No." };
    case "text":
      if (value.length > MAX_TEXT) return { ok: false, reason: `Keep this under ${MAX_TEXT} characters.` };
      if (hasForbiddenCharacters(value) || !value.isWellFormed()) return { ok: false, reason: "Use plain text only." };
      return { ok: true, value };
  }
}

export function journeyCount(answers: Record<string, string>): number {
  return Object.keys(answers).filter((k) => Object.hasOwn(ANSWER_KEYS, k) && ANSWER_KEYS[k].question !== null).length;
}

export function scenarioReducer(state: ScenarioState, action: ScenarioAction): ScenarioState {
  switch (action.type) {
    case "set_scenario":
      return state.scenarioType === action.scenarioType ? state : { ...state, scenarioType: action.scenarioType };
    case "answer":
    case "skip":
    case "unknown": {
      const key = action.key;
      if (!Object.hasOwn(ANSWER_KEYS, key)) return state;
      const isNew = !Object.hasOwn(state.answers, key);
      // Budget is enforced here as well as by the server: a client that over-asks would only waste the person's time.
      if (isNew && ANSWER_KEYS[key].question !== null && journeyCount(state.answers) >= QUESTIONS_PER_JOURNEY) return state;
      if (isNew && Object.keys(state.answers).length >= MAX_ANSWERS) return state;
      let value: string;
      if (action.type === "skip") value = SKIPPED;
      else if (action.type === "unknown") value = NOT_KNOWN;
      else {
        const check = validateAnswerValue(key, action.value);
        if (!check.ok) return state;
        value = check.value;
      }
      return { ...state, answers: { ...state.answers, [key]: value } };
    }
    case "undo": {
      if (!Object.hasOwn(state.answers, action.key)) return state;
      const { [action.key]: _removed, ...rest } = state.answers;
      void _removed;
      return { ...state, answers: rest };
    }
    case "restore":
      return sanitiseScenario(action.state) ?? state;
    case "reset":
      return initialScenario(state.scenarioType);
  }
}

/** Defensive restore from sessionStorage: anything unexpected is dropped, never trusted. */
export function sanitiseScenario(raw: unknown): ScenarioState | null {
  if (raw === null || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const types = ["general_benefit", "planned_procedure", "cashless_information", "emergency_admission", "policy_comparison"];
  if (typeof rec.scenarioType !== "string" || !types.includes(rec.scenarioType)) return null;
  const answers: Record<string, string> = {};
  if (rec.answers && typeof rec.answers === "object") {
    for (const [key, value] of Object.entries(rec.answers as Record<string, unknown>)) {
      if (!Object.hasOwn(ANSWER_KEYS, key) || typeof value !== "string") continue;
      if (value === NOT_KNOWN || value === SKIPPED) answers[key] = value;
      else {
        const check = validateAnswerValue(key, value);
        if (check.ok) answers[key] = check.value;
      }
    }
  }
  return { scenarioType: rec.scenarioType as ScenarioType, answers };
}

export type PreviewSourceRef = { caseId: string; answerId: string };

export function buildPreviewRequest(sources: PreviewSourceRef[], state: ScenarioState) {
  return {
    contractVersion: SCENARIO_VERSION,
    sources: sources.slice(0, 5).map((s) => ({ caseId: s.caseId, answerId: s.answerId })),
    scenario: { scenarioType: state.scenarioType, answers: { ...state.answers } },
  } as const;
}

/**
 * The questions to show now: at most two, none already answered locally, none for an unknown key, none once the
 * journey budget is spent. The server already applies the same limits; this is the client's own guard.
 */
export function visibleQuestions(preview: Pick<Preview, "questions" | "budget">, state: ScenarioState): PreviewQuestion[] {
  if (journeyCount(state.answers) >= QUESTIONS_PER_JOURNEY) return [];
  if (preview.budget?.exhausted) return [];
  const seen = new Set<string>();
  const out: PreviewQuestion[] = [];
  for (const q of preview.questions) {
    if (out.length >= QUESTIONS_PER_TURN) break;
    const spec = Object.hasOwn(ANSWER_KEYS, q.questionKey) ? ANSWER_KEYS[q.questionKey] : undefined;
    if (!spec || spec.question !== q.questionId) continue; // an unknown or mismatched question is never rendered
    if (q.alreadyAnswered || Object.hasOwn(state.answers, q.questionKey) || seen.has(q.questionKey)) continue;
    seen.add(q.questionKey);
    out.push(q);
  }
  return out;
}

export function budgetText(preview: Pick<Preview, "budget">, state: ScenarioState): { used: number; limit: number; exhausted: boolean } {
  const used = Math.max(journeyCount(state.answers), preview.budget?.usedInJourney ?? 0);
  const limit = QUESTIONS_PER_JOURNEY;
  return { used: Math.min(used, limit), limit, exhausted: used >= limit };
}
