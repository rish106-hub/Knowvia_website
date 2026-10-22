"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppApiError, appFetch } from "@/lib/app-client";
import type { DocumentView } from "@/lib/app-contract";
import { decidePoll } from "./polling";
import { documentActions } from "./stage";

export type StalledReason = "cap" | "failures";

type Options = {
  onDocument: (doc: DocumentView) => void;
  /** Returns true when the error was a session error (the app signs out and redirects). */
  onError: (error: unknown) => boolean;
};

/**
 * Keeps documents that are being read (POST /documents/{id}/ocr/refresh) or deleted (GET /documents/{id}) current.
 * Backoff 3 s -> 20 s, paused while the tab is hidden, stops when the stage settles, capped at 40 polls, and gives up
 * after 3 failures in a row. A stalled document is reported so the row can offer "Check again".
 */
export function useStagePolling(documents: DocumentView[], { onDocument, onError }: Options) {
  const [stalled, setStalled] = useState<Record<string, StalledReason>>({});
  const [generation, setGeneration] = useState(0);
  const stalledRef = useRef(stalled);
  const callbacks = useRef({ onDocument, onError });
  useEffect(() => {
    stalledRef.current = stalled;
    callbacks.current = { onDocument, onError };
  });

  const watchKey = documents
    .filter((doc) => documentActions(doc).polls)
    .map((doc) => `${doc.id}\t${doc.stage}\t${documentActions(doc).polls}`)
    .sort()
    .join("|");

  useEffect(() => {
    if (!watchKey) return;
    const stops: Array<() => void> = [];

    for (const entry of watchKey.split("|")) {
      const [id, stage, polls] = entry.split("\t");
      if (stalledRef.current[id]) continue;
      const watching = stage as "processing" | "deleting";
      let attempt = 0;
      let failures = 0;
      let cancelled = false;
      let waiting = false;
      let timer: number | undefined;

      const markStalled = (reason: StalledReason) => setStalled((current) => ({ ...current, [id]: reason }));

      const schedule = (currentStage: string) => {
        const decision = decidePoll({ attempt, consecutiveFailures: failures, stage: currentStage, watching, hidden: document.hidden });
        if (decision.action === "schedule") timer = window.setTimeout(() => void run(), decision.delayMs);
        else if (decision.action === "wait_visible") waiting = true;
        else if (decision.reason !== "settled") markStalled(decision.reason);
      };

      const run = async () => {
        timer = undefined;
        if (cancelled) return;
        if (document.hidden) {
          waiting = true;
          return;
        }
        try {
          const body =
            polls === "ocr_refresh"
              ? await appFetch<{ document: DocumentView }>(`/documents/${id}/ocr/refresh`, { method: "POST" })
              : await appFetch<{ document: DocumentView }>(`/documents/${id}`);
          if (cancelled) return;
          failures = 0;
          attempt += 1;
          callbacks.current.onDocument(body.document);
          schedule(body.document.stage);
        } catch (error) {
          if (cancelled) return;
          if (callbacks.current.onError(error)) return;
          if (error instanceof AppApiError && (error.code === "OCR_JOB_NOT_STARTED" || error.code === "DOCUMENT_NOT_FOUND")) {
            markStalled("failures");
            return;
          }
          failures += 1;
          attempt += 1;
          schedule(watching);
        }
      };

      const onVisibility = () => {
        if (!document.hidden && waiting && !cancelled) {
          waiting = false;
          void run();
        }
      };
      document.addEventListener("visibilitychange", onVisibility);
      schedule(watching);
      stops.push(() => {
        cancelled = true;
        if (timer !== undefined) window.clearTimeout(timer);
        document.removeEventListener("visibilitychange", onVisibility);
      });
    }
    return () => stops.forEach((stop) => stop());
  }, [watchKey, generation]);

  /** "Check again": forget the stall for one document and start a fresh loop. */
  const restart = useCallback((id: string) => {
    setStalled((current) => {
      const next = { ...current };
      delete next[id];
      stalledRef.current = next;
      return next;
    });
    setGeneration((n) => n + 1);
  }, []);

  return { stalled, restart };
}
