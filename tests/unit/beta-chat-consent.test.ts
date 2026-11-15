import { describe, expect, it } from "vitest";
import { CHAT_MODEL_RECIPIENT, createThread } from "@/lib/beta/handlers";
import { type BetaSession, SESSION_COOKIE, sealSession } from "@/lib/beta/session";

// Chat-model consent through the beta BFF: opening a thread first holds a coverage_reconstruction grant naming the chat provider as
// recipient (the backend skips any provider without its own grant). Synthetic ids only.

const TOKEN = "backend-bearer-token-synthetic-value";
const env = { BACKEND_API_URL: "http://backend.test", KNOWVIA_BOOTSTRAP_TOKEN: "b".repeat(40), NODE_ENV: "test" } as unknown as NodeJS.ProcessEnv;

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };
function stub(handler: (call: Call) => Response) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const call = { url: String(url), method: String(init.method), headers: Object.fromEntries(Object.entries(init.headers as Record<string, string>)), body: init.body };
    calls.push(call);
    return handler(call);
  }) as unknown as typeof fetch;
  return { calls, deps: { fetchImpl, env } };
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const cookieFor = (patch: Partial<BetaSession> = {}) =>
  `${SESSION_COOKIE}=${sealSession({ token: TOKEN, householdId: "h1", adultId: "a1", memberId: "m1", holdingId: "hold1", ...patch }, env)}`;
const post = (cookie: string) => new Request("http://x/api/beta/chat/threads", { method: "POST", headers: { cookie } });

describe("beta chat consent", () => {
  it("grants the chat provider before opening the thread", async () => {
    const s = stub(call => (call.url.endsWith("/api/v1/consents") ? json({ id: "g-chat" }, 201) : json({ thread: { id: "t1" } }, 201)));
    const res = await createThread(post(cookieFor()), s.deps);
    expect(res.status).toBe(201);
    expect((await res.json()).threadId).toBe("t1");
    expect(s.calls.map(call => call.url)).toEqual(["http://backend.test/api/v1/consents", "http://backend.test/api/v1/chat/threads"]);
    const grant = JSON.parse(String(s.calls[0].body));
    expect(CHAT_MODEL_RECIPIENT).toBe("openai");
    expect(grant).toEqual({
      householdId: "h1", subjectAdultId: "a1", grantedToActor: "openai", purpose: "coverage_reconstruction",
      scopes: [{ resourceType: "household", resourceId: "h1", action: "derive", dataCategory: "insurance_question", recipient: "openai" }],
    });
    expect(s.calls[0].headers["idempotency-key"]).toBe("chat-openai-h1");
  });

  it("reuses a held grant and asks for none", async () => {
    const s = stub(() => json({ thread: { id: "t2" } }, 201));
    const res = await createThread(post(cookieFor({ chatGrantId: "g-held" })), s.deps);
    expect(res.status).toBe(201);
    expect(s.calls.map(call => call.url)).toEqual(["http://backend.test/api/v1/chat/threads"]);
  });

  it("opens no thread when the grant fails", async () => {
    const s = stub(() => json({ error: { code: "CONSENT_INVALID", message: "x" } }, 400));
    const res = await createThread(post(cookieFor()), s.deps);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(s.calls).toHaveLength(1);
  });

  it("needs a session", async () => {
    const s = stub(() => json({}));
    expect((await createThread(new Request("http://x/api/beta/chat/threads", { method: "POST" }), s.deps)).status).toBe(401);
    expect(s.calls).toHaveLength(0);
  });
});
