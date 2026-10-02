import { and, eq, gt, inArray, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { leadConsentEvents, leadIdempotencyKeys, leadRateLimits, leads } from "@/lib/db/schema";
import type { LeadAudience, LeadIntent, LeadPlacement } from "./types";

// Persistence for early-access leads. All state transitions happen in transactions here.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LeadDatabase = PgDatabase<PgQueryResultHKT, any>;

export const CONFIRMATION_TTL_MS = 72 * 60 * 60 * 1000;
export const RESEND_THROTTLE_MS = 10 * 60 * 1000;
export const PENDING_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000;
export const LAUNCH_LEAD_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export interface PendingLeadInput {
  emailHash: string;
  emailCiphertext: string;
  name?: string;
  role?: string;
  organisation?: string;
  audience: LeadAudience;
  intent: LeadIntent;
  noticeVersion: string;
  sourcePage: string;
  sourcePlacement: LeadPlacement;
  utmSource?: string;
  confirmationTokenHash: string;
}

export type SubmissionOutcome =
  | { action: "send_confirmation"; leadId: string }
  | { action: "no_email"; reason: "already_confirmed" | "recently_sent" };

export class LeadStore {
  constructor(private readonly db: LeadDatabase) {}

  async findIdempotentResponse(key: string): Promise<{ requestFingerprint: string; responseStatus: number } | null> {
    const rows = await this.db
      .select({ requestFingerprint: leadIdempotencyKeys.requestFingerprint, responseStatus: leadIdempotencyKeys.responseStatus })
      .from(leadIdempotencyKeys)
      .where(eq(leadIdempotencyKeys.key, key))
      .limit(1);
    return rows[0] ?? null;
  }

  async saveIdempotentResponse(key: string, requestFingerprint: string, responseStatus: number): Promise<void> {
    await this.db.insert(leadIdempotencyKeys).values({ key, requestFingerprint, responseStatus }).onConflictDoNothing();
  }

  /** Records a consented submission. Never reveals to the caller whether the email was already known. */
  async recordSubmission(input: PendingLeadInput, now: Date): Promise<SubmissionOutcome> {
    return this.db.transaction(async (tx) => {
      const pendingValues = {
        emailCiphertext: input.emailCiphertext,
        name: input.name ?? null,
        role: input.role ?? null,
        organisation: input.organisation ?? null,
        audience: input.audience,
        intent: input.intent,
        status: "pending" as const,
        noticeVersion: input.noticeVersion,
        sourcePage: input.sourcePage,
        sourcePlacement: input.sourcePlacement,
        utmSource: input.utmSource ?? null,
        confirmationTokenHash: input.confirmationTokenHash,
        confirmationExpiresAt: new Date(now.getTime() + CONFIRMATION_TTL_MS),
        confirmationSentAt: null,
        emailDeliveryStatus: "not_sent" as const,
        updatedAt: now,
      };

      const inserted = await tx
        .insert(leads)
        .values({ emailHash: input.emailHash, createdAt: now, ...pendingValues })
        .onConflictDoNothing({ target: leads.emailHash })
        .returning({ id: leads.id });

      let leadId = inserted[0]?.id;
      if (!leadId) {
        const [existing] = await tx.select().from(leads).where(eq(leads.emailHash, input.emailHash)).for("update");
        if (!existing) throw new Error("Lead disappeared during submission");
        if (existing.status === "confirmed") return { action: "no_email", reason: "already_confirmed" };
        const recentlySent =
          existing.status === "pending" &&
          existing.emailDeliveryStatus === "sent" &&
          existing.confirmationSentAt !== null &&
          now.getTime() - existing.confirmationSentAt.getTime() < RESEND_THROTTLE_MS;
        if (recentlySent) return { action: "no_email", reason: "recently_sent" };
        await tx.update(leads).set(pendingValues).where(eq(leads.id, existing.id));
        leadId = existing.id;
      }

      await tx.insert(leadConsentEvents).values({
        leadId,
        event: "submitted",
        noticeVersion: input.noticeVersion,
        sourcePage: input.sourcePage,
        occurredAt: now,
      });
      return { action: "send_confirmation", leadId };
    });
  }

  async recordDelivery(leadId: string, delivered: boolean, now: Date): Promise<void> {
    await this.db
      .update(leads)
      .set({
        emailDeliveryStatus: delivered ? "sent" : "failed",
        confirmationSentAt: delivered ? now : null,
        updatedAt: now,
      })
      .where(and(eq(leads.id, leadId), eq(leads.status, "pending")));
  }

  /** Single-use and expiry-bounded. Returns false for unknown, used or expired tokens. */
  async confirm(tokenHash: string, now: Date): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const updated = await tx
        .update(leads)
        .set({
          status: "confirmed",
          confirmedAt: now,
          confirmationTokenHash: null,
          confirmationExpiresAt: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(leads.confirmationTokenHash, tokenHash),
            eq(leads.status, "pending"),
            gt(leads.confirmationExpiresAt, now),
          ),
        )
        .returning({ id: leads.id, noticeVersion: leads.noticeVersion });
      const row = updated[0];
      if (!row) return false;
      await tx.insert(leadConsentEvents).values({ leadId: row.id, event: "confirmed", noticeVersion: row.noticeVersion, occurredAt: now });
      return true;
    });
  }

  /** Erases personal fields and keeps only the hash, so the address is suppressed. Idempotent. */
  async unsubscribe(leadId: string, now: Date): Promise<void> {
    await this.db.transaction(async (tx) => {
      const updated = await tx
        .update(leads)
        .set({
          status: "unsubscribed",
          emailCiphertext: null,
          name: null,
          role: null,
          organisation: null,
          utmSource: null,
          confirmationTokenHash: null,
          confirmationExpiresAt: null,
          unsubscribedAt: now,
          updatedAt: now,
        })
        .where(and(eq(leads.id, leadId), ne(leads.status, "unsubscribed")))
        .returning({ id: leads.id });
      if (updated[0]) {
        await tx.insert(leadConsentEvents).values({ leadId, event: "unsubscribed", occurredAt: now });
      }
    });
  }

  async findForEmail(leadId: string): Promise<{ id: string; emailCiphertext: string | null; status: string } | null> {
    const rows = await this.db
      .select({ id: leads.id, emailCiphertext: leads.emailCiphertext, status: leads.status })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    return rows[0] ?? null;
  }

  /** Retention job. Returns counts for the operator log (no personal data). */
  async purgeExpired(now: Date, launchCampaignEndedAt: Date | null) {
    // Measured from the latest submission, so a re-submission restarts the clock.
    const pendingCutoff = new Date(now.getTime() - PENDING_RETENTION_MS);
    const expiredPending = and(eq(leads.status, "pending"), lt(leads.updatedAt, pendingCutoff));
    const deletedPending = await this.db
      .delete(leads)
      .where(and(expiredPending, isNull(leads.unsubscribedAt)))
      .returning({ id: leads.id });
    // A person who unsubscribed before and never confirmed again returns to suppressed, keeping the hash.
    await this.db
      .update(leads)
      .set({
        status: "unsubscribed",
        emailCiphertext: null,
        name: null,
        role: null,
        organisation: null,
        utmSource: null,
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
        updatedAt: now,
      })
      .where(and(expiredPending, isNotNull(leads.unsubscribedAt)));

    const deletedKeys = await this.db
      .delete(leadIdempotencyKeys)
      .where(lt(leadIdempotencyKeys.createdAt, new Date(now.getTime() - IDEMPOTENCY_RETENTION_MS)))
      .returning({ key: leadIdempotencyKeys.key });

    await this.db.delete(leadRateLimits).where(lt(leadRateLimits.windowStart, new Date(now.getTime() - IDEMPOTENCY_RETENTION_MS)));

    let erasedLaunchLeads = 0;
    if (launchCampaignEndedAt && now.getTime() - launchCampaignEndedAt.getTime() > LAUNCH_LEAD_RETENTION_MS) {
      // Launch-update leads did not subscribe to the newsletter; they are erased 90 days after the campaign.
      const erased = await this.db
        .update(leads)
        .set({
          status: "unsubscribed",
          emailCiphertext: null,
          name: null,
          role: null,
          organisation: null,
          utmSource: null,
          unsubscribedAt: now,
          updatedAt: now,
        })
        .where(and(eq(leads.status, "confirmed"), inArray(leads.intent, ["launch_updates", "policy_clarity"])))
        .returning({ id: leads.id });
      erasedLaunchLeads = erased.length;
    }

    return { deletedPending: deletedPending.length, deletedIdempotencyKeys: deletedKeys.length, erasedLaunchLeads };
  }

  /** Counts a hit in the current fixed window and returns the running total, atomically. */
  async countRateLimitHit(bucketKey: string, now: Date, windowMs: number): Promise<number> {
    const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
    const [row] = await this.db
      .insert(leadRateLimits)
      .values({ bucketKey, windowStart, hits: 1 })
      .onConflictDoUpdate({
        target: [leadRateLimits.bucketKey, leadRateLimits.windowStart],
        set: { hits: sql`${leadRateLimits.hits} + 1` },
      })
      .returning({ hits: leadRateLimits.hits });
    return row?.hits ?? 1;
  }

  async ping(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }
}
