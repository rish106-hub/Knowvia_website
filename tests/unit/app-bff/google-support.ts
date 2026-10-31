// Test support for Google sign-in (V1b): a LOCAL FAKE OIDC provider (discovery, JWKS, token endpoint) behind an injected fetch.
// No network. The host names below look like Google's only so the production endpoint checks run unchanged; nothing is contacted.
// Keys are generated per test run. Everything here is synthetic.
import { createHmac, generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import type { FetchLike } from "@/server/app/backend-client";
import { GOOGLE_DISCOVERY_URL } from "@/server/app/oidc-google";
import type { EnvSource } from "@/server/app/env";
import { applyCookies, baseEnv, FAKE_IDENTITY_TOKEN, makeApp, ORIGIN, request, type FakeBackend, type Jar } from "./helpers";

export const CLIENT_ID = "fake-client-id-123456.apps.example.test";
export const CLIENT_SECRET = "fake-google-client-secret-0123456789ABCDEF";
export const REDIRECT_URL = `${ORIGIN}/api/app/auth/google/callback`;
export const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";

export const googleEnv = (extra: EnvSource = {}): EnvSource =>
  baseEnv({
    GOOGLE_OIDC_CLIENT_ID: CLIENT_ID,
    GOOGLE_OIDC_CLIENT_SECRET: CLIENT_SECRET,
    APP_OIDC_REDIRECT_URL: REDIRECT_URL,
    COVERSAATH_IDENTITY_TOKEN: FAKE_IDENTITY_TOKEN,
    ...extra,
  });

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

export type Claims = Record<string, unknown>;

export type KeyPair = { kid: string; privateKey: KeyObject; publicKey: KeyObject };

function newKey(kid: string): KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return { kid, privateKey, publicKey };
}

const jwkOf = (key: KeyPair) => ({ ...key.publicKey.export({ format: "jwk" }), kid: key.kid, use: "sig", alg: "RS256" });

export function createFakeGoogle(options: { now?: () => number } = {}) {
  const clock = options.now ?? (() => Date.now());
  const control = {
    keys: [newKey("fake-key-1")],
    discoveryStatus: 200,
    tokenStatus: 200,
    /** The id_token the token endpoint returns next (set by the test). */
    idToken: "" as string,
    /** Extra fields in the token response, to prove they are ignored. */
    tokenExtras: { access_token: "fake-access-token-must-never-be-kept", token_type: "Bearer" } as Record<string, unknown>,
    discoveryIssuer: "https://accounts.google.com",
  };
  const calls: Array<{ url: string; method: string; body: string | null; redirect: unknown }> = [];
  const other = newKey("fake-key-other");

  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  const fetch: FetchLike = async (url, init) => {
    calls.push({ url, method: (init?.method ?? "GET").toUpperCase(), body: typeof init?.body === "string" ? init.body : null, redirect: init?.redirect });
    if (url === GOOGLE_DISCOVERY_URL) {
      if (control.discoveryStatus !== 200) return json(control.discoveryStatus, {});
      return json(200, { issuer: control.discoveryIssuer, authorization_endpoint: AUTH_ENDPOINT, token_endpoint: TOKEN_ENDPOINT, jwks_uri: JWKS_URI });
    }
    if (url === JWKS_URI) return json(200, { keys: control.keys.map(jwkOf) });
    if (url === TOKEN_ENDPOINT && (init?.method ?? "GET").toUpperCase() === "POST") {
      if (control.tokenStatus !== 200) return json(control.tokenStatus, { error: "invalid_grant", error_description: "fake" });
      return json(200, { id_token: control.idToken, ...control.tokenExtras });
    }
    throw new Error(`fake google: unexpected request ${url}`);
  };

  /** A valid claim set for a nonce. Override fields to break one rule at a time. */
  const claims = (nonce: string, overrides: Claims = {}): Claims => {
    const nowSeconds = Math.floor(clock() / 1000);
    return {
      iss: "https://accounts.google.com",
      aud: CLIENT_ID,
      sub: "synthetic-google-subject-0001",
      iat: nowSeconds,
      exp: nowSeconds + 3600,
      nonce,
      email: "asha@example.test",
      email_verified: true,
      name: "Asha Synthetic",
      ...overrides,
    };
  };

  /** Signs claims. `alg` and `kid` default to a valid RS256 token from the first key. */
  const mint = (payload: Claims, opts: { alg?: string; kid?: string | null; key?: KeyPair; unsigned?: boolean } = {}) => {
    const key = opts.key ?? control.keys[0];
    const header: Record<string, unknown> = { alg: opts.alg ?? "RS256", typ: "JWT" };
    if (opts.kid !== null) header.kid = opts.kid ?? key.kid;
    const signingInput = `${b64(header)}.${b64(payload)}`;
    if (opts.unsigned) return `${signingInput}.`;
    if (header.alg === "HS256") {
      // The classic confusion attack: the public key used as an HMAC secret.
      const secret = key.publicKey.export({ format: "pem", type: "spki" });
      return `${signingInput}.${createHmac("sha256", secret).update(signingInput).digest("base64url")}`;
    }
    return `${signingInput}.${sign("RSA-SHA256", Buffer.from(signingInput), key.privateKey).toString("base64url")}`;
  };

  return { fetch, calls, control, claims, mint, otherKey: other, newKey, tokenCalls: () => calls.filter((call) => call.url === TOKEN_ENDPOINT) };
}

