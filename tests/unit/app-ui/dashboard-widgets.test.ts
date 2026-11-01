// The dashboard widgets (run W-B1), rendered to static markup in the node environment (the repo has no DOM test
// environment). Every widget is rendered in each branch it can be in. Synthetic data only.
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDashboardView, type DashboardInput, type ReadFactsInput } from "@/server/app/dashboard-view";
import type { DocumentView, Overview, PermissionView, ReadFactsView } from "@/server/app/contract";
import { W01 } from "@/components/app/dashboard/widgets/W01";
import { W02 } from "@/components/app/dashboard/widgets/W02";
import { W03 } from "@/components/app/dashboard/widgets/W03";
import { W04 } from "@/components/app/dashboard/widgets/W04";
import { W05 } from "@/components/app/dashboard/widgets/W05";
import { W06 } from "@/components/app/dashboard/widgets/W06";
import { W07 } from "@/components/app/dashboard/widgets/W07";
import { W09 } from "@/components/app/dashboard/widgets/W09";
import { W11 } from "@/components/app/dashboard/widgets/W11";
import { W12 } from "@/components/app/dashboard/widgets/W12";
import { W13 } from "@/components/app/dashboard/widgets/W13";
import { W14 } from "@/components/app/dashboard/widgets/W14";
import { W15 } from "@/components/app/dashboard/widgets/W15";
import { W16 } from "@/components/app/dashboard/widgets/W16";
import { W17 } from "@/components/app/dashboard/widgets/W17";

function doc(over: Partial<DocumentView> & { id: string }): DocumentView {
  return {
    caseId: "case-1", documentKind: "policy_schedule", byteSize: 100, uploadedAt: "2026-10-21T00:00:00.000Z", stage: "readable", nextAction: "none",
    label: "Read", backendStatus: "accepted", ocr: { status: "succeeded", errorCode: null, pageCount: 12 }, structuring: null, note: null, ...over,
  };
}
const overviewOf = (documents: DocumentView[], extra: Partial<Overview> = {}): Overview => ({
  session: { expiresAt: "2026-10-22T00:00:00.000Z" }, household: { id: "household-1", viewerRole: "owner" }, owner: { adultId: "adult-1", memberId: "member-1" },
  members: [], cases: documents.length ? [{ id: "case-1" }] : [], documents, documentsAccess: "full", consents: [], ...extra,
});
const reading: PermissionView = { id: "consent-9", kind: "read_document", label: "Read 2 documents with the reading service (OCR)", grantedAt: "2026-10-21T00:00:00.000Z", expiresAt: null, status: "active", documentIds: ["doc-1", "doc-2"], noticeStatus: "draft_needs_legal_review" };
function facts(documents: Array<{ documentId: string; documentKind?: string; fields: Array<{ field: string; value: string | null; state?: string; page?: number }> }>, excluded: ReadFactsView["excluded"] = []): ReadFactsInput {
  return {
    status: "ok",
    data: {
      label: "read_not_checked", notice: "Read from your documents by a rule, not checked.", excluded,
      documents: documents.map((entry) => ({
        documentId: entry.documentId, documentKind: entry.documentKind ?? "policy_schedule",
        fields: entry.fields.map((field) => ({ field: field.field, topic: null, value: field.value, state: (field.value === null ? "unknown" : (field.state ?? "extracted_unverified")) as "unknown", page: field.page ?? 1, quote: field.value === null ? null : `${field.field} is ${field.value}` })),
      })),
    },
  };
}
const build = (over: Partial<DashboardInput> & { documents?: DocumentView[] } = {}) =>
  buildDashboardView({ overview: overviewOf(over.documents ?? []), consents: [], scanMode: "clamd", readFacts: { status: "none" }, ...over });
const html = (element: ReactElement) => renderToStaticMarkup(element);
const text = (markup: string) => markup.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const THREE = [doc({ id: "doc-1", documentKind: "member_card" }), doc({ id: "doc-2", documentKind: "policy_schedule" }), doc({ id: "doc-3", documentKind: "policy_wording" })];
const CHIP_WORDS = ["Confirmed in your documents", "Read, not checked", "Your documents disagree", "Not found yet"];

