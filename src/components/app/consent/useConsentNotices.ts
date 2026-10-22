"use client";

import { useCallback, useEffect, useState } from "react";
import { AppApiError, appFetch } from "@/lib/app-client";
import type { ConsentNotice, ConsentScope } from "@/lib/app-contract";
import { asApiError } from "../shell/session-context";

type NoticesState =
  | { status: "loading" }
  | { status: "ready"; notices: ConsentNotice[] }
  | { status: "error"; error: AppApiError };

/**
 * Loads the DRAFT consent notices from the BFF once the caller needs them. The wording is never hard-coded in the UI:
 * if it cannot be loaded, consent cannot be given (the caller disables the grant button).
 */
export function useConsentNotices(enabled: boolean) {
  const [state, setState] = useState<NoticesState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    appFetch<{ notices: ConsentNotice[] }>("/consents/notices")
      .then((body) => {
        if (!cancelled) setState({ status: "ready", notices: body.notices });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", error: asApiError(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const noticeFor = useCallback(
    (scope: ConsentScope): ConsentNotice | null => (state.status === "ready" ? (state.notices.find((n) => n.scope === scope) ?? null) : null),
    [state],
  );

  return { state, noticeFor, retry };
}
