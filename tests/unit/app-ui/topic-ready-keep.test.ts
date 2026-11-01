// S12 topic detail, S14 readiness and S04 keep-my-document (run W-B2): the pure view logic, and the demo dashboards rendered
// through the same DashboardBody the real screen uses. Rendered to static markup (the repo has no DOM test environment).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DASHBOARD_TOPICS } from "@/server/app/contract";
import { buildDemoDashboard } from "@/server/app/demo-data";
import { DashboardBody } from "@/components/app/dashboard/DashboardScreen";
import { AddHrefContext } from "@/components/app/dashboard/parts";
import { addDocumentsHref, holdsKeepConsent, isTopicId, TOPIC_IDS, tickedWords, topicHref, KEEP_HREF, DOCUMENTS_HREF } from "@/components/app/dashboard/view-model";
import { ChecklistItems } from "@/components/app/dashboard/widgets/W09";
import { PassageCard, PASSAGE_LABEL } from "@/components/app/policy/PassageCard";
import { KEEP_LEAD, KEEP_TAKE_BACK } from "@/components/app/keep/KeepConsentScreen";
import { isPublicAppPath } from "@/components/app/shell/public-paths";

const html = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(element);
const text = (markup: string) => markup.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

describe("S12 topics", () => {
  it("the client list is the BFF's list, in the same order", () => {
    expect([...TOPIC_IDS]).toEqual([...DASHBOARD_TOPICS]);
  });
  it("only the six topics are valid; everything else is a 404", () => {
    for (const topic of DASHBOARD_TOPICS) expect(isTopicId(topic)).toBe(true);
    for (const bad of ["", "score", "Sum_Insured", "sum-insured", "constructor", "__proto__", "toString", "../x", undefined, null, 1, ["room_rent"]]) expect(isTopicId(bad)).toBe(false);
  });
  it("links to the topic's own page", () => {
    expect(topicHref("room_rent")).toBe("/app/policies/room_rent");
  });
});

describe("PassageCard", () => {
  it("says 'Page N', and 'Passage from your document, not an answer'", () => {
    const t = text(html(PassageCard({ page: 7, heading: "Room rent", children: "Room rent is covered as per the room category chosen." })));
    expect(t).toContain("Page 7");
    expect(t).toContain("Room rent");
    expect(t).toContain("Passage from your document, not an answer");
    expect(PASSAGE_LABEL).toContain("not an answer");
    expect(text(html(PassageCard({ page: null, children: "x" })))).toContain("Page not known");
  });
});

describe("S14 readiness", () => {
  const items = buildDemoDashboard("full").widgets.w09.data.items;
  it("lists every W09 item with a real checkbox, including the claim form line", () => {
    const markup = html(createElement(ChecklistItems, { items, ticked: new Set<string>(), onToggle: () => undefined }));
    expect((markup.match(/type="checkbox"/g) ?? []).length).toBe(items.length);
    expect(text(markup)).toContain("Claim form from the insurer");
    expect(markup).not.toContain("checked");
  });
  it("shows the person's own ticks, as a count of their own items and never as a percentage", () => {
    const markup = html(createElement(ChecklistItems, { items, ticked: new Set([items[0].id]), onToggle: () => undefined }));
    expect((markup.match(/checked=""/g) ?? []).length).toBe(1);
    expect(tickedWords(1, 6)).toBe("1 of 6 ticked");
    expect(tickedWords(0, 6)).not.toContain("%");
  });
  it("the data says ticks are not stored", () => {
    const data = buildDemoDashboard("full").widgets.w09.data;
    expect(data.ticksStored).toBe(false);
    expect(data.note).toContain("Ticks are not saved anywhere");
  });
});

