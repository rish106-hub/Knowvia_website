// Server-only guard (a lint-style test instead of the `server-only` package, which is not a dependency).
// Nothing in client-reachable code may import src/server/app/** except type-only through src/lib/app-contract.ts.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "..", "..");
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const CLIENT_ROOTS = ["src/components", "src/lib"];
const SERVER_IMPORT = /(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)["'][^"']*(?:server\/app|@\/server)[^"']*["']/;

function isClientFile(file: string) {
  const rel = relative(root, file).split("\\").join("/");
  if (rel === "src/lib/app-contract.ts") return false; // the single allowed bridge, checked separately
  if (!/\.(ts|tsx|js|jsx|mjs)$/.test(rel)) return false;
  if (rel.startsWith("src/app/") && /\/page\.(t|j)sx?$/.test(rel)) return true;
  if (rel.startsWith("src/app/") && /\/(layout|template|loading|error|not-found)\.(t|j)sx?$/.test(rel)) return true;
  return CLIENT_ROOTS.some((base) => rel.startsWith(`${base}/`));
}

describe("server-only boundary", () => {
  it("no page, layout, component or lib module imports src/server/app", () => {
    const offenders = walk(join(root, "src"))
      .filter(isClientFile)
      .filter((file) => SERVER_IMPORT.test(readFileSync(file, "utf8")))
      .map((file) => relative(root, file));
    expect(offenders).toEqual([]);
  });

  it("the only bridge is a type-only re-export of contract.ts", () => {
    const text = readFileSync(join(root, "src/lib/app-contract.ts"), "utf8");
    const code = text.replace(/\/\/.*$/gm, "");
    expect(code).toMatch(/export type \{[\s\S]*\} from "\.\.\/server\/app\/contract";/);
    expect(code).not.toMatch(/^\s*import\s/m);
    expect(code.replace(/export type \{[\s\S]*?\} from "[^"]+";/, "").trim()).toBe("");
  });

  it("contract.ts imports only zod (no server modules, no env, no node built-ins)", () => {
    const text = readFileSync(join(root, "src/server/app/contract.ts"), "utf8");
    const imports = [...text.matchAll(/^\s*import[^"']*["']([^"']+)["']/gm)].map((match) => match[1]);
    expect(imports).toEqual(["zod"]);
    expect(text).not.toMatch(/process\.env/);
  });

  it("only env.ts and runtime.ts read process.env inside src/server/app", () => {
    const readers = walk(join(root, "src/server/app"))
      .filter((file) => /process\.env/.test(readFileSync(file, "utf8").replace(/\/\/.*$/gm, "")))
      .map((file) => relative(root, file).split("\\").join("/"))
      .sort();
    expect(readers).toEqual(["src/server/app/env.ts", "src/server/app/runtime.ts"]);
  });

  it("route files under src/app/api/app import only the runtime wiring", () => {
    const routes = walk(join(root, "src/app/api/app")).filter((file) => file.endsWith("route.ts"));
    expect(routes.length).toBeGreaterThan(15);
    for (const file of routes) {
      const imports = [...readFileSync(file, "utf8").matchAll(/^\s*import[^"']*["']([^"']+)["']/gm)].map((match) => match[1]);
      expect(imports, relative(root, file)).toEqual(["@/server/app/runtime"]);
    }
  });
});
