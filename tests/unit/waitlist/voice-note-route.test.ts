import { describe, expect, it, vi } from "vitest";
import { MemoryRateLimiter } from "@/lib/server/request-guards";
import { createVoiceNoteHandler, type VoiceNoteDeps } from "@/lib/server/voice-note-handler";
import { VOICE_NOTE_CONSENT_VERSION } from "@/lib/server/waitlist-store.mjs";
import { fakePool } from "./fake-pool";

function setup(overrides: Partial<VoiceNoteDeps> = {}, pool = fakePool()) {
  const deps: VoiceNoteDeps = {
    getPool: () => pool,
    env: { NODE_ENV: "test", VOICE_NOTES_ENABLED: "true" },
    limiter: new MemoryRateLimiter(4, 60_000),
    devCounter: { notes: 0 },
    logError: vi.fn(),
    ...overrides,
  };
  return { POST: createVoiceNoteHandler(deps), pool, deps };
}

function upload(fields: Record<string, string> = {}, audio: Blob | null = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" })) {
  const form = new FormData();
  const values = { email: "ravi@example.test", consent: "yes", duration: "12", ...fields };
  for (const [key, value] of Object.entries(values)) form.append(key, value);
  if (audio) form.append("audio", audio, "voice-note.webm");
  return new Request("http://localhost/api/voice-note", { method: "POST", headers: { "x-real-ip": "203.0.113.5" }, body: form });
}

describe("POST /api/voice-note", () => {
  it("stays disabled unless VOICE_NOTES_ENABLED is exactly true", async () => {
    const { POST, pool } = setup({ env: { NODE_ENV: "test", VOICE_NOTES_ENABLED: "1" } });
    expect((await POST(upload())).status).toBe(404);
    expect(pool.calls).toHaveLength(0);
  });

  it("stores the note in knowvia_web with the consent version", async () => {
    const { POST, pool } = setup();
    expect((await POST(upload())).status).toBe(201);
    expect(pool.calls[0].text).toContain("INSERT INTO knowvia_web.voice_notes");
    expect(pool.calls[0].values?.[4]).toBe(VOICE_NOTE_CONSENT_VERSION);
    expect(pool.calls[0].values?.[5]).toBe("website:voice-note");
  });

  it("requires consent and a real audio file", async () => {
    const { POST, pool } = setup();
    expect((await POST(upload({ consent: "no" }))).status).toBe(400);
    expect((await POST(upload({}, null))).status).toBe(400);
    expect((await POST(upload({}, new Blob(["x"], { type: "text/plain" })))).status).toBe(400);
    expect(pool.calls).toHaveLength(0);
  });

  it("answers 429 when the per-email database throttle refuses the insert", async () => {
    const { POST } = setup({}, fakePool(() => ({ rows: [], rowCount: 0 })));
    expect((await POST(upload())).status).toBe(429);
  });

  it("hides driver detail on storage failure", async () => {
    const { POST } = setup({}, fakePool(() => { throw Object.assign(new Error("connection to db.example.test refused"), { code: "ECONNREFUSED" }); }));
    const res = await POST(upload());
    expect(res.status).toBe(503);
    expect(await res.text()).not.toMatch(/example\.test|ECONNREFUSED/);
  });
});
