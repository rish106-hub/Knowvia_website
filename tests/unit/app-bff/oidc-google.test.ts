// Run V1b: real Google OIDC (code flow + PKCE) against a LOCAL FAKE provider. No network. Fake secrets only.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openCookie } from "@/server/app/cookie-crypto";
import { loadAppConfig } from "@/server/app/env";
import { createGoogleOidc, GOOGLE_DISCOVERY_URL, pkceChallenge } from "@/server/app/oidc-google";
import { redirectAllowed } from "@/server/app/handler";
import { applyCookies, baseEnv, cookieHeader, FAKE_BACKEND_TOKEN, FAKE_BOOTSTRAP, FAKE_IDENTITY_TOKEN, FAKE_SECRET, request, signIn } from "./helpers";
import { AUTH_ENDPOINT, callbackGoogle, callbackGoogleRaw, CLIENT_ID, CLIENT_SECRET, createFakeGoogle, fullSignIn, googleEnv, identityCalls, JWKS_URI, makeGoogleApp, REDIRECT_URL, startGoogle, TOKEN_ENDPOINT } from "./google-support";

const FAILED = "/app/sign-in?reason=failed";
let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => errors.mockRestore());

const sessionCookieSet = (cookies: string[]) => cookies.some((cookie) => /^kv_session=[^;]+/.test(cookie));
const oidcCleared = (cookies: string[]) => cookies.some((cookie) => /^kv_oidc=;/.test(cookie) && /Max-Age=0/.test(cookie));

/** Every failed callback must look the same and leave nothing behind. */
async function expectRejected(ctx: ReturnType<typeof makeGoogleApp>, result: Awaited<ReturnType<typeof callbackGoogle>>, reason?: string) {
  const secrets: string[] = [];
  expect(result.response.status).toBe(302);
  expect(result.location).toBe(FAILED);
  expect(sessionCookieSet(result.setCookies)).toBe(false);
  expect(oidcCleared(result.setCookies)).toBe(true);
  expect(identityCalls(ctx.backend)).toHaveLength(0);
  // The fixed reason code is logged (never the token); it proves which rule fired.
  if (reason) expect(errors.mock.calls.flat().join("\n")).toContain(`oidc:${reason}`);
  const text = await result.response.text();
  for (const secret of [ctx.google.control.idToken, CLIENT_SECRET, ...secrets].filter(Boolean)) {
    expect(`${result.location}${text}${result.setCookies.join("\n")}`).not.toContain(secret);
    expect(errors.mock.calls.flat().join("\n")).not.toContain(secret);
  }
}