describe("W01 setup progress", () => {
  it("empty: 'Add your e-card first' with a link to upload", () => {
    const view = build();
    const markup = html(createElement(W01, view.widgets.w01));
    expect(text(markup)).toContain("Add your e-card first");
    expect(markup).toContain('href="/app/documents"');
    expect(markup).not.toContain("<svg class");
  });
  it("partial: a ring with one arc per step, n of 5 as text, and each step listed", () => {
    const view = build({ documents: [THREE[0]], consents: [reading] });
    const markup = html(createElement(W01, view.widgets.w01));
    expect(view.widgets.w01.state).toBe("partial");
    expect(markup).toContain("Setup: 3 of 5 steps done");
    expect((markup.match(/stroke-width="10"/g) ?? []).length).toBe(5);
    expect(text(markup)).toContain("3/5");
    expect(text(markup)).toContain("2 steps to go");
  });
  it("full: the ring at rest", () => {
    const view = build({ documents: THREE, consents: [reading] });
    const markup = html(createElement(W01, view.widgets.w01));
    expect(view.widgets.w01.state).toBe("full");
    expect(text(markup)).toContain("5/5");
    expect(text(markup)).toContain("All 5 steps are done");
  });
  it("an unavailable permission list is 'Could not check', never 'Not yet'", () => {
    const view = build({ documents: THREE, permissionsStatus: "unavailable" });
    const markup = html(createElement(W01, view.widgets.w01));
    expect(text(markup)).toContain("Could not check");
    expect(view.widgets.w01.data.done).toBe(4);
  });
});

describe("W07, W15, W16", () => {
  it("W07 empty, partial and full", () => {
    expect(text(html(createElement(W07, build().widgets.w07)))).toContain("0 of 3 kinds");
    const partial = text(html(createElement(W07, build({ documents: [THREE[1]] }).widgets.w07)));
    expect(partial).toContain("1 of 3 kinds");
    expect(partial).toContain("Not added");
    expect(text(html(createElement(W07, build({ documents: THREE }).widgets.w07)))).toContain("3 of 3 kinds");
  });
  it("W15 empty and with documents: stage, pages read", () => {
    expect(text(html(createElement(W15, build().widgets.w15)))).toContain("No documents yet");
    const markup = text(html(createElement(W15, build({ documents: [THREE[1]] }).widgets.w15)));
    expect(markup).toContain("Policy schedule");
    expect(markup).toContain("Readable");
    expect(markup).toContain("Read 12 pages");
  });
  it("W16 empty lists all three in order; partial lists the missing ones; full says 'All key documents added'", () => {
    const empty = text(html(createElement(W16, build().widgets.w16)));
    expect(empty).toMatch(/E-card.*Policy schedule.*Policy wording/i);
    const partial = text(html(createElement(W16, build({ documents: [THREE[0]] }).widgets.w16)));
    expect(partial).toContain("Policy schedule");
    expect(partial).not.toMatch(/E-card/i);
    expect(text(html(createElement(W16, build({ documents: THREE }).widgets.w16)))).toContain("All key documents added");
  });
});

