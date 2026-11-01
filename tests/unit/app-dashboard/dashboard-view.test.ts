// Dashboard view and read-back routes (run V5). Fake backend only, synthetic data only.
import { describe, expect, it } from "vitest";
import { buildDashboardView, toPassagesView, toReadFactsView, type DashboardInput, type ReadFactsInput } from "@/server/app/dashboard-view";
import type { DocumentView, Overview, PermissionView, ReadFactsView } from "@/server/app/contract";
import { applyCookies, createFakeBackend, makeApp, request, signIn, uploadRequest, type FakeBackend, type Jar } from "../app-bff/helpers";

// ---------- builders ----------

function doc(over: Partial<DocumentView> & { id: string }): DocumentView {
  return {
    caseId: "case-1",
    documentKind: "policy_schedule",
    byteSize: 100,
    uploadedAt: "2026-10-21T00:00:00.000Z",
    stage: "readable",
    nextAction: "none",
    label: "Read",
    backendStatus: "accepted",
    ocr: { status: "succeeded", errorCode: null, pageCount: 2 },
    structuring: null,
    note: null,
    ...over,
  };
}

function overviewOf(documents: DocumentView[], extra: Partial<Overview> = {}): Overview {
  return {
    session: { expiresAt: "2026-10-22T00:00:00.000Z" },
    household: { id: "household-1", viewerRole: "owner" },
    owner: { adultId: "adult-1", memberId: "member-1" },
    members: [],
    cases: documents.length ? [{ id: "case-1" }] : [],
    documents,
    documentsAccess: "full",
    consents: [],
    ...extra,
  };
}

const readingPermission: PermissionView = {
  id: "consent-9",
  kind: "read_document",
  label: "Read 1 document with the reading service (OCR)",
  grantedAt: "2026-10-21T00:00:00.000Z",
  expiresAt: null,
  status: "active",
  documentIds: ["doc-1"],
  noticeStatus: "draft_needs_legal_review",
};

type FieldInput = { field: string; value: string | null; state?: string; page?: number | null; quote?: string | null };
function facts(documents: Array<{ documentId: string; documentKind?: string; fields: FieldInput[] }>, excluded: ReadFactsView["excluded"] = []): ReadFactsInput {
  return {
    status: "ok",
    data: {
      label: "read_not_checked",
      notice: "Read from your documents by a rule, not checked.",
      excluded,
      documents: documents.map((entry) => ({
        documentId: entry.documentId,
        documentKind: entry.documentKind ?? "policy_schedule",
        fields: entry.fields.map((field) => ({
          field: field.field,
          topic: null,
          value: field.value,
          state: (field.value === null ? "unknown" : (field.state ?? "extracted_unverified")) as "unknown",
          page: field.page ?? (field.value === null ? null : 1),
          quote: field.quote ?? (field.value === null ? null : `${field.field} | ${field.value}`),
        })),
      })),
    },
  };
}

const build = (over: Partial<DashboardInput> & { documents?: DocumentView[] } = {}) =>
  buildDashboardView({ overview: overviewOf(over.documents ?? []), consents: [], scanMode: "clamd", readFacts: { status: "none" }, ...over });

const topicOf = (view: ReturnType<typeof build>, topic: string) => view.widgets.w17.data.topics.find((entry) => entry.topic === topic)!;

/** Every object key anywhere in a value. */
function keysOf(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((entry) => keysOf(entry, out));
  else if (value && typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) {
      out.add(key);
      keysOf(inner, out);
    }
  }
  return out;
}

// ---------- the pure view ----------