describe("oidc.google.start", () => {
  it("302s to the discovered Google URL with PKCE S256, state, nonce and the sealed kv_oidc cookie", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx, new Map(), "?mode=E");
    expect(started.response.status).toBe(302);
    expect(started.response.headers.get("cache-control")).toBe("no-store");
    expect(`${started.url!.origin}${started.url!.pathname}`).toBe(AUTH_ENDPOINT);
    const q = started.url!.searchParams;
    expect(Object.fromEntries(q)).toMatchObject({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URL,
      scope: "openid email profile",
      code_challenge_method: "S256",
      prompt: "select_account",
    });
    expect(q.get("state")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(q.get("nonce")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(q.get("state")).not.toBe(q.get("nonce"));
    expect(started.url!.toString()).not.toContain(CLIENT_SECRET);

    const header = started.response.headers.getSetCookie().find((cookie) => cookie.startsWith("kv_oidc="))!;
    expect(header).toMatch(/HttpOnly/);
    expect(header).toMatch(/SameSite=Lax/);
    expect(header).toMatch(/Max-Age=600/);
    expect(header).toMatch(/Path=\//);
    const opened = openCookie<{ state: string; nonce: string; verifier: string; mode: string }>("oidc", started.jar.get("kv_oidc")!, FAKE_SECRET, Date.now());
    expect(opened.ok && opened.value.state).toBe(q.get("state"));
    expect(opened.ok && opened.value.nonce).toBe(q.get("nonce"));
    expect(opened.ok && opened.value.mode).toBe("E");
    // The challenge is the S256 hash of the verifier that only the cookie holds.
    expect(q.get("code_challenge")).toBe(pkceChallenge(opened.ok ? opened.value.verifier : ""));
    // The cookie is not readable as another kind (AAD binds the kind).
    expect(openCookie("session", started.jar.get("kv_oidc")!, FAKE_SECRET, Date.now()).ok).toBe(false);
    expect(openCookie("state", started.jar.get("kv_oidc")!, FAKE_SECRET, Date.now()).ok).toBe(false);
  });

  it("uses a fresh state, nonce and verifier every time, and caches discovery per process", async () => {
    const ctx = makeGoogleApp();
    const one = await startGoogle(ctx);
    const two = await startGoogle(ctx);
    expect(one.state).not.toBe(two.state);
    expect(one.nonce).not.toBe(two.nonce);
    expect(ctx.google.calls.filter((call) => call.url === GOOGLE_DISCOVERY_URL)).toHaveLength(1);
  });

  it("an unknown mode is stored as P and a missing one too", async () => {
    const ctx = makeGoogleApp();
    for (const [query, expected] of [["?mode=zzz", "P"], ["", "P"], ["?mode=e", "P"], ["?mode=A", "A"]] as const) {
      const started = await startGoogle(ctx, new Map(), query);
      const opened = openCookie<{ mode: string }>("oidc", started.jar.get("kv_oidc")!, FAKE_SECRET, Date.now());
      expect(opened.ok && opened.value.mode).toBe(expected);
    }
  });

  it("a discovery failure redirects to the failed screen and sets no flow cookie", async () => {
    const ctx = makeGoogleApp();
    ctx.google.control.discoveryStatus = 503;
    const started = await startGoogle(ctx);
    expect(started.location).toBe(FAILED);
    expect(started.jar.has("kv_oidc")).toBe(false);
  });
});

describe("oidc.google.callback: a valid flow", () => {
  it("302s to /app, sets kv_session, clears kv_oidc and calls the backend once with the normalised issuer", async () => {
    const ctx = makeGoogleApp();
    const { jar, started, done } = await fullSignIn(ctx);
    expect(done.response.status).toBe(302);
    expect(done.location).toBe("/app");
    expect(done.response.headers.get("cache-control")).toBe("no-store");
    expect(done.response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(sessionCookieSet(done.setCookies)).toBe(true);
    expect(oidcCleared(done.setCookies)).toBe(true);
    expect(jar.has("kv_oidc")).toBe(false);
    const session = done.setCookies.find((cookie) => cookie.startsWith("kv_session="))!;
    expect(session).toMatch(/HttpOnly/);
    expect(session).toMatch(/SameSite=Lax/);

    const calls = identityCalls(ctx.backend);
    expect(calls).toHaveLength(1);
    expect(calls[0].headers.authorization).toBe(`Bearer ${FAKE_IDENTITY_TOKEN}`);
    expect(calls[0].body).toEqual({ issuer: "https://accounts.google.com", subject: "synthetic-google-subject-0001", displayName: "Asha Synthetic", contactEmail: "asha@example.test" });

    // The token request carried the code, the PKCE verifier and the client secret to Google, server to server.
    const token = ctx.google.tokenCalls();
    expect(token).toHaveLength(1);
    const form = new URLSearchParams(token[0].body ?? "");
    expect(form.get("grant_type")).toBe("authorization_code");
    expect(form.get("code")).toBe("fake-auth-code-1");
    expect(form.get("client_secret")).toBe(CLIENT_SECRET);
    expect(form.get("redirect_uri")).toBe(REDIRECT_URL);
    expect(pkceChallenge(form.get("code_verifier")!)).toBe(started.url!.searchParams.get("code_challenge"));
    expect(token[0].redirect).toBe("error");

    // Neither the ID token, the access token nor the client secret reaches the browser or the backend.
    const everything = [done.location, ...done.setCookies, JSON.stringify(calls[0])].join("\n");
    expect(everything).not.toContain(ctx.google.control.idToken);
    expect(everything).not.toContain("fake-access-token-must-never-be-kept");
    expect(everything).not.toContain(CLIENT_SECRET);
    expect(ctx.backend.calls.map((call) => JSON.stringify(call.body ?? "")).join("\n")).not.toContain(ctx.google.control.idToken);
    expect(errors.mock.calls.flat().join("\n")).not.toContain(ctx.google.control.idToken);

    // The session works as a normal one and reports Google as the provider.
    const view = await ctx.app.dispatch("session.get", request("/api/app/session", { jar, csrf: false }));
    expect(await view.json()).toMatchObject({ authenticated: true, identity: { provider: "google" } });
  });

  it("an accounts.google.com issuer is also sent to the backend as https://accounts.google.com", async () => {
    const ctx = makeGoogleApp();
    const { done } = await fullSignIn(ctx, new Map(), { iss: "accounts.google.com" });
    expect(done.location).toBe("/app");
    expect(identityCalls(ctx.backend)[0].body).toMatchObject({ issuer: "https://accounts.google.com" });
  });

  it("the e-mail is never the lookup key: the same subject with another e-mail is the same adult; the same e-mail with another subject is not", async () => {
    const ctx = makeGoogleApp();
    const first = await fullSignIn(ctx, new Map(), { sub: "subject-A", email: "one@example.test" });
    const again = await fullSignIn(ctx, new Map(), { sub: "subject-A", email: "two@example.test" });
    const other = await fullSignIn(ctx, new Map(), { sub: "subject-B", email: "one@example.test" });
    for (const result of [first, again, other]) expect(result.done.location).toBe("/app");
    expect(ctx.backend.identities.size).toBe(2);
    const calls = identityCalls(ctx.backend);
    expect(calls.map((call) => (call.body as { subject: string }).subject)).toEqual(["subject-A", "subject-A", "subject-B"]);
    // The same subject came back as the same household.
    const household = async (jar: Map<string, string>) => (await (await ctx.app.dispatch("session.get", request("/api/app/session", { jar, csrf: false }))).json()).householdId;
    expect(await household(first.jar)).toBe(await household(again.jar));
    expect(await household(first.jar)).not.toBe(await household(other.jar));
  });

  it("an e-mail Google has not verified is not sent, and an unusable name falls back to a plain one", async () => {
    const ctx = makeGoogleApp();
    await fullSignIn(ctx, new Map(), { email_verified: false, name: "<<>>" });
    expect(identityCalls(ctx.backend)[0].body).toEqual({ issuer: "https://accounts.google.com", subject: "synthetic-google-subject-0001", displayName: "CoverSaath user" });
  });

  it("a re-sign-in revokes the previous backend session", async () => {
    const ctx = makeGoogleApp();
    const { jar } = await signIn(ctx);
    expect(ctx.backend.revoked.has(FAKE_BACKEND_TOKEN)).toBe(false);
    const { done } = await fullSignIn(ctx, jar);
    expect(done.location).toBe("/app");
    expect(ctx.backend.revoked.has(FAKE_BACKEND_TOKEN)).toBe(true);
  });

  it("a stale previous session (already gone on the backend) does not block sign-in", async () => {
    const ctx = makeGoogleApp();
    const { jar } = await signIn(ctx);
    ctx.backend.revoked.add(FAKE_BACKEND_TOKEN);
    const { done } = await fullSignIn(ctx, jar);
    expect(done.location).toBe("/app");
    expect(sessionCookieSet(done.setCookies)).toBe(true);
  });

  it("if the previous session cannot be revoked, no cookie is issued and the new backend session is released", async () => {
    const ctx = makeGoogleApp();
    const { jar } = await signIn(ctx);
    ctx.backend.control.failNext.push({ match: /POST \/api\/v1\/sessions\/current\/revoke/, respond: () => new Error("down") });
    const { done } = await fullSignIn(ctx, jar);
    expect(done.location).toBe(FAILED);
    expect(sessionCookieSet(done.setCookies)).toBe(false);
    expect(ctx.backend.revoked.size).toBe(1);
    expect([...ctx.backend.revoked][0]).toMatch(/^fake-identity-session-token-/);
  });
});

describe("oidc.google.callback: every bad flow is 302 ?reason=failed with no session", () => {
  it("state mismatch", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce));
    const result = await callbackGoogle(ctx, started.jar, { code: "c", state: "x".repeat(43) });
    await expectRejected(ctx, result);
    expect(ctx.google.tokenCalls()).toHaveLength(0);
  });

  it("missing or repeated state or code, an oversized code, and an error from Google: refused before any call to Google", async () => {
    const ctx = makeGoogleApp();
    // The query is written by hand so repeated parameters survive. `$S` is this flow's real state.
    const cases: Array<[string, string]> = [
      ["no state", "code=c"],
      ["no code", "state=$S"],
      ["error from Google", "error=access_denied&state=$S"],
      ["code repeated", "code=a&code=b&state=$S"],
      ["state repeated (first one right)", "code=c&state=$S&state=other"],
      ["state repeated (second one right)", "code=c&state=other&state=$S"],
      ["code of 3000 characters", `code=${"c".repeat(3000)}&state=$S`],
      ["empty code", "code=&state=$S"],
    ];
    for (const [label, template] of cases) {
      const started = await startGoogle(ctx);
      // A fully valid ID token is ready, so only the query guard stands between this request and a successful sign-in.
      ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce));
      const result = await callbackGoogleRaw(ctx, started.jar, template.replaceAll("$S", started.state));
      expect(result.location, label).toBe(FAILED);
      expect(sessionCookieSet(result.setCookies), label).toBe(false);
      expect(oidcCleared(result.setCookies), label).toBe(true);
      expect(ctx.google.tokenCalls(), label).toHaveLength(0);
    }
    expect(identityCalls(ctx.backend)).toHaveLength(0);
    // Control: the same shape with one state and one short code does sign in.
    const good = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(good.nonce));
    expect((await callbackGoogleRaw(ctx, good.jar, `code=c&state=${good.state}`)).location).toBe("/app");
  });

  it("missing kv_oidc (no flow in this browser, or a replayed callback)", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce));
    const result = await callbackGoogle(ctx, new Map(), { code: "c", state: started.state });
    await expectRejected(ctx, result);
    expect(ctx.google.tokenCalls()).toHaveLength(0);
  });

  it("a callback cannot be replayed: the flow cookie is cleared after the first use", async () => {
    const ctx = makeGoogleApp();
    const { jar, started, done } = await fullSignIn(ctx);
    expect(done.location).toBe("/app");
    expect(jar.has("kv_oidc")).toBe(false);
    const replay = await callbackGoogle(ctx, jar, { code: "fake-auth-code-1", state: started.state });
    expect(replay.location).toBe(FAILED);
    expect(sessionCookieSet(replay.setCookies)).toBe(false);
    expect(identityCalls(ctx.backend)).toHaveLength(1);
    expect(ctx.google.tokenCalls()).toHaveLength(1);
  });

  it("a flow cookie that has expired (more than 10 minutes) is refused", async () => {
    let now = Date.now();
    const ctx = makeGoogleApp({ now: () => now });
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce));
    now += 601_000;
    // The browser would have dropped it; a copy sent anyway is refused by the seal.
    const result = await callbackGoogle(ctx, started.jar, { code: "c", state: started.state });
    await expectRejected(ctx, result);
  });

  it("a tampered flow cookie", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce));
    const value = started.jar.get("kv_oidc")!;
    started.jar.set("kv_oidc", value.slice(0, -2) + (value.endsWith("AA") ? "BB" : "AA"));
    await expectRejected(ctx, await callbackGoogle(ctx, started.jar, { code: "c", state: started.state }));
  });

  it("nonce mismatch", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims("some-other-nonce-value-0123456789abcdefghij"));
    await expectRejected(ctx, await callbackGoogle(ctx, started.jar, { code: "c", state: started.state }), "nonce");
  });

  it("wrong audience", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce, { aud: "someone-elses-client-id.apps.example.test" }));
    await expectRejected(ctx, await callbackGoogle(ctx, started.jar, { code: "c", state: started.state }), "audience");
  });

  it("expired token", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    const now = Math.floor(Date.now() / 1000);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce, { iat: now - 7200, exp: now - 3600 }));
    await expectRejected(ctx, await callbackGoogle(ctx, started.jar, { code: "c", state: started.state }), "expired");
  });

  it("alg none (unsigned)", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce), { alg: "none", unsigned: true });
    await expectRejected(ctx, await callbackGoogle(ctx, started.jar, { code: "c", state: started.state }), "alg");
  });

  it("HS256 signed with the public key as the secret", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce), { alg: "HS256" });
    await expectRejected(ctx, await callbackGoogle(ctx, started.jar, { code: "c", state: started.state }), "alg");
  });

  it("signed by another key, even with a known kid", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce), { key: ctx.google.otherKey, kid: ctx.google.control.keys[0].kid });
    await expectRejected(ctx, await callbackGoogle(ctx, started.jar, { code: "c", state: started.state }), "signature");
  });

  it("unknown kid", async () => {
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce), { key: ctx.google.otherKey });
    await expectRejected(ctx, await callbackGoogle(ctx, started.jar, { code: "c", state: started.state }), "kid");
  });

  it("no kid, a wrong issuer, an issued-at far in the future and a missing subject", async () => {
    const cases: Array<[string, Record<string, unknown>, { kid?: null }]> = [
      ["no kid", {}, { kid: null }],
      ["wrong issuer", { iss: "https://evil.example.test" }, {}],
      ["issuer without scheme but different", { iss: "accounts.google.com.evil.test" }, {}],
      ["issued in the future", { iat: Math.floor(Date.now() / 1000) + 600 }, {}],
      ["empty subject", { sub: "" }, {}],
      ["subject too long", { sub: "s".repeat(256) }, {}],
      ["audience as a list", { aud: [CLIENT_ID] }, {}],
      ["missing exp", { exp: undefined }, {}],
    ];
    for (const [label, overrides, opts] of cases) {
      const ctx = makeGoogleApp();
      const started = await startGoogle(ctx);
      ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce, overrides), opts);
      const result = await callbackGoogle(ctx, started.jar, { code: "c", state: started.state });
      expect(result.location, label).toBe(FAILED);
      expect(identityCalls(ctx.backend), label).toHaveLength(0);
    }
  });

  it("a token endpoint failure, and a response with no id_token", async () => {
    for (const mutate of [(g: ReturnType<typeof createFakeGoogle>) => (g.control.tokenStatus = 400), (g: ReturnType<typeof createFakeGoogle>) => (g.control.tokenStatus = 500)]) {
      const ctx = makeGoogleApp();
      const started = await startGoogle(ctx);
      mutate(ctx.google);
      await expectRejected(ctx, await callbackGoogle(ctx, started.jar, { code: "c", state: started.state }));
      expect(ctx.google.tokenCalls()).toHaveLength(1); // no retry
    }
    const ctx = makeGoogleApp();
    const started = await startGoogle(ctx);
    ctx.google.control.idToken = "";
    await expectRejected(ctx, await callbackGoogle(ctx, started.jar, { code: "c", state: started.state }));
  });

  it("the backend refusing the identity (401 for a wrong credential) fails the sign-in without detail", async () => {
    const ctx = makeGoogleApp({ env: googleEnv({ COVERSAATH_IDENTITY_TOKEN: "another-identity-credential-0123456789abcdef" }) });
    const { done } = await fullSignIn(ctx);
    expect(done.location).toBe(FAILED);
    expect(sessionCookieSet(done.setCookies)).toBe(false);
  });
});

