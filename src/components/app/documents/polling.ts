// Polling policy for documents that are being read or deleted. Pure decision logic: unit tested in tests/unit/app-ui.
// There is no backend progress signal, so nothing here produces a percentage. Backoff, pause when the tab is hidden,
// stop on a terminal state, and a hard cap so a stuck job does not poll forever.

export const POLL_INITIAL_MS = 3000;
export const POLL_MAX_MS = 20000;
export const POLL_FACTOR = 1.6;
export const POLL_MAX_ATTEMPTS = 40;
export const POLL_MAX_CONSECUTIVE_FAILURES = 3;

/** Delay before poll number `attempt` (0 based). Grows by 1.6x from 3 s and never exceeds 20 s. */
export function nextDelayMs(attempt: number): number {
  const safe = Math.max(0, Math.floor(attempt));
  return Math.min(POLL_MAX_MS, Math.round(POLL_INITIAL_MS * POLL_FACTOR ** safe));
}

export type PollInput = {
  /** Polls completed so far. */
  attempt: number;
  consecutiveFailures: number;
  /** Stage of the document after the last poll, or the stage being polled for. */
  stage: string;
  /** Stage this loop exists for (processing or deleting). The loop ends once the document leaves it. */
  watching: "processing" | "deleting";
  hidden: boolean;
};

export type PollDecision =
  | { action: "schedule"; delayMs: number }
  | { action: "wait_visible" }
  | { action: "stop"; reason: "settled" | "cap" | "failures" };

export function decidePoll(input: PollInput): PollDecision {
  if (input.stage !== input.watching) return { action: "stop", reason: "settled" };
  if (input.consecutiveFailures >= POLL_MAX_CONSECUTIVE_FAILURES) return { action: "stop", reason: "failures" };
  if (input.attempt >= POLL_MAX_ATTEMPTS) return { action: "stop", reason: "cap" };
  if (input.hidden) return { action: "wait_visible" };
  return { action: "schedule", delayMs: nextDelayMs(input.attempt) };
}
