// Public, non-secret site configuration. Values here may appear in HTML.

// APP_ENV is set by the deployment: development (default), preview or production.
export const appEnv = (process.env.APP_ENV ?? "development") as "development" | "preview" | "production";

export const isProductionDeploy = appEnv === "production";

function resolveSiteUrl(): string {
  const configured = process.env.SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "Knowvia",
  url: resolveSiteUrl(),
  tagline: "Know your cover. Before you need it.",
  description:
    "Understand all your health insurance in one place: what is covered, what needs checking and what to do next.",
  privacyEmail: process.env.PRIVACY_EMAIL?.trim() || null,
  operatorName: process.env.RESPONSIBLE_OPERATOR_NAME?.trim() || null,
  // Search engines index only the production deployment.
  indexable: isProductionDeploy,
  locale: "en_IN",
  legalReviewApproved: process.env.LEGAL_REVIEW_APPROVED === "true",
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, `${siteConfig.url}/`).toString();
}

/**
 * Production launch gate. A production build fails until the operator identity,
 * canonical domain and privacy contact exist, so legal pages never ship with blanks.
 */
export function assertProductionConfig(): void {
  if (!isProductionDeploy) return;
  const missing: string[] = ["SITE_URL", "PRIVACY_EMAIL", "RESPONSIBLE_OPERATOR_NAME"].filter(
    (name) => !process.env[name]?.trim(),
  );
  if (process.env.LEGAL_REVIEW_APPROVED !== "true") missing.push("LEGAL_REVIEW_APPROVED=true (after Indian legal review)");
  if (missing.length > 0) {
    throw new Error(`Production build blocked. Missing configuration: ${missing.join(", ")}`);
  }
}

export const primaryNav = [
  { href: "/for-families", label: "For families" },
  { href: "/for-employers", label: "For employers" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Guides" },
  { href: "/trust", label: "Trust" },
] as const;

export const footerNav = [
  { href: "/about", label: "About" },
  { href: "/trust", label: "Trust and security" },
  { href: "/privacy", label: "Privacy notice" },
  { href: "/terms", label: "Terms of use" },
  { href: "/cookies", label: "Cookie notice" },
] as const;
