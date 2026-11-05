import { timingSafeEqual } from "node:crypto";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

const globalStore = globalThis as typeof globalThis & { knowviaPool?: Pool };

function authorised(request: Request) {
  const token = process.env.WAITLIST_ADMIN_TOKEN;
  if (!token || token.length < 32) return null;
  const given = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Lists stored signups so they can be verified. Bearer WAITLIST_ADMIN_TOKEN required; 404 when unconfigured.
export async function GET(request: Request) {
  const ok = authorised(request);
  if (ok === null) return new Response(null, { status: 404 });
  if (!ok) return Response.json({ message: "Unauthorised." }, { status: 401 });
  if (!process.env.DATABASE_URL) return Response.json({ message: "DATABASE_URL is not set." }, { status: 503 });
  try {
    globalStore.knowviaPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 4, ssl: process.env.DATABASE_URL.includes("localhost") ? undefined : { rejectUnauthorized: false } });
    const pool = globalStore.knowviaPool;
    const total = await pool.query("SELECT COUNT(*)::int AS n FROM knowvia_waitlist");
    const rows = await pool.query("SELECT email, first_name, signup_location, created_at FROM knowvia_waitlist ORDER BY created_at DESC LIMIT 200");
    return Response.json({ total: total.rows[0].n, latest: rows.rows }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Waitlist admin read failed", error);
    return Response.json({ message: "Could not read the waitlist." }, { status: 503 });
  }
}
