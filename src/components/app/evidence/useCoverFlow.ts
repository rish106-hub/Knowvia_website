"use client";

// State machine for /app/cover: overview -> consent -> (stable-key) question -> decision-catalogue handoff.
// The first answer costs a model call, so the Idempotency-Key is derived (case + sorted documents + fixed question id)
// and the answer id is kept in sessionStorage: a reload replays the stored answer at no extra cost.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ConsentNotice, DocumentView, Overview } from "@/lib/app-contract";
import {
  answerIsGone, bumpGeneration, clearStoredAnswer, deriveQuestionKey, deriveReviewKey, describeError, documentSetKey, hasConfirmerFlag, loadGeneration, loadStoredAnswer,
  saveConfirmerFlag, saveStoredAnswer, sessionStore, type DocumentLite, type ErrorView, type EvidenceAnswer, type Handoff,
} from "@/lib/app-evidence";
import { newIdempotencyKey } from "@/lib/app-client";
import { askFirstQuestion, designateSelfConfirmer, getAnswer, getHandoff, getOverview, getQuestionNotice, grantQuestionConsent, recordReview } from "@/lib/app-evidence/api";
import type { ConfirmState } from "./FactCardView";

export type Phase = "loading" | "error" | "no_documents" | "consent" | "reading" | "read_failed" | "ready";

type Ctx = { overview: Overview; caseId: string; documentIds: string[]; docSet: string };

export type CoverState = {
  phase: Phase;
  error: ErrorView | null;
  overview: Overview | null;
  pendingDocuments: DocumentView[];
  documents: DocumentLite[];
  notice: ConsentNotice | null;
  noticeError: ErrorView | null;
  granting: boolean;
  grantError: ErrorView | null;
  recovered: boolean;
  startedAt: number;
  caseId: string | null;
  answerId: string | null;
  answer: EvidenceAnswer | null;
  handoff: Handoff | null;
  handoffUnreadable: boolean;
  handoffLoading: boolean;
  handoffError: ErrorView | null;
  review: Record<string, ConfirmState>;
  reviewMessage: string | null;
};

const initial: CoverState = {
  phase: "loading", error: null, overview: null, pendingDocuments: [], documents: [], notice: null, noticeError: null, granting: false, grantError: null, recovered: false,
  startedAt: 0, caseId: null, answerId: null, answer: null, handoff: null, handoffUnreadable: false, handoffLoading: false, handoffError: null, review: {}, reviewMessage: null,
};

const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";
const CONSENT_CODES = new Set(["CONSENT_REQUIRED", "CONSENT_SCOPE_REQUIRED"]);
const codeOf = (e: unknown) => (e && typeof e === "object" && typeof (e as { code?: unknown }).code === "string" ? (e as { code: string }).code : "");
const ASK_TIMEOUT_MS = 150_000;

