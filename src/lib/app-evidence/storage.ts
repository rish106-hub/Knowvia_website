// sessionStorage persistence for the answer id per case and the preview scenario. Every access is wrapped: storage can
// be missing, blocked or full, and the screens must still work (they then re-ask using the stable idempotency key,
// which replays the stored answer at no extra cost).
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function sessionStore(): StorageLike | null {
  try {
    return typeof window !== "undefined" && window.sessionStorage ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function read(store: StorageLike | null, key: string): unknown {
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function write(store: StorageLike | null, key: string, value: unknown): void {
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the screens degrade to re-asking with the stable key */
  }
}
function remove(store: StorageLike | null, key: string): void {
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

const answerKey = (caseId: string) => `kv.cover.answer.${caseId}`;
const genKey = (caseId: string) => `kv.cover.gen.${caseId}`;
const scenarioKey = (caseId: string, answerId: string) => `kv.cover.scenario.${caseId}.${answerId}`;
const confirmerKey = (householdId: string) => `kv.cover.confirmer.${householdId}`;

export type StoredAnswer = { answerId: string; docSet: string };

export function loadStoredAnswer(store: StorageLike | null, caseId: string): StoredAnswer | null {
  const raw = read(store, answerKey(caseId));
  if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    if (typeof rec.answerId === "string" && rec.answerId && typeof rec.docSet === "string") return { answerId: rec.answerId, docSet: rec.docSet };
  }
  return null;
}
export const saveStoredAnswer = (store: StorageLike | null, caseId: string, value: StoredAnswer) => write(store, answerKey(caseId), value);
export function clearStoredAnswer(store: StorageLike | null, caseId: string) {
  const current = loadStoredAnswer(store, caseId);
  remove(store, answerKey(caseId));
  if (current) remove(store, scenarioKey(caseId, current.answerId));
}

export function loadGeneration(store: StorageLike | null, caseId: string): number {
  const raw = read(store, genKey(caseId));
  return typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < 1000 ? raw : 0;
}
export const bumpGeneration = (store: StorageLike | null, caseId: string): number => {
  const next = loadGeneration(store, caseId) + 1;
  write(store, genKey(caseId), next);
  return next;
};

export const loadScenarioRaw = (store: StorageLike | null, caseId: string, answerId: string): unknown => read(store, scenarioKey(caseId, answerId));
export const saveScenario = (store: StorageLike | null, caseId: string, answerId: string, value: unknown) => write(store, scenarioKey(caseId, answerId), value);
export const hasConfirmerFlag = (store: StorageLike | null, householdId: string) => read(store, confirmerKey(householdId)) === true;
export const saveConfirmerFlag = (store: StorageLike | null, householdId: string) => write(store, confirmerKey(householdId), true);
