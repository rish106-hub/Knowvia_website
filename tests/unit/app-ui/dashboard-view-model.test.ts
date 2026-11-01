// Pure helpers behind the dashboard widgets (run W-B1): entry mode, layout order, the setup ring, topic branches, passage
// paths. Synthetic data only. The dashboard view is built by the real BFF function from fixtures.
import { describe, expect, it } from "vitest";
import { hasNoDocuments, parseEntryMode, passagesPath, refreshKey, ringArcs, topicBody, widgetLayout, clipQuote, excludedLines, groupValues, sourceLine, QUOTE_MAX, CONFLICT_NOTES } from "@/components/app/dashboard/view-model";
import { buildDashboardView, type DashboardInput, type ReadFactsInput } from "@/server/app/dashboard-view";
import type { DocumentView, Overview, PermissionView, ReadFactsView } from "@/server/app/contract";

function doc(over: Partial<DocumentView> & { id: string }): DocumentView {
  return {
    caseId: "case-1", documentKind: "policy_schedule", byteSize: 100, uploadedAt: "2026-10-21T00:00:00.000Z", stage: "readable", nextAction: "none",
    label: "Read", backendStatus: "accepted", ocr: { status: "succeeded", errorCode: null, pageCount: 2 }, structuring: null, note: null, ...over,
  };
}
const overviewOf = (documents: DocumentView[], extra: Partial<Overview> = {}): Overview => ({
  session: { expiresAt: "2026-10-22T00:00:00.000Z" }, household: { id: "household-1", viewerRole: "owner" }, owner: { adultId: "adult-1", memberId: "member-1" },
  members: [], cases: documents.length ? [{ id: "case-1" }] : [], documents, documentsAccess: "full", consents: [], ...extra,
});
const reading: PermissionView = { id: "consent-9", kind: "read_document", label: "Read 1 document", grantedAt: "2026-10-21T00:00:00.000Z", expiresAt: null, status: "active", documentIds: ["doc-1"], noticeStatus: "draft_needs_legal_review" };

type FieldInput = { field: string; value: string | null; state?: string; page?: number | null; quote?: string | null };
function facts(documents: Array<{ documentId: string; documentKind?: string; fields: FieldInput[] }>, excluded: ReadFactsView["excluded"] = []): ReadFactsInput {
  return {
    status: "ok",
    data: {
      label: "read_not_checked", notice: "Read from your documents by a rule, not checked.", excluded,
      documents: documents.map((entry) => ({
        documentId: entry.documentId, documentKind: entry.documentKind ?? "policy_schedule",
        fields: entry.fields.map((field) => ({
          field: field.field, topic: null, value: field.value,
          state: (field.value === null ? "unknown" : (field.state ?? "extracted_unverified")) as "unknown",
          page: field.page ?? (field.value === null ? null : 1), quote: field.quote ?? (field.value === null ? null : `${field.field} | ${field.value}`),
        })),
      })),
    },
  };
}
const build = (over: Partial<DashboardInput> & { documents?: DocumentView[] } = {}) =>
  buildDashboardView({ overview: overviewOf(over.documents ?? []), consents: [], scanMode: "clamd", readFacts: { status: "none" }, ...over });
const topicOf = (view: ReturnType<typeof build>, topic: string) => view.widgets.w17.data.topics.find((entry) => entry.topic === topic)!;

describe("entry mode", () => {
  it("E and emergency are mode E; asked is A; everything else is P", () => {
    expect(parseEntryMode("E")).toBe("E");
    expect(parseEntryMode("emergency")).toBe("E");
    expect(parseEntryMode("A")).toBe("A");
    expect(parseEntryMode("planned")).toBe("P");
    for (const bad of [undefined, null, "", "e", "constructor", "__proto__", "toString", ["E"]]) expect(parseEntryMode(bad as never)).toBe("P");
  });
});

