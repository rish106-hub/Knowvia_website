import "server-only";
import { decodeKey, type LeadKeys } from "./crypto";

// Lead capture is enabled only when every dependency is configured. Missing configuration
// disables the endpoint (503) instead of degrading silently. Values are never logged.

export interface LeadRuntimeConfig {
  databaseUrl: string;
  keys: LeadKeys;
  /** Previous encryption keys still needed to decrypt older envelopes during rotation. */
  keyring: Map<string, Buffer>;
  turnstileSecretKey: string;
  email: { kind: "resend"; apiKey: string; from: string } | { kind: "development" };
  launchCampaignEndedAt: Date | null;
}

export type LeadConfigResult = { enabled: true; config: LeadRuntimeConfig } | { enabled: false; missing: string[] };

export function readLeadConfig(env: NodeJS.ProcessEnv = process.env): LeadConfigResult {
  if (env.LEADS_ENABLED === "false") return { enabled: false, missing: ["LEADS_ENABLED"] };
  // The console mailer prints live confirmation links, so it is allowed only under `next dev`.
  const isLocalDevelopment = env.NODE_ENV === "development";
  const required = [
    "DATABASE_URL",
    "LEAD_EMAIL_ENCRYPTION_KEY",
    "LEAD_EMAIL_ENCRYPTION_KEY_ID",
    "LEAD_EMAIL_HMAC_KEY",
    "TURNSTILE_SECRET_KEY",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  ];
  const usesResend = Boolean(env.RESEND_API_KEY) || !isLocalDevelopment;
  if (usesResend) required.push("RESEND_API_KEY", "RESEND_FROM_EMAIL");
  const missing = required.filter((name) => !env[name]?.trim());
  if (missing.length > 0) return { enabled: false, missing };

  const keyId = env.LEAD_EMAIL_ENCRYPTION_KEY_ID!.trim();
  if (!/^[a-z0-9-]{1,32}$/.test(keyId)) return { enabled: false, missing: ["LEAD_EMAIL_ENCRYPTION_KEY_ID (format)"] };

  let keys: LeadKeys;
  const keyring = new Map<string, Buffer>();
  try {
    keys = {
      encryptionKey: decodeKey("LEAD_EMAIL_ENCRYPTION_KEY", env.LEAD_EMAIL_ENCRYPTION_KEY),
      encryptionKeyId: keyId,
      hmacKey: decodeKey("LEAD_EMAIL_HMAC_KEY", env.LEAD_EMAIL_HMAC_KEY),
    };
    keyring.set(keyId, keys.encryptionKey);
    // Optional "id:base64key,id:base64key" list of retired keys kept for decryption only.
    for (const entry of (env.LEAD_EMAIL_PREVIOUS_KEYS ?? "").split(",").filter(Boolean)) {
      const [id, value] = entry.split(":");
      if (id && value) keyring.set(id.trim(), decodeKey("LEAD_EMAIL_PREVIOUS_KEYS", value.trim()));
    }
  } catch {
    return { enabled: false, missing: ["LEAD_EMAIL_* keys (must be 32 bytes, base64)"] };
  }

  const campaignEnd = env.LAUNCH_CAMPAIGN_ENDED_AT ? new Date(env.LAUNCH_CAMPAIGN_ENDED_AT) : null;

  return {
    enabled: true,
    config: {
      databaseUrl: env.DATABASE_URL!,
      keys,
      keyring,
      turnstileSecretKey: env.TURNSTILE_SECRET_KEY!,
      email: usesResend
        ? { kind: "resend", apiKey: env.RESEND_API_KEY!, from: env.RESEND_FROM_EMAIL! }
        : { kind: "development" },
      launchCampaignEndedAt: campaignEnd && !Number.isNaN(campaignEnd.getTime()) ? campaignEnd : null,
    },
  };
}