describe("buildDashboardView", () => {
  it("empty: W01 0/5, W16 lists the three key documents with the e-card first, every chip disabled", () => {
    const view = build();
    expect(view.widgets.w01.state).toBe("empty");
    expect(view.widgets.w01.data).toMatchObject({ done: 0, total: 5, emptyLabel: "Add your e-card first" });
    expect(view.widgets.w16.state).toBe("empty");
    expect(view.widgets.w16.data.missing.map((entry) => entry.kind)).toEqual(["member_card", "policy_schedule", "policy_wording"]);
    expect(view.widgets.w16.data.fullLabel).toBeNull();
    expect(view.widgets.w07.state).toBe("empty");
    expect(view.widgets.w15).toEqual({ state: "empty", data: { documents: [] } });
    expect(view.widgets.w17.state).toBe("empty");
    const topics = view.widgets.w17.data.topics;
    expect(topics.map((topic) => topic.topic)).toEqual(["sum_insured", "room_rent", "co_payment", "waiting_period", "pre_authorisation", "policy_period"]);
    for (const topic of topics) {
      expect(topic.enabled).toBe(false);
      expect(topic.chip).toBeNull();
      expect(topic.values).toEqual([]);
      expect(topic.explainer.length).toBeGreaterThan(10);
    }
    expect(view.widgets.w12.data).toMatchObject({ action: "add_document", documentKind: "member_card" });
    expect(view.widgets.w14.data.eCard).toEqual({ saved: false, documentId: null });
    expect(view.widgets.w14.data.tel).toBe("tel:112");
    expect(view.widgets.w04).toMatchObject({ state: "empty", data: { chip: null, values: [], stored: false } });
    expect(view.widgets.w13.state).toBe("empty");
    expect(view.copyStatus).toBe("draft_needs_medical_and_legal_review");
  });

  it("uses the shared topic explainers word for word", () => {
    const topics = build().widgets.w17.data.topics;
    expect(topics.find((t) => t.topic === "sum_insured")!.explainer).toBe("The most the policy says it may pay in a policy year. It is not cash in your account.");
    expect(topics.find((t) => t.topic === "pre_authorisation")!.explainer).toBe(
      "Approval from the insurer or TPA before a planned cashless admission, or soon after an emergency one.",
    );
  });

  it("e-card read (2 pages) plus a sum_insured fact: 2/5, 'Read 2 pages', 'Read, not checked' with page, e-card saved", () => {
    const view = build({
      documents: [doc({ id: "doc-1", documentKind: "member_card" })],
      readFacts: facts([{ documentId: "doc-1", documentKind: "member_card", fields: [{ field: "base_sum_insured", value: "5,00,000", page: 1, quote: "Sum Insured | 5,00,000" }] }]),
    });
    expect(view.widgets.w01.state).toBe("partial");
    expect(view.widgets.w01.data.done).toBe(2);
    expect(view.widgets.w01.data.steps.filter((step) => step.done).map((step) => step.id)).toEqual(["member_card", "document_read"]);
    expect(view.widgets.w15.data.documents[0].pagesLabel).toBe("Read 2 pages");
    const sum = topicOf(view, "sum_insured");
    expect(sum.enabled).toBe(true);
    expect(sum.chip).toEqual({ state: "extracted_unverified", label: "Read, not checked" });
    expect(sum.values).toHaveLength(1);
    expect(sum.values[0]).toMatchObject({ value: "5,00,000", page: 1, quote: "Sum Insured | 5,00,000", state: "extracted_unverified" });
    expect(view.widgets.w14.data.eCard).toEqual({ saved: true, documentId: "doc-1" });
    expect(view.widgets.w16.data.missing.map((entry) => entry.kind)).toEqual(["policy_schedule", "policy_wording"]);
    expect(view.widgets.w09.data.items.find((item) => item.id === "member_card")!.source).toBe("your_files");
    // A topic nothing was found for is "Not found yet", not hidden and not guessed.
    expect(topicOf(view, "co_payment").chip).toEqual({ state: "unknown", label: "Not found yet" });
    expect(topicOf(view, "pre_authorisation").chip?.label).toBe("Not found yet");
    // Reading permission is a real consent state: not held here, so 2 and not 3.
    expect(build({ documents: [doc({ id: "doc-1", documentKind: "member_card" })], consents: [readingPermission] }).widgets.w01.data.done).toBe(3);
  });

  it("a withdrawn or expired permission does not count as held", () => {
    const view = build({ documents: [doc({ id: "doc-1" })], consents: [{ ...readingPermission, status: "revoked" }, { ...readingPermission, status: "expired" }] });
    expect(view.widgets.w01.data.steps.find((step) => step.id === "reading_permission")!.done).toBe(false);
    expect(view.widgets.w13.state).toBe("empty");
  });

  it("two documents with different room rent limits: 'Your documents disagree' with both values", () => {
    const view = build({
      documents: [doc({ id: "doc-1" }), doc({ id: "doc-2", documentKind: "policy_wording" })],
      readFacts: facts([
        { documentId: "doc-1", fields: [{ field: "room_rent_limit", value: "1% of sum insured", page: 2 }] },
        { documentId: "doc-2", documentKind: "policy_wording", fields: [{ field: "room_rent_limit", value: "No limit stated", page: 7 }] },
      ]),
    });
    const room = topicOf(view, "room_rent");
    expect(room.chip).toEqual({ state: "conflicting", label: "Your documents disagree" });
    expect(room.conflictDetail).toBe("both_values");
    expect(room.values.map((value) => [value.value, value.page, value.documentId])).toEqual([
      ["1% of sum insured", 2, "doc-1"],
      ["No limit stated", 7, "doc-2"],
    ]);
    expect(room.values.every((value) => value.chip.label === "Your documents disagree")).toBe(true);
    expect(view.widgets.w17.state).toBe("conflicting");
  });

  it("the same value in two documents is not a disagreement", () => {
    const view = build({
      documents: [doc({ id: "doc-1" }), doc({ id: "doc-2" })],
      readFacts: facts([
        { documentId: "doc-1", fields: [{ field: "co_payment", value: "20% on every claim" }] },
        { documentId: "doc-2", fields: [{ field: "co_payment", value: "20%  on every claim" }] },
      ]),
    });
    expect(topicOf(view, "co_payment").chip?.state).toBe("extracted_unverified");
    expect(topicOf(view, "co_payment").values).toHaveLength(1);
  });

  it("a disagreement inside one document is shown with the one value the backend gave, and says so", () => {
    const view = build({
      documents: [doc({ id: "doc-1" })],
      readFacts: facts([{ documentId: "doc-1", fields: [{ field: "ped_waiting_period", value: "24 months", state: "conflicting", page: 3 }] }]),
    });
    const waiting = topicOf(view, "waiting_period");
    expect(waiting.chip?.label).toBe("Your documents disagree");
    expect(waiting.conflictDetail).toBe("one_value");
    expect(waiting.values).toHaveLength(1);
  });

  it("scanning off plus a document awaiting checks gives a notice; otherwise none", () => {
    const waiting = doc({ id: "doc-1", stage: "awaiting_checks", backendStatus: "received_pending_checks", ocr: null, nextAction: "grant_ocr_consent", note: "scan_disabled" });
    expect(build({ documents: [waiting], scanMode: "disabled" }).scanNotice).toMatch(/switched off/);
    expect(build({ documents: [waiting], scanMode: "clamd" }).scanNotice).toBeNull();
    expect(build({ documents: [waiting], scanMode: null }).scanNotice).toBeNull();
    expect(build({ documents: [doc({ id: "doc-2" })], scanMode: "disabled" }).scanNotice).toBeNull();
  });

  it("no key named score, no 'verified' state or 'Confirmed' chip, anywhere", () => {
    const views = [
      build(),
      build({
        documents: [doc({ id: "doc-1", documentKind: "member_card" }), doc({ id: "doc-2" }), doc({ id: "doc-3", documentKind: "policy_wording" })],
        consents: [readingPermission],
        readFacts: facts([
          { documentId: "doc-2", fields: [{ field: "base_sum_insured", value: "5,00,000" }, { field: "policy_period_end", value: "31-03-2026" }] },
        ]),
      }),
    ];
    for (const view of views) {
      expect([...keysOf(view)].filter((key) => /score|streak|percent|countdown/i.test(key))).toEqual([]);
      const json = JSON.stringify(view);
      expect(json).not.toMatch(/\bverified\b/i);
      expect(json).not.toMatch(/Confirmed in your documents/);
      expect(json).not.toMatch(/"state":"verified"/);
    }
  });

  it("a state the backend sends that is not one of the three is dropped as 'Not found yet'", () => {
    const view = toReadFactsView({
      label: "read_not_checked",
      documents: [{ documentId: "doc-1", documentKind: "policy_schedule", fields: [{ field: "base_sum_insured", topic: "sum_insured", value: "5,00,000", state: "verified", page: 1, quote: "q" }] }],
    });
    expect(view.documents[0].fields[0]).toMatchObject({ value: null, state: "unknown", page: null, quote: null });
    const dashboard = build({ documents: [doc({ id: "doc-1" })], readFacts: { status: "ok", data: view } });
    expect(topicOf(dashboard, "sum_insured").chip?.label).toBe("Not found yet");
    expect(topicOf(dashboard, "sum_insured").values).toEqual([]);
  });

  it("read-back off, unavailable or none: the explainer stays and the chip is not shown", () => {
    for (const status of ["off", "unavailable", "none"] as const) {
      const view = build({ documents: [doc({ id: "doc-1" })], readFacts: { status } });
      expect(view.widgets.w17.data.readback).toBe(status);
      expect(view.widgets.w17.state).toBe("empty");
      for (const topic of view.widgets.w17.data.topics) {
        expect(topic.enabled).toBe(false);
        expect(topic.chip).toBeNull();
        expect(topic.explainer).toBe(topic.explainer.trim());
      }
    }
  });

  it("identity fields never reach the view, and long quotes are cut to 160 characters", () => {
    const long = "x".repeat(400);
    const view = build({
      documents: [doc({ id: "doc-1" })],
      readFacts: facts([
        {
          documentId: "doc-1",
          fields: [
            { field: "insurer", value: "Demo Health Insurance Co" },
            { field: "plan_name", value: "Demo Plan" },
            { field: "policy_number", value: "POL-123" },
            { field: "base_sum_insured", value: "5,00,000", quote: long },
          ],
        },
      ]),
    });
    const json = JSON.stringify(view);
    expect(json).not.toContain("Demo Health Insurance Co");
    expect(json).not.toContain("Demo Plan");
    expect(json).not.toContain("POL-123");
    expect(topicOf(view, "sum_insured").values[0].quote!.length).toBeLessThanOrEqual(160);
  });

  it("W04: the policy end date is 'Read, not checked' and never stored as confirmed", () => {
    const view = build({
      documents: [doc({ id: "doc-1" })],
      readFacts: facts([{ documentId: "doc-1", fields: [{ field: "policy_period_start", value: "01-04-2025" }, { field: "policy_period_end", value: "31-03-2026", page: 1 }] }]),
    });
    expect(view.widgets.w04.state).toBe("full");
    expect(view.widgets.w04.data.chip).toEqual({ state: "extracted_unverified", label: "Read, not checked" });
    expect(view.widgets.w04.data.stored).toBe(false);
    expect(view.widgets.w04.data.values.map((value) => value.field)).toEqual(["policy_period_start", "policy_period_end"]);
    const startOnly = build({ documents: [doc({ id: "doc-1" })], readFacts: facts([{ documentId: "doc-1", fields: [{ field: "policy_period_start", value: "01-04-2025" }] }]) });
    expect(startOnly.widgets.w04.state).toBe("partial");
    expect(startOnly.widgets.w04.data.chip?.label).toBe("Not found yet");
  });

  it("W12: a document's own next action first, then the first missing key document, then waiting, then nothing", () => {
    const needsPermission = doc({ id: "doc-1", documentKind: "member_card", stage: "awaiting_ocr_consent", nextAction: "grant_ocr_consent", ocr: null, label: "Waiting for your permission to read it" });
    expect(build({ documents: [needsPermission] }).widgets.w12.data).toMatchObject({ action: "grant_ocr_consent", documentId: "doc-1" });
    const all = ["member_card", "policy_schedule", "policy_wording"].map((documentKind, index) => doc({ id: `doc-${index}`, documentKind }));
    expect(build({ documents: all }).widgets.w12).toEqual({ state: "empty", data: { action: "none", label: "Nothing to do right now", documentId: null, documentKind: null } });
    const processing = all.map((entry, index) => (index === 0 ? { ...entry, stage: "processing" as const, nextAction: "wait" as const } : entry));
    expect(build({ documents: processing }).widgets.w12.data.action).toBe("wait");
    const retry = all.map((entry, index) => (index === 1 ? { ...entry, stage: "unreadable" as const, nextAction: "retry_ocr" as const } : entry));
    expect(build({ documents: retry }).widgets.w12.data).toMatchObject({ action: "retry_ocr", documentId: "doc-1" });
    expect(build({ documents: all }).widgets.w16).toEqual({ state: "full", data: { missing: [], fullLabel: "All key documents added" } });
  });

  it("deleted, deleting and rejected documents do not count as added", () => {
    const view = build({ documents: [doc({ id: "a", documentKind: "member_card", stage: "deleting", nextAction: "wait" }), doc({ id: "b", documentKind: "policy_schedule", stage: "rejected" })] });
    expect(view.widgets.w16.data.missing).toHaveLength(3);
    expect(view.widgets.w14.data.eCard.saved).toBe(false);
  });

  it("model-backed widgets say unknown until an answer exists", () => {
    const { w02, w03, w05, w06, w11 } = build().widgets;
    for (const widget of [w02, w03, w05, w06, w11]) expect(widget).toEqual({ state: "unknown", reason: "needs_answer" });
  });

  it("W09: the checklist says ticks are not stored", () => {
    const { w09 } = build().widgets;
    expect(w09.data.ticksStored).toBe(false);
    expect(w09.data.items.map((item) => item.label)).toContain("Claim form from the insurer");
    expect(w09.data.note).toMatch(/not saved/);
  });
});

