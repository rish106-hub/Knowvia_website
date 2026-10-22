// In-memory rate limit for session creation. PER-INSTANCE ONLY: each server instance keeps its own counters, so the
// effective limit scales with instance count and resets on restart. Keys are hashed so raw addresses are not retained.
//
// Client identification: X-Forwarded-For and X-Real-IP are client-controlled unless a trusted proxy overwrites them,
// so they are IGNORED unless APP_TRUSTED_PROXY_HOPS says how many proxies of ours append to X-Forwarded-For. With 0
// hops every caller shares one bucket (safe, coarse). A global ceiling applies on top of the per-client limit, so a
// caller that does get a fresh key per request still cannot create sessions faster than the backend can hold them.
import { createHash } from "node:crypto";
import { appError } from "./errors";

export type RateLimiter = { check(key: string, nowMs: number): void };

type Bucket = { count: number; resetAt: number };

export function createRateLimiter({ limit = 10, windowMs = 10 * 60_000, maxKeys = 10_000, globalLimit = 60 } = {}): RateLimiter {
  const hits = new Map<string, Bucket>();
  let global: Bucket = { count: 0, resetAt: 0 };
  return {
    check(key, nowMs) {
      if (global.resetAt <= nowMs) global = { count: 0, resetAt: nowMs + windowMs };
      global.count += 1;
      const digest = createHash("sha256").update(key).digest("hex").slice(0, 24);
      const current = hits.get(digest);
      const entry = !current || current.resetAt <= nowMs ? { count: 0, resetAt: nowMs + windowMs } : current;
      entry.count += 1;
      hits.set(digest, entry);
      if (hits.size > maxKeys) {
        for (const [k, v] of hits) if (v.resetAt <= nowMs) hits.delete(k);
        // Still over the cap (a flood of fresh keys): drop the oldest keys, so memory and the scan stay bounded.
        for (const k of hits.keys()) {
          if (hits.size <= maxKeys) break;
          hits.delete(k);
        }
      }
      if (entry.count > limit || global.count > globalLimit) throw appError(429, "RATE_LIMITED", { retryable: true });
    },
  };
}

const SHARED_KEY = "untrusted-direct";

/**
 * `trustedProxyHops` is the number of trusted proxies that each append the address they saw to X-Forwarded-For. The
 * client is the entry that the outermost trusted proxy appended: `hops` from the right. A missing or short header
 * falls back to the shared bucket, never to an attacker-chosen value.
 */
export function clientKey(request: Request, trustedProxyHops = 0): string {
  if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 1) return SHARED_KEY;
  const hops = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
  const client = hops[hops.length - trustedProxyHops];
  return client && client.length <= 64 ? `ip:${client}` : SHARED_KEY;
}
