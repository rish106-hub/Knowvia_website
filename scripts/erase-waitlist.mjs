#!/usr/bin/env node
// Admin-only erasure: removes the waitlist row and every voice note for one email address.
//   DATABASE_URL=... [DATABASE_SSL_CA_PATH=...] node scripts/erase-waitlist.mjs person@example.test
// Run only from an operator machine with database credentials, after verifying the request came from
// the address owner. Prints row counts only; the email is not echoed to keep it out of shell logs.
import pg from "pg";
import { buildPoolConfig } from "../src/lib/server/db.mjs";
import { eraseWaitlistEntry } from "../src/lib/server/waitlist-store.mjs";

const email = process.argv[2];
if (!email || !email.includes("@") || process.argv.length > 3) {
  console.error("usage: node scripts/erase-waitlist.mjs <email>");
  process.exit(2);
}

const pool = new pg.Pool({ ...buildPoolConfig(process.env), max: 1 });
try {
  const removed = await eraseWaitlistEntry(pool, email);
  console.log(`erase-waitlist: removed ${removed.waitlist} waitlist row(s) and ${removed.voiceNotes} voice note(s)`);
} catch (error) {
  const code = error && typeof error === "object" && "code" in error ? ` (code ${error.code})` : "";
  console.error(`erase-waitlist: failed${code}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
