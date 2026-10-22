import { describe, expect, it } from "vitest";
import { openCookie, sealCookie } from "@/server/app/cookie-crypto";
import { loadSession, sessionCookie, type SessionData } from "@/server/app/session";
import { FAKE_BACKEND_TOKEN, FAKE_SECRET } from "./helpers";

const NOW = Date.parse("2026-10-21T10:00:00Z");
const payload = { token: FAKE_BACKEND_TOKEN, hello: "world" };

describe("cookie envelope (AES-256-GCM, HKDF)", () => {
  it("round-trips and never contains the plaintext", () => {
    const sealed = sealCookie("session", payload, FAKE_SECRET, NOW + 60_000);
    expect(sealed.startsWith("v1.")).toBe(true);
    expect(sealed).not.toContain(FAKE_BACKEND_TOKEN);
    expect(Buffer.from(sealed.split(".")[2], "base64url").toString("utf8")).not.toContain("world");
    const opened = openCookie<typeof payload>("session", sealed, FAKE_SECRET, NOW);
    expect(opened).toEqual({ ok: true, value: payload });
  });

  it("uses a fresh IV every time", () => {
    const a = sealCookie("session", payload, FAKE_SECRET, NOW + 60_000);
    const b = sealCookie("session", payload, FAKE_SECRET, NOW + 60_000);
    expect(a.split(".")[1]).not.toBe(b.split(".")[1]);
    expect(a).not.toBe(b);
  });

  it("rejects tampering in every segment", () => {
    const sealed = sealCookie("session", payload, FAKE_SECRET, NOW + 60_000);
    const parts = sealed.split(".");
    for (const index of [1, 2, 3]) {
      const copy = [...parts];
      const buffer = Buffer.from(copy[index], "base64url");
      buffer[0] ^= 0x01;
      copy[index] = buffer.toString("base64url");
      expect(openCookie("session", copy.join("."), FAKE_SECRET, NOW)).toEqual({ ok: false, reason: "invalid" });
    }
  });

  it("rejects a wrong version, garbage, a wrong secret and a swapped cookie kind", () => {
    const sealed = sealCookie("session", payload, FAKE_SECRET, NOW + 60_000);
    expect(openCookie("session", sealed.replace(/^v1\./, "v2."), FAKE_SECRET, NOW).ok).toBe(false);
    expect(openCookie("session", "not-a-cookie", FAKE_SECRET, NOW).ok).toBe(false);
    expect(openCookie("session", sealed, `${FAKE_SECRET}x`, NOW).ok).toBe(false);
    expect(openCookie("state", sealed, FAKE_SECRET, NOW).ok).toBe(false);
  });

  it("rejects an expired but authentic cookie, reporting expiry", () => {
    const sealed = sealCookie("session", payload, FAKE_SECRET, NOW + 1_000);
    expect(openCookie("session", sealed, FAKE_SECRET, NOW + 1_000)).toEqual({ ok: false, reason: "expired" });
    expect(openCookie("session", sealed, FAKE_SECRET, NOW + 5_000)).toEqual({ ok: false, reason: "expired" });
  });
});

describe("session loading", () => {
  const session: SessionData = {
    token: FAKE_BACKEND_TOKEN,
    expiresAt: new Date(NOW + 60_000).toISOString(),
    householdId: "household-1",
    adultId: "adult-1",
    memberId: "member-1",
  };
  const options = { secret: FAKE_SECRET, production: false, nowMs: NOW };

  it("loads a good session and sets hardened attributes", () => {
    const header = sessionCookie(session, FAKE_SECRET, false, NOW);
    expect(header).toMatch(/HttpOnly/);
    expect(header).toMatch(/SameSite=Lax/);
    expect(header).not.toMatch(/Secure/);
    expect(sessionCookie(session, FAKE_SECRET, true, NOW)).toMatch(/Secure/);
    const loaded = loadSession(header.split(";")[0], options);
    expect(loaded.session.token).toBe(FAKE_BACKEND_TOKEN);
  });

  it("throws SESSION_REQUIRED without a cookie, and clears on a tampered one", () => {
    expect(() => loadSession(null, options)).toThrowError(expect.objectContaining({ code: "SESSION_REQUIRED" }));
    expect(() => loadSession("kv_session=v1.a.b.c", options)).toThrowError(expect.objectContaining({ code: "SESSION_REQUIRED", clearSession: true }));
  });

  it("throws SESSION_EXPIRED once past expiresAt", () => {
    const header = sessionCookie(session, FAKE_SECRET, false, NOW);
    expect(() => loadSession(header.split(";")[0], { ...options, nowMs: NOW + 120_000 })).toThrowError(
      expect.objectContaining({ code: "SESSION_EXPIRED", status: 401, clearSession: true }),
    );
  });
});
