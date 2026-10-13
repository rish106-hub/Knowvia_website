import { createHash } from "node:crypto";
import { Pool } from "pg";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.email().max(320),
  name: z.string().trim().max(80).optional(),
  events: z.union([z.string(), z.array(z.string().max(80)).max(10)]).optional(),
  policies: z.union([z.string(), z.array(z.string().max(80)).max(10)]).optional(),
  location: z.enum(["hero", "closing"]),
  company_website: z.string().max(0).optional().default(""),
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(180).optional(),
  utm_content: z.string().max(180).optional(),
  utm_term: z.string().max(180).optional(),
  gclid: z.string().max(250).optional(),
  fbclid: z.string().max(250).optional(),
});

type WaitlistInput = z.infer<typeof waitlistSchema>;
type MemoryStore = { leads: Map<string, WaitlistInput>; attempts: Map<string, number[]> };
const globalStore = globalThis as typeof globalThis & { knowviaWaitlist?: MemoryStore; knowviaPool?: Pool };
globalStore.knowviaWaitlist ??= { leads: new Map(), attempts: new Map() };

function clientKey(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return createHash("sha256").update(address).digest("hex").slice(0, 16);
}

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (globalStore.knowviaWaitlist?.attempts.get(key) || []).filter((time) => now - time < 60_000);
  recent.push(now);
  globalStore.knowviaWaitlist?.attempts.set(key, recent);
  return recent.length > 8;
}

async function saveLead(input: WaitlistInput) {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production") throw new Error("Waitlist storage is not configured.");
    globalStore.knowviaWaitlist?.leads.set(input.email.toLowerCase(), input);
    return;
  }
  globalStore.knowviaPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 4, ssl: process.env.DATABASE_URL.includes("localhost") ? undefined : { rejectUnauthorized: false } });
  const pool = globalStore.knowviaPool;
  await pool.query(`CREATE TABLE IF NOT EXISTS knowvia_waitlist (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    events TEXT[] NOT NULL DEFAULT '{}',
    signup_location TEXT NOT NULL,
    attribution JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query(`ALTER TABLE knowvia_waitlist ADD COLUMN IF NOT EXISTS first_name TEXT, ADD COLUMN IF NOT EXISTS policies TEXT[] NOT NULL DEFAULT '{}'`);
  const asList = (value: string | string[] | undefined) => (value ? (Array.isArray(value) ? value : [value]) : []);
  const events = asList(input.events);
  const policies = asList(input.policies);
  const attribution = { utm_source: input.utm_source, utm_medium: input.utm_medium, utm_campaign: input.utm_campaign, utm_content: input.utm_content, utm_term: input.utm_term, gclid: input.gclid, fbclid: input.fbclid };
  await pool.query(`INSERT INTO knowvia_waitlist (email, first_name, events, policies, signup_location, attribution)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (email) DO UPDATE SET first_name = COALESCE(EXCLUDED.first_name, knowvia_waitlist.first_name), events = EXCLUDED.events, policies = EXCLUDED.policies, signup_location = EXCLUDED.signup_location, attribution = EXCLUDED.attribution, updated_at = NOW()`,
    [input.email.toLowerCase(), input.name || null, events, policies, input.location, JSON.stringify(attribution)]);
}

export async function POST(request: Request) {
  const key = clientKey(request);
  if (rateLimited(key)) return Response.json({ message: "Too many attempts. Try again in a minute." }, { status: 429 });
  try {
    const input = waitlistSchema.parse(await request.json());
    await saveLead(input);
    return Response.json({ message: "You’re on the list." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ message: "Enter a valid email address." }, { status: 400 });
    console.error("Waitlist signup failed", error);
    return Response.json({ message: "We could not save that right now. Please try again." }, { status: 503 });
  }
}