describe("read-back mapping keeps only known fields", () => {
  it("read-facts: label kept, unknown keys dropped, unsafe ids dropped, text bounded", () => {
    const view = toReadFactsView({
      label: "read_not_checked",
      notice: "n".repeat(900),
      extra: "dropped",
      documents: [
        { documentId: "doc-1", documentKind: "policy_schedule", consentGrantId: "grant-secret", fields: [{ field: "co_payment", topic: "co_payment", value: "20%", state: "extracted_unverified", page: 2, quote: "q".repeat(500), secret: "x" }] },
        { documentId: "../etc", documentKind: "policy_schedule", fields: [] },
        "not an object",
      ],
      excluded: [{ documentId: "doc-2", reason: "superseded", why: "x" }, { documentId: "doc-3", reason: "something_new" }, { documentId: "bad id", reason: "not_read" }],
    } as never);
    const json = JSON.stringify(view);
    expect(view.label).toBe("read_not_checked");
    expect(view.notice.length).toBeLessThanOrEqual(300);
    expect(view.documents).toHaveLength(1);
    expect(view.documents[0].fields[0].quote!.length).toBeLessThanOrEqual(160);
    expect(view.excluded).toEqual([{ documentId: "doc-2", reason: "superseded" }, { documentId: "doc-3", reason: "not_read" }]);
    expect(json).not.toMatch(/grant-secret|dropped|"secret"|etc/);
  });

  it("passages: label kept, unknown keys dropped, at most 10, snippet bounded, a missing snippet is skipped", () => {
    const raw = Array.from({ length: 15 }, (_, index) => ({ clauseId: `clause-${index}`, documentId: "doc-1", page: 3, kind: "exclusion", title: null, snippet: `s${index}`, hidden: "x" }));
    const view = toPassagesView({
      label: "passage_not_answer",
      query: "room rent",
      passages: [{ clauseId: "c", documentId: "doc-1", page: 1, kind: "benefit", snippet: "" }, { clauseId: "c2", documentId: "doc-1", page: 0, kind: "benefit", snippet: "y".repeat(900) }, ...raw],
      excluded: [],
    } as never);
    expect(view.label).toBe("passage_not_answer");
    expect(view.passages).toHaveLength(10);
    expect(view.passages[0]).toEqual({ clauseId: "c2", documentId: "doc-1", page: null, kind: "benefit", title: null, snippet: "y".repeat(400) });
    expect(JSON.stringify(view)).not.toMatch(/hidden|room rent/);
  });
});

