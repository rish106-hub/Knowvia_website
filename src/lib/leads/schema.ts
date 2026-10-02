import { z } from "zod";
import { LEAD_NOTICE_VERSION } from "./notice";

// Contract for POST /api/public/v1/leads. Unknown keys are rejected at every level.

export { LEAD_NOTICE_VERSION };
export const MAX_LEAD_BODY_BYTES = 4096;

export const leadAudiences = ["hr", "individual", "other"] as const;
export const leadIntents = ["newsletter", "launch_updates", "policy_clarity"] as const;
export const leadPlacements = ["hero", "guide", "article", "footer"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // Letters, marks, digits, spaces and common punctuation in names and organisations.
    .regex(/^[\p{L}\p{M}\p{N} .,'&()\-/]*$/u, "Use letters, numbers and simple punctuation")
    .optional()
    .transform((value) => (value ? value : undefined));

export const leadRequestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(254)
      .pipe(z.email({ message: "Enter a valid email address" }))
      .transform((value) => value.toLowerCase()),
    audience: z.enum(leadAudiences),
    intent: z.enum(leadIntents),
    noticeVersion: z.literal(LEAD_NOTICE_VERSION),
    marketingConsent: z.literal(true),
    ageConfirmed: z.literal(true),
    turnstileToken: z.string().min(1).max(2048),
    name: optionalText(80),
    role: optionalText(80),
    organisation: optionalText(120),
    source: z
      .object({
        page: z
          .string()
          .max(200)
          .regex(/^\/[A-Za-z0-9/_-]*$/, "Page must be a site path"),
        placement: z.enum(leadPlacements),
        utmSource: z
          .string()
          .max(64)
          .regex(/^[A-Za-z0-9._-]+$/)
          .optional(),
      })
      .strict(),
  })
  .strict();

export type LeadRequest = z.infer<typeof leadRequestSchema>;

export const leadTokenSchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict();

export const idempotencyKeySchema = z.uuid();
