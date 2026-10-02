CREATE TABLE "lead_consent_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"event" text NOT NULL,
	"notice_version" text,
	"source_page" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_consent_events_event_check" CHECK ("lead_consent_events"."event" in ('submitted', 'confirmed', 'unsubscribed'))
);
--> statement-breakpoint
CREATE TABLE "lead_idempotency_keys" (
	"key" uuid PRIMARY KEY NOT NULL,
	"request_fingerprint" text NOT NULL,
	"response_status" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_rate_limits" (
	"bucket_key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "lead_rate_limits_bucket_key_window_start_pk" PRIMARY KEY("bucket_key","window_start")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_hash" text NOT NULL,
	"email_ciphertext" text,
	"name" text,
	"role" text,
	"organisation" text,
	"audience" text NOT NULL,
	"intent" text NOT NULL,
	"status" text NOT NULL,
	"notice_version" text NOT NULL,
	"source_page" text NOT NULL,
	"source_placement" text NOT NULL,
	"utm_source" text,
	"confirmation_token_hash" text,
	"confirmation_expires_at" timestamp with time zone,
	"confirmation_sent_at" timestamp with time zone,
	"email_delivery_status" text DEFAULT 'not_sent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "leads_email_hash_unique" UNIQUE("email_hash"),
	CONSTRAINT "leads_confirmation_token_hash_unique" UNIQUE("confirmation_token_hash"),
	CONSTRAINT "leads_status_check" CHECK ("leads"."status" in ('pending', 'confirmed', 'unsubscribed')),
	CONSTRAINT "leads_audience_check" CHECK ("leads"."audience" in ('hr', 'individual', 'other')),
	CONSTRAINT "leads_intent_check" CHECK ("leads"."intent" in ('newsletter', 'launch_updates', 'policy_clarity')),
	CONSTRAINT "leads_placement_check" CHECK ("leads"."source_placement" in ('hero', 'guide', 'article', 'footer')),
	CONSTRAINT "leads_delivery_check" CHECK ("leads"."email_delivery_status" in ('not_sent', 'sent', 'failed')),
	CONSTRAINT "leads_unsubscribed_erased_check" CHECK ("leads"."status" <> 'unsubscribed' or ("leads"."email_ciphertext" is null and "leads"."name" is null and "leads"."role" is null and "leads"."organisation" is null)),
	CONSTRAINT "leads_active_has_email_check" CHECK ("leads"."status" = 'unsubscribed' or "leads"."email_ciphertext" is not null)
);
--> statement-breakpoint
ALTER TABLE "lead_consent_events" ADD CONSTRAINT "lead_consent_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_consent_events_lead_idx" ON "lead_consent_events" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_idempotency_created_idx" ON "lead_idempotency_keys" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_rate_limits_window_idx" ON "lead_rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "leads_status_created_idx" ON "leads" USING btree ("status","created_at");