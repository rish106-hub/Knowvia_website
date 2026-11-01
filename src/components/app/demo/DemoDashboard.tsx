"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { appFetch, type AppApiError } from "@/lib/app-client";
import type { DashboardView } from "@/lib/app-contract";
import { DashboardBody } from "../dashboard/DashboardScreen";
import type { EntryMode } from "../dashboard/view-model";
import { errorCopy } from "../shell/error-copy";
import { asApiError } from "../shell/session-context";
import { Button, Notice } from "../ui";
import { DEMO_SCENARIO_IDS, DEMO_SCENARIO_LABELS, demoHref, type DemoScenarioId } from "./demo-scenarios";
import css from "../dashboard/dashboard.module.css";

/** DRAFT. Said on every demo page so nobody mistakes the sample for a real policy. */
export const DEMO_BANNER = "Sample data. This is a made-up policy for looking at every state of the dashboard. It is not yours.";

/**
 * /app/demo/[scenario]: the SAME dashboard body the real screen uses, fed by GET /api/app/demo/{scenario}. No session and
 * no backend. The BFF answers 404 unless demo data is on, and demo data is refused in production.
 */
export function DemoDashboard({ scenario, mode = "P" }: { scenario: DemoScenarioId; mode?: EntryMode }) {
  const [state, setState] = useState<{ view: DashboardView | null; error: AppApiError | null }>({ view: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const view = await appFetch<DashboardView>(`/demo/${scenario}`);
        if (!cancelled) setState({ view, error: null });
      } catch (error) {
        if (!cancelled) setState({ view: null, error: asApiError(error) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scenario, attempt]);

  const retry = useCallback(() => {
    setState({ view: null, error: null });
    setAttempt((n) => n + 1);
  }, []);

  const header = (
    <>
      <p className={css.demoBanner} role="note" data-testid="demo-banner">
        {DEMO_BANNER}
      </p>
      <nav aria-label="Demo scenarios" className={css.actionRow}>
        {DEMO_SCENARIO_IDS.map((id) => (
          <Link key={id} href={demoHref(id)} className={`kva-btn kva-btn--sm ${id === scenario ? "kva-btn--primary" : "kva-btn--secondary"}`} aria-current={id === scenario ? "page" : undefined}>
            {DEMO_SCENARIO_LABELS[id]}
          </Link>
        ))}
      </nav>
    </>
  );

  if (!state.view) {
    return (
      <div className={css.pageNarrow}>
        {header}
        {state.error ? (
          <Notice tone="error" title="Could not load the sample" actions={<Button size="sm" onClick={retry}>Try again</Button>}>
            {errorCopy(state.error).message}
          </Notice>
        ) : (
          <p className="kva-p kva-muted" role="status">
            Loading the sample.
          </p>
        )}
      </div>
    );
  }
  return (
    <div className={css.pageNarrow}>
      {header}
      <DashboardBody view={state.view} mode={mode} onError={() => false} onRetry={retry} />
    </div>
  );
}
