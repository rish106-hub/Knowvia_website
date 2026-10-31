// Run V1b: a returning Google sign-in rebuilds the BFF state from the backend, so the person is not asked again. Fake backend and
// fake Google only. Sign-in must never fail because of the rebuild.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildConsentGrant } from "@/server/app/consent-scopes";
import { openCookie } from "@/server/app/cookie-crypto";
import type { AppState } from "@/server/app/session";
import { FAKE_SECRET, request, type FakeBackend } from "./helpers";
import { fullSignIn, makeGoogleApp, startGoogle } from "./google-support";

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => errors.mockRestore());

const doc = (id: string, status = "accepted") => ({ id, caseId: "case-1", documentKind: "policy_schedule", byteSize: 100, status, uploadedAt: "2026-10-21T00:00:00.000Z" });

/** The household the first sign-in created, with a case, documents and grants already on the backend. */
async function seed(ctx: ReturnType<typeof makeGoogleApp>, options: { documents?: Array<ReturnType<typeof doc>>; ocrDocs?: string[] } = {}) {
  const first = await fullSignIn(ctx);
  expect(first.done.location).toBe("/app");
  const identity = ctx.backend.calls.find((call) => call.path === "/api/v1/identity-sessions");
  expect(identity).toBeDefined();
  const [principal] = [...ctx.backend.identities.values()];
  const documents = options.documents ?? [doc("doc-a"), doc("doc-b")];
  for (const document of documents) ctx.backend.documents.set(document.id, document);
  ctx.backend.control.cases = [
    { id: "case-old", status: "closed", createdAt: "2026-10-01T00:00:00.000Z" },
    { id: "case-1", status: "open", createdAt: "2026-10-20T00:00:00.000Z" },
  ];
  const ids = { adultId: principal.adultId, householdId: principal.householdId };
  ctx.backend.grants.set("consent-collect", buildConsentGrant("collect", { ...ids, caseId: "case-1" }));
  ctx.backend.grants.set("consent-ocr", buildConsentGrant("ocr_sarvam", { ...ids, documentIds: options.ocrDocs ?? documents.map((document) => document.id) }));
  return { principal };
}

const stateOf = (jar: Map<string, string>): AppState => {
  const opened = openCookie<AppState>("state", jar.get("kv_state")!, FAKE_SECRET, Date.now());
  expect(opened.ok).toBe(true);
  return (opened as { ok: true; value: AppState }).value;
};

const ocrStarts = (backend: FakeBackend) => backend.calls.filter((call) => call.method === "POST" && /\/ocr-jobs$/.test(call.path));

