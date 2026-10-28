import { z } from "zod";
import { MemoryRateLimiter, platformClientIp } from "./request-guards";
import { normaliseEmail, saveWaitlistEntry, type PoolLike } from "./waitlist-store.mjs";

const listField = z.union([z.string().max(80), z.array(z.string().max(80)).max(10)]).optional();

export const waitlistSchema = z.object({
  email: z.email().max(320),
  // The form shows a notice (draft wording, pending legal review) and sends consent: true with every signup.
  consent: z.literal(true),
  name: z.string().trim().max(80).optional(),
  events: listField,
  policies: listField,
  location: z.enum(["hero", "closing"]),
  company_website: z.string().max(0).optional().default(""),
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(180).optional(),
  utm_content: z.string().max(180).optional(),
  utm_term: z.string().max(180).optional(),
  gclid: z.string().max(250).optional(),
  fbclid: z.string().max(250).optional(),
});

type WaitlistInput = z.infer<typeof waitlistSchema>;

export type WaitlistDeps = {
  getPool: () => PoolLike | null;
  env: { NODE_ENV?: string };
  limiter: MemoryRateLimiter;
  devLeads: Map<string, WaitlistInput>;
  logError: (message: string, code: string) => void;
};

const MESSAGES = {
  saved: "You’re on the list.",
  invalid: "Enter a valid email address.",
  consent: "Please accept the notice to join the list.",
  tooMany: "Too many attempts. Try again in a minute.",
  unavailable: "We could not save that right now. Please try again.",
} as const;

const asList = (value: string | string[] | undefined) => (value ? (Array.isArray(value) ? value : [value]) : []);

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") return error.code;
  return error instanceof Error ? error.name : "unknown";
}

export function createWaitlistHandler(deps: WaitlistDeps) {
  return async function POST(request: Request): Promise<Response> {
    if (deps.limiter.hit(platformClientIp(request.headers))) return Response.json({ message: MESSAGES.tooMany }, { status: 429 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: MESSAGES.invalid }, { status: 400 });
    }
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      const consentMissing = parsed.error.issues.some((issue) => issue.path[0] === "consent");
      return Response.json({ message: consentMissing ? MESSAGES.consent : MESSAGES.invalid }, { status: 400 });
    }
    const input = parsed.data;

    try {
      const pool = deps.getPool();
      if (!pool) {
        if (deps.env.NODE_ENV === "production") throw new Error("Waitlist storage is not configured.");
        deps.devLeads.set(normaliseEmail(input.email), input);
        return Response.json({ message: MESSAGES.saved }, { status: 201 });
      }
      const result = await saveWaitlistEntry(pool, {
        email: input.email,
        firstName: input.name || null,
        events: asList(input.events),
        policies: asList(input.policies),
        location: input.location,
        attribution: {
          utm_source: input.utm_source,
          utm_medium: input.utm_medium,
          utm_campaign: input.utm_campaign,
          utm_content: input.utm_content,
          utm_term: input.utm_term,
          gclid: input.gclid,
          fbclid: input.fbclid,
        },
        consentSource: `website:${input.location}`,
      });
      if (result.status === "throttled") return Response.json({ message: MESSAGES.tooMany }, { status: 429 });
      return Response.json({ message: MESSAGES.saved }, { status: 201 });
    } catch (error) {
      deps.logError("Waitlist signup failed", errorCode(error));
      return Response.json({ message: MESSAGES.unavailable }, { status: 503 });
    }
  };
}
