import { createHash } from "node:crypto";

/**
 * Client IP as reported by the hosting platform, never the client-controlled left end of x-forwarded-for.
 * Vercel sets x-real-ip to the connecting client. Without it, the last x-forwarded-for hop is the
 * address our nearest proxy saw. Returns "unknown" when neither is present.
 */
export function platformClientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const hops = headers.get("x-forwarded-for")?.split(",").map((hop) => hop.trim()).filter(Boolean) ?? [];
  return hops.length ? hops[hops.length - 1].slice(0, 64) : "unknown";
}

/** Per-instance sliding-window limiter. Best effort only: serverless instances do not share it. */
export class MemoryRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(private readonly limit: number, private readonly windowMs: number, private readonly now: () => number = Date.now) {}

  /** Records an attempt and returns true when the key is over the limit. */
  hit(ip: string): boolean {
    const key = createHash("sha256").update(ip).digest("hex").slice(0, 16);
    const now = this.now();
    const recent = (this.attempts.get(key) ?? []).filter((time) => now - time < this.windowMs);
    recent.push(now);
    this.attempts.set(key, recent);
    if (this.attempts.size > 10_000) this.prune(now);
    return recent.length > this.limit;
  }

  private prune(now: number) {
    for (const [key, times] of this.attempts) {
      if (times.every((time) => now - time >= this.windowMs)) this.attempts.delete(key);
    }
  }
}
