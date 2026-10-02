import { randomBytes, randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { leadConsentEvents, leads } from "@/lib/db/schema";
import { readLeadConfig } from "@/lib/leads/config";
import {
  decryptEmail,
  emailLookupHash,
  encryptEmail,
  unsubscribeSignature,
  type LeadKeys,
} from "@/lib/leads/crypto";
import type { ConfirmationMessage } from "@/lib/leads/email";
import { renderConfirmationEmail } from "@/lib/leads/email";
import { LEAD_NOTICE_VERSION, MAX_LEAD_BODY_BYTES } from "@/lib/leads/schema";
import { confirmLead, RATE_LIMIT_MAX_PER_CLIENT, submitLead, unsubscribeLead, type LeadServiceDeps } from "@/lib/leads/service";
import { LeadStore, PENDING_RETENTION_MS, type LeadDatabase } from "@/lib/leads/store";
import { createTurnstileVerifier } from "@/lib/leads/turnstile";

const keys: LeadKeys = {
  encryptionKey: randomBytes(32),
  encryptionKeyId: "k1",
  hmacKey: randomBytes(32),
};

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    email: "  Priya.Sharma@Example.COM ",
    audience: "individual",
    intent: "launch_updates",
    noticeVersion: LEAD_NOTICE_VERSION,
    marketingConsent: true,
    ageConfirmed: true,
    turnstileToken: "test-token",
    source: { page: "/", placement: "hero" },
    ...overrides,
  };
}

async function freshDatabase() {
  const client = new PGlite();
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "drizzle" });
  return db;
}

interface Harness {
  db: Awaited<ReturnType<typeof freshDatabase>>;
  deps: LeadServiceDeps;
  sent: ConfirmationMessage[];
  setNow: (value: Date) => void;
  turnstile: { pass: boolean };
  email: { deliver: boolean };
}

async function harness(): Promise<Harness> {
  const db = await freshDatabase();
  const sent: ConfirmationMessage[] = [];
  let now = new Date("2026-10-02T10:00:00Z");
  const turnstile = { pass: true };
  const email = { deliver: true };
  const deps: LeadServiceDeps = {
    store: new LeadStore(db as unknown as LeadDatabase),
    verifyTurnstile: async () => turnstile.pass,
    sendConfirmation: async (message) => {
      if (!email.deliver) return false;
      sent.push(message);
      return true;
    },
    keys,
    keyring: new Map([[keys.encryptionKeyId, keys.encryptionKey]]),
    siteUrl: "https://knowvia.example",
    now: () => now,
  };
  return { db, deps, sent, setNow: (value) => (now = value), turnstile, email };
}

function tokenFrom(message: ConfirmationMessage): string {
  return new URL(message.confirmUrl).searchParams.get("token")!;
}

describe("lead crypto", () => {
  it("encrypts with a key-bound envelope and decrypts", () => {
    const envelope = encryptEmail("a@example.com", keys);
    expect(envelope).not.toContain("example");
    expect(envelope.startsWith("v1.k1.")).toBe(true);
    expect(decryptEmail(envelope, new Map([["k1", keys.encryptionKey]]))).toBe("a@example.com");
  });

  it("refuses a tampered envelope or an unknown key", () => {
    const envelope = encryptEmail("a@example.com", keys);
    const parts = envelope.split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decryptEmail(parts.join("."), new Map([["k1", keys.encryptionKey]]))).toThrow();
    expect(() => decryptEmail(envelope, new Map([["k2", keys.encryptionKey]]))).toThrow();
  });

  it("hashes deterministically per key", () => {
    expect(emailLookupHash("a@example.com", keys.hmacKey)).toBe(emailLookupHash("a@example.com", keys.hmacKey));
    expect(emailLookupHash("a@example.com", randomBytes(32))).not.toBe(emailLookupHash("a@example.com", keys.hmacKey));
  });
});

