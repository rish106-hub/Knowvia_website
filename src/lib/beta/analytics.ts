import type { Sensitivity } from "./types";

export type AnswerEvent = { questionId: string; answered: true; optionIds?: string[] };

/** What may leave the browser about an answered question. Health and money answers send only that it was answered (B1). */
export function answerEvent(questionId: string, optionIds: string[], sensitivity: Sensitivity): AnswerEvent {
  if (sensitivity === "none") return { questionId, answered: true, optionIds };
  return { questionId, answered: true };
}

/** Hook point: forwards to the consent-gated gtag when present. Nothing is sent without analytics consent (gtag is only defined then). */
export function trackAnswer(questionId: string, optionIds: string[], sensitivity: Sensitivity) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const e = answerEvent(questionId, optionIds, sensitivity);
  window.gtag("event", "beta_question_answered", { question_id: e.questionId, answered: true, ...(e.optionIds ? { option_ids: e.optionIds.join(",") } : {}) });
}