// ---------- the routes ----------

type Reply = { status: number; body: unknown };
function withReadBack(replies: { readFacts?: Reply | (() => Reply); passages?: Reply | (() => Reply) } = {}) {
  const base = createFakeBackend();
  const seen: Array<{ path: string; authorization: string }> = [];
  const resolve = (reply: Reply | (() => Reply) | undefined): Reply => (typeof reply === "function" ? reply() : (reply ?? { status: 503, body: { error: { code: "READBACK_DISABLED", message: "Reading values back is disabled." } } }));
  const fetch: FakeBackend["fetch"] = async (url, init) => {
    const parsed = new URL(url);
    const isReadFacts = parsed.pathname === "/api/v1/cases/case-1/read-facts";
    const isPassages = parsed.pathname === "/api/v1/cases/case-1/passages";
    if ((isReadFacts || isPassages) && (init?.method ?? "GET") === "GET") {
      seen.push({ path: parsed.pathname + parsed.search, authorization: new Headers(init?.headers as HeadersInit).get("authorization") ?? "" });
      const reply = resolve(isReadFacts ? replies.readFacts : replies.passages);
      return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { "content-type": "application/json" } });
    }
    return base.fetch(url, init);
  };
  return { backend: { ...base, fetch } as FakeBackend, seen, calls: base.calls };
}

const get = (ctx: ReturnType<typeof makeApp>, name: Parameters<ReturnType<typeof makeApp>["app"]["dispatch"]>[0], path: string, jar: Jar, params: Record<string, string> = {}, csrf = true) =>
  ctx.app.dispatch(name, request(path, { jar, csrf }), params).then((response) => {
    applyCookies(jar, response);
    return response;
  });

const post = (ctx: ReturnType<typeof makeApp>, name: Parameters<ReturnType<typeof makeApp>["app"]["dispatch"]>[0], path: string, jar: Jar, json: unknown = {}, params: Record<string, string> = {}) =>
  ctx.app.dispatch(name, request(path, { method: "POST", json, jar }), params).then((response) => {
    applyCookies(jar, response);
    return response;
  });

