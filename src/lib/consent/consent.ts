// Consent state. Essential storage is always on; analytics and advertising default to off.
// Pure functions so the cookie contract is unit-tested.

export const CONSENT_COOKIE = "kv_consent";
export const CONSENT_VERSION = 1;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export interface ConsentChoice {
  analytics: boolean;
  advertising: boolean;
}

export interface ConsentRecord extends ConsentChoice {
  version: number;
  updatedAt: string;
}

export const REJECT_ALL: ConsentChoice = { analytics: false, advertising: false };
export const ACCEPT_ALL: ConsentChoice = { analytics: true, advertising: true };

export function createConsentRecord(choice: ConsentChoice, now: Date = new Date()): ConsentRecord {
  return {
    analytics: choice.analytics === true,
    advertising: choice.advertising === true,
    version: CONSENT_VERSION,
    updatedAt: now.toISOString(),
  };
}

/** Returns null when no valid, current-version record exists, so the banner is shown again. */
export function parseConsentCookie(cookieHeader: string | null | undefined): ConsentRecord | null {
  if (!cookieHeader) return null;
  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  if (!pair) return null;
  try {
    const raw: unknown = JSON.parse(decodeURIComponent(pair.slice(CONSENT_COOKIE.length + 1)));
    if (!raw || typeof raw !== "object") return null;
    const record = raw as Record<string, unknown>;
    if (record.version !== CONSENT_VERSION) return null;
    if (typeof record.analytics !== "boolean" || typeof record.advertising !== "boolean") return null;
    if (typeof record.updatedAt !== "string" || Number.isNaN(Date.parse(record.updatedAt))) return null;
    return {
      analytics: record.analytics,
      advertising: record.advertising,
      version: CONSENT_VERSION,
      updatedAt: record.updatedAt,
    };
  } catch {
    return null;
  }
}

export function serializeConsentCookie(record: ConsentRecord, secure: boolean): string {
  const value = encodeURIComponent(JSON.stringify(record));
  return [
    `${CONSENT_COOKIE}=${value}`,
    "Path=/",
    `Max-Age=${MAX_AGE_SECONDS}`,
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/** Google Consent Mode v2 signals derived from a choice. Basic mode: the tag loads only after a grant. */
export function googleConsentSignals(choice: ConsentChoice) {
  const ads = choice.advertising ? "granted" : "denied";
  return {
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    analytics_storage: choice.analytics ? "granted" : "denied",
  } as const;
}