describe("W17 topics", () => {
  const load = async () => ({ label: "passage_not_answer" as const, notice: "n", passages: [], excluded: [] });
  it("empty (read-back none): every topic says 'Not read yet', with the explainer, and no state chip", () => {
    const view = build({ documents: [THREE[1]] });
    const markup = html(createElement(W17, { ...view.widgets.w17, loadPassages: load }));
    expect(view.widgets.w17.state).toBe("empty");
    expect((markup.match(/data-chip-state="not_read"/g) ?? []).length).toBe(6);
    for (const word of CHIP_WORDS) expect(markup).not.toContain(word);
    expect(text(markup)).toContain("The most the policy says it may pay in a policy year. It is not cash in your account.");
    expect(text(markup)).toContain("DRAFT");
    expect(markup).not.toContain("See where your documents mention this");
  });
  it("read-back off and unavailable are said honestly", () => {
    const off = text(html(createElement(W17, build({ documents: [THREE[1]], readFacts: { status: "off" } }).widgets.w17)));
    expect(off).toContain("is switched off here");
    expect(off).toContain("Not read yet");
    const unavailable = text(html(createElement(W17, { ...build({ documents: [THREE[1]], readFacts: { status: "unavailable" } }).widgets.w17, onRetry: () => undefined })));
    expect(unavailable).toContain("We could not look at what your documents say");
    expect(unavailable).toContain("Try again");
    expect(unavailable).not.toContain("Not found yet");
  });
  it("partial: a read value shows 'Read, not checked', the page, a quote and the passages button", () => {
    const view = build({ documents: [THREE[1]], readFacts: facts([{ documentId: "doc-2", fields: [{ field: "base_sum_insured", value: "500000", page: 2 }] }]) });
    const markup = html(createElement(W17, { ...view.widgets.w17, loadPassages: load }));
    const t = text(markup);
    expect(view.widgets.w17.state).toBe("partial");
    expect(t).toContain("Read, not checked");
    expect(t).toContain("500000");
    expect(t).toContain("Policy schedule, page 2");
    expect(t).toContain("Passage from your document, not an answer");
    expect(t).toContain("Page 2");
    expect(t).toContain("Not found yet");
    expect((markup.match(/See where your documents mention this/g) ?? []).length).toBe(6);
    expect(markup).toContain('aria-expanded="false"');
    expect(t).not.toContain("Confirmed in your documents");
  });
  it("conflicting: both values, each with its source, and 'Your documents disagree'", () => {
    const view = build({
      documents: [THREE[1], THREE[2]],
      readFacts: facts([
        { documentId: "doc-2", fields: [{ field: "room_rent_limit", value: "1% of sum insured", page: 2 }] },
        { documentId: "doc-3", documentKind: "policy_wording", fields: [{ field: "room_rent_limit", value: "No limit stated", page: 7 }] },
      ]),
    });
    const t = text(html(createElement(W17, view.widgets.w17)));
    expect(view.widgets.w17.state).toBe("conflicting");
    expect(t).toContain("Your documents disagree");
    expect(t).toContain("1% of sum insured");
    expect(t).toContain("No limit stated");
    expect(t).toContain("Policy schedule, page 2");
    expect(t).toContain("Policy wording, page 7");
    expect(t).toContain("Both are shown");
  });
  it("lists excluded documents by reason", () => {
    const view = build({ documents: [THREE[1]], readFacts: facts([{ documentId: "doc-2", fields: [{ field: "base_sum_insured", value: "1" }] }], [{ documentId: "doc-9", reason: "not_read" }]) });
    expect(text(html(createElement(W17, view.widgets.w17)))).toContain("1 document not read yet");
  });
});