/** Signed in, one document uploaded, reading allowed and finished: the document is `readable`. */
async function withReadDocument(replies: Parameters<typeof withReadBack>[0] = {}) {
  const wrapped = withReadBack(replies);
  const ctx = makeApp({ backend: wrapped.backend });
  const { jar } = await signIn(ctx);
  const collectId = (await (await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" })).json()).consent.grantId as string;
  const upload = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": collectId, "x-document-kind": "member_card" }), { caseId: "case-1" });
  const documentId = (await upload.json()).document.id as string;
  await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "ocr_sarvam", documentIds: [documentId] });
  await post(ctx, "ocr.start", `/api/app/documents/${documentId}/ocr`, jar, {}, { documentId });
  await post(ctx, "ocr.refresh", `/api/app/documents/${documentId}/ocr/refresh`, jar, {}, { documentId });
  return { ctx, jar, documentId, ...wrapped };
}

const FACTS_BODY = (documentId: string) => ({
  label: "read_not_checked",
  notice: "Read from your documents by a rule, not checked.",
  documents: [
    {
      documentId,
      documentKind: "member_card",
      fields: [
        { field: "base_sum_insured", topic: "sum_insured", value: "5,00,000", state: "extracted_unverified", page: 1, quote: "Sum Insured | 5,00,000" },
        { field: "co_payment", topic: "co_payment", value: null, state: "unknown", page: null, quote: null },
      ],
    },
  ],
  excluded: [],
});

describe("GET /api/app/dashboard", () => {
  it("needs a session and the X-Knowvia-App marker", async () => {
    const ctx = makeApp();
    const anonymous = await get(ctx, "dashboard.get", "/api/app/dashboard", new Map());
    expect(anonymous.status).toBe(401);
    const { jar } = await signIn(ctx);
    const noMarker = await get(ctx, "dashboard.get", "/api/app/dashboard", jar, {}, false);
    expect(noMarker.status).toBe(403);
    expect((await noMarker.json()).error.code).toBe("CSRF_BLOCKED");
  });

  it("with no documents: an empty dashboard and no read-back call", async () => {
    const wrapped = withReadBack();
    const ctx = makeApp({ backend: wrapped.backend });
    const { jar } = await signIn(ctx);
    const response = await get(ctx, "dashboard.get", "/api/app/dashboard", jar);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.widgets.w01.data.done).toBe(0);
    expect(body.widgets.w17.data.readback).toBe("none");
    expect(wrapped.seen).toEqual([]);
  });

  it("backend switch off (503 READBACK_DISABLED): the dashboard still loads and chips say not read yet", async () => {
    const { ctx, jar } = await withReadDocument();
    const response = await get(ctx, "dashboard.get", "/api/app/dashboard", jar);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.widgets.w17.data.readback).toBe("off");
    expect(body.widgets.w17.state).toBe("empty");
    expect(body.widgets.w17.data.topics.every((topic: { enabled: boolean; chip: unknown }) => !topic.enabled && topic.chip === null)).toBe(true);
    // The rest of the dashboard is real: the document is read (3 pages from the fake) and the permission is held.
    expect(body.widgets.w15.data.documents[0].pagesLabel).toBe("Read 3 pages");
    expect(body.widgets.w01.data.steps.find((step: { id: string }) => step.id === "reading_permission").done).toBe(true);
  });

  it("read-back on: chips carry the value, page and 'Read, not checked'", async () => {
    let documentId = "";
    const { ctx, jar, seen, documentId: id } = await withReadDocument({ readFacts: () => ({ status: 200, body: FACTS_BODY(documentId) }) });
    documentId = id;
    const response = await get(ctx, "dashboard.get", "/api/app/dashboard", jar);
    const body = await response.json();
    expect(body.widgets.w17.data.readback).toBe("ok");
    const sum = body.widgets.w17.data.topics.find((topic: { topic: string }) => topic.topic === "sum_insured");
    expect(sum.chip).toEqual({ state: "extracted_unverified", label: "Read, not checked" });
    expect(sum.values[0]).toMatchObject({ value: "5,00,000", page: 1 });
    expect(body.widgets.w14.data.eCard).toEqual({ saved: true, documentId });
    // The case comes from the session, the token from the cookie: never from the browser.
    expect(seen.at(-1)!.path).toBe("/api/v1/cases/case-1/read-facts");
    expect(seen.at(-1)!.authorization).toMatch(/^Bearer fake-backend-session-token-/);
    expect(JSON.stringify(body)).not.toMatch(/fake-backend-session-token|consentGrantId|Bearer/);
  });

  it("read-back failing (500 or an unexpected body) degrades to 'unavailable', not a failed dashboard", async () => {
    const failing = await withReadDocument({ readFacts: { status: 500, body: { error: { code: "INTERNAL_ERROR", message: "x" } } } });
    expect((await (await get(failing.ctx, "dashboard.get", "/api/app/dashboard", failing.jar)).json()).widgets.w17.data.readback).toBe("unavailable");
    const odd = await withReadDocument({ readFacts: { status: 200, body: { label: "something_else", documents: [] } } });
    expect((await (await get(odd.ctx, "dashboard.get", "/api/app/dashboard", odd.jar)).json()).widgets.w17.data.readback).toBe("unavailable");
  });

  it("an ended backend session during read-back ends the session here too", async () => {
    const ended = await withReadDocument({ readFacts: { status: 401, body: { error: { code: "AUTHENTICATION_REQUIRED", message: "x" } } } });
    const response = await get(ended.ctx, "dashboard.get", "/api/app/dashboard", ended.jar);
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("SESSION_EXPIRED");
  });

  it("does not ask for values when the storage permission was withdrawn", async () => {
    const { ctx, jar, backend, seen } = await withReadDocument();
    backend.control.fieldAccessDenied = true;
    const before = seen.length;
    const body = await (await get(ctx, "dashboard.get", "/api/app/dashboard", jar)).json();
    expect(body.documentsAccess).toBe("permission_withdrawn");
    expect(body.widgets.w17.data.readback).toBe("unavailable");
    expect(seen.length).toBe(before);
  });

  it("scan disabled and a document waiting: scanNotice is present", async () => {
    const wrapped = withReadBack();
    wrapped.backend.control.documentStatus = "received_pending_checks";
    wrapped.backend.control.scanMode = "disabled";
    const ctx = makeApp({ backend: wrapped.backend });
    const { jar } = await signIn(ctx);
    const collectId = (await (await post(ctx, "consents.grant", "/api/app/consents", jar, { scope: "collect" })).json()).consent.grantId as string;
    await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "x-consent-grant-id": collectId }), { caseId: "case-1" });
    const body = await (await get(ctx, "dashboard.get", "/api/app/dashboard", jar)).json();
    expect(body.scanNotice).toMatch(/switched off/);
  });
});

