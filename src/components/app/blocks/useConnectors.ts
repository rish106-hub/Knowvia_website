"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appFetch } from "@/lib/app-client";
import type { ConnectorList } from "@/lib/app-contract";
import { asApiError } from "../shell/session-context";
import type { AppApiError } from "@/lib/app-client";

export type ConnectorsState = { status: "loading" } | { status: "ready"; data: ConnectorList } | { status: "error"; error: AppApiError };

/** Reads GET /api/app/connectors (no session needed). `demo` is false for real users and the list is then upload only. */
export function useConnectors(): ConnectorsState & { retry: () => void } {
  const [state, setState] = useState<ConnectorsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    appFetch<ConnectorList>("/connectors").then(
      (data) => {
        if (alive.current) setState({ status: "ready", data });
      },
      (error: unknown) => {
        if (alive.current) setState({ status: "error", error: asApiError(error) });
      },
    );
    return () => {
      alive.current = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);
  return { ...state, retry };
}
