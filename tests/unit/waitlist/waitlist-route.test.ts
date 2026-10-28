import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { MemoryRateLimiter, platformClientIp } from "@/lib/server/request-guards";
import { createWaitlistHandler, type WaitlistDeps } from "@/lib/server/waitlist-handler";
import { EMAIL_HOURLY_LIMIT, WAITLIST_CONSENT_VERSION, eraseWaitlistEntry } from "@/lib/server/waitlist-store.mjs";
import { fakePool } from "./fake-pool";

const EMAIL = "asha@example.test";

function setup(overrides: Partial<WaitlistDeps> = {}, pool = fakePool()) {
  const logError = vi.fn();
  const deps: WaitlistDeps = {
    getPool: () => pool,
    env: { NODE_ENV: "test" },
    limiter: new MemoryRateLimiter(8, 60_000),
    devLeads: new Map(),
    logError,
    ...overrides,
  };
  return { POST: createWaitlistHandler(deps), pool, logError, deps };
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "203.0.113.7", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const valid = { email: EMAIL, consent: true, location: "hero", company_website: "" };

describe("POST /api/waitlist", () => {
  it("stores consent version, source and timestamp with a normalised email", async () => {
    const { POST, pool } = setup();
    const res = await POST(post({ ...valid, email: "Asha@Example.TEST", utm_source: "newsletter" }));
    expect(res.status).toBe(201);
    expect(pool.calls).toHaveLength(1);
    const [{ text, values }] = pool.calls;
    expect(text).toContain("INSERT INTO knowvia_web.waitlist");
    expect(text).toContain("consented_at");
    expect(values?.[0]).toBe(EMAIL);
    expect(values?.[6]).toBe(WAITLIST_CONSENT_VERSION);
    expect(values?.[7]).toBe("website:hero");
    expect(JSON.parse(String(values?.[5]))).toMatchObject({ utm_source: "newsletter" });
  });

  it("requires the consent flag", async () => {
    const { POST, pool } = setup();
    for (const consent of [undefined, false, "yes"]) {
      const res = await POST(post({ ...valid, consent }));
      expect(res.status).toBe(400);
      expect((await res.json()).message).toMatch(/notice/);
    }
    expect(pool.calls).toHaveLength(0);
  });

  it("rejects invalid emails, bad JSON and filled honeypots with 400", async () => {
    const { POST, pool } = setup();
    expect((await POST(post({ ...valid, email: "not-an-email" }))).status).toBe(400);
    expect((await POST(post("{not json"))).status).toBe(400);
    expect((await POST(post({ ...valid, company_website: "spam.example.test" }))).status).toBe(400);
    expect((await POST(post({ ...valid, location: "footer" }))).status).toBe(400);
    expect(pool.calls).toHaveLength(0);
  });

  it("treats a repeat signup as an idempotent upsert", async () => {
    const { POST, pool } = setup();
    expect((await POST(post(valid))).status).toBe(201);
    expect((await POST(post(valid))).status).toBe(201);
    expect(pool.calls.every((call) => /ON CONFLICT \(email\) DO UPDATE/.test(call.text))).toBe(true);
  });

  it("answers 429 when the database per-email throttle refuses the write", async () => {
    const { POST, pool } = setup({}, fakePool(() => ({ rows: [], rowCount: 0 })));
    const res = await POST(post(valid));
    expect(res.status).toBe(429);
    expect(pool.calls[0].values?.[8]).toBe(EMAIL_HOURLY_LIMIT);
  });

  it("rate limits by platform IP and ignores a spoofed left-most x-forwarded-for", async () => {
    const { POST } = setup({ limiter: new MemoryRateLimiter(2, 60_000) });
    const statuses = [];
    for (let i = 0; i < 3; i += 1) {
      // A client rotating the first x-forwarded-for entry still lands in the same bucket.
      const res = await POST(post(valid, { "x-real-ip": "", "x-forwarded-for": `198.51.100.${i}, 203.0.113.9` }));
      statuses.push(res.status);
    }
    expect(statuses).toEqual([201, 201, 429]);
  });

  it("returns a generic 503 with no driver or stack detail when storage fails", async () => {
    const failing = fakePool(() => {
      const error = Object.assign(new Error('relation "knowvia_web.waitlist" does not exist at db.example.test'), { code: "42P01" });
      throw error;
    });
    const { POST, logError } = setup({}, failing);
    const res = await POST(post(valid));
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ message: "We could not save that right now. Please try again." });
    expect(text).not.toMatch(/relation|knowvia_web|42P01|example\.test|\bat \S+:\d+|Error/);
    expect(logError).toHaveBeenCalledWith("Waitlist signup failed", "42P01");
  });

  it("refuses to fall back to memory in production without a database", async () => {
    const { POST, logError } = setup({ getPool: () => null, env: { NODE_ENV: "production" } });
    expect((await POST(post(valid))).status).toBe(503);
    expect(logError).toHaveBeenCalled();
  });

  it("keeps an in-memory dev store when no database is configured outside production", async () => {
    const devLeads = new Map();
    const { POST } = setup({ getPool: () => null, devLeads });
    expect((await POST(post(valid))).status).toBe(201);
    expect(devLeads.has(EMAIL)).toBe(true);
  });
});

describe("platformClientIp", () => {
  it("prefers x-real-ip, then the last x-forwarded-for hop", () => {
    expect(platformClientIp(new Headers({ "x-real-ip": "203.0.113.1", "x-forwarded-for": "1.1.1.1" }))).toBe("203.0.113.1");
    expect(platformClientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 203.0.113.2" }))).toBe("203.0.113.2");
    expect(platformClientIp(new Headers())).toBe("unknown");
  });
});

describe("eraseWaitlistEntry", () => {
  it("deletes voice notes and the waitlist row for one email in a transaction", async () => {
    const pool = fakePool((text) => ({ rows: [], rowCount: text.startsWith("DELETE") ? 1 : null }));
    const removed = await eraseWaitlistEntry(pool, " Asha@Example.TEST ");
    expect(removed).toEqual({ waitlist: 1, voiceNotes: 1 });
    expect(pool.calls.map((call) => call.text.split(" WHERE")[0])).toEqual([
      "BEGIN",
      "DELETE FROM knowvia_web.voice_notes",
      "DELETE FROM knowvia_web.waitlist",
      "COMMIT",
    ]);
    expect(pool.calls[1].values).toEqual([EMAIL]);
    expect(pool.released).toBe(1);
  });

  it("rolls back and releases the client when a delete fails", async () => {
    const pool = fakePool((text) => {
      if (text.includes("knowvia_web.waitlist")) throw new Error("boom");
      return { rows: [], rowCount: 0 };
    });
    await expect(eraseWaitlistEntry(pool, EMAIL)).rejects.toThrow("boom");
    expect(pool.calls.at(-1)?.text).toBe("ROLLBACK");
    expect(pool.released).toBe(1);
  });
});

describe("no schema changes at request time", () => {
  it("has no CREATE or ALTER TABLE under src", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(m?[jt]sx?)$/.test(entry) && /\b(CREATE|ALTER)\s+TABLE\b/i.test(readFileSync(path, "utf8"))) hits.push(path);
      }
    };
    walk(join(process.cwd(), "src"));
    expect(hits).toEqual([]);
  });
});
