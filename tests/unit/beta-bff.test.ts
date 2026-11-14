import { describe, expect, it } from "vitest";
import { chatTurn, confirmProduct, saveDeclarations, startSession, uploadDocument } from "@/lib/beta/handlers";
import { readAnswer } from "@/lib/beta/client";
import { SESSION_COOKIE } from "@/lib/beta/session";

const TOKEN = "backend-bearer-token-synthetic-value";
const BOOT = "b".repeat(40);
const env = { BACKEND_API_URL: "http://backend.test", KNOWVIA_BOOTSTRAP_TOKEN: BOOT, NODE_ENV: "test" } as unknown as NodeJS.ProcessEnv;

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

async function signIn() {
  const s = stub(() => json({ household: { id: "h1" }, owner: { id: "a1" }, ownerMember: { id: "m1" }, session: { token: TOKEN } }, 201));
  const res = await startSession(new Request("http://x/api/beta/session", { method: "POST", body: JSON.stringify({ name: "Asha Test", email: "asha@example.test" }) }), s.deps);
  const cookie = res.headers.get("set-cookie")!.split(";")[0];
  return { res, cookie, s };
}
const withCookie = (cookie: string, init: RequestInit = {}) => ({ ...init, headers: { cookie, ...(init.headers as object) } });

describe("beta BFF", () => {
  it("opens a session with the bootstrap token and never returns the bearer to the client", async () => {
    const { res, cookie, s } = await signIn();
    expect(s.calls[0].headers.authorization).toBe(`Bearer ${BOOT}`);
    const text = await res.text();
    expect(text).not.toContain(TOKEN);
    expect(text).not.toContain(BOOT);
    expect(res.headers.get("set-cookie")).toMatch(/HttpOnly/);
    expect(cookie.startsWith(`${SESSION_COOKIE}=`)).toBe(true);
    expect(cookie).not.toContain(TOKEN);
  });

  it("refuses to start when the bootstrap secret is missing", async () => {
    const s = stub(() => json({}));
    const res = await startSession(new Request("http://x", { method: "POST", body: JSON.stringify({ name: "A", email: "a@example.test" }) }), { ...s.deps, env: { BACKEND_API_URL: "http://backend.test" } as unknown as NodeJS.ProcessEnv });
    expect(res.status).toBe(503);
    expect(s.calls).toHaveLength(0);
  });

  it("needs a session and on-screen consent before uploading", async () => {
    const s = stub(() => json({}));
    expect((await uploadDocument(new Request("http://x", { method: "POST", body: "pdf" }), s.deps)).status).toBe(401);
    const { cookie } = await signIn();
    const res = await uploadDocument(new Request("http://x", withCookie(cookie, { method: "POST", body: "pdf" })), s.deps);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("CONSENT_NOT_CONFIRMED");
    expect(s.calls).toHaveLength(0);
  });

  it("passes a coded upload rejection through with its status and no token", async () => {
    const { cookie } = await signIn();
    const s = stub(call => {
      if (call.url.endsWith("/api/v1/cases")) return json({ id: "c1" }, 201);
      if (call.url.endsWith("/api/v1/consents")) return json({ id: "g1" }, 201);
      return json({ error: { code: "NOT_INSURANCE_DOCUMENT", message: "Not an insurance document." } }, 422);
    });
    const res = await uploadDocument(new Request("http://x", withCookie(cookie, { method: "POST", body: "%PDF", headers: { "x-consent-confirmed": "true" } })), s.deps);
    expect(res.status).toBe(422);
    const text = await res.text();
    expect(JSON.parse(text).error.code).toBe("NOT_INSURANCE_DOCUMENT");
    expect(text).not.toContain(TOKEN);
    const upload = s.calls.at(-1)!;
    expect(upload.headers.authorization).toBe(`Bearer ${TOKEN}`);
    expect(upload.headers["x-document-kind"]).toBe("policy_schedule");
  });

  it("maps an unreachable backend to a coded 502", async () => {
    const { cookie } = await signIn();
    const deps = { env, fetchImpl: (async () => { throw new Error("connect ECONNREFUSED http://backend.test"); }) as unknown as typeof fetch };
    const ok = await uploadDocument(new Request("http://x", withCookie(cookie, { method: "POST", body: "%PDF", headers: { "x-consent-confirmed": "true" } })), deps);
    expect(ok.status).toBe(502);
    expect(JSON.stringify(await ok.json())).not.toContain("ECONNREFUSED");
  });

  it("validates product confirmation and declarations input", async () => {
    const { cookie } = await signIn();
    const s = stub(() => json({}));
    const bad = await saveDeclarations(new Request("http://x", withCookie(cookie, { method: "POST", body: JSON.stringify({ items: [{ kind: "bogus", label: "x" }] }) })), s.deps);
    expect(bad.status).toBe(400);
    const noHolding = await confirmProduct(new Request("http://x", withCookie(cookie, { method: "POST", body: JSON.stringify({ candidateId: "c", expectedVersion: 1 }) })), s.deps);
    expect(noHolding.status).toBe(409);
  });

  it("proxies the chat event stream and rejects a bad thread id", async () => {
    const { cookie } = await signIn();
    const sse = `event: meta\ndata: {}\n\nevent: answer\ndata: ${JSON.stringify({ status: "evidence_found", answer: "Waiting period is 24 months.", sources: [{ page: 4, quote: "24 months" }] })}\n\nevent: done\ndata: {}\n\n`;
    const s = stub(() => new Response(sse, { status: 200, headers: { "content-type": "text/event-stream" } }));
    const res = await chatTurn(new Request("http://x", withCookie(cookie, { method: "POST", body: JSON.stringify({ threadId: "t1", message: "Waiting period?" }) })), s.deps);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(s.calls[0].url).toBe("http://backend.test/api/v1/chat/threads/t1/turns");
    expect(s.calls[0].headers.authorization).toBe(`Bearer ${TOKEN}`);
    const answer = await readAnswer(res);
    expect(answer.status).toBe("evidence_found");
    expect(answer.sources[0].page).toBe(4);
    const bad = await chatTurn(new Request("http://x", withCookie(cookie, { method: "POST", body: JSON.stringify({ threadId: "../x", message: "hi" }) })), s.deps);
    expect(bad.status).toBe(400);
  });

  it("passes a coded error before the stream starts", async () => {
    const { cookie } = await signIn();
    const s = stub(() => json({ error: { code: "MEMORY_DISABLED", message: "Chat is off." } }, 503));
    const res = await chatTurn(new Request("http://x", withCookie(cookie, { method: "POST", body: JSON.stringify({ threadId: "t1", message: "hi" }) })), s.deps);
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("MEMORY_DISABLED");
  });

  it("reads an unknown answer and a coded stream error", async () => {
    const unknown = await readAnswer(new Response(`event: answer\ndata: ${JSON.stringify({ status: "unknown", answer: "", sources: [] })}\n\n`, { headers: { "content-type": "text/event-stream" } }));
    expect(unknown.status).toBe("unknown");
    await expect(readAnswer(new Response(`event: error\ndata: {"code":"CHAT_TURN_FAILED"}\n\n`))).rejects.toMatchObject({ code: "CHAT_TURN_FAILED" });
  });
});
