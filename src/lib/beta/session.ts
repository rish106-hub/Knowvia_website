import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** Server-side beta session. Lives only in an encrypted httpOnly cookie; never sent to client JS. */
export type BetaSession = {
  token: string;
  householdId: string;
  adultId: string;
  memberId: string;
  caseId?: string;
  documentId?: string;
  ocrJobId?: string;
  ocrGrantId?: string;
  holdingId?: string;
  profileGrantId?: string;
};

export const SESSION_COOKIE = "kv_beta";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function key(env: NodeJS.ProcessEnv) {
  const secret = env.BETA_SESSION_SECRET || env.KNOWVIA_BOOTSTRAP_TOKEN || "";
  if (secret.length < 32) return null;
  return createHash("sha256").update("kv-beta-session:" + secret).digest();
}

export function sealSession(session: BetaSession, env: NodeJS.ProcessEnv = process.env) {
  const k = key(env);
  if (!k) throw new Error("Beta session secret is not configured.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function openSession(value: string | undefined, env: NodeJS.ProcessEnv = process.env): BetaSession | null {
  const k = key(env);
  if (!k || !value) return null;
  try {
    const raw = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", k, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const text = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(text) as BetaSession;
    return typeof parsed.token === "string" && typeof parsed.householdId === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return undefined;
}

export function sessionCookie(value: string, env: NodeJS.ProcessEnv = process.env) {
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
