import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const hasPython = spawnSync("python3", ["--version"]).status === 0;
const hasArtboards = existsSync(join(root, "design/claude-design/Main.dc.html"));

describe("design port contract", () => {
  it.skipIf(!hasPython || !hasArtboards)("regenerating from the artboards changes no generated file", () => {
    const run = spawnSync("bash", ["scripts/design-port/check-regen.sh"], { cwd: root, encoding: "utf8" });
    expect(run.stderr, run.stderr).toBe("");
    expect(run.status).toBe(0);
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
    const artboards = hasArtboards ? read("design/claude-design/Main.dc.html").toLowerCase() : null;
    for (const [name, hex] of Object.entries(brand)) {
      expect(tokens, name).toContain(`${name}: ${hex};`);
      if (artboards) expect(artboards, `${hex} must exist in the artboards`).toContain(hex);
    }
  });

  it("defines the four evidence states and keeps the bridge out of generated files", () => {
    for (const name of ["--state-confirmed", "--state-unknown", "--state-conflict", "--state-pending"]) expect(tokens).toContain(`${name}:`);
    for (const rel of ["src/app/design.css", "src/app/layout.tsx"]) expect(read(rel)).not.toContain("tokens.css");
  });
});
