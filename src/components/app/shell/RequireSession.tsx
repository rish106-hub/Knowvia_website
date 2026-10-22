"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Overview } from "@/lib/app-contract";
import { Button, Notice } from "../ui";
import { errorCopy } from "./error-copy";
import { useApp } from "./session-context";

/**
 * Renders children only for a signed-in session whose overview has loaded. Everything else is an honest state:
 * loading, could-not-load (with Retry), or a redirect to sign-in.
 */
export function RequireSession({ children }: { children: (overview: Overview) => ReactNode }) {
  const { state, reload, reloadOverview } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "signed_out") return;
    router.replace(state.reason === "expired" ? "/app/sign-in?reason=expired" : state.reason === "signed_out" ? "/app/sign-in?reason=signed_out" : "/app/sign-in");
  }, [state, router]);

  if (state.status === "loading" || state.status === "signed_out") {
    return (
      <p className="kva-p kva-muted" role="status">
        {state.status === "loading" ? "Loading your household." : "Taking you to sign-in."}
      </p>
    );
  }
  if (state.status === "error") {
    const copy = errorCopy(state.error);
    return (
      <Notice tone="error" title={copy.title} actions={<Button size="sm" onClick={() => void reload()}>Try again</Button>}>
        {copy.message}
      </Notice>
    );
  }
  if (state.overviewError) {
    const copy = errorCopy(state.overviewError);
    return (
      <Notice tone="error" title="Could not load your household" actions={<Button size="sm" onClick={() => void reloadOverview()}>Try again</Button>}>
        {copy.message}
      </Notice>
    );
  }
  if (!state.overview) {
    return (
      <p className="kva-p kva-muted" role="status">
        Loading your household.
      </p>
    );
  }
  return <>{children(state.overview)}</>;
}
