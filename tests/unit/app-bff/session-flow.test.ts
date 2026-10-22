import { describe, expect, it } from "vitest";
import { loadAppConfig } from "@/server/app/env";
import { FAKE_BACKEND_TOKEN, FAKE_BOOTSTRAP, FAKE_SECRET, ORIGIN, applyCookies, baseEnv, makeApp, request, signIn, type Jar } from "./helpers";

const readable = (response: Response) => response.headers.getSetCookie().join("\n");

describe("APP_ENABLED gate", () => {
  it("answers 404 APP_DISABLED for every method and fallback when off (default)", async () => {
    const { app } = makeApp({ env: { NODE_ENV: "test" } });
    for (const name of ["overview.get", "session.get", "session.create", "documents.upload"] as const) {
      const response = await app.dispatch(name, request("/api/app/x", { method: name === "overview.get" || name === "session.get" ? "GET" : "POST" }));
      expect(response.status).toBe(404);
      expect((await response.json()).error.code).toBe("APP_DISABLED");
    }
    const fallback = await app.fallback("not_found");
    expect(fallback.status).toBe(404);
    expect((await fallback.json()).error.code).toBe("APP_DISABLED");
    const methodFallback = await app.fallback("method_not_allowed");
    expect((await methodFallback.json()).error.code).toBe("APP_DISABLED");
  });

  it("makes no backend call while disabled", async () => {
    const ctx = makeApp({ env: {} });
    await ctx.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { email: "a@b.test" } }));
    expect(ctx.backend.calls).toHaveLength(0);
  });
});

describe("environment validation", () => {
  it("refuses APP_DEV_IDENTITY in production and short secrets", () => {
    expect(() => loadAppConfig(baseEnv({ NODE_ENV: "production", APP_DEV_IDENTITY: "true" }))).toThrow(/APP_DEV_IDENTITY/);
    expect(() => loadAppConfig(baseEnv({ APP_SESSION_SECRET: "too-short" }))).toThrow(/APP_SESSION_SECRET/);
    expect(() => loadAppConfig(baseEnv({ COVERSAATH_API_URL: "ftp://x" }))).toThrow(/COVERSAATH_API_URL/);
    expect(() => loadAppConfig(baseEnv({ COVERSAATH_BOOTSTRAP_TOKEN: "short" }))).toThrow(/COVERSAATH_BOOTSTRAP_TOKEN/);
  });

  it("never puts a secret value in the configuration error", () => {
    try {
      loadAppConfig(baseEnv({ APP_SESSION_SECRET: "short-secret-value" }));
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain("short-secret-value");
    }
  });

  it("returns APP_MISCONFIGURED (500) instead of running with bad config", async () => {
    const { app } = makeApp({ env: baseEnv({ NODE_ENV: "production", APP_DEV_IDENTITY: "true", NEXT_PUBLIC_SITE_URL: ORIGIN }) });
    const response = await app.dispatch("overview.get", request("/api/app/overview"));
    expect(response.status).toBe(500);
    expect((await response.json()).error.code).toBe("APP_MISCONFIGURED");
  });
});

describe("CSRF", () => {
  it("blocks non-GET without Origin, with a foreign Origin, or without the app header", async () => {
    const { app, backend } = makeApp();
    const attempts: Array<Record<string, string>> = [
      {},
      { origin: "https://evil.example", "x-knowvia-app": "1" },
      { origin: ORIGIN },
      { "x-knowvia-app": "1" },
      { origin: ORIGIN, "x-knowvia-app": "0" },
    ];
    for (const headers of attempts) {
      const response = await app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { email: "a@b.test" }, headers, csrf: false }));
      expect(response.status).toBe(403);
      expect((await response.json()).error.code).toBe("CSRF_BLOCKED");
    }
    expect(backend.calls).toHaveLength(0);
  });

  it("applies to DELETE /session and to authenticated mutations, but not to GET", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    const del = await ctx.app.dispatch("session.delete", request("/api/app/session", { method: "DELETE", jar, csrf: false }));
    expect(del.status).toBe(403);
    const mutate = await ctx.app.dispatch("cases.create", request("/api/app/cases", { method: "POST", json: {}, jar, csrf: false }));
    expect(mutate.status).toBe(403);
    const get = await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar }));
    expect(get.status).toBe(200);
  });
});

