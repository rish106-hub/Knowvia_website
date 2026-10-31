// Run V1b review fix: if something throws AFTER the callback issued a backend session, the flow cookie is still cleared and the
// session that will never reach the browser is released on the backend. Fake backend and fake Google only.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fullSignIn, makeGoogleApp } from "./google-support";

// The pipeline seals the state cookie after the route returns. Make that one step fail on demand.
const control = vi.hoisted(() => ({ failState: false }));
vi.mock("@/server/app/session", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/server/app/session")>();
  return {
    ...original,
    stateCookie: (...args: Parameters<typeof original.stateCookie>) => {
      if (control.failState) throw new Error("synthetic late failure: must never be logged beyond its class name");
      return original.stateCookie(...args);
    },
  };
});

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  control.failState = false;
  errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => errors.mockRestore());

describe("a failure after the session was issued", () => {
  it("answers 500, still clears kv_oidc, sets no session cookie and revokes the new backend session", async () => {
    const ctx = makeGoogleApp();
    control.failState = true;
    const { done } = await fullSignIn(ctx);
    expect(done.response.status).toBe(500);
    expect((await done.response.json()).error.code).toBe("INTERNAL");
    expect(done.setCookies.some((cookie) => /^kv_oidc=;/.test(cookie) && /Max-Age=0/.test(cookie))).toBe(true);
    expect(done.setCookies.some((cookie) => /^kv_session=[^;]+/.test(cookie))).toBe(false);
    expect(ctx.backend.revoked.size).toBe(1);
    expect([...ctx.backend.revoked][0]).toMatch(/^fake-identity-session-token-/);
    // Only the class name is logged.
    expect(errors.mock.calls.flat().join("\n")).not.toContain("synthetic late failure");
  });

  it("a failed revoke does not change the answer", async () => {
    const ctx = makeGoogleApp();
    control.failState = true;
    ctx.backend.control.failNext.push({ match: /POST \/api\/v1\/sessions\/current\/revoke/, respond: () => new Error("down") });
    const { done } = await fullSignIn(ctx);
    expect(done.response.status).toBe(500);
    expect(done.setCookies.some((cookie) => /^kv_oidc=;/.test(cookie))).toBe(true);
  });

  it("without a late failure nothing is revoked", async () => {
    const ctx = makeGoogleApp();
    const { done } = await fullSignIn(ctx);
    expect(done.location).toBe("/app");
    expect(ctx.backend.revoked.size).toBe(0);
  });
});