describe("submitLead", () => {
  let h: Harness;
  beforeEach(async () => {
    h = await harness();
  });

  it("accepts a valid submission, stores only protected email and sends one confirmation", async () => {
    const result = await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: "203.0.113.7" }, h.deps);
    expect(result).toEqual({ status: 202, body: { status: "verification_pending" } });
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].to).toBe("priya.sharma@example.com");

    const [row] = await h.db.select().from(leads);
    expect(row.status).toBe("pending");
    expect(row.emailCiphertext).not.toContain("priya");
    expect(row.emailHash).toBe(emailLookupHash("priya.sharma@example.com", keys.hmacKey));
    expect(row.confirmationTokenHash).not.toBe(tokenFrom(h.sent[0]));
    expect(row.emailDeliveryStatus).toBe("sent");
    expect(await h.db.select().from(leadConsentEvents)).toHaveLength(1);
  });

  it.each([
    ["missing consent", { marketingConsent: false }, "marketingConsent"],
    ["under-18 not confirmed", { ageConfirmed: undefined }, "ageConfirmed"],
    ["bad email", { email: "not-an-email" }, "email"],
    ["unknown field", { phone: "9999999999" }, "body"],
    ["stale notice", { noticeVersion: "2020-01-01" }, "noticeVersion"],
    ["unknown source key", { source: { page: "/", placement: "hero", referrer: "x" } }, "source"],
    ["external source page", { source: { page: "https://evil.example", placement: "hero" } }, "source"],
    ["markup in name", { name: "<script>" }, "name"],
  ])("rejects %s with field names only", async (_label, overrides, field) => {
    const result = await submitLead({ body: validBody(overrides), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe("invalid_request");
    expect(result.body.fields).toContain(field);
    expect(h.sent).toHaveLength(0);
  });

  it("requires a UUID idempotency key", async () => {
    const result = await submitLead({ body: validBody(), idempotencyKey: "abc", clientAddress: null }, h.deps);
    expect(result).toEqual({ status: 400, body: { error: "idempotency_key_required" } });
  });

  it("fails closed when the bot check fails", async () => {
    h.turnstile.pass = false;
    const result = await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    expect(result).toEqual({ status: 400, body: { error: "verification_failed" } });
    expect(await h.db.select().from(leads)).toHaveLength(0);
  });

  it("replays a retried request without a second email, and rejects key reuse with different content", async () => {
    const key = randomUUID();
    await submitLead({ body: validBody(), idempotencyKey: key, clientAddress: null }, h.deps);
    const retry = await submitLead({ body: validBody({ turnstileToken: "new-token" }), idempotencyKey: key, clientAddress: null }, h.deps);
    expect(retry.status).toBe(202);
    expect(h.sent).toHaveLength(1);
    const conflict = await submitLead({ body: validBody({ intent: "newsletter" }), idempotencyKey: key, clientAddress: null }, h.deps);
    expect(conflict).toEqual({ status: 409, body: { error: "idempotency_conflict" } });
  });

  it("gives the same response for a new, pending and confirmed address (no enumeration)", async () => {
    const first = await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    const pendingAgain = await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    await confirmLead({ token: tokenFrom(h.sent[0]) }, h.deps);
    const confirmedAgain = await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    expect(first).toEqual(pendingAgain);
    expect(first).toEqual(confirmedAgain);
    // Throttled while pending, never re-sent once confirmed.
    expect(h.sent).toHaveLength(1);
  });

  it("re-sends a fresh link after the throttle window and invalidates the old one", async () => {
    await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    h.setNow(new Date("2026-10-02T10:11:00Z"));
    await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    expect(h.sent).toHaveLength(2);
    expect((await confirmLead({ token: tokenFrom(h.sent[0]) }, h.deps)).status).toBe(400);
    expect((await confirmLead({ token: tokenFrom(h.sent[1]) }, h.deps)).status).toBe(200);
  });

  it("handles concurrent duplicate submissions without errors or duplicate rows", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: `192.0.2.${index}` }, h.deps),
      ),
    );
    expect(results.every((result) => result.status === 202)).toBe(true);
    expect(await h.db.select().from(leads)).toHaveLength(1);
  });

  it("answers 202 during an email outage, records the failure and delivers on the next attempt", async () => {
    h.email.deliver = false;
    const failed = await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    expect(failed.status).toBe(202);
    const [row] = await h.db.select().from(leads);
    expect(row.emailDeliveryStatus).toBe("failed");

    h.email.deliver = true;
    const retried = await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    expect(retried.status).toBe(202);
    expect(h.sent).toHaveLength(1);
  });

  it("sends email after the response when a defer hook is provided", async () => {
    const deferred: Array<() => Promise<void>> = [];
    const result = await submitLead(
      { body: validBody(), idempotencyKey: randomUUID(), clientAddress: null },
      { ...h.deps, defer: (task) => void deferred.push(task) },
    );
    expect(result.status).toBe(202);
    expect(h.sent).toHaveLength(0);
    await deferred[0]();
    expect(h.sent).toHaveLength(1);
  });

  it("rate-limits requests without a client address in one shared bucket (fails closed)", async () => {
    let last = 0;
    for (let index = 0; index <= RATE_LIMIT_MAX_PER_CLIENT; index += 1) {
      last = (
        await submitLead({ body: validBody({ email: `anon${index}@example.com` }), idempotencyKey: randomUUID(), clientAddress: null }, h.deps)
      ).status;
    }
    expect(last).toBe(429);
  });

  it("reports a database outage as retryable", async () => {
    const broken = { ...h.deps, store: { findIdempotentResponse: async () => { throw new Error("db down"); } } as unknown as LeadStore };
    const result = await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: null }, broken);
    expect(result).toEqual({ status: 503, body: { error: "temporarily_unavailable" } });
  });

  it("rate-limits one client address across requests", async () => {
    let last = 0;
    for (let index = 0; index <= RATE_LIMIT_MAX_PER_CLIENT; index += 1) {
      last = (
        await submitLead(
          { body: validBody({ email: `person${index}@example.com` }), idempotencyKey: randomUUID(), clientAddress: "198.51.100.4" },
          h.deps,
        )
      ).status;
    }
    expect(last).toBe(429);
  });
});

