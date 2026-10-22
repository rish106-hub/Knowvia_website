// Stable Idempotency-Key derivation. The first answer costs a model call, so a reload must replay the stored answer.
// Key = hash(caseId, sorted unique documentIds, fixed question id, generation). `generation` only changes after a
// documented conflict (IDEMPOTENCY_CONFLICT / stale answer) so the person can ask again deliberately.
export const FIRST_QUESTION_ID = "first-read-v1";
export const FIRST_QUESTION =
  "What does this policy document say about what is covered, what is limited or excluded, and the conditions that apply? Use only the document, quote the text you rely on, and say what you could not find.";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const normaliseDocumentIds = (ids: readonly string[]): string[] => [...new Set(ids)].sort();

export async function deriveQuestionKey(caseId: string, documentIds: readonly string[], generation = 0): Promise<string> {
  const hex = await sha256Hex(JSON.stringify(["question", caseId, normaliseDocumentIds(documentIds), FIRST_QUESTION_ID, generation]));
  return `kv-q-${hex.slice(0, 48)}`;
}

export async function deriveReviewKey(caseId: string, answerId: string, factId: string, decision: string): Promise<string> {
  const hex = await sha256Hex(JSON.stringify(["review", caseId, answerId, factId, decision]));
  return `kv-r-${hex.slice(0, 48)}`;
}

/** Fingerprint of the document set an answer was read from; used to notice that the set has changed. */
export async function documentSetKey(caseId: string, documentIds: readonly string[]): Promise<string> {
  return (await sha256Hex(JSON.stringify(["docs", caseId, normaliseDocumentIds(documentIds)]))).slice(0, 32);
}