describe("W04 renewal", () => {
  it("empty: not read yet, no value, and no control to confirm", () => {
    const view = build({ documents: [THREE[1]] });
    const markup = html(createElement(W04, view.widgets.w04));
    expect(text(markup)).toContain("Not read yet");
    expect(markup.toLowerCase()).not.toContain("confirm date");
    expect(markup).not.toContain("<button");
  });
  it("partial: only the start date", () => {
    const view = build({ documents: [THREE[1]], readFacts: facts([{ documentId: "doc-2", fields: [{ field: "policy_period_start", value: "14 Mar 2026" }] }]) });
    const t = text(html(createElement(W04, view.widgets.w04)));
    expect(view.widgets.w04.state).toBe("partial");
    expect(t).toContain("14 Mar 2026");
    expect(t).toContain("end date, when renewal is due, was not found yet");
  });
  it("full: the end date as 'Read, not checked', and 'Not saved as confirmed'", () => {
    const view = build({ documents: [THREE[1]], readFacts: facts([{ documentId: "doc-2", fields: [{ field: "policy_period_end", value: "13 Mar 2027" }] }]) });
    const t = text(html(createElement(W04, view.widgets.w04)));
    expect(view.widgets.w04.state).toBe("full");
    expect(t).toContain("13 Mar 2027");
    expect(t).toContain("Read, not checked");
    expect(t).toContain("Not saved as confirmed");
    expect(t).not.toContain("Confirmed in your documents");
  });
  it("conflicting: both dates and 'Your documents disagree'", () => {
    const view = build({
      documents: [THREE[1], THREE[2]],
      readFacts: facts([{ documentId: "doc-2", fields: [{ field: "policy_period_end", value: "13 Mar 2027" }] }, { documentId: "doc-3", documentKind: "policy_wording", fields: [{ field: "policy_period_end", value: "14 Mar 2027" }] }]),
    });
    const t = text(html(createElement(W04, view.widgets.w04)));
    expect(t).toContain("Your documents disagree");
    expect(t).toContain("13 Mar 2027");
    expect(t).toContain("14 Mar 2027");
  });
});

describe("W12, W13, W14, W09", () => {
  it("W12: a document's own action, adding a document, waiting, and nothing to do", () => {
    const grant = build({ documents: [doc({ id: "doc-1", stage: "awaiting_ocr_consent", nextAction: "grant_ocr_consent", ocr: null })] });
    expect(text(html(createElement(W12, grant.widgets.w12)))).toContain("Allow CoverSaath to read the documents you have added");
    const add = build({ documents: [THREE[1]] });
    expect(text(html(createElement(W12, add.widgets.w12)))).toContain("Add your health card or e-card");
    const wait = build({ documents: [...THREE.slice(0, 2), doc({ id: "doc-3", documentKind: "policy_wording", stage: "processing", nextAction: "wait", ocr: null })] });
    expect(text(html(createElement(W12, wait.widgets.w12)))).toContain("Reading is in progress");
    const none = build({ documents: THREE });
    expect(text(html(createElement(W12, none.widgets.w12)))).toContain("Nothing to do right now");
  });
  it("W13: empty, full, truncated and unavailable (not shown as 'off')", () => {
    expect(text(html(createElement(W13, build({ documents: THREE }).widgets.w13)))).toContain("You have not allowed anything yet");
    const full = text(html(createElement(W13, build({ documents: THREE, consents: [reading] }).widgets.w13)));
    expect(full).toContain("Covers 2 documents");
    const truncated = text(html(createElement(W13, build({ documents: THREE, consents: [reading], permissionsTruncated: true }).widgets.w13)));
    expect(truncated).toContain("cut short");
    const unavailable = text(html(createElement(W13, build({ documents: THREE, permissionsStatus: "unavailable" }).widgets.w13)));
    expect(unavailable).toContain("We could not check your permissions just now");
    expect(unavailable).toContain("does not mean they are off");
  });
  it("W14: tel:112, the helpline line, the e-card link; only the two chip treatments", () => {
    const saved = html(createElement(W14, build({ documents: THREE }).widgets.w14));
    expect(saved).toContain('href="tel:112"');
    expect(text(saved)).toContain("Call 112 (national emergency number)");
    expect(text(saved)).toContain("Call the helpline printed on your health card");
    expect(text(saved)).toContain("Your e-card is saved in Documents");
    expect(text(saved)).toContain("Check this");
    for (const word of ["Read, not checked", "Your documents disagree", "Not found yet"]) expect(saved).not.toContain(word);
    const none = html(createElement(W14, build({ documents: [THREE[1]] }).widgets.w14));
    expect(text(none)).toContain("No e-card saved yet");
    expect(none).not.toContain("Check this");
  });
  it("W14 prominent keeps the same content", () => {
    expect(text(html(createElement(W14, { ...build().widgets.w14, prominent: true })))).toContain("Call 112");
  });
  it("W09: the checklist includes the claim form line and says ticks are not saved", () => {
    const t = text(html(createElement(W09, build().widgets.w09)));
    expect(t).toContain("Claim form from the insurer");
    expect(t).toContain("Ticks are not saved anywhere");
    expect((html(createElement(W09, build().widgets.w09)).match(/type="checkbox"/g) ?? []).length).toBe(6);
  });
});

