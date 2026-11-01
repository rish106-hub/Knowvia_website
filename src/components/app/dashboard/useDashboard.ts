"use client";

import { useCallback, useEffect, useState } from "react";
import { appFetch, type AppApiError } from "@/lib/app-client";
import type { DashboardView, PassagesView } from "@/lib/app-contract";
import { asApiError, useApp } from "../shell/session-context";
import { passagesPath } from "./view-model";

export type DashboardState = {
  /** The last dashboard the BFF sent. Kept while a newer one is on its way, so the screen does not flash. */
  view: DashboardView | null;
  /** The last request failed. `view` may still hold an older answer. */
  error: AppApiError | null;
  loading: boolean;
};

/**
 * GET /api/app/dashboard. Asked once on arrival and again whenever `refresh` changes (a document moved to a new stage, a
 * permission changed). The BFF composes the whole view; this hook only fetches and keeps it. A session error signs out.
 */
export function useDashboard(refresh: string, caseId: string | null) {
  const { handleError } = useApp();
  const [state, setState] = useState<DashboardState>({ view: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const view = await appFetch<DashboardView>("/dashboard");
        if (!cancelled) setState({ view, error: null, loading: false });
      } catch (error) {
        if (cancelled || handleError(error)) return;
        setState((current) => ({ view: current.view, error: asApiError(error), loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, attempt, handleError]);

  const retry = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    setAttempt((n) => n + 1);
  }, []);

  /** "See where your documents mention this": the passages for one topic's search words. */
  const loadPassages = useCallback(
    (query: string) => {
      const path = passagesPath(caseId, query);
      if (!path) return Promise.reject(asApiError(null));
      return appFetch<PassagesView>(path);
    },
    [caseId],
  );

  return { ...state, retry, loadPassages, handleError };
}