describe("key rotation", () => {
  it("an unknown kid re-reads the key set once, but not within a minute of the last read", async () => {
    let now = Date.now();
    const ctx = makeGoogleApp({ now: () => now });
    const first = await fullSignIn(ctx);
    expect(first.done.location).toBe("/app");
    const rotated = ctx.google.newKey("fake-key-2");
    ctx.google.control.keys = [rotated];

    // Too soon: still the cached set, so the new key is unknown.
    now += 10_000;
    const early = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(early.nonce), { key: rotated });
    expect((await callbackGoogle(ctx, early.jar, { code: "c", state: early.state })).location).toBe(FAILED);
    expect(ctx.google.calls.filter((call) => call.url === JWKS_URI)).toHaveLength(1);

    now += 61_000;
    const later = await startGoogle(ctx);
    ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(later.nonce), { key: rotated });
    expect((await callbackGoogle(ctx, later.jar, { code: "c", state: later.state })).location).toBe("/app");
    expect(ctx.google.calls.filter((call) => call.url === JWKS_URI)).toHaveLength(2);
  });
});

describe("discovery endpoints", () => {
  it("refuses endpoints that are not https or not on a Google host", async () => {
    const bad = [
      { authorization_endpoint: "http://accounts.google.com/auth", token_endpoint: TOKEN_ENDPOINT, jwks_uri: JWKS_URI },
      { authorization_endpoint: AUTH_ENDPOINT, token_endpoint: "https://evil.example.test/token", jwks_uri: JWKS_URI },
      { authorization_endpoint: AUTH_ENDPOINT, token_endpoint: TOKEN_ENDPOINT, jwks_uri: "https://www.googleapis.com.evil.test/certs" },
      { authorization_endpoint: "https://user:pw@accounts.google.com/auth", token_endpoint: TOKEN_ENDPOINT, jwks_uri: JWKS_URI },
    ];
    for (const endpoints of bad) {
      const oidc = createGoogleOidc({
        now: Date.now,
        fetch: async () => new Response(JSON.stringify({ issuer: "https://accounts.google.com", ...endpoints }), { status: 200 }),
      });
      await expect(oidc.discover()).rejects.toMatchObject({ name: "OidcError", reason: "discovery" });
    }
  });

  it("refuses a discovery document for another issuer", async () => {
    const ctx = makeGoogleApp();
    ctx.google.control.discoveryIssuer = "https://evil.example.test";
    expect((await startGoogle(ctx)).location).toBe(FAILED);
  });

  it("times out a hung discovery request after 5 seconds, without a network call", async () => {
    vi.useFakeTimers();
    try {
      const oidc = createGoogleOidc({
        now: Date.now,
        fetch: (_url, init) => new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
      });
      const pending = expect(oidc.discover()).rejects.toMatchObject({ reason: "discovery" });
      await vi.advanceTimersByTimeAsync(5_001);
      await pending;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("configuration", () => {
  it("env missing: both routes answer 501 and the connectors list hides Google", async () => {
    for (const env of [baseEnv(), googleEnv({ GOOGLE_OIDC_CLIENT_SECRET: undefined }), googleEnv({ COVERSAATH_IDENTITY_TOKEN: undefined }), googleEnv({ APP_OIDC_REDIRECT_URL: undefined }), googleEnv({ GOOGLE_OIDC_CLIENT_ID: "" })]) {
      const ctx = makeGoogleApp({ env });
      const start = await ctx.app.dispatch("oidc.google.start", request("/api/app/auth/google/start", { csrf: false }));
      expect(start.status).toBe(501);
      expect(start.headers.get("location")).toBeNull();
      expect((await start.json()).error.code).toBe("IDENTITY_NOT_IMPLEMENTED");
      const callback = await ctx.app.dispatch("oidc.google.callback", request("/api/app/auth/google/callback?code=c&state=s", { csrf: false }));
      expect(callback.status).toBe(501);
      expect(callback.headers.getSetCookie()).toEqual([]);
      expect(ctx.google.calls).toHaveLength(0);
      const list = await (await ctx.app.dispatch("connectors.list", request("/api/app/connectors", { csrf: false }))).json();
      expect(list.signIn.google).toBe(false);
    }
  });

  it("configured: the connectors list offers Google", async () => {
    const ctx = makeGoogleApp();
    const list = await (await ctx.app.dispatch("connectors.list", request("/api/app/connectors", { csrf: false }))).json();
    expect(list.signIn).toEqual({ google: true, dev: true });
  });

  it("a malformed redirect URL, an identity credential equal to the bootstrap token, or an http redirect in production is a configuration error (names only)", () => {
    const names = (env: Record<string, string | undefined>) => {
      try {
        loadAppConfig(env);
        return [];
      } catch (error) {
        const fields = (error as { fields: string[] }).fields;
        expect((error as Error).message).not.toContain(CLIENT_SECRET);
        expect((error as Error).message).not.toContain(FAKE_IDENTITY_TOKEN);
        return fields;
      }
    };
    expect(names(googleEnv({ APP_OIDC_REDIRECT_URL: `${REDIRECT_URL}?x=1` }))).toEqual(["APP_OIDC_REDIRECT_URL"]);
    expect(names(googleEnv({ APP_OIDC_REDIRECT_URL: "http://localhost:3000/somewhere-else" }))).toEqual(["APP_OIDC_REDIRECT_URL"]);
    expect(names(googleEnv({ APP_OIDC_REDIRECT_URL: "http://evil.example.test:3000/api/app/auth/google/callback" }))).toEqual(["APP_OIDC_REDIRECT_URL"]);
    expect(names(googleEnv({ COVERSAATH_IDENTITY_TOKEN: FAKE_BOOTSTRAP }))).toEqual(["COVERSAATH_IDENTITY_TOKEN"]);
    expect(names(googleEnv({ NODE_ENV: "production", APP_DEV_IDENTITY: "false", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }))).toEqual(["APP_OIDC_REDIRECT_URL"]);
    expect(names(googleEnv({ NODE_ENV: "production", APP_DEV_IDENTITY: "false", NEXT_PUBLIC_SITE_URL: "https://app.example.test", APP_OIDC_REDIRECT_URL: "https://app.example.test/api/app/auth/google/callback" }))).toEqual([]);
  });

  it("POST /session with provider google never signs anyone in: 400 when configured, 501 when not", async () => {
    const configured = makeGoogleApp();
    const response = await configured.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { provider: "google", email: "x@example.test" } }));
    expect(response.status).toBe(400);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(configured.backend.calls).toHaveLength(0);
    const plain = makeGoogleApp({ env: baseEnv() });
    expect((await plain.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { provider: "google", email: "x@example.test" } }))).status).toBe(501);
    for (const provider of ["microsoft", "apple", "phone_otp"]) {
      expect((await configured.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { provider, email: "x@example.test" } }))).status).toBe(501);
    }
  });

  it("the dev provider still works beside Google", async () => {
    const ctx = makeGoogleApp();
    const { response } = await signIn(ctx);
    expect(response.status).toBe(201);
    const jar = new Map<string, string>();
    applyCookies(jar, response);
    expect(cookieHeader(jar)).toContain("kv_session=");
  });
});

