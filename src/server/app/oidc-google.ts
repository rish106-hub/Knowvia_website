// Google OpenID Connect for the BFF (run V1b). Server-only. Authorization code flow with PKCE (S256), state and nonce.
//
// What this module does: fetch and cache Google's discovery document and signing keys, build the authorization URL,
// exchange a code for an ID token, and verify that ID token (RS256 signature against Google's JWKS, issuer, audience, expiry,
// issued-at and nonce). It uses node:crypto only; no JOSE library.
//
// What it never does: keep, log or return an access token or an ID token. exchangeCode returns the ID token string to its
// one caller, which passes it to verifyIdToken and drops it. Errors carry a short reason code, never token or response text.
import { createHash, createPublicKey, timingSafeEqual, verify, type JsonWebKey } from "node:crypto";
import { z } from "zod";
import { readBoundedBody, type FetchLike } from "./backend-client";

export const GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration";
/** The one issuer value the rest of the app sees. Google may sign tokens with either spelling. */
export const GOOGLE_ISSUER = "https://accounts.google.com";
const ACCEPTED_ISSUERS = new Set([GOOGLE_ISSUER, "accounts.google.com"]);

const DISCOVERY_TIMEOUT_MS = 5_000;
const JWKS_TIMEOUT_MS = 5_000;
const TOKEN_TIMEOUT_MS = 10_000;
const MAX_DOCUMENT_BYTES = 256 * 1024;
const MAX_ID_TOKEN_CHARS = 16 * 1024;
const DISCOVERY_TTL_MS = 6 * 60 * 60 * 1000;
const JWKS_TTL_MS = 60 * 60 * 1000;
/** An unknown key id may mean Google rotated keys, so the key set is re-read, but not more often than this. */
const JWKS_MIN_REFETCH_MS = 60 * 1000;
const MAX_IAT_FUTURE_SECONDS = 60;

export type OidcFailure =
  | "discovery"
  | "jwks"
  | "token_exchange"
  | "token_malformed"
  | "alg"
  | "kid"
  | "signature"
  | "issuer"
  | "audience"
  | "expired"
  | "issued_at"
  | "nonce"
  | "subject";

/** The reason is a fixed code. It never contains a token, a code, a secret or any part of a response. */
export class OidcError extends Error {
  readonly reason: OidcFailure;
  constructor(reason: OidcFailure) {
    super(reason);
    this.name = "OidcError";
    this.reason = reason;
  }
}

const discoverySchema = z.object({
  issuer: z.string(),
  authorization_endpoint: z.string(),
  token_endpoint: z.string(),
  jwks_uri: z.string(),
});

export type OidcDiscovery = { authorizationEndpoint: string; tokenEndpoint: string; jwksUri: string };

const jwkSchema = z.object({ kty: z.string(), kid: z.string().optional(), use: z.string().optional(), alg: z.string().optional() }).loose();
const jwksSchema = z.object({ keys: z.array(jwkSchema).max(50) });
type Jwk = z.infer<typeof jwkSchema>;

const headerSchema = z.object({ alg: z.string(), kid: z.string().optional() }).loose();
const claimsSchema = z
  .object({
    iss: z.string().optional(),
    aud: z.unknown().optional(),
    sub: z.string().optional(),
    exp: z.number().optional(),
    iat: z.number().optional(),
    nonce: z.string().optional(),
    email: z.string().optional(),
    email_verified: z.boolean().optional(),
    name: z.string().optional(),
  })
  .loose();

/** What the rest of the app may know about a verified Google sign-in. No token, no raw claims. */
export type VerifiedGoogleIdentity = {
  issuer: typeof GOOGLE_ISSUER;
  subject: string;
  /** Only present when Google marks the address verified. Never a lookup key. */
  email: string | null;
  name: string | null;
};

export type GoogleOidc = ReturnType<typeof createGoogleOidc>;

type Options = { fetch: FetchLike; now: () => number; discoveryUrl?: string };

const base64url = (buffer: Buffer) => buffer.toString("base64url");
const BASE64URL = /^[A-Za-z0-9_-]+$/;

/** PKCE S256 challenge for a verifier. */
export const pkceChallenge = (verifier: string) => base64url(createHash("sha256").update(verifier).digest());