describe("model-backed widgets", () => {
  it("W02, W03, W05, W06, W11 show 'Ask to see this' with 'Not found yet' and no value", () => {
    const w = build().widgets;
    for (const markup of [html(createElement(W02, w.w02)), html(createElement(W03, w.w03)), html(createElement(W05, w.w05)), html(createElement(W06, w.w06)), html(createElement(W11, w.w11))]) {
      expect(text(markup)).toContain("Ask to see this");
      expect(text(markup)).toContain("Not found yet");
      expect(markup).not.toContain("<button");
    }
  });
});

describe("whole dashboard", () => {
  const views = [
    build(),
    build({ documents: THREE, consents: [reading], readFacts: facts([{ documentId: "doc-2", fields: [{ field: "base_sum_insured", value: "500000" }, { field: "co_payment", value: "10%" }] }]) }),
    build({ documents: [THREE[1], THREE[2]], readFacts: facts([{ documentId: "doc-2", fields: [{ field: "room_rent_limit", value: "A" }] }, { documentId: "doc-3", fields: [{ field: "room_rent_limit", value: "B" }] }]) }),
  ];
  const render = (view: ReturnType<typeof build>) => {
    const w = view.widgets;
    return [
      html(createElement(W01, w.w01)), html(createElement(W02, w.w02)), html(createElement(W03, w.w03)), html(createElement(W04, w.w04)), html(createElement(W05, w.w05)), html(createElement(W06, w.w06)),
      html(createElement(W07, w.w07)), html(createElement(W09, w.w09)), html(createElement(W11, w.w11)), html(createElement(W12, w.w12)), html(createElement(W13, w.w13)),
      html(createElement(W14, w.w14)), html(createElement(W15, w.w15)), html(createElement(W16, w.w16)), html(createElement(W17, w.w17)),
    ].join("\n");
  };
  it("no rendered text says score, streak, countdown, days left or a percentage", () => {
    for (const view of views) {
      const t = text(render(view)).toLowerCase();
      for (const word of ["score", "streak", "countdown", "days left", "days to go", "% complete", "percent complete"]) expect(t).not.toContain(word);
      expect(t).not.toMatch(/\d+\s*% (done|complete)/);
    }
  });
  it("the chip words are only ever the plan's wording, and nothing renders 'Confirmed in your documents' (no code path produces it)", () => {
    for (const view of views) expect(text(render(view))).not.toContain("Confirmed in your documents");
  });
  it("no widget markup carries an inline colour", () => {
    for (const view of views) expect(render(view)).not.toMatch(/style="[^"]*(#|rgb|hsl)/i);
  });
});

describe("stylesheet", () => {
  const css = readFileSync(join(__dirname, "..", "..", "..", "src/components/app/dashboard/dashboard.module.css"), "utf8");
  it("uses token variables only: no hex colours", () => {
    expect(css.replace(/\/\*[\s\S]*?\*\//g, "")).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
  it("respects prefers-reduced-motion for every animation and transition it defines", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain("animation: none");
    expect(reduced).toContain("transition-duration: 0s");
  });
  it("gives every control at least 44px", () => {
    for (const selector of [".careLink", ".disclosure", ".check", ".callButton", ".stepItem"]) {
      const rule = css.match(new RegExp(`${selector.replace(".", "\\.")}\\s*\\{[^}]*\\}`));
      expect(rule, selector).not.toBeNull();
      const min = Number(rule![0].match(/min-height:\s*(\d+)px/)?.[1] ?? 0);
      expect(min, selector).toBeGreaterThanOrEqual(44);
    }
  });
});
