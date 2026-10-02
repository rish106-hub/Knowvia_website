import * as z from "zod/mini";

// zod/mini keeps the client bundle small; jitless avoids its eval feature probe (blocked by our CSP).
z.config({ jitless: true });

// The only analytics events this site may send. Properties are enums or bounded slugs:
// never form content, email, names, free text, insurance data or raw identifiers.

const slug = z.string().check(z.regex(/^[a-z0-9-]{1,80}$/));
const placement = z.enum(["hero", "guide", "article", "footer", "page"]);
const audience = z.enum(["family", "team"]);

export const analyticsEventSchemas = {
  hero_cta_clicked: z.strictObject({ cta: z.enum(["join_early_access", "see_how_it_works"]) }),
  audience_selected: z.strictObject({ audience, surface: z.enum(["hero", "guide", "walkthrough"]) }),
  journey_step_viewed: z.strictObject({ journey: audience, step: z.int().check(z.minimum(1), z.maximum(6)) }),
  guide_opened: z.strictObject({}),
  lead_form_started: z.strictObject({ placement }),
  lead_form_submitted: z.strictObject({
    placement,
    audience: z.enum(["hr", "individual", "other"]),
    intent: z.enum(["newsletter", "launch_updates", "policy_clarity"]),
  }),
  newsletter_verified: z.strictObject({}),
  article_opened: z.strictObject({ slug }),
  consent_updated: z.strictObject({ analytics: z.boolean(), advertising: z.boolean() }),
} as const;

export type AnalyticsEventName = keyof typeof analyticsEventSchemas;
export type AnalyticsEventProps<Name extends AnalyticsEventName> = z.infer<(typeof analyticsEventSchemas)[Name]>;

/** Returns validated properties, or null when the event or any property is not allowlisted. */
export function validateAnalyticsEvent<Name extends AnalyticsEventName>(
  name: Name,
  props: unknown,
): AnalyticsEventProps<Name> | null {
  const schema = analyticsEventSchemas[name];
  if (!schema) return null;
  const parsed = schema.safeParse(props ?? {});
  return parsed.success ? (parsed.data as AnalyticsEventProps<Name>) : null;
}

/** Strips query strings and fragments, which can carry tokens or campaign identifiers. */
export function pathOnly(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, "https://placeholder.invalid");
    return parsed.origin === "https://placeholder.invalid" ? parsed.pathname : `${parsed.origin}${parsed.pathname}`;
  } catch {
    return undefined;
  }
}

/** Paths whose events must never be sent (they carry one-time tokens). */
export function isSensitivePath(pathname: string): boolean {
  return pathname.startsWith("/confirm") || pathname.startsWith("/unsubscribe");
}