describe("identity providers", () => {
  it("answers 501 IDENTITY_NOT_IMPLEMENTED for otp, magic_link and oidc, and for dev when APP_DEV_IDENTITY is off", async () => {
    for (const provider of ["otp", "magic_link", "oidc"]) {
      const { app } = makeApp();
      const response = await app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { provider, email: "a@b.test" } }));
      expect(response.status).toBe(501);
      expect((await response.json()).error.code).toBe("IDENTITY_NOT_IMPLEMENTED");
    }
    const off = makeApp({ env: baseEnv({ APP_DEV_IDENTITY: "false" }) });
    const response = await off.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { email: "a@b.test" } }));
    expect(response.status).toBe(501);
    expect(off.backend.calls).toHaveLength(0);
  });
});

describe("session creation, secrecy and logout", () => {
  it("never exposes the backend token or bootstrap token in bodies or readable Set-Cookie values", async () => {
    const ctx = makeApp();
    const { jar, response } = await signIn(ctx);
    expect(response.status).toBe(201);
    const body = await response.clone().text();
    const cookies = readable(response);
    for (const secret of [FAKE_BACKEND_TOKEN, FAKE_BOOTSTRAP, FAKE_SECRET]) {
      expect(body).not.toContain(secret);
      expect(cookies).not.toContain(secret);
    }
    expect(cookies).toMatch(/kv_session=v1\./);
    expect(cookies).toMatch(/HttpOnly/);
    expect(cookies).toMatch(/SameSite=Lax/);
    expect(jar.size).toBe(2);

    // The bootstrap token is used server-side only for household creation; session calls carry the session token.
    const create = ctx.backend.calls[0];
    expect(create.headers.authorization).toBe(`Bearer ${FAKE_BOOTSTRAP}`);

    // Every later response body is also free of tokens.
    const overview = await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar }));
    const text = await overview.text();
    expect(overview.status).toBe(200);
    for (const secret of [FAKE_BACKEND_TOKEN, FAKE_BOOTSTRAP]) expect(text).not.toContain(secret);
    expect(ctx.backend.calls.at(-1)?.headers.authorization).toBe(`Bearer ${FAKE_BACKEND_TOKEN}`);
  });

  it("never uses the dev provider in production", async () => {
    const ctx = makeApp({ env: baseEnv({ NODE_ENV: "production", APP_DEV_IDENTITY: "false" }) });
    const response = await ctx.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { email: "a@b.test" } }));
    expect(response.status).toBe(501);
  });

  it("rate limits session creation per client behind one trusted proxy", async () => {
    const ctx = makeApp({ limit: 3, env: baseEnv({ APP_TRUSTED_PROXY_HOPS: "1" }) });
    const statuses: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const response = await ctx.app.dispatch(
        "session.create",
        request("/api/app/session", { method: "POST", json: { email: "a@b.test" }, headers: { "x-forwarded-for": "203.0.113.9" } }),
      );
      statuses.push(response.status);
    }
    expect(statuses).toEqual([201, 201, 201, 429, 429]);
    // Another client is unaffected.
    const other = await ctx.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { email: "a@b.test" }, headers: { "x-forwarded-for": "198.51.100.1" } }));
    expect(other.status).toBe(201);
  });

  it("GET /session reports the session without secrets, and signed-out state", async () => {
    const ctx = makeApp();
    const none = await ctx.app.dispatch("session.get", request("/api/app/session"));
    expect((await none.json()).authenticated).toBe(false);
    const { jar } = await signIn(ctx);
    const some = await ctx.app.dispatch("session.get", request("/api/app/session", { jar }));
    const body = await some.json();
    expect(body).toMatchObject({ authenticated: true, householdId: "household-1", identity: { provider: "dev", provisional: true } });
    expect(JSON.stringify(body)).not.toContain(FAKE_BACKEND_TOKEN);
  });

  it("does not issue a replacement cookie when the previous session cannot be revoked", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.failNext.push({ match: /revoke/, respond: () => new TypeError("fetch failed") });
    const replacement = await signIn(ctx, jar);
    expect(replacement.response.status).toBe(503);
    expect((await replacement.response.json()).error.code).toBe("BACKEND_REQUEST_FAILED");
    expect(replacement.response.headers.getSetCookie()).toHaveLength(0);
    const revokes = ctx.backend.calls.filter((call) => call.path === "/api/v1/sessions/current/revoke");
    expect(revokes).toHaveLength(2);
    expect(revokes[0].headers.authorization).toBe(`Bearer ${FAKE_BACKEND_TOKEN}`);
    expect(revokes[1].headers.authorization).toBe("Bearer fake-backend-session-token-00000002");
  });

  it("logout revokes on the backend and then clears both cookies", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    const response = await ctx.app.dispatch("session.delete", request("/api/app/session", { method: "DELETE", jar }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signedOut: true, backendRevoked: true });
    expect(ctx.backend.calls.at(-1)).toMatchObject({ method: "POST", path: "/api/v1/sessions/current/revoke" });
    expect(ctx.backend.revoked.has(FAKE_BACKEND_TOKEN)).toBe(true);
    applyCookies(jar, response);
    expect(jar.size).toBe(0);
    // The old token no longer works.
    const stale = await ctx.app.dispatch("overview.get", request("/api/app/overview"));
    expect(stale.status).toBe(401);
  });

  it("isolates two distinct sessions across logout, preserves the other household, and makes repeat logout safe", async () => {
    const ctx = makeApp();
    const a = await signIn(ctx);
    const b = await signIn(ctx);
    expect(a.response.status).toBe(201);
    expect(b.response.status).toBe(201);
    const overviewA = await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar: a.jar }));
    const overviewB = await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar: b.jar }));
    expect(overviewA.status).toBe(200);
    expect(overviewB.status).toBe(200);
    expect((await overviewA.json()).household.id).toBe("household-1");
    expect((await overviewB.json()).household.id).toBe("household-2");
    const tokenHeaders = ctx.backend.calls.filter((call) => call.path === "/api/v1/households/household-1" || call.path === "/api/v1/households/household-2");
    expect(tokenHeaders.map((call) => call.headers.authorization)).toEqual([
      "Bearer fake-backend-session-token-ZZZZZZZZZZZZZZZZZZZZ",
      "Bearer fake-backend-session-token-00000002",
    ]);

    const logoutA = await ctx.app.dispatch("session.delete", request("/api/app/session", { method: "DELETE", jar: a.jar }));
    expect((await logoutA.json()).backendRevoked).toBe(true);
    applyCookies(a.jar, logoutA);
    expect(a.jar.size).toBe(0);
    expect((await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar: a.jar }))).status).toBe(401);
    expect((await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar: b.jar }))).status).toBe(200);

    const logoutB = await ctx.app.dispatch("session.delete", request("/api/app/session", { method: "DELETE", jar: b.jar }));
    expect((await logoutB.json()).backendRevoked).toBe(true);
    applyCookies(b.jar, logoutB);
    expect((await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar: b.jar }))).status).toBe(401);
    const repeatedLogout = await ctx.app.dispatch("session.delete", request("/api/app/session", { method: "DELETE", jar: b.jar }));
    expect(await repeatedLogout.json()).toEqual({ signedOut: true, backendRevoked: false });
    expect(repeatedLogout.headers.getSetCookie()).toHaveLength(2);
  });

  it("logout still clears cookies when the backend is unreachable and reports backendRevoked=false", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    for (let i = 0; i < 2; i += 1) ctx.backend.control.failNext.push({ match: /revoke/, respond: () => new TypeError("fetch failed") });
    const response = await ctx.app.dispatch("session.delete", request("/api/app/session", { method: "DELETE", jar }));
    expect(await response.json()).toEqual({ signedOut: true, backendRevoked: false });
    applyCookies(jar, response);
    expect(jar.size).toBe(0);
  });

  it("surfaces SESSION_EXPIRED (and clears cookies) when the cookie has expired", async () => {
    let now = Date.now();
    const ctx = makeApp({ now: () => now });
    const { jar } = await signIn(ctx);
    now += 2 * 3600_000;
    const response = await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar }));
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("SESSION_EXPIRED");
    applyCookies(jar, response);
    expect(jar.size).toBe(0);
  });

  it("surfaces SESSION_EXPIRED when the backend rejects the token before the cookie expires", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.expireTokens = true;
    const response = await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar }));
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("SESSION_EXPIRED");
    expect(response.headers.getSetCookie().length).toBe(2);
  });

  it("rejects a tampered session cookie as unauthenticated", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    const sealed = jar.get("kv_session") as string;
    const tampered = `${sealed.slice(0, -3)}${sealed.endsWith("AAA") ? "BBB" : "AAA"}`;
    const bad: Jar = new Map(jar).set("kv_session", tampered);
    const response = await ctx.app.dispatch("overview.get", request("/api/app/overview", { jar: bad }));
    expect(response.status).toBe(401);
    expect(ctx.backend.calls.filter((c) => c.path.includes("/households/household-1"))).toHaveLength(0);
  });
});
