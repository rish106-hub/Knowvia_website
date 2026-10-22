// Identity seam. PROVISIONAL: decision D1 (identity) is OPEN. Only a DEVELOPMENT provider is implemented.
// Real OTP / magic link / OIDC providers are typed stubs that answer 501 IDENTITY_NOT_IMPLEMENTED.
// OTP proves factor control only, never employer entitlement or insured status.
import type { BackendClient, BackendHouseholdSession } from "./backend-client";
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

export function resolveIdentityProvider(kind: IdentityProviderKind, { devIdentity }: { devIdentity: boolean }): IdentityProvider {
  if (kind === "dev") return devIdentity ? devIdentityProvider : notImplemented("dev");
  if (kind === "otp") return otpIdentityProvider;
  if (kind === "magic_link") return magicLinkIdentityProvider;
  return oidcIdentityProvider;
}
