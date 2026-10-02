# Security and privacy notes

## Assets and trust boundaries

| Asset | Where | Protection |
|---|---|---|
| Lead email addresses | `leads.email_ciphertext` | AES-256-GCM envelope `v1.<keyId>.<iv>.<ct>.<tag>`, AAD binds version and key id; key only in the server environment |
| Lookup and deduplication | `leads.email_hash` | HMAC-SHA256 with a separate key; never a plain hash |
| Confirmation tokens | `leads.confirmation_token_hash` | 32 random bytes, only SHA-256 stored, 72-hour expiry, single use, cleared on confirm or resend |
| Unsubscribe links | URL `lead` + `sig` | HMAC over the lead id, constant-time compare |
| Rate-limit counters | `lead_rate_limits` | HMAC of client address, deleted within 24 hours |
| Consent choice | `kv_consent` cookie | First-party, `SameSite=Lax`, `Secure` on HTTPS, versioned |

Untrusted inputs: request bodies, headers (`Origin`, `X-Forwarded-For`, `Idempotency-Key`), query strings on
`/confirm` and `/unsubscribe`, Turnstile and Resend responses.

## Lead API controls

- Same-origin check against `SITE_URL` (no CORS headers are ever sent, so browsers block cross-origin reads).
- `application/json` only, 4 KB body limit, strict Zod schema with unknown keys rejected at every level.
- Required UUID `Idempotency-Key`; same key with different content returns 409. Successful responses are replayed
  without a second email. The single-use Turnstile token is excluded from the request fingerprint.
- Database-backed fixed-window rate limit per client address, then server-side Turnstile verification (5-second
  timeout, fail closed).
- Enumeration-safe: new, pending and confirmed addresses all receive `202 verification_pending`. Resends are throttled
  to one per 10 minutes; confirmed addresses are never emailed again.
- Email provider failure returns 503 (retryable) and is not cached as idempotent. A known limitation: during an email
  outage, a confirmed address still gets 202 while a new one gets 503. This needs an outage plus repeated probing to
  exploit and reveals only subscription status.
- Confirmation is a `POST` from the `/confirm` page, so mail link scanners cannot confirm on someone's behalf.
- Errors are generic (`invalid_request` with field names, `verification_failed`, `temporarily_unavailable`). Nothing
  logs request bodies or email addresses.

## Content Security Policy decision

Public pages are prerendered and served from a CDN, so a per-request nonce is not possible without making every page
dynamic. The App Router streams inline bootstrap scripts, so `script-src` includes `'unsafe-inline'`. All other
directives are strict: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
`frame-ancestors 'none'`, and third-party origins are added only when their provider is configured.

Mitigations: the site renders no user-supplied HTML; the only `dangerouslySetInnerHTML` uses are the fixed head
script and JSON-LD, which escapes `<`, `>` and `&`. Revisit with Next.js SRI or nonces if the site gains
user-generated content.

## Consent

- Nothing optional loads before a choice. PostHog is a dynamic import executed only after analytics consent; the
  Google tag script is injected only after advertising consent (Basic Consent Mode, defaults denied).
- PostHog: autocapture, pageviews, session replay, surveys, heatmaps, exceptions, flags and external script loading
  are all disabled; `person_profiles: "never"`; URLs are reduced to paths; no events from `/confirm` or
  `/unsubscribe` except `newsletter_verified`, which is sent without a URL.
- Events and properties are validated against an allowlist before sending.
- Browser tests prove no request reaches PostHog or Google before consent or after rejection.

## Open items before production

- Indian legal review of `/privacy`, `/terms`, `/cookies` (production build is blocked until approved).
- Provider data-processing terms and regions (Resend, PostHog, Cloudflare, Google, database host).
- Real Postgres concurrency test and a backup restore drill on the chosen database.
- WAF rule for the lead endpoint and an alert on 5xx and 429 rates.
- Key rotation runbook: add a new `LEAD_EMAIL_ENCRYPTION_KEY_ID`, move the old key to `LEAD_EMAIL_PREVIOUS_KEYS`.
  The HMAC key cannot rotate without re-hashing, so treat it as long-lived.
