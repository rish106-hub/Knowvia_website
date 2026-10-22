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

export type AppConfig =
  | { enabled: false }
  | {
      enabled: true;
      production: boolean;
      apiUrl: string;
      bootstrapToken: string;
      sessionSecret: string;
      devIdentity: boolean;
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
  const bad: string[] = [];

  const api = apiUrl.safeParse(source.COVERSAATH_API_URL ?? "");
  if (!api.success) bad.push("COVERSAATH_API_URL");
  const token = bootstrapToken.safeParse(source.COVERSAATH_BOOTSTRAP_TOKEN ?? "");
  if (!token.success) bad.push("COVERSAATH_BOOTSTRAP_TOKEN");
  const secret = sessionSecret.safeParse(source.APP_SESSION_SECRET ?? "");
  if (!secret.success) bad.push("APP_SESSION_SECRET");
  // The dev identity provider mints a household for any email. It must never run in production.
  if (devIdentity && production) bad.push("APP_DEV_IDENTITY (refused when NODE_ENV=production)");

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
    allowedOrigins: [...origins],
    trustedProxyHops,
  };
}
