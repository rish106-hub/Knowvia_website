// Server-only environment for the Block 5 BFF. PROVISIONAL: decisions D1 (identity) and D2 (topology) are OPEN.
// Nothing here may be imported by client code (see tests/unit/app-bff/no-client-import.test.ts).
import { z } from "zod";

export class AppConfigError extends Error {
  readonly fields: string[];
  constructor(fields: string[]) {
    // Names only. Values (secrets) never appear in the message.
    super(`BFF configuration is invalid: ${fields.join(", ")}`);
    this.name = "AppConfigError";
    this.fields = fields;
  }
}

export type EnvSource = Record<string, string | undefined>;

/** Real Google sign-in (V1b). Present only when all four settings are set and valid; otherwise the feature is off. */
export type GoogleOidcConfig = {
  clientId: string;
  /** Server-only. Never sent to a browser, never logged. */
  clientSecret: string;
  /** Where Google sends the person back: must be this app's callback route. */
  redirectUrl: string;
  /** Server credential for POST /api/v1/identity-sessions (the backend's KNOWVIA_IDENTITY_TOKEN). Server-only. */
  identityToken: string;
};

export const GOOGLE_CALLBACK_PATH = "/api/app/auth/google/callback";

export type AppConfig =
  | { enabled: false }
  | {
      enabled: true;
      production: boolean;
      apiUrl: string;
      bootstrapToken: string;
      sessionSecret: string;
      devIdentity: boolean;
      /** Null unless GOOGLE_OIDC_CLIENT_ID, GOOGLE_OIDC_CLIENT_SECRET, APP_OIDC_REDIRECT_URL and COVERSAATH_IDENTITY_TOKEN are all set. */
      google: GoogleOidcConfig | null;
      /** Synthetic demo data and demo-only controls. Never allowed in production. */
      demoData: boolean;
      allowedOrigins: string[];
      /** Trusted proxies that append to X-Forwarded-For (0 = ignore the header). */
      trustedProxyHops: number;
    };

const truthy = (value: string | undefined) =>
  value !== undefined && ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());

// Matches the backend bearer pattern (tenant-access-service.js: [A-Za-z0-9_-]{32,256}).
const bootstrapToken = z.string().regex(/^[A-Za-z0-9_-]{32,256}$/);
const sessionSecret = z.string().min(32).max(512);
const apiUrl = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value))
  .transform((value) => value.replace(/\/+$/, ""));

const oidcClientId = z.string().min(8).max(256).regex(/^[\x21-\x7e]+$/);
const oidcClientSecret = z.string().min(8).max(512).regex(/^[\x21-\x7e]+$/);

/**
 * The callback URL must be this app's own callback route on an allowed origin, with no query or fragment, and https
 * outside development (a code in a query over plain http is readable on the wire).
 */
function validRedirectUrl(value: string, production: boolean, allowedOrigins: string[]): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return false;
    if (url.pathname !== GOOGLE_CALLBACK_PATH) return false;
    if (production ? url.protocol !== "https:" : url.protocol !== "https:" && url.protocol !== "http:") return false;
    return allowedOrigins.includes(url.origin);
  } catch {
    return false;
  }
}

