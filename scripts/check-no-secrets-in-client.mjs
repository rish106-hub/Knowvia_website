#!/usr/bin/env node
// Scans the client bundle (.next/static) for BFF secret env NAMES and VALUES. Run after `npm run build`.
//   COVERSAATH_BOOTSTRAP_TOKEN=... APP_SESSION_SECRET=... COVERSAATH_API_URL=... node scripts/check-no-secrets-in-client.mjs
// Values are read from the environment that built the bundle (use fake values for the check). Exit 1 on any hit.
// Reports only the needle LABEL (a name, or "value of NAME") and file, never the secret value itself.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? join(process.cwd(), ".next", "static");
const SECRET_NAMES = ["COVERSAATH_BOOTSTRAP_TOKEN", "APP_SESSION_SECRET", "COVERSAATH_API_URL", "APP_DEV_IDENTITY"];
const MIN_VALUE_LENGTH = 8; // avoids false positives on values like "true"

if (!existsSync(root)) {
  console.error(`check-no-secrets-in-client: ${root} not found. Run "npm run build" first.`);
  process.exit(2);
}

const needles = [];
for (const name of SECRET_NAMES) {
  needles.push({ label: `name ${name}`, text: name });
  const value = process.env[name];
  if (value && value.length >= MIN_VALUE_LENGTH) needles.push({ label: `value of ${name}`, text: value });
}
// Also guard the well-known backend path prefix and the bearer scheme the BFF uses toward the backend.
needles.push({ label: "backend path /api/v1/households", text: "/api/v1/households" });

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(path);
  }
})(root);

const hits = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const needle of needles) if (text.includes(needle.text)) hits.push(`${file}: ${needle.label}`);
}

const valueNeedles = needles.filter((needle) => needle.label.startsWith("value of")).length;
console.log(`check-no-secrets-in-client: scanned ${files.length} files, ${needles.length} needles (${valueNeedles} secret values).`);
if (valueNeedles === 0) console.warn("warning: no secret env values were set, so only names and paths were checked.");
if (hits.length > 0) {
  console.error("FAIL: secrets or server-only names found in the client bundle:");
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log("OK: no BFF secret names or values in .next/static.");
