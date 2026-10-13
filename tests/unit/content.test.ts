import { describe, expect, it } from "vitest";
import { faqs, industryStats, policyTerms, promises } from "@/content/landing";

describe("landing content", () => {
  it("keeps the supplied content sets complete", () => {
    expect(industryStats).toHaveLength(4);
    expect(policyTerms).toHaveLength(12);
    expect(faqs).toHaveLength(10);
    expect(promises).toHaveLength(5);
  });
});
