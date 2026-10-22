// A stateful fake of the /api/app BFF for the S3/S4 specs. page.route answers EVERY /api/app call: no real BFF logic and
// no CoverSaath. These specs prove the UI against payload shapes read from the backend source, not the backend itself.
import { createHash } from "node:crypto";
import type { Page, Route } from "@playwright/test";
import {
  ADULT_ID, ANSWER_ID, CASE_ID, DOC_ID, answerEnvelope, handoffMixed, handoffUnverified, openFinding, overviewFixture, previewBase, previewConditional, qDate, qMember, qSchedule, reviewHousehold,
} from "../../unit/app-evidence/fixtures";

export { ADULT_ID, ANSWER_ID, CASE_ID, DOC_ID };

export type Call = { method: string; path: string; headers: Record<string, string>; body: unknown };
export type Failure = { status: number; code: string; retryable?: boolean } | "abort";

const NOTICE = {
  scope: "question_gemini",
  version: "draft-v0-needs-legal-review",
  status: "draft_needs_legal_review",
  title: "Answer questions from these documents",
  body: "Draft: text from the listed documents is sent to a language model service to answer your question with quotes.",
};

const SESSION = { authenticated: true, expiresAt: "2026-10-22T20:00:00.000Z", householdId: "hh-synth-1", adultId: ADULT_ID, memberId: "mem-synth-owner", identity: { provider: "dev", provisional: true } };

export type Fake = InstanceType<typeof FakeCover>;

export class FakeCover {
  calls: Call[] = [];
  overview: Record<string, unknown>;
  handoff: unknown = handoffUnverified();
  answer: unknown = answerEnvelope();
  /** Called with the request body; returns the preview payload. */
  previewFor: (body: { scenario: { scenarioType: string; answers: Record<string, string> } }) => unknown = () => previewBase();
  askDelayMs = 0;
  private failures = new Map<string, Failure[]>();
  private reviewDecision: string | null = null;

  constructor(overview: Record<string, unknown> = overviewFixture()) {
    this.overview = overview;
  }

  failNext(key: string, failure: Failure, times = 1) {
    this.failures.set(key, [...(this.failures.get(key) ?? []), ...Array(times).fill(failure)]);
  }
  count(key: string) {
    return this.calls.filter((c) => `${c.method} ${c.path}` === key).length;
  }
  last(key: string) {
    return [...this.calls].reverse().find((c) => `${c.method} ${c.path}` === key);
  }
  /** Grant state as the overview shows it. */
  grant() {
    (this.overview.consents as unknown[]).push({ scope: "question_gemini", grantId: "g1", documentIds: [DOC_ID], grantedAt: "2026-10-22T09:00:00.000Z", noticeStatus: "draft_needs_legal_review" });
  }

  async install(page: Page) {
    await page.route("**/api/app/**", (route) => void this.handle(route));
  }

  private json(route: Route, status: number, body: unknown) {
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  }

  private async handle(route: Route) {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api\/app/, "");
    const method = req.method();
    let body: unknown = null;
    try {
      body = req.postData() ? JSON.parse(req.postData() as string) : null;
    } catch {
      body = null;
    }
    this.calls.push({ method, path: path + (url.search || ""), headers: req.headers(), body });
    const norm = path.replace(/\/cases\/[^/]+/, "/cases/:id").replace(/\/answers\/[^/]+/, "/answers/:aid");
    const key = `${method} ${norm}`;
    // record under the bare path too so specs can count by normalised key
    this.calls[this.calls.length - 1].path = norm + (url.search ? "?q" : "");
    const queue = this.failures.get(key);
    if (queue?.length) {
      const f = queue.shift()!;
      if (f === "abort") return route.abort("failed");
      return this.json(route, f.status, { error: { code: f.code, message: "backend text must never be shown", retryable: f.retryable ?? f.status >= 500 } });
    }
    switch (key) {
      case "GET /session":
        return this.json(route, 200, SESSION);
      case "GET /overview":
        return this.json(route, 200, this.overview);
      case "GET /consents/notices":
        return this.json(route, 200, { notices: [NOTICE] });
      case "POST /consents":
        this.grant();
        return this.json(route, 201, { consent: (this.overview.consents as unknown[]).at(-1), reused: false });
      case "POST /cases/:id/questions":
        if (this.askDelayMs) await new Promise((r) => setTimeout(r, this.askDelayMs));
        return this.json(route, 201, this.answer);
      case "GET /cases/:id/answers/:aid":
        return this.json(route, 200, { answerId: ANSWER_ID, current: true, answer: (this.answer as { answer: unknown }).answer });
      case "GET /cases/:id/decision-catalogue":
        return this.json(route, 200, this.handoff);
      case "POST /catalogue-confirmers":
        return this.json(route, 201, { grantId: "cg1", kind: "household_confirmer", status: "active" });
      case "POST /cases/:id/catalogue-reviews": {
        const b = body as { factId: string; decision: string };
        this.reviewDecision = b.decision;
        const h = structuredClone(this.handoff) as ReturnType<typeof handoffUnverified>;
        if (b.decision === "accepted") h.reviews = [...h.reviews, reviewHousehold(b.factId) as never];
        else h.openEndedFindings = h.openEndedFindings.filter((f) => f.factId !== b.factId);
        this.handoff = h;
        return this.json(route, 201, { reviewId: "rev1", replayed: false, decision: b.decision, authority: "household", factId: b.factId });
      }
      case "POST /coverage-preview":
        return this.json(route, 200, this.previewFor(body as never));
      default:
        return this.json(route, 404, { error: { code: "NOT_FOUND", message: "x", retryable: false } });
    }
  }
}

/** Same fingerprint the app derives (documentSetKey): sha256 of ["docs", caseId, sorted ids], first 32 hex chars. */
export const docSetFor = (caseId: string, ids: string[]) => createHash("sha256").update(JSON.stringify(["docs", caseId, [...new Set(ids)].sort()])).digest("hex").slice(0, 32);

/** Seeds sessionStorage as if the evidence screen had already stored an answer for this case. */
export async function seedAnswer(page: Page, docSet: string) {
  await page.addInitScript(([caseId, answerId, ds]) => {
    sessionStorage.setItem(`kv.cover.answer.${caseId}`, JSON.stringify({ answerId, docSet: ds }));
  }, [CASE_ID, ANSWER_ID, docSet]);
}

export const noDocsOverview = () => overviewFixture({ cases: [], documents: [] });
export const processingOverview = () => overviewFixture({ documents: [{ ...(overviewFixture().documents as Array<Record<string, unknown>>)[0], stage: "processing", nextAction: "wait", label: "Reading your PDF", ocr: { status: "processing", errorCode: null, pageCount: null } }] });
export const consentedOverview = () => {
  const o = overviewFixture();
  (o.consents as unknown[]).push({ scope: "question_gemini", grantId: "g1", documentIds: [DOC_ID], grantedAt: "2026-10-22T09:00:00.000Z", noticeStatus: "draft_needs_legal_review" });
  return o;
};

/** Handoff with every state at once: known, conflicting, not selected, missing, dynamic, plus unverified findings. */
export function handoffEverything() {
  const mixed = handoffMixed();
  const unverified = handoffUnverified();
  return { ...mixed, openEndedFindings: unverified.openEndedFindings.concat([openFinding("fact-extra", "Day care procedures", "covers", "cl-wait", 7) as never]) };
}

export { handoffMixed, handoffUnverified, previewBase, previewConditional, qDate, qMember, qSchedule, answerEnvelope };