describe("layout", () => {
  const withDocs = build({ documents: [doc({ id: "doc-1" })], consents: [reading] });
  const empty = build();

  it("mode E puts W14 first and not again in the side column", () => {
    const layout = widgetLayout(withDocs, "E");
    expect(layout.first).toEqual(["w14"]);
    expect([...layout.band, ...layout.main, ...layout.side].filter((id) => id === "w14")).toHaveLength(0);
  });

  it("other modes keep W14 in the side column and nothing above the cards", () => {
    for (const mode of ["P", "A"] as const) {
      const layout = widgetLayout(withDocs, mode);
      expect(layout.first).toEqual([]);
      expect(layout.side).toContain("w14");
    }
  });

  it("every widget with a component appears exactly once per layout", () => {
    const all = ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w09", "w11", "w12", "w13", "w14", "w15", "w16", "w17"].sort();
    for (const view of [withDocs, empty]) {
      for (const mode of ["E", "P"] as const) {
        const layout = widgetLayout(view, mode);
        const shown = [...layout.first, ...layout.band, ...layout.main, ...layout.side];
        expect(new Set(shown).size).toBe(shown.length);
        if (view === withDocs) expect([...shown].sort()).toEqual(all);
      }
    }
  });

  it("with no document yet, the dashboard leads with W01 ('Add your e-card first') and what is still needed", () => {
    expect(hasNoDocuments(empty)).toBe(true);
    expect(empty.widgets.w01.data.emptyLabel).toBe("Add your e-card first");
    const layout = widgetLayout(empty, "P");
    expect(layout.band).toEqual(["w01"]);
    expect(layout.main).toEqual(["w16"]);
    expect(layout.main).not.toContain("w17");
    expect(hasNoDocuments(withDocs)).toBe(false);
  });

  it("mode E still puts W14 first when there is no document", () => {
    expect(widgetLayout(empty, "E").first).toEqual(["w14"]);
  });
});

describe("refresh key", () => {
  it("changes when a document changes stage or a permission appears, and not otherwise", () => {
    const a = overviewOf([doc({ id: "doc-1", stage: "processing", nextAction: "wait" })]);
    const same = overviewOf([doc({ id: "doc-1", stage: "processing", nextAction: "wait" })]);
    const moved = overviewOf([doc({ id: "doc-1", stage: "readable" })]);
    const granted = overviewOf([doc({ id: "doc-1", stage: "processing", nextAction: "wait" })], { consents: [{ scope: "ocr_sarvam", grantId: "g", documentIds: ["doc-1"], grantedAt: "2026-10-21T00:00:00.000Z", noticeStatus: "draft_needs_legal_review" }] });
    expect(refreshKey(a)).toBe(refreshKey(same));
    expect(refreshKey(a)).not.toBe(refreshKey(moved));
    expect(refreshKey(a)).not.toBe(refreshKey(granted));
  });
});

describe("W01 ring", () => {
  it("has one arc per step and fills exactly the done ones", () => {
    for (let done = 0; done <= 5; done += 1) {
      const arcs = ringArcs(5, done);
      expect(arcs).toHaveLength(5);
      expect(arcs.filter((arc) => arc.done)).toHaveLength(done);
      for (const arc of arcs) expect(arc.d).toMatch(/^M -?\d+(\.\d+)? -?\d+(\.\d+)? A 38 38 0 0 1 -?\d+(\.\d+)? -?\d+(\.\d+)?$/);
    }
  });
  it("clamps nonsense", () => {
    expect(ringArcs(5, 99).filter((arc) => arc.done)).toHaveLength(5);
    expect(ringArcs(5, -3).filter((arc) => arc.done)).toHaveLength(0);
    expect(ringArcs(0, 0)).toHaveLength(1);
  });
});

