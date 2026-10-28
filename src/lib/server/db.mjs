// @ts-check
// Shared PostgreSQL connection for the website's own schema (knowvia_web).
// Used by the API routes and by scripts/migrate.mjs and scripts/erase-waitlist.mjs, so it stays plain ESM.
// TLS is always verified: a CA from DATABASE_SSL_CA_PATH / DATABASE_SSL_CA, or the system roots.
// Certificate verification is never disabled.
import { readFileSync } from "node:fs";
import pg from "pg";

/** Website objects live in their own schema inside the shared database. Every query qualifies names with it. */
export const WEB_SCHEMA = "knowvia_web";

// libpq-style TLS parameters in the URL would override the ssl object we build, so they are removed.
const STRIPPED_URL_PARAMS = /^(ssl.*|uselibpqcompat)$/i;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export class DatabaseConfigError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

/**
 * @param {string} raw
 * @returns {string}
 */
function normalisePem(raw) {
  // Hosting dashboards often store multi-line values with literal "\n".
  const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  if (!pem.includes("-----BEGIN CERTIFICATE-----")) throw new DatabaseConfigError("Database CA is not a PEM certificate.");
  return pem;
}

/**
 * Builds pg.Pool options from environment variables. Pure apart from reading the CA file.
 * @param {Record<string, string | undefined>} env
 * @param {{ readFile?: (path: string) => string }} [io]
 * @returns {import("pg").PoolConfig}
 */
export function buildPoolConfig(env, io = {}) {
  const readFile = io.readFile ?? ((path) => readFileSync(path, "utf8"));
  const rawUrl = env.DATABASE_URL;
  if (!rawUrl) throw new DatabaseConfigError("DATABASE_URL is not set.");
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new DatabaseConfigError("DATABASE_URL is not a valid URL.");
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") throw new DatabaseConfigError("DATABASE_URL must be a postgres URL.");
  for (const key of [...url.searchParams.keys()]) {
    if (STRIPPED_URL_PARAMS.test(key)) url.searchParams.delete(key);
  }

  if (env.DATABASE_SSL_CA_PATH && env.DATABASE_SSL_CA) {
    throw new DatabaseConfigError("Set only one of DATABASE_SSL_CA_PATH or DATABASE_SSL_CA.");
  }
  let ca;
  if (env.DATABASE_SSL_CA_PATH) {
    let text;
    try {
      text = readFile(env.DATABASE_SSL_CA_PATH);
    } catch {
      throw new DatabaseConfigError("DATABASE_SSL_CA_PATH could not be read.");
    }
    ca = normalisePem(text);
  } else if (env.DATABASE_SSL_CA) {
    ca = normalisePem(env.DATABASE_SSL_CA);
  }

  const production = env.NODE_ENV === "production";
  const local = LOCAL_HOSTS.has(url.hostname);
  /** @type {import("pg").PoolConfig["ssl"]} */
  let ssl;
  if (ca) ssl = { ca, rejectUnauthorized: true };
  else if (local && !production) ssl = false; // local development server without TLS
  else ssl = { rejectUnauthorized: true }; // verified against the system trust store

  return {
    connectionString: url.toString(),
    ssl,
    max: 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    // Client-side timeout: poolers may reject server startup parameters such as statement_timeout.
    query_timeout: 5_000,
  };
}

/** @type {{ knowviaWebPool?: import("pg").Pool }} */
const globalStore = /** @type {any} */ (globalThis);

/**
 * Lazily created process-wide pool. Returns null when DATABASE_URL is unset.
 * @param {Record<string, string | undefined>} [env]
 * @returns {import("pg").Pool | null}
 */
export function getPool(env = process.env) {
  if (!env.DATABASE_URL) return null;
  if (!globalStore.knowviaWebPool) {
    const pool = new pg.Pool(buildPoolConfig(env));
    // Idle-client errors must not crash the process; log only the error code, never connection details.
    pool.on("error", (error) => console.error("knowvia-web pool error", /** @type {any} */ (error).code ?? "unknown"));
    globalStore.knowviaWebPool = pool;
  }
  return globalStore.knowviaWebPool;
}
