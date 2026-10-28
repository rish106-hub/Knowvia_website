// Thin client over the BFF for the cover screens. Every response is parsed defensively; an unreadable payload becomes
// a thrown AppEvidenceParseError (screens then fail closed to "Not confirmed"), never a guess.
import { appFetch } from "../app-client";
import type { ConsentNotice, ConsentView, Overview } from "../app-contract";
import { FIRST_QUESTION } from "./idempotency";
import { parseAnswerEnvelope, parseHandoff, parsePreview, type AnswerEnvelope, type Handoff, type Preview } from "./schemas";
import { buildPreviewRequest, type PreviewSourceRef, type ScenarioState } from "./scenario";

export class AppEvidenceParseError extends Error {
  readonly code = "UNREADABLE_RESPONSE";
  readonly status = 200;
  readonly retryable = false;
  constructor(what: string) {
    super(`Could not read the ${what} safely.`);
    this.name = "AppEvidenceParseError";
  }
}

const enc = encodeURIComponent;

export const getOverview = (signal?: AbortSignal) => appFetch<Overview>("/overview", { signal });

export async function getQuestionNotice(signal?: AbortSignal): Promise<ConsentNotice | null> {
  const body = await appFetch<{ notices?: ConsentNotice[] }>("/consents/notices", { signal });
  const notice = Array.isArray(body?.notices) ? body.notices.find((n) => n?.scope === "question_gemini") : undefined;
  return notice && typeof notice.title === "string" && typeof notice.body === "string" ? notice : null;
}

// One key per user action: a repeat after an ambiguous timeout gets the same grant back instead of a second, unrecorded one.
export const grantQuestionConsent = (documentIds: string[], idempotencyKey: string, signal?: AbortSignal) =>
  appFetch<{ consent: ConsentView; reused: boolean }>("/consents", {
    method: "POST",
    json: { scope: "question_gemini", documentIds },
    headers: { "Idempotency-Key": idempotencyKey },
    signal,
  });

export async function askFirstQuestion(caseId: string, documentIds: string[], idempotencyKey: string, signal?: AbortSignal): Promise<AnswerEnvelope> {
  const raw = await appFetch<unknown>(`/cases/${enc(caseId)}/questions`, {
    method: "POST",
    json: { question: FIRST_QUESTION, documentIds },
    headers: { "Idempotency-Key": idempotencyKey },
    signal,
  });
  const parsed = parseAnswerEnvelope(raw);
  if (!parsed) throw new AppEvidenceParseError("answer");
  return parsed;
}

export async function getAnswer(caseId: string, answerId: string, signal?: AbortSignal): Promise<AnswerEnvelope> {
  const raw = await appFetch<unknown>(`/cases/${enc(caseId)}/answers/${enc(answerId)}`, { signal });
  const parsed = parseAnswerEnvelope(raw);
  if (!parsed) throw new AppEvidenceParseError("answer");
  return parsed;
}

/** Resolves to null when the handoff cannot be read safely; the caller then shows everything as unconfirmed. */
export async function getHandoff(caseId: string, answerId: string, signal?: AbortSignal): Promise<Handoff | null> {
  const raw = await appFetch<unknown>(`/cases/${enc(caseId)}/decision-catalogue?answerId=${enc(answerId)}`, { signal });
  return parseHandoff(raw);
}

export const designateSelfConfirmer = (adultUserId: string, signal?: AbortSignal) =>
  appFetch<unknown>("/catalogue-confirmers", { method: "POST", json: { adultUserId }, signal });

export const recordReview = (caseId: string, input: { answerId: string; factId: string; decision: "accepted" | "rejected"; reasonCode: "matches_clause" | "does_not_match_clause" }, idempotencyKey: string, signal?: AbortSignal) =>
  appFetch<unknown>(`/cases/${enc(caseId)}/catalogue-reviews`, { method: "POST", json: input, headers: { "Idempotency-Key": idempotencyKey }, signal });

export async function getCoveragePreview(sources: PreviewSourceRef[], scenario: ScenarioState, signal?: AbortSignal): Promise<Preview> {
  const raw = await appFetch<unknown>("/coverage-preview", { method: "POST", json: buildPreviewRequest(sources, scenario), signal });
  const parsed = parsePreview(raw);
  if (!parsed) throw new AppEvidenceParseError("preview");
  return parsed;
}