/** Constant-time string equality (false on a length difference, which leaks only the length). */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Endpoints come from a discovery document fetched over TLS, but are still held to https and a Google host. */
function googleEndpoint(value: string, discoveryIsGoogle: boolean): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new OidcError("discovery");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.hash) throw new OidcError("discovery");
  const host = url.hostname.toLowerCase();
  if (discoveryIsGoogle && !(host === "google.com" || host.endsWith(".google.com") || host === "googleapis.com" || host.endsWith(".googleapis.com"))) {
    throw new OidcError("discovery");
  }
  return url.toString();
}

export function createGoogleOidc(options: Options) {
  const discoveryUrl = options.discoveryUrl ?? GOOGLE_DISCOVERY_URL;
  const discoveryIsGoogle = discoveryUrl === GOOGLE_DISCOVERY_URL;
  let discoveryCache: { value: OidcDiscovery; at: number } | null = null;
  let discoveryInflight: Promise<OidcDiscovery> | null = null;
  let jwksCache: { keys: Jwk[]; at: number } | null = null;
  let jwksInflight: Promise<Jwk[]> | null = null;

  /** GET or POST with a hard timeout, no redirects, no cache, a capped body, and JSON out. Never logs. */
  async function requestJson(url: string, init: { method: "GET" | "POST"; body?: string; headers?: Record<string, string> }, timeoutMs: number, failure: OidcFailure): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await options.fetch(url, {
        method: init.method,
        headers: { accept: "application/json", ...init.headers },
        body: init.body,
        signal: controller.signal,
        cache: "no-store",
        redirect: "error",
      });
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        throw new OidcError(failure);
      }
      const text = await readBoundedBody(response, MAX_DOCUMENT_BYTES);
      return JSON.parse(text);
    } catch (error) {
      if (error instanceof OidcError) throw error;
      // Timeout, network failure, oversized body or unparseable JSON: one reason, no detail.
      throw new OidcError(failure);
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadDiscovery(): Promise<OidcDiscovery> {
    const parsed = discoverySchema.safeParse(await requestJson(discoveryUrl, { method: "GET" }, DISCOVERY_TIMEOUT_MS, "discovery"));
    if (!parsed.success) throw new OidcError("discovery");
    if (!ACCEPTED_ISSUERS.has(parsed.data.issuer) && discoveryIsGoogle) throw new OidcError("discovery");
    return {
      authorizationEndpoint: googleEndpoint(parsed.data.authorization_endpoint, discoveryIsGoogle),
      tokenEndpoint: googleEndpoint(parsed.data.token_endpoint, discoveryIsGoogle),
      jwksUri: googleEndpoint(parsed.data.jwks_uri, discoveryIsGoogle),
    };
  }

  /** The discovery document, cached for the life of the process (refreshed every few hours). */
  async function discover(): Promise<OidcDiscovery> {
    if (discoveryCache && options.now() - discoveryCache.at < DISCOVERY_TTL_MS) return discoveryCache.value;
    discoveryInflight ??= loadDiscovery()
      .then((value) => {
        discoveryCache = { value, at: options.now() };
        return value;
      })
      .finally(() => {
        discoveryInflight = null;
      });
    return discoveryInflight;
  }

  async function loadJwks(): Promise<Jwk[]> {
    const { jwksUri } = await discover();
    const parsed = jwksSchema.safeParse(await requestJson(jwksUri, { method: "GET" }, JWKS_TIMEOUT_MS, "jwks"));
    if (!parsed.success) throw new OidcError("jwks");
    return parsed.data.keys;
  }

  async function signingKeys(forceRefresh: boolean): Promise<Jwk[]> {
    const age = jwksCache ? options.now() - jwksCache.at : Infinity;
    if (jwksCache && age < JWKS_TTL_MS && !(forceRefresh && age >= JWKS_MIN_REFETCH_MS)) return jwksCache.keys;
    jwksInflight ??= loadJwks()
      .then((keys) => {
        jwksCache = { keys, at: options.now() };
        return keys;
      })
      .finally(() => {
        jwksInflight = null;
      });
    return jwksInflight;
  }

  /** The URL to send the browser to. Every parameter is set here; nothing is taken from the request. */
  function authorizationUrl(discovery: OidcDiscovery, input: { clientId: string; redirectUrl: string; state: string; nonce: string; verifier: string }): string {
    const query = new URLSearchParams({
      response_type: "code",
      client_id: input.clientId,
      redirect_uri: input.redirectUrl,
      scope: "openid email profile",
      state: input.state,
      nonce: input.nonce,
      code_challenge: pkceChallenge(input.verifier),
      code_challenge_method: "S256",
      prompt: "select_account",
    });
    return `${discovery.authorizationEndpoint}?${query.toString()}`;
  }

  /** Server-side code exchange: 10 s timeout, no retry (a code is single-use). Returns the ID token and nothing else. */
  async function exchangeCode(input: { code: string; verifier: string; clientId: string; clientSecret: string; redirectUrl: string }): Promise<string> {
    const { tokenEndpoint } = await discover();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUrl,
      code_verifier: input.verifier,
    }).toString();
    const parsed = z
      .object({ id_token: z.string().min(1).max(MAX_ID_TOKEN_CHARS) })
      .loose()
      .safeParse(await requestJson(tokenEndpoint, { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded" } }, TOKEN_TIMEOUT_MS, "token_exchange"));
    if (!parsed.success) throw new OidcError("token_exchange");
    // Any access_token in the response is deliberately never read.
    return parsed.data.id_token;
  }

  function decodeSegment(segment: string): unknown {
    if (!BASE64URL.test(segment)) throw new OidcError("token_malformed");
    try {
      return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
    } catch {
      throw new OidcError("token_malformed");
    }
  }

  /**
   * Verifies an ID token. Order matters: the header is checked (alg exactly RS256, a kid) and the signature is verified
   * before any claim is trusted. Throws OidcError with a reason code on every failure.
   */
  async function verifyIdToken(idToken: string, expected: { clientId: string; nonce: string }): Promise<VerifiedGoogleIdentity> {
    if (typeof idToken !== "string" || idToken.length === 0 || idToken.length > MAX_ID_TOKEN_CHARS) throw new OidcError("token_malformed");
    const parts = idToken.split(".");
    if (parts.length !== 3) throw new OidcError("token_malformed");
    const [headerPart, payloadPart, signaturePart] = parts;

    const header = headerSchema.safeParse(decodeSegment(headerPart));
    if (!header.success) throw new OidcError("token_malformed");
    // Exactly RS256: "none", HS256 (the public key as an HMAC secret) and everything else are refused before any key lookup.
    if (header.data.alg !== "RS256") throw new OidcError("alg");
    const kid = header.data.kid;
    if (!kid) throw new OidcError("kid");

    const matching = (keys: Jwk[]) => keys.find((key) => key.kid === kid && key.kty === "RSA" && (key.use === undefined || key.use === "sig") && (key.alg === undefined || key.alg === "RS256"));
    let jwk = matching(await signingKeys(false));
    if (!jwk) jwk = matching(await signingKeys(true));
    if (!jwk) throw new OidcError("kid");

    if (!BASE64URL.test(signaturePart)) throw new OidcError("signature");
    let valid = false;
    try {
      const key = createPublicKey({ key: jwk as JsonWebKey, format: "jwk" });
      valid = verify("RSA-SHA256", Buffer.from(`${headerPart}.${payloadPart}`), key, Buffer.from(signaturePart, "base64url"));
    } catch {
      valid = false;
    }
    if (!valid) throw new OidcError("signature");

    const claims = claimsSchema.safeParse(decodeSegment(payloadPart));
    if (!claims.success) throw new OidcError("token_malformed");
    const { iss, aud, sub, exp, iat, nonce, email, email_verified: emailVerified, name } = claims.data;

    if (typeof iss !== "string" || !ACCEPTED_ISSUERS.has(iss)) throw new OidcError("issuer");
    if (typeof aud !== "string" || !safeEqual(aud, expected.clientId)) throw new OidcError("audience");
    const nowSeconds = options.now() / 1000;
    if (typeof exp !== "number" || !Number.isFinite(exp) || exp <= nowSeconds) throw new OidcError("expired");
    if (typeof iat !== "number" || !Number.isFinite(iat) || iat > nowSeconds + MAX_IAT_FUTURE_SECONDS) throw new OidcError("issued_at");
    if (typeof nonce !== "string" || !safeEqual(nonce, expected.nonce)) throw new OidcError("nonce");
    if (typeof sub !== "string" || sub.length < 1 || sub.length > 255) throw new OidcError("subject");

    return {
      issuer: GOOGLE_ISSUER,
      subject: sub,
      email: emailVerified === true && typeof email === "string" && email.length <= 320 ? email : null,
      name: typeof name === "string" ? name : null,
    };
  }

  return { discover, authorizationUrl, exchangeCode, verifyIdToken };
}
