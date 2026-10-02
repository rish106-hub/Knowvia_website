import "server-only";

// Cloudflare Turnstile server-side verification. Fails closed: any error, timeout or
// unexpected response counts as "not verified".

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

export type TurnstileVerifier = (token: string, remoteIp: string | null) => Promise<boolean>;

export function createTurnstileVerifier(secretKey: string, fetchImpl: typeof fetch = fetch): TurnstileVerifier {
  return async (token, remoteIp) => {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);
    try {
      const response = await fetchImpl(VERIFY_URL, {
        method: "POST",
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "error",
      });
      if (!response.ok) return false;
      const result = (await response.json()) as { success?: unknown };
      return result.success === true;
    } catch {
      return false;
    }
  };
}
