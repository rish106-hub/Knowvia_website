"use client";

// State machine for /app/cover/preview. The preview contract is STATELESS: `scenario.answers` lives here (and in
// sessionStorage) and is re-sent in full on every call. The server never remembers an answer.
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Overview } from "@/lib/app-contract";
import {
  answerIsGone, clearStoredAnswer, describeError, initialScenario, loadScenarioRaw, loadStoredAnswer, sanitiseScenario, saveScenario, scenarioReducer, sessionStore,
  type DocumentLite, type ErrorView, type EvidenceAnswer, type Preview, type ScenarioAction, type ScenarioState,
} from "@/lib/app-evidence";
import { getAnswer, getCoveragePreview, getOverview } from "@/lib/app-evidence/api";

export type PreviewPhase = "loading" | "error" | "no_answer" | "gone" | "ready";

export type PreviewFlow = {
  phase: PreviewPhase;
  error: ErrorView | null;
  overview: Overview | null;
  documents: DocumentLite[];
  answer: EvidenceAnswer | null;
  caseId: string | null;
  answerId: string | null;
  scenario: ScenarioState;
  preview: Preview | null;
  updating: boolean;
  previewError: ErrorView | null;
  dispatch: (action: ScenarioAction) => void;
  retry: () => void;
  undoLast: () => void;
};

export function usePreviewFlow(): PreviewFlow {
  const [phase, setPhase] = useState<PreviewPhase>("loading");
  const [error, setError] = useState<ErrorView | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [answer, setAnswer] = useState<EvidenceAnswer | null>(null);
  const [ids, setIds] = useState<{ caseId: string; answerId: string } | null>(null);
  const [scenario, dispatchScenario] = useReducer(scenarioReducer, undefined, () => initialScenario());
  const [preview, setPreview] = useState<Preview | null>(null);
  const [updating, setUpdating] = useState(false);
  const [previewError, setPreviewError] = useState<ErrorView | null>(null);
  const [nonce, setNonce] = useState(0);
  const lastKey = useRef<string | null>(null);
  const token = useRef(0);
  const restored = useRef(false);

  // 1. overview -> stored answer id -> the answer itself (for quotes)
  useEffect(() => {
    const my = ++token.current;
    (async () => {
      try {
        const ov = await getOverview();
        if (token.current !== my) return;
        setOverview(ov);
        const caseId = ov.cases[0]?.id ?? null;
        const store = sessionStore();
        const stored = caseId ? loadStoredAnswer(store, caseId) : null;
        if (!caseId || !stored) return void setPhase("no_answer");
        try {
          const env = await getAnswer(caseId, stored.answerId);
          if (token.current !== my) return;
          setAnswer(env.answer);
        } catch (e) {
          if (token.current !== my) return;
          if (answerIsGone(e)) {
            clearStoredAnswer(store, caseId);
            setError(describeError(e, "answer"));
            return void setPhase("gone");
          }
          throw e;
        }
        const saved = sanitiseScenario(loadScenarioRaw(store, caseId, stored.answerId));
        if (saved) dispatchScenario({ type: "restore", state: saved });
        restored.current = true;
        setIds({ caseId, answerId: stored.answerId });
        setPhase("ready");
      } catch (e) {
        if (token.current !== my) return;
        setError(describeError(e, "preview"));
        setPhase("error");
      }
    })();
    return () => void (token.current += 1);
  }, [nonce]);

  // 2. every scenario change re-asks the stateless preview endpoint with the full scenario
  useEffect(() => {
    if (phase !== "ready" || !ids) return;
    const my = ++token.current;
    const abort = new AbortController();
    queueMicrotask(() => {
      if (token.current !== my) return;
      setUpdating(true);
      setPreviewError(null);
    });
    saveScenario(sessionStore(), ids.caseId, ids.answerId, scenario);
    (async () => {
      try {
        const next = await getCoveragePreview([{ caseId: ids.caseId, answerId: ids.answerId }], scenario, abort.signal);
        if (token.current !== my) return;
        setPreview(next);
      } catch (e) {
        if (token.current !== my || (e instanceof DOMException && e.name === "AbortError")) return;
        if (answerIsGone(e)) {
          clearStoredAnswer(sessionStore(), ids.caseId);
          setError(describeError(e, "preview"));
          setPhase("gone");
          return;
        }
        setPreviewError(describeError(e, "preview"));
      } finally {
        if (token.current === my) setUpdating(false);
      }
    })();
    return () => abort.abort();
  }, [phase, ids, scenario, nonce]);

  const dispatch = useCallback((action: ScenarioAction) => {
    if (action.type === "answer" || action.type === "skip" || action.type === "unknown") lastKey.current = action.key;
    dispatchScenario(action);
  }, []);
  const undoLast = useCallback(() => {
    if (lastKey.current) dispatchScenario({ type: "undo", key: lastKey.current });
    lastKey.current = null;
  }, []);
  const retry = useCallback(() => setNonce((n) => n + 1), []);

  const documents: DocumentLite[] = overview ? overview.documents.map((d) => ({ id: d.id, documentKind: d.documentKind, uploadedAt: d.uploadedAt })) : [];
  return { phase, error, overview, documents, answer, caseId: ids?.caseId ?? null, answerId: ids?.answerId ?? null, scenario, preview, updating, previewError, dispatch, retry, undoLast };
}
