import { describe, expect, it } from "vitest";
import { productSearch } from "@/lib/beta/handlers";
import { type BetaSession, SESSION_COOKIE, sealSession } from "@/lib/beta/session";

// Product name search through the beta BFF. Synthetic ids only.

const TOKEN = "backend-bearer-token-synthetic-value";
const env = { BACKEND_API_URL: "http://backend.test", KNOWVIA_BOOTSTRAP_TOKEN: "b".repeat(40), NODE_ENV: "test" } as unknown as NodeJS.ProcessEnv;
type Call = { url: string; headers: Record<string, string> };
function stub(body: unknown) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), headers: init.headers as Record<string, string> });
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { calls, deps: { fetchImpl, env } };
}
const cookieFor = (patch: Partial<BetaSession> = {}) => `${SESSION_COOKIE}=${sealSession({ token: TOKEN, householdId: "h1", adultId: "a1", memberId: "m1", holdingId: "hold1", ...patch }, env)}`;
const get = (q: string, cookie = cookieFor()) => new Request(`http://x/api/beta/product/search?q=${encodeURIComponent(q)}`, { headers: { cookie } });

describe("beta product search", () => {
  it("forwards a trimmed fragment to the holding search and never returns the bearer", async () => {
    const s = stub({ holdingId: "hold1", candidates: [{ candidateId: "p1", insurerName: "Synthetic Insurer", productName: "Synthetic Shield", rank: 1 }] });
    const res = await productSearch(get("  shield   plus "), s.deps);
    expect(res.status).toBe(200);
    expect(s.calls[0].url).toBe("http://backend.test/api/v1/holdings/hold1/product-search?q=shield%20plus");
    const text = await res.text();
    expect(text).not.toContain(TOKEN);
    expect(JSON.parse(text).candidates[0].candidateId).toBe("p1");
  });

  it("refuses short, long or many-word fragments and a missing holding before calling the backend", async () => {
    const s = stub({});
    for (const q of ["a", "x".repeat(81), "one two three four five six seven eight nine"]) expect((await productSearch(get(q), s.deps)).status).toBe(400);
    expect((await productSearch(get("shield", cookieFor({ holdingId: undefined })), s.deps)).status).toBe(409);
    expect((await productSearch(new Request("http://x/api/beta/product/search?q=shield"), s.deps)).status).toBe(401);
    expect(s.calls).toHaveLength(0);
  });
});