export type FakeGoogle = ReturnType<typeof createFakeGoogle>;

/** App wired with the fake backend and fake Google. */
export function makeGoogleApp(options: { env?: EnvSource; backend?: FakeBackend; google?: FakeGoogle; now?: () => number } = {}) {
  const google = options.google ?? createFakeGoogle({ now: options.now });
  const ctx = makeApp({ env: options.env ?? googleEnv(), backend: options.backend, now: options.now, oidcFetch: google.fetch });
  return { ...ctx, google };
}

export type GoogleApp = ReturnType<typeof makeGoogleApp>;

/** GET /api/app/auth/google/start. Returns the response, the parsed Google URL and the flow cookie jar. */
export async function startGoogle(ctx: GoogleApp, jar: Jar = new Map(), query = "") {
  const response = await ctx.app.dispatch("oidc.google.start", request(`/api/app/auth/google/start${query}`, { jar, csrf: false }));
  applyCookies(jar, response);
  const location = response.headers.get("location");
  const url = location && /^https?:/.test(location) ? new URL(location) : null;
  return { response, jar, location, url, state: url?.searchParams.get("state") ?? "", nonce: url?.searchParams.get("nonce") ?? "" };
}

/** GET /api/app/auth/google/callback with whatever query the test wants. No CSRF headers: a browser cannot add them here. */
export async function callbackGoogle(ctx: GoogleApp, jar: Jar, query: Record<string, string | undefined>) {
  const search = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined));
  const response = await ctx.app.dispatch("oidc.google.callback", request(`/api/app/auth/google/callback?${search}`, { jar, csrf: false }));
  const setCookies = response.headers.getSetCookie();
  applyCookies(jar, response);
  return { response, setCookies, location: response.headers.get("location") };
}

/** Like callbackGoogle, but the query string is used as written, so repeated parameters survive. */
export async function callbackGoogleRaw(ctx: GoogleApp, jar: Jar, rawQuery: string) {
  const response = await ctx.app.dispatch("oidc.google.callback", request(`/api/app/auth/google/callback?${rawQuery}`, { jar, csrf: false }));
  const setCookies = response.headers.getSetCookie();
  applyCookies(jar, response);
  return { response, setCookies, location: response.headers.get("location") };
}

/** A whole good sign-in: start, mint a token for the nonce, callback. */
export async function fullSignIn(ctx: GoogleApp, jar: Jar = new Map(), overrides: Claims = {}, query = "") {
  const started = await startGoogle(ctx, jar, query);
  ctx.google.control.idToken = ctx.google.mint(ctx.google.claims(started.nonce, overrides));
  const done = await callbackGoogle(ctx, jar, { code: "fake-auth-code-1", state: started.state });
  return { jar, started, done };
}

export const identityCalls = (backend: FakeBackend) => backend.calls.filter((call) => call.path === "/api/v1/identity-sessions");
