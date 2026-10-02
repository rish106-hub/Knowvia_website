import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, primaryKey, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Early-access lead store. Isolated from any product, household or document data.
// Raw email never stored: email_ciphertext is an AES-GCM envelope, email_hash a keyed HMAC.

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    emailHash: text("email_hash").notNull().unique(),
    emailCiphertext: text("email_ciphertext"),
    name: text("name"),
    role: text("role"),
    organisation: text("organisation"),
    audience: text("audience").notNull(),
    intent: text("intent").notNull(),
    status: text("status").notNull(),
    noticeVersion: text("notice_version").notNull(),
    sourcePage: text("source_page").notNull(),
    sourcePlacement: text("source_placement").notNull(),
    utmSource: text("utm_source"),
    confirmationTokenHash: text("confirmation_token_hash").unique(),
    confirmationExpiresAt: timestamp("confirmation_expires_at", { withTimezone: true }),
    confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true }),
    emailDeliveryStatus: text("email_delivery_status").notNull().default("not_sent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (table) => [
    check("leads_status_check", sql`${table.status} in ('pending', 'confirmed', 'unsubscribed')`),
    check("leads_audience_check", sql`${table.audience} in ('hr', 'individual', 'other')`),
    check("leads_intent_check", sql`${table.intent} in ('newsletter', 'launch_updates', 'policy_clarity')`),
    check("leads_placement_check", sql`${table.sourcePlacement} in ('hero', 'guide', 'article', 'footer')`),
    check(
      "leads_delivery_check",
      sql`${table.emailDeliveryStatus} in ('not_sent', 'sent', 'failed')`,
    ),
    // An unsubscribed lead keeps only its hash, for suppression.
    check(
      "leads_unsubscribed_erased_check",
      sql`${table.status} <> 'unsubscribed' or (${table.emailCiphertext} is null and ${table.name} is null and ${table.role} is null and ${table.organisation} is null)`,
    ),
    check("leads_active_has_email_check", sql`${table.status} = 'unsubscribed' or ${table.emailCiphertext} is not null`),
    index("leads_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const leadConsentEvents = pgTable(
  "lead_consent_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    noticeVersion: text("notice_version"),
    sourcePage: text("source_page"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("lead_consent_events_event_check", sql`${table.event} in ('submitted', 'confirmed', 'unsubscribed')`),
    index("lead_consent_events_lead_idx").on(table.leadId),
  ],
);

export const leadIdempotencyKeys = pgTable(
  "lead_idempotency_keys",
  {
    key: uuid("key").primaryKey(),
    requestFingerprint: text("request_fingerprint").notNull(),
    responseStatus: smallint("response_status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("lead_idempotency_created_idx").on(table.createdAt)],
);

// Fixed-window counters shared by every app instance. Keys are HMACs of the client address, never raw IPs.
export const leadRateLimits = pgTable(
  "lead_rate_limits",
  {
    bucketKey: text("bucket_key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    hits: integer("hits").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.bucketKey, table.windowStart] }), index("lead_rate_limits_window_idx").on(table.windowStart)],
);
