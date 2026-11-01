// StateChip (run W-B1): the four evidence states map to the exact words, the two-treatment mode says "Check this", and
// nothing that renders contains the word "score". Rendered to static markup in the node environment (no DOM is needed).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CHECK_THIS, CHIP_WORDS, chipModel, NOT_READ_YET, type ChipState } from "@/components/app/dashboard/chip-model";
import { NotReadChip, StateChip } from "@/components/app/dashboard/StateChip";

const STATES: ChipState[] = ["verified", "extracted_unverified", "conflicting", "unknown"];
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");

describe("chip wording", () => {
  it("maps the four states to the exact words from the plan", () => {
    expect(CHIP_WORDS).toEqual({
      verified: "Confirmed in your documents",
      extracted_unverified: "Read, not checked",
      conflicting: "Your documents disagree",
      unknown: "Not found yet",
    });
  });

  it("gives each state its own border style and icon, in the four-treatment mode", () => {
    expect(chipModel("verified")).toMatchObject({ border: "solid", icon: "check" });
    expect(chipModel("extracted_unverified")).toMatchObject({ border: "dashed", icon: "question" });
    expect(chipModel("conflicting")).toMatchObject({ border: "thick", icon: "alert" });
    expect(chipModel("unknown")).toMatchObject({ border: "dotted", icon: "clock" });
    const borders = STATES.map((state) => chipModel(state).border);
    expect(new Set(borders).size).toBe(4);
  });

  it("the two-treatment mode keeps 'Confirmed in your documents' and gives 'Check this' for the other three", () => {
    expect(chipModel("verified", "two").label).toBe("Confirmed in your documents");
    for (const state of ["extracted_unverified", "conflicting", "unknown"] as const) {
      const model = chipModel(state, "two");
      expect(model.label).toBe(CHECK_THIS);
      expect(model.label).toBe("Check this");
      // still colour, border style, icon and words: never words alone
      expect(model.border).toBe("dashed");
      expect(model.icon).toBe("question");
    }
  });
});

describe("StateChip render", () => {
  it("renders the exact words, an icon and a border marker for each state", () => {
    for (const state of STATES) {
      const markup = renderToStaticMarkup(createElement(StateChip, { state }));
      expect(text(markup)).toBe(CHIP_WORDS[state]);
      expect(markup).toContain("<svg");
      expect(markup).toContain(`data-chip-state="${state}"`);
      expect(markup).toContain(`data-chip-border="${chipModel(state).border}"`);
    }
  });

  it("renders 'Check this' for the three unconfirmed states in two-treatment mode", () => {
    for (const state of ["extracted_unverified", "conflicting", "unknown"] as const) {
      expect(text(renderToStaticMarkup(createElement(StateChip, { state, treatment: "two" })))).toBe("Check this");
    }
    expect(text(renderToStaticMarkup(createElement(StateChip, { state: "verified", treatment: "two" })))).toBe("Confirmed in your documents");
  });

  it("the 'Not read yet' chip is dotted with a clock and is not one of the four evidence states", () => {
    const markup = renderToStaticMarkup(createElement(NotReadChip));
    expect(text(markup)).toBe(NOT_READ_YET);
    expect(markup).toContain('data-chip-border="dotted"');
    expect(markup).toContain("<svg");
    expect(Object.values(CHIP_WORDS)).not.toContain(NOT_READ_YET);
  });

  it("no rendered text contains 'score'", () => {
    const all = [
      ...STATES.map((state) => text(renderToStaticMarkup(createElement(StateChip, { state })))),
      ...STATES.map((state) => text(renderToStaticMarkup(createElement(StateChip, { state, treatment: "two" })))),
      text(renderToStaticMarkup(createElement(NotReadChip))),
      ...Object.values(CHIP_WORDS),
      CHECK_THIS,
    ].join(" ");
    expect(all.toLowerCase()).not.toContain("score");
  });
});
