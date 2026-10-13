import type { CSSProperties } from "react";

// The design port passes view models straight from the artboard logic, which is untyped JavaScript.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any = any;

const styleCache = new Map<string, CSSProperties>();

function splitDeclarations(text: string) {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === ";" && depth === 0) { out.push(current); current = ""; } else current += ch;
  }
  if (current.trim()) out.push(current);
  return out;
}

/** Turns an inline CSS string computed by the artboard logic into a React style object. */
export function css(text: unknown): CSSProperties {
  if (typeof text !== "string" || !text) return {};
  const cached = styleCache.get(text);
  if (cached) return cached;
  const style: Record<string, string> = {};
  for (const declaration of splitDeclarations(text)) {
    const at = declaration.indexOf(":");
    if (at < 0) continue;
    const property = declaration.slice(0, at).trim();
    const value = declaration.slice(at + 1).trim();
    if (!property) continue;
    const key = property.startsWith("--") ? property : property.replace(/^-webkit-/, "Webkit-").replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    style[key] = value;
  }
  styleCache.set(text, style as CSSProperties);
  return style as CSSProperties;
}

/** Matches the canvas runtime: "false", "", 0, null and undefined hide a block. */
export function truthy(value: unknown) {
  return !(value === false || value == null || value === "" || value === 0 || value === "false");
}