describe("redirect guard", () => {
  const trusted = AUTH_ENDPOINT;
  it("allows /app paths and the discovered authorization URL with its query only", () => {
    expect(redirectAllowed("/app", null)).toBe(true);
    expect(redirectAllowed("/app/sign-in?reason=failed", null)).toBe(true);
    expect(redirectAllowed(`${trusted}?client_id=x&state=y`, trusted)).toBe(true);
  });

  it("refuses everything else", () => {
    const refused: Array<[string, string | null]> = [
      ["//evil.example.test", null],
      ["/\\evil.example.test", null],
      ["/apple", null],
      ["/application", null],
      ["/", null],
      ["/app\r\nSet-Cookie: x=1", null],
      ["https://evil.example.test/app", null],
      ["https://accounts.google.com/o/oauth2/v2/auth", trusted], // no query
      [`${trusted}/../evil?x=1`, trusted],
      [`${trusted}@evil.example.test/?x=1`, trusted],
      [`https://evil.example.test/?u=${trusted}?x`, trusted],
      [`${trusted}?x=1`, null], // external redirect without a discovered endpoint
      ["javascript:alert(1)", trusted],
    ];
    for (const [redirect, endpoint] of refused) expect(redirectAllowed(redirect, endpoint), redirect).toBe(false);
  });
});