describe("pass-through routes", () => {
  it("read-facts keeps the label and drops anything the BFF does not know", async () => {
    let documentId = "";
    const body = () => {
      const facts = FACTS_BODY(documentId);
      return { status: 200, body: { ...facts, debug: "internal", documents: facts.documents.map((entry) => ({ ...entry, consentGrantId: "grant-secret" })) } };
    };
    const { ctx, jar, documentId: id } = await withReadDocument({ readFacts: body });
    documentId = id;
    const response = await get(ctx, "readFacts.get", "/api/app/cases/case-1/read-facts", jar, { caseId: "case-1" });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.label).toBe("read_not_checked");
    expect(json.documents[0].fields[0]).toEqual({ field: "base_sum_insured", topic: "sum_insured", value: "5,00,000", state: "extracted_unverified", page: 1, quote: "Sum Insured | 5,00,000" });
    expect(JSON.stringify(json)).not.toMatch(/grant-secret|internal/);
  });

  it("read-facts: a wrong label is refused, not shown", async () => {
    const { ctx, jar } = await withReadDocument({ readFacts: { status: 200, body: { label: "verified", documents: [] } } });
    const response = await get(ctx, "readFacts.get", "/api/app/cases/case-1/read-facts", jar, { caseId: "case-1" });
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("BACKEND_BAD_RESPONSE");
  });

  it("read-facts: the switch being off is a coded, client-safe, non-retryable 503", async () => {
    const { ctx, jar } = await withReadDocument();
    const response = await get(ctx, "readFacts.get", "/api/app/cases/case-1/read-facts", jar, { caseId: "case-1" });
    expect(response.status).toBe(503);
    expect((await response.json()).error).toEqual({ code: "READBACK_DISABLED", message: "Showing what your documents say is not switched on yet.", retryable: false });
  });

  it("read-facts and passages need a session and the marker; a bad case id is refused before any backend call", async () => {
    const { ctx, jar, seen } = await withReadDocument();
    const before = seen.length;
    for (const [name, path] of [["readFacts.get", "/api/app/cases/case-1/read-facts"], ["passages.get", "/api/app/cases/case-1/passages?q=room"]] as const) {
      expect((await get(ctx, name, path, new Map(), { caseId: "case-1" })).status).toBe(401);
      expect((await get(ctx, name, path, jar, { caseId: "case-1" }, false)).status).toBe(403);
      expect((await get(ctx, name, path, jar, { caseId: "../x" })).status).toBe(400);
    }
    expect(seen.length).toBe(before);
  });

  it("passages: label kept, unknown fields dropped, the query is forwarded but not echoed", async () => {
    const reply = {
      status: 200,
      body: {
        label: "passage_not_answer",
        notice: "These are passages from your documents, not an answer or a claim decision.",
        query: "room rent",
        passages: [{ clauseId: "clause-1", documentId: "doc-1", page: 7, kind: "benefit", title: "Room rent", snippet: "Room rent is covered as per the room category chosen.", score: 0.93, text: "full text" }],
        excluded: [{ documentId: "doc-2", reason: "reading_permission_withdrawn" }],
      },
    };
    const { ctx, jar, seen } = await withReadDocument({ passages: reply });
    const response = await get(ctx, "passages.get", "/api/app/cases/case-1/passages?q=%20room%20rent%20&limit=3", jar, { caseId: "case-1" });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.label).toBe("passage_not_answer");
    expect(json.passages).toEqual([{ clauseId: "clause-1", documentId: "doc-1", page: 7, kind: "benefit", title: "Room rent", snippet: "Room rent is covered as per the room category chosen." }]);
    expect(json.excluded).toEqual([{ documentId: "doc-2", reason: "reading_permission_withdrawn" }]);
    expect(JSON.stringify(json)).not.toMatch(/score|full text|"query"/);
    expect(seen.at(-1)!.path).toBe("/api/v1/cases/case-1/passages?q=room+rent&limit=3");
  });

  it("passages: a short, long or repeated query and a bad limit are refused with 400 before any backend call", async () => {
    const { ctx, jar, seen } = await withReadDocument();
    const before = seen.length;
    const bad = [
      "/api/app/cases/case-1/passages",
      "/api/app/cases/case-1/passages?q=a",
      `/api/app/cases/case-1/passages?q=${"x".repeat(121)}`,
      "/api/app/cases/case-1/passages?q=room&q=rent",
      "/api/app/cases/case-1/passages?q=room&limit=0",
      "/api/app/cases/case-1/passages?q=room&limit=11",
      "/api/app/cases/case-1/passages?q=room&limit=abc",
      "/api/app/cases/case-1/passages?q=room&limit=1&limit=2",
      "/api/app/cases/case-1/passages?q=ro%00om",
      "/api/app/cases/case-1/passages?q=ro%0Aom",
      "/api/app/cases/case-1/passages?q=room%0A",
      "/api/app/cases/case-1/passages?q=room%7F",
    ];
    for (const path of bad) {
      const response = await get(ctx, "passages.get", path, jar, { caseId: "case-1" });
      expect(response.status, path).toBe(400);
      expect((await response.json()).error.code).toBe("INVALID_REQUEST");
    }
    expect(seen.length).toBe(before);
  });

  it("passages: no limit is sent when none was given, and the switch being off is the same coded 503", async () => {
    const { ctx, jar, seen } = await withReadDocument();
    const response = await get(ctx, "passages.get", "/api/app/cases/case-1/passages?q=co-payment", jar, { caseId: "case-1" });
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("READBACK_DISABLED");
    expect(seen.at(-1)!.path).toBe("/api/v1/cases/case-1/passages?q=co-payment");
  });
});

