import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const hasPython = spawnSync("python3", ["--version"]).status === 0;

describe("design port contract", () => {
  it.skipIf(!hasPython)("regenerating from the artboards changes no generated file", () => {
    const run = spawnSync("bash", ["scripts/design-port/check-regen.sh"], { cwd: root, encoding: "utf8" });
    expect(run.stderr, run.stderr).toBe("");
    expect(run.status).toBe(0);
  });

  it("onboarding upload is PDF only, in the artboard and the generated component", () => {
    for (const rel of ["design/claude-design/O5-Upload.dc.html", "src/components/onboarding/OnboardingAddPolicies.tsx"]) {
      const text = read(rel);
      expect(text, rel).not.toMatch(/jpe?g|png|photo/i);
      expect(text, rel).toContain("PDF, up to 15 MB each");
      expect(text, rel).toMatch(/accept=\{?"\.pdf,application\/pdf"/);
    }
  });

  it("onboarding no longer makes claims the backend cannot back", () => {
    const banned = [
      /files are encrypted/i,
      /we will email you/i,
      /invites sent/i,
      /get an invite/i,
      /your sister/i,
    ];
    for (const rel of [
      "OnboardingAddPolicies",
      "OnboardingReading",
      "OnboardingSharing",
      "OnboardingPeople",
      "OnboardingStart",
      "OnboardingComingUp",
      "OnboardingCoverMobile",
      "OnboardingCoverDesktop",
    ]) {
      const text = read(`src/components/onboarding/${rel}.tsx`);
      for (const re of banned) expect(text, `${rel} ${re}`).not.toMatch(re);
    }
  });

  it("per-artboard styles reach a separate stylesheet that is scoped to onboarding", () => {
    const css = read("src/app/design-onboarding.css");
    expect(css).toContain(".kv-file:focus-within");
    expect(css).toContain("@keyframes kvOut");
    // kvIn differs between Main and O6, so O6 gets its own name and the landing keyframes stay untouched.
    expect(css).toContain("@keyframes kvIn-o6");
    expect(css).not.toMatch(/@keyframes kvIn\b(?!-)/);
    expect(read("src/app/onboarding/layout.tsx")).toContain("design-onboarding.css");
    expect(read("src/app/layout.tsx")).not.toContain("design-onboarding.css");
  });
});

describe("token bridge", () => {
  const tokens = read("src/app/tokens.css");

  it("exposes every brand colour from the artboards", () => {
    const brand = {
      "--kv-tide": "#163f42",
      "--kv-harbour": "#176f69",
      "--kv-forest": "#0f4a3a",
      "--kv-mist": "#f3f7f6",
      "--kv-lime": "#c8e6a0",
      "--kv-gold": "#e0a02b",
      "--kv-ink": "#1a3034",
      "--kv-muted": "#55696d",
      "--kv-border": "#cfdcda",
    };
    const artboards = read("design/claude-design/Main.dc.html").toLowerCase();
    for (const [name, hex] of Object.entries(brand)) {
      expect(tokens, name).toContain(`${name}: ${hex};`);
      expect(artboards, `${hex} must exist in the artboards`).toContain(hex);
    }
  });

  it("defines the four evidence states and keeps the bridge out of generated files", () => {
    for (const name of ["--state-confirmed", "--state-unknown", "--state-conflict", "--state-pending"]) expect(tokens).toContain(`${name}:`);
    for (const rel of ["src/app/design.css", "src/app/design-onboarding.css", "src/app/layout.tsx"]) expect(read(rel)).not.toContain("tokens.css");
  });
});
