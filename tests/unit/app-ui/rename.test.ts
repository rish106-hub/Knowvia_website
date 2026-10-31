import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The product is CoverSaath. This scans the tree (not a fixed list) for the old name in visible text.
// Allowed leftovers: the X-Knowvia-App header, src/lib/site.ts, and code comments.
// Scope: the /app product (its routes, components, BFF, client libs) and every test. The marketing site
// (landing, privacy, terms, partners, onboarding) is the Knowvia public brand and is deliberately not covered here.
const OLD = "Know" + "via";
const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const SCAN = ["src/app/app", "src/app/api/app", "src/components/app", "src/server/app", "src/lib", "tests"];
const SKIP_FILES = new Set(["src/lib/site.ts"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "__screenshots__") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

describe("rename to CoverSaath", () => {
  const files = SCAN.flatMap((dir) => walk(join(ROOT, dir))).filter((file) => !SKIP_FILES.has(relative(ROOT, file)));

  it("scans a real tree", () => {
    expect(files.length).toBeGreaterThan(50);
    expect(files.some((file) => file.endsWith("AppShell.tsx"))).toBe(true);
    expect(files.some((file) => file.endsWith("session.spec.ts"))).toBe(true);
  });

  it("leaves no visible old brand name in any .ts or .tsx file", () => {
    const hits: string[] = [];
    for (const file of files) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, index) => {
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
          const visible = line.split(`X-${OLD}-App`).join("");
          if (visible.includes(OLD)) hits.push(`${relative(ROOT, file)}:${index + 1}`);
        });
    }
    expect(hits).toEqual([]);
  });

  it("shows CoverSaath as the product name in the shell and the sign-in screen", () => {
    const shell = readFileSync(join(ROOT, "src/components/app/shell/AppShell.tsx"), "utf8");
    const layout = readFileSync(join(ROOT, "src/app/app/layout.tsx"), "utf8");
    expect(shell).toContain("<span>CoverSaath</span>");
    expect(layout).toContain('default: "CoverSaath app", template: "%s | CoverSaath"');
  });
});