// ---------- review fixes ----------

const PASSAGES_OK = {
  status: 200,
  body: { label: "passage_not_answer", notice: "n", passages: [{ clauseId: "clause-1", documentId: "doc-1", page: 1, kind: "benefit", title: null, snippet: "Room rent is covered." }], excluded: [] },
};

describe("passages: label and session", () => {
  it("a wrong label is refused with 502 BACKEND_BAD_RESPONSE", async () => {
    const { ctx, jar } = await withReadDocument({ passages: { status: 200, body: { label: "answer", passages: [] } } });
    const response = await get(ctx, "passages.get", "/api/app/cases/case-1/passages?q=room", jar, { caseId: "case-1" });
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("BACKEND_BAD_RESPONSE");
  });

  it("a 401 from the backend ends the session here too and clears the cookies", async () => {
    const { ctx, jar } = await withReadDocument({ passages: { status: 401, body: { error: { code: "AUTHENTICATION_REQUIRED", message: "x" } } } });
    const response = await get(ctx, "passages.get", "/api/app/cases/case-1/passages?q=room", jar, { caseId: "case-1" });
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("SESSION_EXPIRED");
    expect(jar.size).toBe(0);
  });

  it("is rate limited per signed-in adult (429 after 30 searches), without touching the sign-in limiter", async () => {
    const { ctx, jar, seen } = await withReadDocument({ passages: PASSAGES_OK });
    const before = seen.length;
    for (let index = 0; index < 30; index += 1) {
      expect((await get(ctx, "passages.get", "/api/app/cases/case-1/passages?q=room", jar, { caseId: "case-1" })).status).toBe(200);
    }
    const limited = await get(ctx, "passages.get", "/api/app/cases/case-1/passages?q=room", jar, { caseId: "case-1" });
    expect(limited.status).toBe(429);
    expect((await limited.json()).error.code).toBe("RATE_LIMITED");
    expect(seen.length - before).toBe(30);
    // Signing in again is not affected.
    expect((await signIn(ctx, new Map())).response.status).toBe(201);
  });
});

describe("dashboard: permission list failures", () => {
  const failConsents = (backend: FakeBackend, status: number) =>
    backend.control.failNext.push({ match: /^GET \/api\/v1\/households\/[^/]+\/consents$/, respond: () => new Response(JSON.stringify({ error: { code: "BACKEND_DOWN", message: "x" } }), { status, headers: { "content-type": "application/json" } }) });

  it("a failing permission list does not fail the dashboard and claims nothing about permissions", async () => {
    const { ctx, jar, backend } = await withReadDocument();
    failConsents(backend, 500);
    const response = await get(ctx, "dashboard.get", "/api/app/dashboard", jar);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.permissions).toEqual({ status: "unavailable", truncated: false });
    expect(body.widgets.w13.data).toEqual({ status: "unavailable", truncated: false, items: [] });
    const step = body.widgets.w01.data.steps.find((entry: { id: string }) => entry.id === "reading_permission");
    expect(step).toMatchObject({ done: false, known: false });
    expect(body.widgets.w01.data.steps.filter((entry: { known: boolean }) => !entry.known)).toHaveLength(1);
    // The rest of the dashboard is still real.
    expect(body.widgets.w15.data.documents[0].pagesLabel).toBe("Read 3 pages");
  });

  it("a 401 from the permission list still ends the session", async () => {
    const { ctx, jar, backend } = await withReadDocument();
    failConsents(backend, 401);
    const response = await get(ctx, "dashboard.get", "/api/app/dashboard", jar);
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("SESSION_EXPIRED");
  });

  it("a healthy permission list is 'ok' and not truncated", async () => {
    const { ctx, jar } = await withReadDocument();
    const body = await (await get(ctx, "dashboard.get", "/api/app/dashboard", jar)).json();
    expect(body.permissions).toEqual({ status: "ok", truncated: false });
    expect(body.widgets.w13.data.status).toBe("ok");
    expect(body.widgets.w13.data.items.length).toBeGreaterThan(0);
  });

  it("pure view: unavailable ignores any consents passed, and truncated is surfaced only when the list is known", () => {
    const unavailable = build({ documents: [doc({ id: "doc-1" })], consents: [readingPermission], permissionsStatus: "unavailable", permissionsTruncated: true });
    expect(unavailable.permissions).toEqual({ status: "unavailable", truncated: false });
    expect(unavailable.widgets.w01.data.steps.find((step) => step.id === "reading_permission")).toMatchObject({ done: false, known: false });
    expect(unavailable.widgets.w01.data.done).toBe(2);
    const truncated = build({ documents: [doc({ id: "doc-1" })], consents: [readingPermission], permissionsTruncated: true });
    expect(truncated.permissions).toEqual({ status: "ok", truncated: true });
    expect(truncated.widgets.w13.data.truncated).toBe(true);
    expect(truncated.widgets.w01.data.steps.find((step) => step.id === "reading_permission")).toMatchObject({ done: true, known: true });
  });
});

