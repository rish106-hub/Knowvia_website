import { describe, expect, it } from "vitest";
import { intakeAnswer, intakeQuestions } from "@/lib/beta/handlers";
import { planFromBackend } from "@/lib/beta/adapter";
import { type BetaSession, SESSION_COOKIE, sealSession } from "@/lib/beta/session";

// Intake questions through the beta BFF: planner output and reviewed catalogue wording from the backend, answers stored under the
// profile_intake grant the BFF holds. Synthetic ids only.

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
const req = (url: string, cookie: string, init: RequestInit = {}) => new Request(url, { ...init, headers: { cookie, ...(init.headers as object) } });

const ENTRY = {
  id: "members.confirm", prompt: { en: "Is this person covered under this policy?", hi: null }, why: { en: "We show cover for each person.", hi: null },
  input: { kind: "yes_no_unsure", options: [{ id: "yes", label: { en: "Yes", hi: null } }, { id: "no", label: { en: "No", hi: null } }, { id: "not_sure", label: { en: "Not sure", hi: null } }] },
  sensitivity: "none", phase: "before_card", perMember: true, followups: {}, legalReview: "pending",
};
const PLAN = { catalogueVersion: "question-catalogue/v1", phase: "before_card", questions: [{ questionId: "members.confirm", memberId: "m1", reason: "unknown", phase: "before_card" }], catalogue: { "members.confirm": ENTRY } };

describe("beta intake BFF", () => {
  it("needs a session and a holding", async () => {
    const s = stub(() => json(PLAN));
    expect((await intakeQuestions(new Request("http://x/api/beta/questions"), s.deps)).status).toBe(401);
    const res = await intakeQuestions(req("http://x/api/beta/questions", cookieFor({ holdingId: undefined })), s.deps);
    expect(res.status).toBe(409);
    expect(s.calls).toHaveLength(0);
  });

  it("serves the planner output with the backend catalogue and labels only the person themself", async () => {
    const s = stub(() => json({ ...PLAN, questions: [...PLAN.questions, { questionId: "members.confirm", memberId: "m2", reason: "unknown", phase: "before_card" }] }));
    const res = await intakeQuestions(req("http://x/api/beta/questions?phase=before_card", cookieFor()), s.deps);
    expect(res.status).toBe(200);
    expect(s.calls[0].url).toBe("http://backend.test/api/v1/holdings/hold1/intake-questions?phase=before_card");
    expect(s.calls[0].headers.authorization).toBe(`Bearer ${TOKEN}`);
    const text = await res.text();
    expect(text).not.toContain(TOKEN);
    const body = JSON.parse(text);
    expect(body.questions.map((q: { memberLabel: string }) => q.memberLabel)).toEqual(["You", "Family member"]);
    expect(body.catalogue["members.confirm"].prompt.en).toBe(ENTRY.prompt.en);
  });

  it("rejects an unknown phase before calling the backend", async () => {
    const s = stub(() => json(PLAN));
    const res = await intakeQuestions(req("http://x/api/beta/questions?phase=later", cookieFor()), s.deps);
    expect(res.status).toBe(400);
    expect(s.calls).toHaveLength(0);
  });

  it("stores an answer under a profile_intake grant, reusing the grant once held", async () => {
    const s = stub(call => (call.url.endsWith("/api/v1/consents") ? json({ id: "g-profile" }, 201) : json({ questionId: "members.confirm", stored: true, status: "user_confirmed", followupsActivated: [] })));
    const body = JSON.stringify({ questionId: "members.confirm", memberId: "m1", optionIds: ["yes"], catalogueVersion: "question-catalogue/v1" });
    const res = await intakeAnswer(req("http://x/api/beta/answers", cookieFor(), { method: "POST", body }), s.deps);
    expect(res.status).toBe(200);
    expect(JSON.parse(String(s.calls[0].body)).purpose).toBe("profile_intake");
    const sent = JSON.parse(String(s.calls[1].body));
    expect(s.calls[1].url).toBe("http://backend.test/api/v1/holdings/hold1/intake-answers");
    expect(sent).toEqual({ questionId: "members.confirm", memberId: "m1", optionIds: ["yes"], catalogueVersion: "question-catalogue/v1", consentGrantId: "g-profile" });
    const again = stub(() => json({ stored: false }));
    await intakeAnswer(req("http://x/api/beta/answers", cookieFor({ profileGrantId: "g-held" }), { method: "POST", body }), again.deps);
    expect(again.calls).toHaveLength(1);
    expect(JSON.parse(String(again.calls[0].body)).consentGrantId).toBe("g-held");
  });

  it("validates the answer before any backend call", async () => {
    const s = stub(() => json({}));
    for (const bad of [{}, { questionId: "members.confirm", optionIds: [], catalogueVersion: "v" }, { questionId: "../x", optionIds: ["yes"], catalogueVersion: "v" }, { questionId: "members.confirm", optionIds: ["yes"] }]) {
      const res = await intakeAnswer(req("http://x/api/beta/answers", cookieFor(), { method: "POST", body: JSON.stringify(bad) }), s.deps);
      expect(res.status).toBe(400);
    }
    expect(s.calls).toHaveLength(0);
  });
});

describe("planFromBackend", () => {
  it("builds plan items from the backend catalogue and drops ids it has no entry for", () => {
    const items = planFromBackend({ ...PLAN, questions: [{ questionId: "members.confirm", memberId: "m1", memberLabel: "You" }, { questionId: "unknown.id", memberId: null, memberLabel: null }] } as never);
    expect(items).toHaveLength(1);
    expect(items[0].key).toBe("members.confirm:m1");
    expect(items[0].member).toEqual({ id: "m1", label: "You" });
    expect(items[0].question.prompt.en).toBe(ENTRY.prompt.en);
  });
});
