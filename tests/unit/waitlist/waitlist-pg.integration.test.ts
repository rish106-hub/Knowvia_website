// Runs only with TEST_DATABASE_URL pointing at a LOCAL PostgreSQL (for example
// postgres://coversaath@localhost:54329/postgres). Creates and drops a throwaway database.
import { randomBytes } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildPoolConfig } from "@/lib/server/db.mjs";
import { EMAIL_HOURLY_LIMIT, eraseWaitlistEntry, saveVoiceNote, saveWaitlistEntry } from "@/lib/server/waitlist-store.mjs";
import { runMigrations } from "../../../scripts/migrate.mjs";

const adminUrl = process.env.TEST_DATABASE_URL;
const isLocal = adminUrl ? ["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(adminUrl).hostname) : false;
const skipReason = !adminUrl ? "TEST_DATABASE_URL not set" : !isLocal ? "TEST_DATABASE_URL is not a local host" : "";
if (skipReason) console.warn(`[waitlist-pg integration] skipped: ${skipReason}`);

describe.skipIf(Boolean(skipReason))("waitlist storage against local PostgreSQL", () => {
  const dbName = `knowvia_web_test_${randomBytes(4).toString("hex")}`;
  let pool: pg.Pool;

  beforeAll(async () => {
    const admin = new pg.Client(buildPoolConfig({ DATABASE_URL: adminUrl, NODE_ENV: "test" }));
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    await admin.end();
    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    pool = new pg.Pool(buildPoolConfig({ DATABASE_URL: url.toString(), NODE_ENV: "test" }));
  });

  afterAll(async () => {
    await pool?.end();
    const admin = new pg.Client(buildPoolConfig({ DATABASE_URL: adminUrl, NODE_ENV: "test" }));
    await admin.connect();
    await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
    await admin.end();
  });

  it("applies migrations once, concurrently safe, and records checksums", async () => {
    const [a, b] = await Promise.all([pool.connect(), pool.connect()]);
    try {
      const results = await Promise.all([runMigrations(a), runMigrations(b)]);
      expect(results.flat()).toEqual(["001_waitlist.sql"]);
    } finally {
      a.release();
      b.release();
    }
    const client = await pool.connect();
    try {
      expect(await runMigrations(client)).toEqual([]);
    } finally {
      client.release();
    }
    const { rows } = await pool.query("SELECT name, length(checksum) AS len FROM knowvia_web.schema_migrations");
    expect(rows).toEqual([{ name: "001_waitlist.sql", len: 64 }]);
  });

  it("stores consent, upserts duplicates and throttles per email", async () => {
    const lead = { email: "Meera@Example.TEST", firstName: null, events: [], policies: ["Not sure"], location: "hero" as const, attribution: {}, consentSource: "website:hero" };
    for (let i = 0; i < EMAIL_HOURLY_LIMIT; i += 1) expect(await saveWaitlistEntry(pool, lead)).toEqual({ status: "saved" });
    expect(await saveWaitlistEntry(pool, lead)).toEqual({ status: "throttled" });
    const { rows } = await pool.query("SELECT email, consent_text_version, consent_source, consented_at IS NOT NULL AS consented FROM knowvia_web.waitlist");
    expect(rows).toEqual([{ email: "meera@example.test", consent_text_version: "draft-1", consent_source: "website:hero", consented: true }]);
  });

  it("erases the waitlist row and voice notes for one email only", async () => {
    const note = { email: "meera@example.test", audio: Buffer.from([1, 2, 3]), mimeType: "audio/webm", durationSeconds: 5, consentSource: "website:voice-note" };
    expect(await saveVoiceNote(pool, note)).toEqual({ status: "saved" });
    await saveWaitlistEntry(pool, { email: "other@example.test", firstName: null, events: [], policies: [], location: "closing", attribution: {}, consentSource: "website:closing" });
    expect(await eraseWaitlistEntry(pool, "meera@example.test")).toEqual({ waitlist: 1, voiceNotes: 1 });
    const left = await pool.query("SELECT email FROM knowvia_web.waitlist UNION ALL SELECT email FROM knowvia_web.voice_notes");
    expect(left.rows).toEqual([{ email: "other@example.test" }]);
  });
});
