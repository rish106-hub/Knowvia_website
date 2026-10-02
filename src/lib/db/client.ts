import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// One bounded pool per server process, reused across requests (and hot reloads in development).

const globalForDb = globalThis as unknown as { knowviaLeadPool?: Pool; knowviaLeadDb?: NodePgDatabase<typeof schema> };

export function getLeadDatabase(databaseUrl: string): NodePgDatabase<typeof schema> {
  if (!globalForDb.knowviaLeadDb) {
    const pool = new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.DB_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 5_000,
      query_timeout: 7_000,
    });
    // An idle client error must not crash the process; the next query reconnects.
    pool.on("error", () => undefined);
    globalForDb.knowviaLeadPool = pool;
    globalForDb.knowviaLeadDb = drizzle(pool, { schema });
  }
  return globalForDb.knowviaLeadDb;
}