export function useCoverFlow() {
  const [state, setState] = useState<CoverState>(initial);
  const run = useRef(0);
  const ctx = useRef<Ctx | null>(null);
  // Kept until the grant succeeds, so every retry of one "allow" action sends the same key.
  const consentKey = useRef<string | null>(null);
  const patch = useCallback((p: Partial<CoverState>) => setState((prev) => ({ ...prev, ...p })), []);

  useEffect(() => () => void (run.current += 1), []);

  const loadNotice = useCallback(async (token: number) => {
    patch({ notice: null, noticeError: null });
    try {
      const notice = await getQuestionNotice();
      if (run.current !== token) return;
      patch(notice ? { notice } : { noticeError: describeError({ code: "UNEXPECTED_RESPONSE", status: 200, retryable: true }, "consent") });
    } catch (e) {
      if (run.current !== token) return;
      patch({ noticeError: describeError(e, "consent") });
    }
  }, [patch]);

  const toConsent = useCallback((token: number, recovered: boolean) => {
    patch({ phase: "consent", recovered, granting: false, grantError: null, answer: null, handoff: null, answerId: null });
    void loadNotice(token);
  }, [patch, loadNotice]);

  const fetchHandoff = useCallback(async (c: Ctx, answerId: string, token: number) => {
    patch({ handoffLoading: true, handoffError: null });
    try {
      const handoff = await getHandoff(c.caseId, answerId);
      if (run.current !== token) return;
      patch({ handoff, handoffUnreadable: handoff === null, handoffLoading: false });
    } catch (e) {
      if (run.current !== token) return;
      if (answerIsGone(e)) {
        clearStoredAnswer(sessionStore(), c.caseId);
        if (CONSENT_CODES.has(codeOf(e))) toConsent(token, true);
        else patch({ phase: "read_failed", error: describeError(e, "handoff"), handoffLoading: false, answer: null });
        return;
      }
      patch({ handoffLoading: false, handoffError: describeError(e, "handoff") });
    }
  }, [patch, toConsent]);

  const loadAnswer = useCallback(async (c: Ctx, token: number) => {
    const store = sessionStore();
    let envelope: Awaited<ReturnType<typeof getAnswer>> | null = null;
    const stored = loadStoredAnswer(store, c.caseId);
    if (stored && stored.docSet === c.docSet) {
      try {
        envelope = await getAnswer(c.caseId, stored.answerId);
      } catch (e) {
        if (run.current !== token) return;
        if (answerIsGone(e)) {
          clearStoredAnswer(store, c.caseId);
          if (CONSENT_CODES.has(codeOf(e))) return toConsent(token, true);
          // otherwise fall through and ask again with the stable key (replay or a fresh read)
        } else {
          return patch({ phase: "read_failed", error: describeError(e, "answer") });
        }
      }
    }
    if (!envelope) {
      patch({ phase: "reading", startedAt: Date.now(), error: null });
      const key = await deriveQuestionKey(c.caseId, c.documentIds, loadGeneration(store, c.caseId));
      const abort = new AbortController();
      const timer = window.setTimeout(() => abort.abort(), ASK_TIMEOUT_MS);
      try {
        envelope = await askFirstQuestion(c.caseId, c.documentIds, key, abort.signal);
      } catch (e) {
        window.clearTimeout(timer);
        if (run.current !== token) return;
        if (isAbort(e)) return patch({ phase: "read_failed", error: describeError({ code: "BACKEND_TIMEOUT", status: 504, retryable: true }, "ask") });
        if (CONSENT_CODES.has(codeOf(e))) return toConsent(token, true);
        if (["IDEMPOTENCY_CONFLICT", "POLICY_EVIDENCE_ANSWER_STALE", "POLICY_EVIDENCE_SUPERSEDED"].includes(codeOf(e))) bumpGeneration(store, c.caseId);
        return patch({ phase: "read_failed", error: describeError(e, "ask") });
      }
      window.clearTimeout(timer);
      if (run.current !== token) return;
      saveStoredAnswer(store, c.caseId, { answerId: envelope.answerId, docSet: c.docSet });
    }
    patch({ phase: "ready", answer: envelope.answer, answerId: envelope.answerId, caseId: c.caseId, handoff: null, handoffUnreadable: false, handoffError: null, review: {}, reviewMessage: null });
    await fetchHandoff(c, envelope.answerId, token);
  }, [patch, toConsent, fetchHandoff]);

  const begin = useCallback(async () => {
    const token = (run.current += 1);
    patch({ ...initial, phase: "loading" });
    let overview: Overview;
    try {
      overview = await getOverview();
    } catch (e) {
      if (run.current === token) patch({ phase: "error", error: describeError(e, "overview") });
      return;
    }
    if (run.current !== token) return;
    const caseId = overview.cases[0]?.id ?? null;
    const inCase = overview.documents.filter((d) => caseId !== null && (d.caseId === caseId || d.caseId === null));
    const readable = inCase.filter((d) => d.stage === "readable").slice(0, 10);
    const pendingDocuments = inCase.filter((d) => !["readable", "deleted", "deleting", "rejected"].includes(d.stage));
    const documents: DocumentLite[] = overview.documents.map((d) => ({ id: d.id, documentKind: d.documentKind, uploadedAt: d.uploadedAt }));
    patch({ overview, documents, pendingDocuments, caseId });
    if (!caseId || readable.length === 0) return patch({ phase: "no_documents" });
    const documentIds = readable.map((d) => d.id).sort();
    const c: Ctx = { overview, caseId, documentIds, docSet: await documentSetKey(caseId, documentIds) };
    ctx.current = c;
    const granted = overview.consents.some((g) => g.scope === "question_gemini" && documentIds.every((id) => g.documentIds.includes(id)));
    if (!granted) return toConsent(token, false);
    await loadAnswer(c, token);
  }, [patch, toConsent, loadAnswer]);

  useEffect(() => {
    queueMicrotask(() => void begin());
  }, [begin]);

  const grant = useCallback(async () => {
    const c = ctx.current;
    if (!c) return;
    const token = run.current;
    patch({ granting: true, grantError: null });
    try {
      consentKey.current ??= newIdempotencyKey();
      await grantQuestionConsent(c.documentIds, consentKey.current);
      consentKey.current = null;
    } catch (e) {
      if (run.current === token) patch({ granting: false, grantError: describeError(e, "consent") });
      return;
    }
    if (run.current !== token) return;
    patch({ granting: false, recovered: false });
    await loadAnswer(c, token);
  }, [patch, loadAnswer]);

  const readAgain = useCallback(async () => {
    const c = ctx.current;
    if (!c) return void begin();
    const token = (run.current += 1);
    await loadAnswer(c, token);
  }, [begin, loadAnswer]);

  const retryNotice = useCallback(() => void loadNotice(run.current), [loadNotice]);

  const retryHandoff = useCallback(async () => {
    const c = ctx.current;
    const answerId = state.answerId;
    if (c && answerId) await fetchHandoff(c, answerId, run.current);
  }, [fetchHandoff, state.answerId]);

  const review = useCallback(async (factId: string, decision: "accepted" | "rejected") => {
    const c = ctx.current;
    const answerId = state.answerId;
    if (!c || !answerId) return;
    const token = run.current;
    const store = sessionStore();
    setState((prev) => ({ ...prev, review: { ...prev.review, [factId]: { status: "saving" } }, reviewMessage: null }));
    try {
      const householdId = c.overview.household.id;
      if (!hasConfirmerFlag(store, householdId)) {
        try {
          await designateSelfConfirmer(c.overview.owner.adultId);
        } catch (e) {
          // 409 means this adult is already designated: carry on. Anything else stops here.
          const status = e && typeof e === "object" ? (e as { status?: unknown }).status : null;
          if (status !== 409) throw e;
        }
        saveConfirmerFlag(store, householdId);
      }
      const key = await deriveReviewKey(c.caseId, answerId, factId, decision);
      await recordReview(c.caseId, { answerId, factId, decision, reasonCode: decision === "accepted" ? "matches_clause" : "does_not_match_clause" }, key);
      if (run.current !== token) return;
      setState((prev) => ({
        ...prev,
        review: { ...prev.review, [factId]: { status: "idle" } },
        reviewMessage: decision === "accepted" ? "Saved. That item now shows as confirmed by you." : "Saved. You marked that item as not matching, so it is no longer listed.",
      }));
      await fetchHandoff(c, answerId, token);
    } catch (e) {
      if (run.current !== token) return;
      const view = describeError(e, "review");
      setState((prev) => ({ ...prev, review: { ...prev.review, [factId]: { status: "error", message: `${view.title}. ${view.message}` } } }));
    }
  }, [state.answerId, fetchHandoff]);

  return { state, actions: { reload: begin, grant, readAgain, retryNotice, retryHandoff, review } };
}
