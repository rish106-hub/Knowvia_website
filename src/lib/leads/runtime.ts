import "server-only";
import { after } from "next/server";
import { getLeadDatabase } from "@/lib/db/client";
import { siteConfig } from "@/lib/site";
import { readLeadConfig } from "./config";
import { createDevelopmentSender, createResendSender } from "./email";
import type { LeadServiceDeps } from "./service";
import { LeadStore } from "./store";
import { createTurnstileVerifier } from "./turnstile";

export function getLeadServiceDeps(): LeadServiceDeps | null {
  const result = readLeadConfig();
  if (!result.enabled) return null;
  const { config } = result;
  return {
    store: new LeadStore(getLeadDatabase(config.databaseUrl)),
    verifyTurnstile: createTurnstileVerifier(config.turnstileSecretKey),
    sendConfirmation:
      config.email.kind === "resend" ? createResendSender(config.email.apiKey, config.email.from) : createDevelopmentSender(),
    keys: config.keys,
    keyring: config.keyring,
    siteUrl: siteConfig.url,
    defer: (task) => after(task),
  };
}

/**
 * Client address from the load balancer's X-Forwarded-For. TRUSTED_PROXY_HOPS is the number of
 * proxies you operate in front of the app (1 for a single ALB, Cloud Run or Front Door).
 */
export function clientAddressFrom(headers: Headers, env: NodeJS.ProcessEnv = process.env): string | null {
  const hops = Number(env.TRUSTED_PROXY_HOPS ?? 1);
  if (!Number.isInteger(hops) || hops < 1) return null;
  const chain = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (chain.length < hops) return null;
  return chain[chain.length - hops] ?? null;
}

/** Rejects cross-site browser posts. Requests without an Origin header (server-to-server) are refused too. */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(siteConfig.url).origin;
  } catch {
    return false;
  }
}
