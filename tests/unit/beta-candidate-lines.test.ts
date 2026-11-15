import { describe, expect, it } from "vitest";
import { candidateLines } from "@/lib/beta/adapter";

// A product the reference data has no clean name for comes back with productName null; it shows its insurer only. Synthetic names.
describe("candidateLines", () => {
  it("shows the product name over the insurer", () => {
    expect(candidateLines({ productName: "Care Plus 360", insurerName: "Suraksha Health" })).toEqual({ title: "Care Plus 360", subtitle: "Suraksha Health" });
  });
  it("shows the insurer only when the name is null or blank", () => {
    expect(candidateLines({ productName: null, insurerName: "Suraksha Health" })).toEqual({ title: "Suraksha Health", subtitle: null });
    expect(candidateLines({ productName: "  ", insurerName: "Suraksha Health" })).toEqual({ title: "Suraksha Health", subtitle: null });
  });
});
