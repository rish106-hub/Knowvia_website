# Latest iteration — Knowvia website build

**Date:** 2026-10-02
**Status:** PARTIAL — site and lead pipeline built and verified locally; production gated on legal review and provider accounts.
**CERT:** READY for preview (see `docs/exec-plans/active/knowvia-website-intake.md`, CERT update).

## Built

- Next.js 16.3.8 App Router, React 19.2.8, TypeScript; every public page prerendered as static HTML.
- Routes: `/`, `/for-families`, `/for-employers`, `/how-it-works`, `/blog` + six sourced guides, `/about`, `/trust`,
  `/privacy`, `/terms`, `/cookies`, `/confirm`, `/unsubscribe`, `/workspace` (noindex placeholder, 404 in production).
- CSS-3D "route to clarity" hero (no JavaScript needed, static under reduced motion); synthetic family and HR
  walkthroughs with a tested cash-scenario calculator; "With support from" strip with official logos.
- Consent manager (equal Accept / Reject / Manage), PostHog and Google Ads load only after consent; allowlisted events.
- Fixed-action floating guide; light/dark theme with pre-paint init.
- Lead API: strict schema, same-origin, 4 KB streamed cap, idempotency keys, DB-backed rate limit (fail closed),
  Turnstile, AES-GCM email + HMAC lookup, double opt-in via Resend sent after the response, single-use 72 h tokens,
  signed one-click unsubscribe with erasure, retention endpoint. Drizzle migration `drizzle/0000_lead_store.sql`.
- Security headers and CSP (decision in `docs/security.md`); Dockerfile for EC2 / Cloud Run / Azure Container Apps.

## Verification evidence

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm test` | 66 passed (content, consent, analytics allowlist, cash scenario, lead API on PGlite Postgres) |
| `npm run build` | passes; production build correctly refuses without domain, privacy email, operator, legal approval |
| `npm run test:e2e` | 87 passed, 1 skipped (keyboard skip-link on phone profile): axe WCAG 2.2 AA on all 16 public pages at desktop and 360 px, no script errors, headers, consent network proof, keyboard, form states, 320–1280 px, 200% text |
| Lighthouse (mobile, DevTools throttling) | Performance 100, Accessibility 100, Best practices 96; LCP 1.5 s, CLS 0, TBT 10–30 ms. Simulated mode estimates LCP 3.8 s. SEO 69 only because non-production is noindex |
| Standalone server smoke | health, pages, assets, sitemap 200; lead API fails closed (503) without config |

## Independent review

Separate read-only reviewer: no critical findings. Fixed: retention clock and suppression on re-signup (F1), rate
limit fail-closed and proxy-hop guidance (F2), production could fall back to console mailer (F3), PostHog `$opt_in`
event and reset ordering (F4), enumeration via timing (F5, email now sent after response), unbounded body read (F6),
trust-page tense and privacy-notice retention wording. Kept: ABHA "every instance" wording, verified against the
circular text.

## Not done / next actions

1. Create the private GitHub repository and push (needs the owner's GitHub login; `gh` is not installed here).
2. Provision Postgres, Resend domain, Turnstile, PostHog (discard IPs), Google Ads; run `npm run db:migrate`.
3. Indian legal review of privacy, terms, cookies; then set `LEGAL_REVIEW_APPROVED=true`.
4. Name an expert reviewer for the guides (currently "pending" on each article).
5. Real-Postgres concurrency test, backup restore drill, WAF rule, load test against a defined workload (SCALE = BLOCKED).
6. Docker image build is untested here (Docker not installed); the standalone server it packages was smoke-tested.
7. In CoverSaath, the old `knowvia-website/` folder and `knowvia-website` branch remain; delete them when ready.
