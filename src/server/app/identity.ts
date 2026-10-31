// Identity seam. PROVISIONAL: decision D1 (identity) is OPEN. A DEVELOPMENT provider and, when configured (V1b), Google
// OIDC are implemented. Real OTP / magic link / Microsoft / Apple / phone providers are typed stubs that answer 501.
// OTP proves factor control only, never employer entitlement or insured status.
import type { BackendClient, BackendHouseholdSession, BackendIdentitySession } from "./backend-client";
import type { IdentityProviderKind } from "./contract";
import { appError } from "./errors";

export type SignInInput = { email: string; displayName?: string };

export interface IdentityProvider {
  readonly kind: IdentityProviderKind;
  readonly implemented: boolean;
  /** Returns the backend session for a verified identity. */
  signIn(input: SignInInput, backend: Pick<BackendClient, "createHousehold">): Promise<BackendHouseholdSession>;
}

const RESERVED_DOMAIN = /(^|\.)(test|invalid|example|localhost)$|(^|\.)example\.(com|org|net)$/i;
const SAFE_NAME = /[^\p{L}\p{N} .'-]/gu;

/**
 * DEV ONLY (APP_DEV_IDENTITY=true and NODE_ENV!=production). No verification at all. Every sign-in creates a
 * brand new household because the backend has no login or identity-to-adult mapping. Synthetic data only.
 */
export const devIdentityProvider: IdentityProvider = {
  kind: "dev",
  implemented: true,
  async signIn(input, backend) {
    // Synthetic data only: the dev provider forwards the address to the backend, so it accepts reserved test domains only.
    if (!RESERVED_DOMAIN.test(input.email.split("@")[1] ?? "")) throw appError(400, "INVALID_REQUEST", { fields: ["email"] });
    const local = input.email.split("@")[0] ?? "user";
    const name = (input.displayName ?? local).replace(SAFE_NAME, "").trim().slice(0, 60) || "Dev User";
    return backend.createHousehold({ displayName: `${name} household`, ownerDisplayName: name, contactEmail: input.email });
  },
};

function notImplemented(kind: IdentityProviderKind): IdentityProvider {
  return {
    kind,
    implemented: false,
    async signIn() {
      // NOT_IMPLEMENTED: needs decision D1 and a backend identity-to-adult mapping.
      throw appError(501, "IDENTITY_NOT_IMPLEMENTED", { retryable: false });
    },
  };
}

export const otpIdentityProvider = notImplemented("otp");
export const magicLinkIdentityProvider = notImplemented("magic_link");
export const oidcIdentityProvider = notImplemented("oidc");
// Google is real only when configured (see signInWithVerifiedGoogleIdentity). Unconfigured, it stays a 501 stub.
export const googleUnconfiguredProvider = notImplemented("google");
/**
 * Configured Google. A POST /session can never sign anyone in with it: a Google identity exists only after the redirect flow
 * has verified an ID token, so a posted email is refused rather than trusted.
 */
export const googleRedirectOnlyProvider: IdentityProvider = {
  kind: "google",
  implemented: true,
  async signIn() {
    throw appError(400, "INVALID_REQUEST", { fields: ["provider"] });
  },
};
export const microsoftIdentityProvider = notImplemented("microsoft");
export const appleIdentityProvider = notImplemented("apple");
export const phoneOtpIdentityProvider = notImplemented("phone_otp");

const SAFE_DISPLAY_NAME = /[^\p{L}\p{N} .'-]/gu;
const PLAIN_EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}$/;

/** What the backend is told about a verified Google sign-in. The pair (issuer, subject) is the identity; nothing else keys it. */
export type VerifiedIdentityClaims = { issuer: string; subject: string; name: string | null; email: string | null };

/**
 * Signs a verified Google identity in through the backend identity route. The display name is cleaned (the backend allows 1 to
 * 80 characters); the e-mail, only when Google verified it, is stored as contact detail and is never used to find the adult.
 */
export function signInWithVerifiedGoogleIdentity(claims: VerifiedIdentityClaims, backend: Pick<BackendClient, "identitySession">): Promise<BackendIdentitySession> {
  const cleaned = (claims.name ?? "").replace(SAFE_DISPLAY_NAME, "").replace(/\s+/g, " ").trim().slice(0, 80).trim();
  const contactEmail = claims.email && PLAIN_EMAIL.test(claims.email) ? claims.email : null;
  return backend.identitySession({ issuer: claims.issuer, subject: claims.subject, displayName: cleaned || "CoverSaath user", contactEmail });
}

export function resolveIdentityProvider(kind: IdentityProviderKind, { devIdentity, google = false }: { devIdentity: boolean; google?: boolean }): IdentityProvider {
  if (kind === "dev") return devIdentity ? devIdentityProvider : notImplemented("dev");
  if (kind === "otp") return otpIdentityProvider;
  if (kind === "magic_link") return magicLinkIdentityProvider;
  if (kind === "oidc") return oidcIdentityProvider;
  if (kind === "google") return google ? googleRedirectOnlyProvider : googleUnconfiguredProvider;
  if (kind === "microsoft") return microsoftIdentityProvider;
  if (kind === "apple") return appleIdentityProvider;
  return phoneOtpIdentityProvider;
}
