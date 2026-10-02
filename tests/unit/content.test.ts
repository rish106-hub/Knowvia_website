import { describe, expect, it } from "vitest";
import { articles } from "@/content/articles";
import { approvedQuotes, supportMarks } from "@/content/evidence";
import { sources } from "@/content/sources";
import { calculateCashScenario } from "@/features/marketing/cash-scenario";

describe("articles", () => {
  it("has the six launch guides with unique slugs", () => {
    expect(articles).toHaveLength(6);
    expect(new Set(articles.map((article) => article.slug)).size).toBe(6);
  });

  it.each(articles.map((article) => [article.slug, article] as const))("%s is complete and sourced", (_slug, article) => {
    expect(article.slug).toMatch(/^[a-z0-9-]+$/);
    expect(article.title.length).toBeLessThanOrEqual(70);
    expect(article.description.length).toBeLessThanOrEqual(200);
    expect(article.directAnswer.length).toBeGreaterThan(40);
    expect(article.author).toBeTruthy();
    expect(Date.parse(article.updatedAt)).toBeGreaterThanOrEqual(Date.parse(article.publishedAt));
    expect(article.sourceIds.length).toBeGreaterThan(0);
    expect(article.body.some((block) => block.type === "limit")).toBe(true);
    // Every inline citation must appear in the article's source list.
    for (const block of article.body) {
      if ("cite" in block && block.cite) {
        for (const id of block.cite) expect(article.sourceIds).toContain(id);
      }
    }
    for (const id of article.sourceIds) expect(sources[id].url).toMatch(/^https:\/\//);
    for (const link of article.related) expect(link.href).toMatch(/^\//);
  });

  it("links related guides only to articles that exist", () => {
    const slugs = new Set(articles.map((article) => article.slug));
    for (const article of articles) {
      for (const link of article.related) {
        if (link.href.startsWith("/blog/")) expect(slugs.has(link.href.slice(6))).toBe(true);
      }
    }
  });
});

describe("evidence register", () => {
  it("records provenance and approval for every support mark", () => {
    expect(supportMarks.map((mark) => mark.name)).toEqual(["Lightspeed India Partners", "Plum", "Insurance Samadhan"]);
    for (const mark of supportMarks) {
      expect(mark.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(mark.approval).toBeTruthy();
      expect(mark.file).toMatch(/^\/support\/.+\.svg$/);
    }
  });

  it("publishes no quote without a consent record", () => {
    for (const quote of approvedQuotes) {
      expect(Date.parse(quote.consentRecordedAt)).not.toBeNaN();
      expect(quote.displayName).toBeTruthy();
    }
  });
});

describe("cash scenario", () => {
  const base = {
    roomRentLimitPerDay: 5000,
    chosenRoomPerDay: 8000,
    days: 4,
    roomLinkedCharges: 120000,
    otherCharges: 60000,
    sumInsuredAvailable: 1000000,
    hospitalUsesRoomBasedBilling: true,
  };

  it("matches the worked example in the room-rent guide", () => {
    const result = calculateCashScenario(base);
    expect(result.totalBill).toBe(212000);
    expect(result.proportion).toBe(0.625);
    expect(result.roomLinkedPayable).toBe(75000);
    expect(result.familyPays).toBe(57000);
  });

  it("applies no proportion when the room is within the limit", () => {
    expect(calculateCashScenario({ ...base, chosenRoomPerDay: 5000 }).familyPays).toBe(0);
  });

  it("applies no proportion when the hospital does not bill by room", () => {
    const result = calculateCashScenario({ ...base, hospitalUsesRoomBasedBilling: false });
    expect(result.proportion).toBe(1);
    expect(result.familyPays).toBe(12000);
  });

  it("caps payment at the available sum insured", () => {
    const result = calculateCashScenario({ ...base, sumInsuredAvailable: 100000 });
    expect(result.insurerPays).toBe(100000);
    expect(result.cappedBySumInsured).toBe(true);
  });

  it("rejects fractional or negative rupees", () => {
    expect(() => calculateCashScenario({ ...base, days: -1 })).toThrow(RangeError);
    expect(() => calculateCashScenario({ ...base, otherCharges: 10.5 })).toThrow(RangeError);
  });
});