describe("topic branches (W17)", () => {
  it("not read: read-back none or off gives a 'not read' body and no chip", () => {
    for (const readFacts of [{ status: "none" }, { status: "off" }, { status: "unavailable" }] as const) {
      const view = build({ documents: [doc({ id: "doc-1" })], readFacts });
      expect(view.widgets.w17.data.readback).toBe(readFacts.status);
      for (const topic of view.widgets.w17.data.topics) expect(topicBody(topic)).toEqual({ kind: "not_read" });
    }
  });

  it("read, not checked: a value with its page and a quote of 160 characters or fewer", () => {
    const long = "x".repeat(400);
    const view = build({ documents: [doc({ id: "doc-1" })], readFacts: facts([{ documentId: "doc-1", fields: [{ field: "base_sum_insured", value: "500000", page: 2, quote: long }] }]) });
    const body = topicBody(topicOf(view, "sum_insured"));
    expect(body.kind).toBe("read");
    if (body.kind !== "read") return;
    expect(body.groups[0].entries[0]).toMatchObject({ value: "500000", page: 2 });
    expect((body.groups[0].entries[0].quote ?? "").length).toBeLessThanOrEqual(QUOTE_MAX);
    expect(sourceLine(body.groups[0].entries[0])).toBe("Policy schedule, page 2");
  });

  it("not found: a topic with no value after a document was read", () => {
    const view = build({ documents: [doc({ id: "doc-1" })], readFacts: facts([{ documentId: "doc-1", fields: [{ field: "base_sum_insured", value: "500000" }] }]) });
    expect(topicBody(topicOf(view, "co_payment"))).toEqual({ kind: "not_found" });
    expect(topicBody(topicOf(view, "pre_authorisation"))).toEqual({ kind: "not_found" });
  });

  it("your documents disagree: both values are kept, from both documents", () => {
    const view = build({
      documents: [doc({ id: "doc-1" }), doc({ id: "doc-2", documentKind: "policy_wording" })],
      readFacts: facts([
        { documentId: "doc-1", fields: [{ field: "room_rent_limit", value: "1% of sum insured", page: 2 }] },
        { documentId: "doc-2", documentKind: "policy_wording", fields: [{ field: "room_rent_limit", value: "No limit stated", page: 7 }] },
      ]),
    });
    expect(view.widgets.w17.state).toBe("conflicting");
    const body = topicBody(topicOf(view, "room_rent"));
    expect(body.kind).toBe("disagree");
    if (body.kind !== "disagree") return;
    expect(body.detail).toBe("both_values");
    expect(body.groups[0].entries.map((entry) => entry.value).sort()).toEqual(["1% of sum insured", "No limit stated"]);
    expect(body.groups[0].state).toBe("conflicting");
    expect(CONFLICT_NOTES[body.detail]).toContain("Both are shown");
  });

  it("a disagreement with only one value (inside one document) says so honestly", () => {
    const view = build({ documents: [doc({ id: "doc-1" })], readFacts: facts([{ documentId: "doc-1", fields: [{ field: "co_payment", value: "10%", state: "conflicting" }] }]) });
    const body = topicBody(topicOf(view, "co_payment"));
    expect(body).toMatchObject({ kind: "disagree", detail: "one_value" });
    expect(CONFLICT_NOTES.one_value).toContain("only one of the values");
  });

  it("groupValues keeps field order and marks a group conflicting when any entry is", () => {
    const base = { label: "L", page: 1, quote: null, documentId: "d", documentKind: "policy_schedule" } as const;
    const groups = groupValues([
      { ...base, field: "a", value: "1", state: "extracted_unverified", chip: { state: "extracted_unverified", label: "Read, not checked" } },
      { ...base, field: "b", value: "2", state: "conflicting", chip: { state: "conflicting", label: "Your documents disagree" } },
      { ...base, field: "a", value: "3", state: "conflicting", chip: { state: "conflicting", label: "Your documents disagree" } },
    ]);
    expect(groups.map((group) => group.field)).toEqual(["a", "b"]);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[0].state).toBe("conflicting");
  });

  it("clipQuote cuts at 160 characters and drops blanks", () => {
    expect(clipQuote(null)).toBeNull();
    expect(clipQuote("   ")).toBeNull();
    expect(clipQuote("short")).toBe("short");
    expect(clipQuote("y".repeat(500))!.length).toBe(QUOTE_MAX);
  });

  it("excludedLines counts the person's own documents by reason", () => {
    expect(excludedLines([])).toEqual([]);
    expect(excludedLines([{ reason: "not_read" }, { reason: "not_read" }, { reason: "reading_permission_withdrawn" }])).toEqual([
      "2 documents not read yet",
      "1 document left out because you took back the reading permission",
    ]);
  });
});

describe("passages path", () => {
  it("is built from the case id and the topic's search words, encoded, and is empty without a case", () => {
    expect(passagesPath(null, "sum insured")).toBeNull();
    expect(passagesPath("case-1", "co-payment")).toBe("/cases/case-1/passages?q=co-payment&limit=5");
    expect(passagesPath("a/b", "sum insured")).toBe("/cases/a%2Fb/passages?q=sum%20insured&limit=5");
  });
});
