import { describe, expect, it } from "vitest";
import {
  POLL_INITIAL_MS,
  POLL_MAX_ATTEMPTS,
  POLL_MAX_CONSECUTIVE_FAILURES,
  POLL_MAX_MS,
  decidePoll,
  nextDelayMs,
} from "@/components/app/documents/polling";

const base = { attempt: 0, consecutiveFailures: 0, stage: "processing", watching: "processing", hidden: false } as const;

describe("nextDelayMs", () => {
  it("starts at 3 s and grows by 1.6x", () => {
    expect(nextDelayMs(0)).toBe(POLL_INITIAL_MS);
    expect(nextDelayMs(1)).toBe(4800);
    expect(nextDelayMs(2)).toBe(7680);
  });

  it("never exceeds the cap and never decreases", () => {
    let previous = 0;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const delay = nextDelayMs(attempt);
      expect(delay).toBeLessThanOrEqual(POLL_MAX_MS);
      expect(delay).toBeGreaterThanOrEqual(previous);
      previous = delay;
    }
    expect(nextDelayMs(30)).toBe(POLL_MAX_MS);
  });

  it("treats a negative or fractional attempt as a safe number", () => {
    expect(nextDelayMs(-5)).toBe(POLL_INITIAL_MS);
    expect(nextDelayMs(1.9)).toBe(nextDelayMs(1));
  });
});

describe("decidePoll", () => {
  it("schedules the next poll with backoff while the stage is unchanged", () => {
    expect(decidePoll(base)).toEqual({ action: "schedule", delayMs: 3000 });
    expect(decidePoll({ ...base, attempt: 3 })).toEqual({ action: "schedule", delayMs: nextDelayMs(3) });
  });

  it("stops on a terminal stage", () => {
    for (const stage of ["readable", "unreadable", "rejected", "deleted", "awaiting_ocr_consent"]) {
      expect(decidePoll({ ...base, stage })).toEqual({ action: "stop", reason: "settled" });
    }
    expect(decidePoll({ ...base, watching: "deleting", stage: "deleted" })).toEqual({ action: "stop", reason: "settled" });
    expect(decidePoll({ ...base, watching: "deleting", stage: "deleting" })).toEqual({ action: "schedule", delayMs: 3000 });
  });

  it("pauses while the tab is hidden instead of scheduling", () => {
    expect(decidePoll({ ...base, hidden: true })).toEqual({ action: "wait_visible" });
  });

  it("stops at the attempt cap", () => {
    expect(decidePoll({ ...base, attempt: POLL_MAX_ATTEMPTS - 1 }).action).toBe("schedule");
    expect(decidePoll({ ...base, attempt: POLL_MAX_ATTEMPTS })).toEqual({ action: "stop", reason: "cap" });
  });

  it("stops after consecutive failures, even when hidden", () => {
    expect(decidePoll({ ...base, consecutiveFailures: POLL_MAX_CONSECUTIVE_FAILURES - 1 }).action).toBe("schedule");
    expect(decidePoll({ ...base, consecutiveFailures: POLL_MAX_CONSECUTIVE_FAILURES, hidden: true })).toEqual({ action: "stop", reason: "failures" });
  });

  it("settled wins over the cap so a finished document never shows a stall", () => {
    expect(decidePoll({ ...base, stage: "readable", attempt: POLL_MAX_ATTEMPTS })).toEqual({ action: "stop", reason: "settled" });
  });
});