describe("returning sign-in rebuilds the state", () => {
  it("1 collect grant, 1 reading grant over 2 documents and 1 open case: 2 consents, the case and 2 reading jobs", async () => {
    const ctx = makeGoogleApp();
    await seed(ctx);
    const again = await fullSignIn(ctx);
    expect(again.done.location).toBe("/app");
    const state = stateOf(again.jar);
    expect(state.v).toBe(1);
    expect(state.caseId).toBe("case-1");
    expect(state.consents).toHaveLength(2);
    expect(state.consents.find((consent) => consent.scope === "collect")).toMatchObject({ id: "consent-collect", docs: [] });
    expect(state.consents.find((consent) => consent.scope === "ocr_sarvam")).toMatchObject({ id: "consent-ocr", docs: ["doc-a", "doc-b"] });
    expect(Object.keys(state.ocrJobs).sort()).toEqual(["doc-a", "doc-b"]);
    expect(ocrStarts(ctx.backend)).toHaveLength(2);
    // The backend session in the state cookie's household is the signed-in one.
    expect(state.hid).toBe([...ctx.backend.identities.values()][0].householdId);

    // The rebuilt state is usable: the overview sees the held permissions and the documents, with no new consent step.
    const overview = await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar: again.jar }));
    expect(overview.status).toBe(200);
    const body = await overview.json();
    expect(body.consents.map((consent: { scope: string }) => consent.scope).sort()).toEqual(["collect", "ocr_sarvam"]);
    expect(body.cases).toEqual([{ id: "case-1" }]);
    expect(body.documents.map((document: { ocr: unknown }) => document.ocr)).not.toContain(undefined);
  });

  it("a reading job that already exists is returned, not created again", async () => {
    const ctx = makeGoogleApp();
    await seed(ctx);
    ctx.backend.jobs.set("job-a", { id: "job-a", documentId: "doc-a", status: "succeeded", errorCode: null, pageCount: 3 });
    ctx.backend.jobs.set("job-b", { id: "job-b", documentId: "doc-b", status: "processing", errorCode: null, pageCount: null });
    const again = await fullSignIn(ctx);
    expect(ctx.backend.jobs.size).toBe(2);
    expect(stateOf(again.jar).ocrJobs).toEqual({ "doc-a": "job-a", "doc-b": "job-b" });
  });

  it("a first sign-in (returning false) gets an empty state and the backend lists are not read", async () => {
    const ctx = makeGoogleApp();
    ctx.backend.control.cases = [{ id: "case-1", status: "open", createdAt: "2026-10-20T00:00:00.000Z" }];
    ctx.backend.grants.set("consent-ocr", buildConsentGrant("ocr_sarvam", { adultId: "adult-1", householdId: "household-1", documentIds: ["doc-a"] }));
    const first = await fullSignIn(ctx);
    expect(first.done.location).toBe("/app");
    expect(stateOf(first.jar)).toEqual({ v: 1, hid: [...ctx.backend.identities.values()][0].householdId, caseId: null, consents: [], ocrJobs: {} });
    expect(ctx.backend.calls.filter((call) => /\/(consents|cases)(\?|$)/.test(call.path) && call.method === "GET")).toHaveLength(0);
    expect(ocrStarts(ctx.backend)).toHaveLength(0);
  });

  it("only active permissions are carried over", async () => {
    const ctx = makeGoogleApp();
    await seed(ctx);
    (ctx.backend.grants.get("consent-ocr") as { __status?: string }).__status = "revoked";
    const again = await fullSignIn(ctx);
    const state = stateOf(again.jar);
    expect(state.consents.map((consent) => consent.scope)).toEqual(["collect"]);
    expect(ocrStarts(ctx.backend)).toHaveLength(0);
    expect(state.ocrJobs).toEqual({});
  });

  it("reading starts only for accepted documents that the reading permission names", async () => {
    const ctx = makeGoogleApp();
    await seed(ctx, { documents: [doc("doc-a"), doc("doc-b", "received_pending_checks"), doc("doc-c")], ocrDocs: ["doc-a", "doc-b"] });
    ctx.backend.control.documentStatus = "received_pending_checks";
    const again = await fullSignIn(ctx);
    // doc-a is accepted and named, doc-b is named but not accepted, doc-c is accepted but not named.
    expect(Object.keys(stateOf(again.jar).ocrJobs)).toEqual(["doc-a"]);
    expect(ocrStarts(ctx.backend).map((call) => call.path)).toEqual(["/api/v1/documents/doc-a/ocr-jobs"]);
  });

  it("each reading start carries the held reading grant", async () => {
    const ctx = makeGoogleApp();
    await seed(ctx);
    await fullSignIn(ctx);
    for (const call of ocrStarts(ctx.backend)) expect(call.body).toEqual({ consentGrantId: "consent-ocr" });
  });
});