function originOf(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export function loadAppConfig(source: EnvSource = process.env): AppConfig {
  if (!truthy(source.APP_ENABLED)) return { enabled: false };

  // Production unless NODE_ENV is explicitly development or test: an unset or unusual value (prod, staging) fails closed.
  const production = !["development", "test"].includes(source.NODE_ENV ?? "");
  const devIdentity = truthy(source.APP_DEV_IDENTITY);
  const demoData = truthy(source.APP_DEMO_DATA);
  const bad: string[] = [];

  const api = apiUrl.safeParse(source.COVERSAATH_API_URL ?? "");
  if (!api.success) bad.push("COVERSAATH_API_URL");
  const token = bootstrapToken.safeParse(source.COVERSAATH_BOOTSTRAP_TOKEN ?? "");
  if (!token.success) bad.push("COVERSAATH_BOOTSTRAP_TOKEN");
  const secret = sessionSecret.safeParse(source.APP_SESSION_SECRET ?? "");
  if (!secret.success) bad.push("APP_SESSION_SECRET");
  // The dev identity provider mints a household for any email. It must never run in production.
  if (devIdentity && production) bad.push("APP_DEV_IDENTITY (refused when NODE_ENV=production)");
  // Demo data is synthetic. It must never be switched on in production.
  if (demoData && production) bad.push("APP_DEMO_DATA (refused when NODE_ENV=production)");

  const origins = new Set<string>();
  for (const candidate of [source.NEXT_PUBLIC_SITE_URL, ...(source.APP_ALLOWED_ORIGINS ?? "").split(",")]) {
    const origin = candidate?.trim() ? originOf(candidate.trim()) : null;
    if (origin) origins.add(origin);
  }
  if (!production) {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }
  if (origins.size === 0) bad.push("NEXT_PUBLIC_SITE_URL or APP_ALLOWED_ORIGINS");

  // Google sign-in is off unless all four settings are present. Present but malformed is a configuration error (names only).
  let google: GoogleOidcConfig | null = null;
  const googleSettings = {
    GOOGLE_OIDC_CLIENT_ID: source.GOOGLE_OIDC_CLIENT_ID?.trim(),
    GOOGLE_OIDC_CLIENT_SECRET: source.GOOGLE_OIDC_CLIENT_SECRET?.trim(),
    APP_OIDC_REDIRECT_URL: source.APP_OIDC_REDIRECT_URL?.trim(),
    COVERSAATH_IDENTITY_TOKEN: source.COVERSAATH_IDENTITY_TOKEN?.trim(),
  };
  if (Object.values(googleSettings).every(Boolean)) {
    const id = oidcClientId.safeParse(googleSettings.GOOGLE_OIDC_CLIENT_ID);
    const clientSecret = oidcClientSecret.safeParse(googleSettings.GOOGLE_OIDC_CLIENT_SECRET);
    const identity = bootstrapToken.safeParse(googleSettings.COVERSAATH_IDENTITY_TOKEN);
    if (!id.success) bad.push("GOOGLE_OIDC_CLIENT_ID");
    if (!clientSecret.success) bad.push("GOOGLE_OIDC_CLIENT_SECRET");
    // The backend refuses an identity credential equal to the bootstrap token, so fail here too.
    if (!identity.success || googleSettings.COVERSAATH_IDENTITY_TOKEN === source.COVERSAATH_BOOTSTRAP_TOKEN?.trim()) bad.push("COVERSAATH_IDENTITY_TOKEN");
    if (!validRedirectUrl(googleSettings.APP_OIDC_REDIRECT_URL as string, production, [...origins])) bad.push("APP_OIDC_REDIRECT_URL");
    if (id.success && clientSecret.success && identity.success && !bad.some((name) => name === "COVERSAATH_IDENTITY_TOKEN" || name === "APP_OIDC_REDIRECT_URL")) {
      google = { clientId: id.data, clientSecret: clientSecret.data, redirectUrl: googleSettings.APP_OIDC_REDIRECT_URL as string, identityToken: identity.data };
    }
  }

  const hopsRaw = source.APP_TRUSTED_PROXY_HOPS?.trim() ?? "";
  const trustedProxyHops = hopsRaw === "" ? 0 : Number(hopsRaw);
  if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 0 || trustedProxyHops > 5) bad.push("APP_TRUSTED_PROXY_HOPS");

  if (bad.length > 0 || !api.success || !token.success || !secret.success) throw new AppConfigError(bad);
  return {
    enabled: true,
    production,
    apiUrl: api.data,
    bootstrapToken: token.data,
    sessionSecret: secret.data,
    devIdentity,
    google,
    demoData,
    allowedOrigins: [...origins],
    trustedProxyHops,
  };
}
