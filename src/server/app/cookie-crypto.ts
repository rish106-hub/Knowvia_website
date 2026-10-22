// AES-256-GCM sealing for BFF cookies. PROVISIONAL: the session model awaits decisions D1 and D2.
// Envelope: "v1." + base64url(iv) + "." + base64url(ciphertext) + "." + base64url(tag)
// Key: HKDF-SHA256 from APP_SESSION_SECRET, one derived key per cookie kind. AAD binds the kind and version,
// so a session cookie cannot be replayed as a state cookie. A fresh random 96-bit IV is used for every seal.
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

export const ENVELOPE_VERSION = "v1";
const SALT = "knowvia-app-cookie-salt-v1";

export type CookieKind = "session" | "state";
export type OpenResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "invalid" | "expired" };

const b64 = (buffer: Buffer) => buffer.toString("base64url");
const fromB64 = (value: string) => Buffer.from(value, "base64url");

function deriveKey(secret: string, kind: CookieKind): Buffer {
  return Buffer.from(hkdfSync("sha256", secret, SALT, `cookie:${kind}:${ENVELOPE_VERSION}`, 32));
}

const aad = (kind: CookieKind) => Buffer.from(`knowvia-app:${ENVELOPE_VERSION}:${kind}`);

export function sealCookie(kind: CookieKind, value: unknown, secret: string, expiresAtMs: number): string {
  const key = deriveKey(secret, kind);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad(kind));
  const plaintext = Buffer.from(JSON.stringify({ exp: expiresAtMs, p: value }), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return `${ENVELOPE_VERSION}.${b64(iv)}.${b64(ciphertext)}.${b64(cipher.getAuthTag())}`;
}

export function openCookie<T = unknown>(
  kind: CookieKind,
  envelope: string,
  secret: string,
  nowMs: number,
): OpenResult<T> {
  const parts = envelope.split(".");
  if (parts.length !== 4 || parts[0] !== ENVELOPE_VERSION) return { ok: false, reason: "invalid" };
  try {
    const iv = fromB64(parts[1]);
    const ciphertext = fromB64(parts[2]);
    const tag = fromB64(parts[3]);
    if (iv.length !== 12 || tag.length !== 16) return { ok: false, reason: "invalid" };
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret, kind), iv);
    decipher.setAAD(aad(kind));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(plaintext) as { exp?: unknown; p?: unknown };
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) return { ok: false, reason: "invalid" };
    // Only an authentic envelope can be reported as expired.
    if (nowMs >= parsed.exp) return { ok: false, reason: "expired" };
    return { ok: true, value: parsed.p as T };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
