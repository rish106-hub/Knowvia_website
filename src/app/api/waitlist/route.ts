import { getPool } from "@/lib/server/db.mjs";
import { MemoryRateLimiter } from "@/lib/server/request-guards";
import { createWaitlistHandler } from "@/lib/server/waitlist-handler";

// Tables are created by scripts/migrate.mjs (db/migrations), never at request time.
export const POST = createWaitlistHandler({
  getPool: () => getPool(),
  env: process.env,
  limiter: new MemoryRateLimiter(8, 60_000),
  devLeads: new Map(),
  logError: (message, code) => console.error(message, code),
});
