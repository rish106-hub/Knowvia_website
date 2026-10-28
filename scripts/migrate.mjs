#!/usr/bin/env node
// Applies db/migrations/*.sql to the website schema (knowvia_web), in name order.
//   DATABASE_URL=... [DATABASE_SSL_CA_PATH=...] node scripts/migrate.mjs
// Each migration runs in its own transaction under a transaction-scoped advisory lock, so concurrent
// runners serialise and the lock also works through a transaction-mode pooler. Applied migrations are
// recorded with a SHA-256 checksum; an edited, already-applied file stops the run.
// Prints migration names and error codes only, never connection details.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { buildPoolConfig, WEB_SCHEMA } from "../src/lib/server/db.mjs";

export const MIGRATIONS_DIR = fileURLToPath(new URL("../db/migrations/", import.meta.url));
const LOCK_KEY = "knowvia_web.migrations";

/** @param {string} dir */
export function loadMigrations(dir = MIGRATIONS_DIR) {
  return readdirSync(dir)
    .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
    .sort()
    .map((name) => {
      const sql = readFileSync(join(dir, name), "utf8");
      return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    });
}

/**
 * @param {import("pg").ClientBase} client
 * @param {{ dir?: string, log?: (line: string) => void }} [options]
 * @returns {Promise<string[]>} names applied in this run
 */
export async function runMigrations(client, options = {}) {
  const log = options.log ?? (() => {});
  const migrations = loadMigrations(options.dir);
  const applied = [];
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [LOCK_KEY]);
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${WEB_SCHEMA}`);
    await client.query(`CREATE TABLE IF NOT EXISTS ${WEB_SCHEMA}.schema_migrations (
      name TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  for (const migration of migrations) {
    await client.query("BEGIN");
    try {
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [LOCK_KEY]);
      const { rows } = await client.query(`SELECT checksum FROM ${WEB_SCHEMA}.schema_migrations WHERE name = $1`, [migration.name]);
      if (rows.length > 0) {
        if (rows[0].checksum !== migration.checksum) throw new Error(`Checksum mismatch for applied migration ${migration.name}.`);
        await client.query("COMMIT");
        continue;
      }
      await client.query(migration.sql);
      await client.query(`INSERT INTO ${WEB_SCHEMA}.schema_migrations (name, checksum) VALUES ($1, $2)`, [migration.name, migration.checksum]);
      await client.query("COMMIT");
      applied.push(migration.name);
      log(`applied ${migration.name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
  return applied;
}

async function main() {
  const client = new pg.Client(buildPoolConfig(process.env));
  await client.connect();
  try {
    const applied = await runMigrations(client, { log: (line) => console.log(line) });
    console.log(applied.length ? `migrate: ${applied.length} applied` : "migrate: up to date");
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const detail = error && typeof error === "object" && "code" in error ? ` (code ${error.code})` : "";
    console.error(`migrate: failed${detail}: ${error instanceof Error && error.name === "DatabaseConfigError" ? error.message : "see database logs"}`);
    if (error instanceof Error && error.message.startsWith("Checksum mismatch")) console.error(error.message);
    process.exit(1);
  });
}
