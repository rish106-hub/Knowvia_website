"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppApiError, appFetch } from "@/lib/app-client";
import type { DocumentView, Overview, SessionView } from "@/lib/app-contract";
import { isSessionError } from "./error-copy";
import { replaceDocument } from "./overview-utils";

export type SignedOutReason = "none" | "expired" | "signed_out";

export type AppState =
  | { status: "loading" }
  | { status: "signed_out"; reason: SignedOutReason }
  | { status: "error"; error: AppApiError }
  | { status: "ready"; session: SessionView; overview: Overview | null; overviewError: AppApiError | null };

type AppContextValue = {
  state: AppState;
  /** Re-read session and overview from scratch (the "Try again" path). */
  reload: () => Promise<void>;
  /** Re-read the overview without flashing a loading state. */
  reloadOverview: () => Promise<void>;
  /** Patch one document in memory after an action returned its new view. */
  updateDocument: (doc: DocumentView) => void;
  /** Call from any catch block. Returns true when it was a session error and the app is now signed out. */
  handleError: (error: unknown) => boolean;
  /** After POST /session succeeded. */
  signedIn: (session: SessionView) => void;
  signOut: () => Promise<AppApiError | null>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function asApiError(error: unknown): AppApiError {
  if (error instanceof AppApiError) return error;
  return new AppApiError(0, { code: "UNEXPECTED_RESPONSE", message: "Something went wrong. Try again.", retryable: true });
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({ status: "loading" });
  const alive = useRef(true);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof AppApiError && isSessionError(error)) {
      setState({ status: "signed_out", reason: error.code === "SESSION_EXPIRED" ? "expired" : "none" });
      return true;
    }
    return false;
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      const overview = await appFetch<Overview>("/overview");
      if (!alive.current) return;
      setState((current) => (current.status === "ready" ? { ...current, overview, overviewError: null } : current));
    } catch (error) {
      if (!alive.current || handleError(error)) return;
      setState((current) => (current.status === "ready" ? { ...current, overviewError: asApiError(error) } : current));
    }
  }, [handleError]);

  const reload = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const session = await appFetch<SessionView>("/session");
      if (!alive.current) return;
      if (!session.authenticated) {
        setState({ status: "signed_out", reason: session.reason === "expired" ? "expired" : "none" });
        return;
      }
      setState({ status: "ready", session, overview: null, overviewError: null });
      await loadOverview();
    } catch (error) {
      if (alive.current) setState({ status: "error", error: asApiError(error) });
    }
  }, [loadOverview]);

  useEffect(() => {
    alive.current = true;
    const task = window.setTimeout(() => void reload(), 0);
    return () => {
      alive.current = false;
      window.clearTimeout(task);
    };
  }, [reload]);

  const updateDocument = useCallback((doc: DocumentView) => {
    setState((current) =>
      current.status === "ready" && current.overview ? { ...current, overview: replaceDocument(current.overview, doc) } : current,
    );
  }, []);

  const signedIn = useCallback(
    (session: SessionView) => {
      setState({ status: "ready", session, overview: null, overviewError: null });
      void loadOverview();
    },
    [loadOverview],
  );

  const signOut = useCallback(async () => {
    try {
      await appFetch<{ signedOut: boolean }>("/session", { method: "DELETE" });
      setState({ status: "signed_out", reason: "signed_out" });
      return null;
    } catch (error) {
      if (handleError(error)) return null;
      return asApiError(error);
    }
  }, [handleError]);

  const value = useMemo<AppContextValue>(
    () => ({ state, reload, reloadOverview: loadOverview, updateDocument, handleError, signedIn, signOut }),
    [state, reload, loadOverview, updateDocument, handleError, signedIn, signOut],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside the /app layout");
  return value;
}