describe("S04 keep-my-document", () => {
  it("is needed until a 'collect' permission exists, and the add links follow", () => {
    expect(holdsKeepConsent([])).toBe(false);
    expect(holdsKeepConsent([{ scope: "ocr_sarvam" }, { scope: "question_gemini" }])).toBe(false);
    expect(holdsKeepConsent([{ scope: "collect" }])).toBe(true);
    expect(addDocumentsHref({ consents: [] })).toBe(KEEP_HREF);
    expect(addDocumentsHref({ consents: [{ scope: "ocr_sarvam", grantId: "g", documentIds: [], grantedAt: "x", noticeStatus: "draft_needs_legal_review" }] })).toBe(KEEP_HREF);
    expect(addDocumentsHref({ consents: [{ scope: "collect", grantId: "g", documentIds: [], grantedAt: "x", noticeStatus: "draft_needs_legal_review" }] })).toBe(DOCUMENTS_HREF);
  });
  it("its copy keeps keeping and reading apart and carries no promise about advice or claims", () => {
    expect(KEEP_LEAD).toContain("does not let CoverSaath read them");
    expect(KEEP_LEAD).toContain("reading is asked separately");
    expect(KEEP_TAKE_BACK).toContain("Permissions page");
    for (const copy of [KEEP_LEAD, KEEP_TAKE_BACK]) expect(copy.toLowerCase()).not.toMatch(/score|guarantee|approved|claim will/);
  });
  it("the dashboard's 'add' links go to S04 for a new person and to Documents otherwise", () => {
    const empty = buildDemoDashboard("empty");
    const body = (href: string) => html(createElement(AddHrefContext.Provider, { value: href }, createElement(DashboardBody, { view: empty, mode: "P", onError: () => false, onRetry: () => undefined })));
    expect(body(KEEP_HREF)).toContain('href="/app/keep"');
    expect(body(KEEP_HREF)).not.toContain('href="/app/documents"><svg');
    expect(body(DOCUMENTS_HREF)).not.toContain('href="/app/keep"');
  });
});

describe("demo dashboards through DashboardBody", () => {
  const render = (scenario: "empty" | "partial" | "full" | "conflicting", mode: "P" | "E" = "P") =>
    html(createElement(DashboardBody, { view: buildDemoDashboard(scenario), mode, onError: () => false, onRetry: () => undefined, detailHref: topicHref }));

  it("empty says 'Add your e-card first'", () => expect(text(render("empty"))).toContain("Add your e-card first"));
  it("conflicting says 'Your documents disagree' and shows both values", () => {
    const t = text(render("conflicting"));
    expect(t).toContain("Your documents disagree");
    expect(t).toContain("1% of sum insured");
    expect(t).toContain("No limit stated");
  });
  it("a passage card says 'not an answer' wherever a quote is shown", () => {
    expect(text(render("full"))).toContain("not an answer");
    expect(text(render("partial"))).toContain("Passage from your document, not an answer");
  });
  it("no scenario renders the word score, and mode E puts the emergency card first", () => {
    for (const scenario of ["empty", "partial", "full", "conflicting"] as const) expect(text(render(scenario)).toLowerCase()).not.toContain("score");
    const markup = render("full", "E");
    expect(markup.indexOf('data-widget="w14"')).toBeGreaterThan(-1);
    expect(markup.indexOf('data-widget="w14"')).toBeLessThan(markup.indexOf('data-widget="w12"'));
  });
  it("topics with something read link to their own page; unread ones do not", () => {
    const full = render("full");
    expect(full).toContain('href="/app/policies/sum_insured"');
    expect(render("empty")).not.toContain("/app/policies/");
  });
});

describe("public paths", () => {
  it("the sample dashboards need no session read; other app paths still do", () => {
    expect(isPublicAppPath("/app/demo/full")).toBe(true);
    expect(isPublicAppPath("/app/demo/")).toBe(false);
    expect(isPublicAppPath("/app/demo/a/b")).toBe(false);
    expect(isPublicAppPath("/app/keep")).toBe(false);
    expect(isPublicAppPath("/app/policies/room_rent")).toBe(false);
    expect(isPublicAppPath("/app/ready")).toBe(false);
    expect(isPublicAppPath("/app/start")).toBe(true);
  });
});