describe("confirmation and unsubscribe", () => {
  let h: Harness;
  beforeEach(async () => {
    h = await harness();
    await submitLead({ body: validBody({ name: "Priya", organisation: "Harbourline" }), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
  });

  it("confirms once; a reused or malformed token is rejected", async () => {
    const token = tokenFrom(h.sent[0]);
    expect(await confirmLead({ token }, h.deps)).toEqual({ status: 200, body: { status: "confirmed" } });
    expect((await confirmLead({ token }, h.deps)).status).toBe(400);
    expect((await confirmLead({ token: "short" }, h.deps)).status).toBe(400);
    expect((await confirmLead({ token, extra: 1 }, h.deps)).status).toBe(400);
  });

  it("rejects an expired token", async () => {
    h.setNow(new Date("2026-10-05T10:00:01Z"));
    expect((await confirmLead({ token: tokenFrom(h.sent[0]) }, h.deps)).status).toBe(400);
  });

  it("unsubscribes with a valid signature, erases personal fields and suppresses future email", async () => {
    const url = new URL(h.sent[0].oneClickUnsubscribeUrl);
    const result = await unsubscribeLead(url.searchParams.get("lead"), url.searchParams.get("sig"), h.deps);
    expect(result.status).toBe(200);
    const [row] = await h.db.select().from(leads);
    expect(row).toMatchObject({ status: "unsubscribed", emailCiphertext: null, name: null, organisation: null });
    // Idempotent.
    expect((await unsubscribeLead(url.searchParams.get("lead"), url.searchParams.get("sig"), h.deps)).status).toBe(200);
  });

  it("refuses a forged unsubscribe link", async () => {
    const [row] = await h.db.select().from(leads);
    expect((await unsubscribeLead(row.id, "forged", h.deps)).status).toBe(400);
    expect((await unsubscribeLead(randomUUID(), unsubscribeSignature(row.id, keys.hmacKey), h.deps)).status).toBe(400);
    expect((await unsubscribeLead("not-a-uuid", "x", h.deps)).status).toBe(400);
  });

  it("allows an unsubscribed person to opt in again through double opt-in", async () => {
    const url = new URL(h.sent[0].oneClickUnsubscribeUrl);
    await unsubscribeLead(url.searchParams.get("lead"), url.searchParams.get("sig"), h.deps);
    const again = await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    expect(again.status).toBe(202);
    expect(h.sent).toHaveLength(2);
    const [row] = await h.db.select().from(leads);
    expect(row.status).toBe("pending");
  });
});

describe("retention", () => {
  it("deletes unconfirmed sign-ups after 7 days and keeps confirmed ones", async () => {
    const h = await harness();
    await submitLead({ body: validBody({ email: "pending@example.com" }), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    await submitLead({ body: validBody({ email: "kept@example.com", intent: "newsletter" }), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    await confirmLead({ token: tokenFrom(h.sent[1]) }, h.deps);

    const later = new Date(new Date("2026-10-02T10:00:00Z").getTime() + PENDING_RETENTION_MS + 1000);
    const counts = await h.deps.store.purgeExpired(later, null);
    expect(counts.deletedPending).toBe(1);
    const remaining = await h.db.select().from(leads);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].status).toBe("confirmed");
  });

  it("measures the 7 days from the latest submission, not the first", async () => {
    const h = await harness();
    await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: "198.51.100.1" }, h.deps);
    h.setNow(new Date("2026-10-08T10:00:00Z"));
    await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: "198.51.100.1" }, h.deps);
    const counts = await h.deps.store.purgeExpired(new Date("2026-10-10T10:00:00Z"), null);
    expect(counts.deletedPending).toBe(0);
    expect((await confirmLead({ token: tokenFrom(h.sent[1]) }, { ...h.deps, now: () => new Date("2026-10-10T10:00:00Z") })).status).toBe(200);
  });

  it("returns an expired re-signup of an unsubscribed person to suppressed instead of deleting it", async () => {
    const h = await harness();
    await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: "198.51.100.2" }, h.deps);
    const url = new URL(h.sent[0].oneClickUnsubscribeUrl);
    await unsubscribeLead(url.searchParams.get("lead"), url.searchParams.get("sig"), h.deps);
    await submitLead({ body: validBody(), idempotencyKey: randomUUID(), clientAddress: "198.51.100.2" }, h.deps);
    await h.deps.store.purgeExpired(new Date("2026-10-20T10:00:00Z"), null);
    const rows = await h.db.select().from(leads);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "unsubscribed", emailCiphertext: null });
    expect(await h.db.select().from(leadConsentEvents)).not.toHaveLength(0);
  });

  it("erases confirmed launch-update leads 90 days after the campaign ends", async () => {
    const h = await harness();
    await submitLead({ body: validBody({ intent: "launch_updates" }), idempotencyKey: randomUUID(), clientAddress: null }, h.deps);
    await confirmLead({ token: tokenFrom(h.sent[0]) }, h.deps);
    const counts = await h.deps.store.purgeExpired(new Date("2027-06-01T00:00:00Z"), new Date("2027-01-01T00:00:00Z"));
    expect(counts.erasedLaunchLeads).toBe(1);
    const [row] = await h.db.select().from(leads).where(eq(leads.status, "unsubscribed"));
    expect(row.emailCiphertext).toBeNull();
  });
});