describe("sign-in never fails because of the rebuild", () => {
  it("503 OCR_PROVIDER_DISABLED on a document with a grant and no job: still 302 /app with a session, that entry unset", async () => {
    const ctx = makeGoogleApp();
    await seed(ctx);
    // doc-a (first in order) has no job and its start fails; doc-b (second) has one. The failure must not stop doc-b.
    ctx.backend.jobs.set("job-b", { id: "job-b", documentId: "doc-b", status: "succeeded", errorCode: null, pageCount: 2 });
    ctx.backend.control.ocrStartFailure = { status: 503, code: "OCR_PROVIDER_DISABLED" };
    const again = await fullSignIn(ctx);
    expect(again.done.response.status).toBe(302);
    expect(again.done.location).toBe("/app");
    expect(again.jar.has("kv_session")).toBe(true);
    const state = stateOf(again.jar);
    expect(state.ocrJobs).toEqual({ "doc-b": "job-b" });
    expect(state.ocrJobs["doc-a"]).toBeUndefined();
    // The grants and the case are still there.
    expect(state.consents).toHaveLength(2);
    expect(state.caseId).toBe("case-1");
  });

  it("the consent list failing gives a smaller state and the same redirect", async () => {
    const ctx = makeGoogleApp();
    await seed(ctx);
    ctx.backend.control.failNext.push({ match: /GET \/api\/v1\/households\/[^/]+\/consents/, respond: () => new Response("{}", { status: 500 }) });
    const again = await fullSignIn(ctx);
    expect(again.done.location).toBe("/app");
    expect(again.jar.has("kv_session")).toBe(true);
    const state = stateOf(again.jar);
    expect(state.consents).toEqual([]);
    expect(state.ocrJobs).toEqual({});
    expect(state.caseId).toBe("case-1");
  });

  it("the case list failing gives no case, no reading start, and the same redirect", async () => {
    const ctx = makeGoogleApp();
    await seed(ctx);
    ctx.backend.control.failNext.push({ match: /GET \/api\/v1\/households\/[^/]+\/cases/, respond: () => new Error("down") });
    const again = await fullSignIn(ctx);
    expect(again.done.location).toBe("/app");
    expect(again.jar.has("kv_session")).toBe(true);
    const state = stateOf(again.jar);
    expect(state.caseId).toBeNull();
    expect(state.consents).toHaveLength(2);
    expect(ocrStarts(ctx.backend)).toHaveLength(0);
  });

  it("the document list failing leaves the grants and the case and starts nothing", async () => {
    const ctx = makeGoogleApp();
    await seed(ctx);
    ctx.backend.control.failNext.push({ match: /GET \/api\/v1\/cases\/case-1\/documents$/, respond: () => new Response("{}", { status: 500 }) });
    const again = await fullSignIn(ctx);
    expect(again.done.location).toBe("/app");
    expect(stateOf(again.jar)).toMatchObject({ caseId: "case-1", ocrJobs: {} });
    expect(ocrStarts(ctx.backend)).toHaveLength(0);
  });

  it("a state too large for the sealed cookie is cut down instead of failing the sign-in", async () => {
    const ctx = makeGoogleApp();
    const { principal } = await seed(ctx);
    const long = (i: number) => `${"d".repeat(110)}${i}`;
    for (let i = 0; i < 12; i += 1) {
      const documentIds = Array.from({ length: 10 }, (_, j) => long(i * 10 + j));
      ctx.backend.grants.set(`consent-big-${i}-${"x".repeat(100)}`, buildConsentGrant("question_gemini", { adultId: principal.adultId, householdId: principal.householdId, documentIds }));
    }
    const again = await fullSignIn(ctx);
    expect(again.done.location).toBe("/app");
    expect(again.jar.has("kv_session")).toBe(true);
    expect(again.jar.get("kv_state")!.length).toBeLessThanOrEqual(3800);
    const state = stateOf(again.jar);
    expect(state.hid).toBe(principal.householdId);
    expect(state.consents.length).toBeLessThanOrEqual(24);
  });

  it("a returning person whose rebuilt state is lost still signs in; the pipeline falls back to an empty state", async () => {
    const ctx = makeGoogleApp();
    await seed(ctx);
    ctx.backend.control.failNext.push(
      { match: /GET \/api\/v1\/households\/[^/]+\/consents/, respond: () => new Error("down") },
      { match: /GET \/api\/v1\/households\/[^/]+\/cases/, respond: () => new Error("down") },
    );
    const again = await fullSignIn(ctx);
    expect(again.done.location).toBe("/app");
    expect(stateOf(again.jar)).toMatchObject({ v: 1, caseId: null, consents: [], ocrJobs: {} });
  });
});

describe("the entry mode", () => {
  it("?mode=E is stored as E in kv_oidc and an unknown value as P; every mode lands on /app", async () => {
    const ctx = makeGoogleApp();
    for (const [query, expected] of [["?mode=E", "E"], ["?mode=P", "P"], ["?mode=A", "A"], ["?mode=emergency", "P"], ["?mode=", "P"]] as const) {
      const started = await startGoogle(ctx, new Map(), query);
      const opened = openCookie<{ mode: string }>("oidc", started.jar.get("kv_oidc")!, FAKE_SECRET, Date.now());
      expect(opened.ok && opened.value.mode, query).toBe(expected);
    }
    const done = await fullSignIn(ctx, new Map(), {}, "?mode=E");
    expect(done.done.location).toBe("/app");
  });
});