describe("case ownership on the read-back routes", () => {
  it("a case other than the session's is refused here with 404 CASE_NOT_FOUND and no backend call", async () => {
    const { ctx, jar, seen } = await withReadDocument({ readFacts: { status: 200, body: FACTS_BODY("doc-1") }, passages: PASSAGES_OK });
    const before = seen.length;
    for (const [name, path] of [["readFacts.get", "/api/app/cases/case-2/read-facts"], ["passages.get", "/api/app/cases/case-2/passages?q=room"]] as const) {
      const response = await get(ctx, name, path, jar, { caseId: "case-2" });
      expect(response.status).toBe(404);
      expect((await response.json()).error.code).toBe("CASE_NOT_FOUND");
    }
    expect(seen.length).toBe(before);
  });

  it("a session that has not learned its case forwards the id, and only the backend's 404 comes back", async () => {
    const wrapped = withReadBack();
    const ctx = makeApp({ backend: wrapped.backend });
    const { jar } = await signIn(ctx);
    const response = await get(ctx, "readFacts.get", "/api/app/cases/case-2/read-facts", jar, { caseId: "case-2" });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(Object.keys(json)).toEqual(["error"]);
    expect(wrapped.seen).toEqual([]);
  });
});

describe("read-back field handling", () => {
  it("read-facts pass-through only carries the nine known fields; identity fields never cross", async () => {
    const body = {
      label: "read_not_checked",
      notice: "n",
      documents: [
        {
          documentId: "doc-1",
          documentKind: "policy_schedule",
          fields: [
            { field: "insurer", topic: null, value: "Demo Health Insurance Co", state: "extracted_unverified", page: 1, quote: "Insurer | Demo Health Insurance Co" },
            { field: "plan_name", topic: null, value: "Demo Plan", state: "extracted_unverified", page: 1, quote: "q" },
            { field: "policy_number", topic: null, value: "POL-123", state: "extracted_unverified", page: 1, quote: "q" },
            { field: "insured_members", topic: null, value: "Asha Test", state: "extracted_unverified", page: 1, quote: "q" },
            { field: "co_payment", topic: "something_else", value: "20%", state: "extracted_unverified", page: 2, quote: "Co-payment | 20%" },
          ],
        },
      ],
      excluded: [],
    };
    const { ctx, jar } = await withReadDocument({ readFacts: { status: 200, body } });
    const json = await (await get(ctx, "readFacts.get", "/api/app/cases/case-1/read-facts", jar, { caseId: "case-1" })).json();
    expect(json.documents[0].fields.map((field: { field: string }) => field.field)).toEqual(["co_payment"]);
    // The topic comes from this BFF's own map, not from the backend.
    expect(json.documents[0].fields[0].topic).toBe("co_payment");
    expect(JSON.stringify(json)).not.toMatch(/Demo Health|Demo Plan|POL-123|Asha/);
  });

  it("a conflicting field without a value stays 'Your documents disagree' and shows no value", () => {
    const view = toReadFactsView({
      label: "read_not_checked",
      documents: [{ documentId: "doc-1", documentKind: "policy_schedule", fields: [{ field: "room_rent_limit", value: null, state: "conflicting", page: 2, quote: "q" }, { field: "icu_limit", value: null, state: "extracted_unverified" }] }],
    });
    expect(view.documents[0].fields[0]).toEqual({ field: "room_rent_limit", topic: "room_rent", value: null, state: "conflicting", page: null, quote: null });
    expect(view.documents[0].fields[1]).toMatchObject({ value: null, state: "unknown" });
    const dashboard = build({ documents: [doc({ id: "doc-1" })], readFacts: { status: "ok", data: view } });
    const room = topicOf(dashboard, "room_rent");
    expect(room.chip).toEqual({ state: "conflicting", label: "Your documents disagree" });
    expect(room.values).toEqual([]);
    expect(room.conflictDetail).toBe("no_value");
    expect(dashboard.widgets.w17.state).toBe("conflicting");
  });

  it("a field in a state other than the two value states is not surfaced, even if it reaches the view directly", () => {
    const data = {
      label: "read_not_checked",
      notice: "n",
      excluded: [],
      documents: [{ documentId: "doc-1", documentKind: "policy_schedule", fields: [{ field: "base_sum_insured", topic: "sum_insured", value: "5,00,000", state: "verified", page: 1, quote: "q" }] }],
    } as unknown as ReadFactsView;
    const view = build({ documents: [doc({ id: "doc-1" })], readFacts: { status: "ok", data } });
    expect(topicOf(view, "sum_insured").values).toEqual([]);
    expect(topicOf(view, "sum_insured").chip?.label).toBe("Not found yet");
    expect(JSON.stringify(view)).not.toContain("5,00,000");
  });
});
