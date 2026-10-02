import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Email protection: AES-256-GCM envelope for storage, keyed HMAC for lookup and deduplication.
// Keys are 32 random bytes, base64-encoded, held only in server environment variables.

export interface LeadKeys {
  encryptionKey: Buffer;
  encryptionKeyId: string;
  hmacKey: Buffer;
}

export function decodeKey(name: string, value: string | undefined): Buffer {
  if (!value) throw new Error(`${name} is not configured`);
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error(`${name} must be 32 bytes, base64-encoded`);
  return key;
}

const ENVELOPE_VERSION = "v1";

export function encryptEmail(email: string, keys: LeadKeys): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keys.encryptionKey, iv);
  // Bind the ciphertext to its key id so an envelope cannot be replayed under another key.
  cipher.setAAD(Buffer.from(`${ENVELOPE_VERSION}.${keys.encryptionKeyId}`));
  const ciphertext = Buffer.concat([cipher.update(email, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [ENVELOPE_VERSION, keys.encryptionKeyId, iv.toString("base64url"), ciphertext.toString("base64url"), tag.toString("base64url")].join(".");
}

export function decryptEmail(envelope: string, keyring: Map<string, Buffer>): string {
  const [version, keyId, iv, ciphertext, tag] = envelope.split(".");
  if (version !== ENVELOPE_VERSION || !keyId || !iv || !ciphertext || !tag) throw new Error("Malformed email envelope");
  const key = keyring.get(keyId);
  if (!key) throw new Error("Unknown email encryption key id");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(`${version}.${keyId}`));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

export function emailLookupHash(normalizedEmail: string, hmacKey: Buffer): string {
  return `h1:${createHmac("sha256", hmacKey).update(normalizedEmail).digest("base64url")}`;
}

/** 32 random bytes: 43 base64url characters. Only the SHA-256 digest is stored. */
export function createOneTimeToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

/** Stateless unsubscribe signature, so every email carries a link that keeps working. */
export function unsubscribeSignature(leadId: string, hmacKey: Buffer): string {
  return createHmac("sha256", hmacKey).update(`unsubscribe:${leadId}`).digest("base64url");
}

export function verifyUnsubscribeSignature(leadId: string, signature: string, hmacKey: Buffer): boolean {
  const expected = Buffer.from(unsubscribeSignature(leadId, hmacKey));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function requestFingerprint(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body)).digest("base64url");
}