describe("configuration and adapters", () => {
  const complete = {
    DATABASE_URL: "postgres://localhost/test",
    LEAD_EMAIL_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    LEAD_EMAIL_ENCRYPTION_KEY_ID: "k1",
    LEAD_EMAIL_HMAC_KEY: randomBytes(32).toString("base64"),
    TURNSTILE_SECRET_KEY: "secret",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site",
  };

  it("disables lead capture when configuration is missing, naming variables but not values", () => {
    const result = readLeadConfig({ ...complete, NODE_ENV: "development", TURNSTILE_SECRET_KEY: "" } as unknown as NodeJS.ProcessEnv);
    expect(result).toEqual({ enabled: false, missing: ["TURNSTILE_SECRET_KEY"] });
  });

  it("requires Resend outside development", () => {
    const result = readLeadConfig({ ...complete, APP_ENV: "production" } as unknown as NodeJS.ProcessEnv);
    expect(result.enabled).toBe(false);
    if (!result.enabled) expect(result.missing).toEqual(["RESEND_API_KEY", "RESEND_FROM_EMAIL"]);
  });

  it("rejects keys of the wrong length", () => {
    const result = readLeadConfig({ ...complete, NODE_ENV: "development", LEAD_EMAIL_HMAC_KEY: "c2hvcnQ=" } as unknown as NodeJS.ProcessEnv);
    expect(result.enabled).toBe(false);
  });

  it("uses the console mailer only under next dev, never in a production server without Resend", () => {
    const dev = readLeadConfig({ ...complete, NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv);
    expect(dev.enabled && dev.config.email.kind).toBe("development");
    const server = readLeadConfig({ ...complete, NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv);
    expect(server).toEqual({ enabled: false, missing: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"] });
  });

  it("treats Turnstile timeouts, errors and non-success as unverified", async () => {
    const ok = createTurnstileVerifier("s", (async () => new Response(JSON.stringify({ success: true }))) as typeof fetch);
    const no = createTurnstileVerifier("s", (async () => new Response(JSON.stringify({ success: false }))) as typeof fetch);
    const down = createTurnstileVerifier("s", (async () => {
      throw new Error("timeout");
    }) as typeof fetch);
    const bad = createTurnstileVerifier("s", (async () => new Response("oops", { status: 500 })) as typeof fetch);
    expect(await ok("t", null)).toBe(true);
    expect(await no("t", null)).toBe(false);
    expect(await down("t", null)).toBe(false);
    expect(await bad("t", null)).toBe(false);
  });

  it("escapes links in the confirmation email", () => {
    const { html, text } = renderConfirmationEmail({
      confirmUrl: 'https://knowvia.example/confirm?token=a"><script>',
      unsubscribeUrl: "https://knowvia.example/unsubscribe?lead=1&sig=2",
    });
    expect(html).not.toContain("<script>");
    expect(text).toContain("Stop all emails");
  });

  it("keeps the body limit small", () => {
    expect(MAX_LEAD_BODY_BYTES).toBeLessThanOrEqual(4096);
  });
});
