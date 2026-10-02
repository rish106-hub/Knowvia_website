import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

// Third-party origins are allowed only when their provider is configured.
const posthogOrigin = originOf(process.env.NEXT_PUBLIC_POSTHOG_HOST);
const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_TAG_ID);
const turnstile = "https://challenges.cloudflare.com";
const google = googleEnabled
  ? [
      "https://www.googletagmanager.com",
      "https://www.google.com",
      "https://googleads.g.doubleclick.net",
      "https://www.googleadservices.com",
    ]
  : [];

// Static pages are served from the CDN, so a per-request nonce is not possible. App Router
// streams inline bootstrap scripts, which requires 'unsafe-inline' for scripts. The site renders
// no user-supplied HTML; JSON-LD is serialised with escaping. See docs/security.md.
const contentSecurityPolicy = [
  "default-src 'self'",
  ["script-src 'self' 'unsafe-inline'", isDev ? "'unsafe-eval'" : "", turnstile, ...google]
    .filter(Boolean)
    .join(" "),
  "style-src 'self' 'unsafe-inline'",
  ["img-src 'self' data: blob:", ...google].join(" "),
  "font-src 'self'",
  ["connect-src 'self'", posthogOrigin ?? "", ...google, isDev ? "ws:" : ""].filter(Boolean).join(" "),
  `frame-src ${turnstile}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  isDev ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  // Vercel serves HTTPS only. Browsers ignore HSTS on plain-HTTP localhost.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (EC2, Cloud Run, Azure Container Apps).
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Token-bearing pages must not leak their URL through Referer or be cached.
        source: "/:page(confirm|unsubscribe)",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/workspace",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
