import { createHmac } from "node:crypto";
import {
  createOneTimeToken,
  decryptEmail,
  emailLookupHash,
  encryptEmail,
  hashToken,
  requestFingerprint,
  unsubscribeSignature,
  verifyUnsubscribeSignature,
  type LeadKeys,
} from "./crypto";
import type { ConfirmationSender } from "./email";
import { idempotencyKeySchema, leadRequestSchema, leadTokenSchema } from "./schema";
import type { LeadStore } from "./store";
import type { TurnstileVerifier } from "./turnstile";

// Application service for early-access leads. Framework-free so it is contract-tested directly.

export interface LeadServiceDeps {
  store: LeadStore;
  verifyTurnstile: TurnstileVerifier;
  sendConfirmation: ConfirmationSender;
  keys: LeadKeys;
  keyring: Map<string, Buffer>;
  siteUrl: string;
  now?: () => Date;
  /**
   * Runs work after the response is sent (Next.js `after`). Every accepted request then returns
   * at the same point, whether or not an email is sent. Defaults to running inline (tests).
   */
  defer?: (task: () => Promise<void>) => void | Promise<void>;
}

export interface ServiceResponse {
  status: number;
  body: Record<string, unknown>;
}

export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const RATE_LIMIT_MAX_PER_CLIENT = 10;

const accepted: ServiceResponse = { status: 202, body: { status: "verification_pending" } };
const unavailable: ServiceResponse = { status: 503, body: { error: "temporarily_unavailable" } };

export interface SubmitLeadInput {
  body: unknown;
  idempotencyKey: string | null;
  clientAddress: string | null;
}

export async function submitLead(input: SubmitLeadInput, deps: LeadServiceDeps): Promise<ServiceResponse> {
  const now = deps.now?.() ?? new Date();

  const keyCheck = idempotencyKeySchema.safeParse(input.idempotencyKey);
  if (!keyCheck.success) return { status: 400, body: { error: "idempotency_key_required" } };
  const idempotencyKey = keyCheck.data;

  const parsed = leadRequestSchema.safeParse(input.body);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "body")))];
    return { status: 400, body: { error: "invalid_request", fields } };
  }
  const lead = parsed.data;
  // The Turnstile token is single-use, so retries of the same submission are matched without it.
  const { turnstileToken, ...stableFields } = lead;
  const fingerprint = requestFingerprint(stableFields);

  try {
    const previous = await deps.store.findIdempotentResponse(idempotencyKey);
    if (previous) {
      if (previous.requestFingerprint !== fingerprint) return { status: 409, body: { error: "idempotency_conflict" } };
      return accepted;
    }

    // Requests without a resolvable client address share one bucket: fail closed, not open.
    const bucket = input.clientAddress
      ? `ip:${createHmac("sha256", deps.keys.hmacKey).update(input.clientAddress).digest("base64url")}`
      : "ip:unknown";
    const hits = await deps.store.countRateLimitHit(bucket, now, RATE_LIMIT_WINDOW_MS);
    if (hits > RATE_LIMIT_MAX_PER_CLIENT) return { status: 429, body: { error: "too_many_requests" } };

    if (!(await deps.verifyTurnstile(turnstileToken, input.clientAddress))) {
      return { status: 400, body: { error: "verification_failed" } };
    }

    const { token, tokenHash } = createOneTimeToken();
    const outcome = await deps.store.recordSubmission(
      {
        emailHash: emailLookupHash(lead.email, deps.keys.hmacKey),
        emailCiphertext: encryptEmail(lead.email, deps.keys),
        name: lead.name,
        role: lead.role,
        organisation: lead.organisation,
        audience: lead.audience,
        intent: lead.intent,
        noticeVersion: lead.noticeVersion,
        sourcePage: lead.source.page,
        sourcePlacement: lead.source.placement,
        utmSource: lead.source.utmSource,
        confirmationTokenHash: tokenHash,
      },
      now,
    );

    if (outcome.action === "send_confirmation") {
      const leadId = outcome.leadId;
      const unsubscribeQuery = `lead=${leadId}&sig=${unsubscribeSignature(leadId, deps.keys.hmacKey)}`;
      const deliver = async () => {
        const delivered = await deps
          .sendConfirmation({
            to: lead.email,
            confirmUrl: `${deps.siteUrl}/confirm?token=${token}`,
            unsubscribeUrl: `${deps.siteUrl}/unsubscribe?${unsubscribeQuery}`,
            oneClickUnsubscribeUrl: `${deps.siteUrl}/api/public/v1/leads/unsubscribe?${unsubscribeQuery}`,
            idempotencyKey: `confirm-${leadId}-${tokenHash.slice(0, 16)}`,
          })
          .catch(() => false);
        // A failed delivery is not throttled, so the person's next attempt sends a fresh link.
        await deps.store.recordDelivery(leadId, delivered, now).catch(() => undefined);
      };
      await (deps.defer ? deps.defer(deliver) : deliver());
    }

    await deps.store.saveIdempotentResponse(idempotencyKey, fingerprint, accepted.status);
    return accepted;
  } catch {
    return unavailable;
  }
}

export async function confirmLead(body: unknown, deps: Pick<LeadServiceDeps, "store" | "now">): Promise<ServiceResponse> {
  const parsed = leadTokenSchema.safeParse(body);
  if (!parsed.success) return { status: 400, body: { error: "invalid_or_expired" } };
  try {
    const confirmed = await deps.store.confirm(hashToken(parsed.data.token), deps.now?.() ?? new Date());
    return confirmed ? { status: 200, body: { status: "confirmed" } } : { status: 400, body: { error: "invalid_or_expired" } };
  } catch {
    return unavailable;
  }
}

export async function unsubscribeLead(
  leadId: string | null,
  signature: string | null,
  deps: Pick<LeadServiceDeps, "store" | "keys" | "now">,
): Promise<ServiceResponse> {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (!leadId || !signature || !uuid.test(leadId) || !verifyUnsubscribeSignature(leadId, signature, deps.keys.hmacKey)) {
    return { status: 400, body: { error: "invalid_link" } };
  }
  try {
    await deps.store.unsubscribe(leadId, deps.now?.() ?? new Date());
    return { status: 200, body: { status: "unsubscribed" } };
  } catch {
    return unavailable;
  }
}

/** Operator helper for export requests: decrypts one lead's address. Never call from a public route. */
export async function exportLeadEmail(leadId: string, deps: Pick<LeadServiceDeps, "store" | "keyring">) {
  const row = await deps.store.findForEmail(leadId);
  if (!row?.emailCiphertext) return null;
  return { id: row.id, status: row.status, email: decryptEmail(row.emailCiphertext, deps.keyring) };
}
