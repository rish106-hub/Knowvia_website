# Knowvia website

Public website for Knowvia: marketing pages, synthetic product walkthroughs, six sourced guides, and a consented,
double-opt-in early-access list. It is separate from the Knowvia product (the CoverSaath repository) and never calls
its API.

Stack: Next.js 16 (App Router, static pages), React 19, TypeScript, Drizzle + `pg` for the lead store, Resend for
email, Cloudflare Turnstile for bot checks, PostHog and Google Ads only after consent.

## Run locally

```bash
npm ci
cp .env.example .env.local   # fill in what you need; lead capture stays off until its variables are set
npm run dev                  # http://localhost:3000
```

Lead capture locally needs a Postgres `DATABASE_URL`, the three `LEAD_EMAIL_*` keys (`openssl rand -base64 32`) and
Turnstile test keys (in `.env.example`). Without `RESEND_API_KEY`, development prints the confirmation link to the
server log instead of sending email. Apply the schema with `npm run db:migrate`.

## Checks

| Command | What it proves |
|---|---|
| `npm run lint` | ESLint (Next.js + React hooks rules) |
| `npm run typecheck` | Route types and TypeScript |
| `npm test` | Unit and contract tests: consent, analytics allowlist, content, cash scenario, lead API against a real Postgres engine (PGlite) |
| `npm run build` | Production build; all public pages prerender |
| `npm run test:e2e` | Builds with test-only analytics IDs, then Playwright: every page at desktop and phone, axe WCAG 2.2 AA, no script errors, metadata, headers, consent network proof, keyboard, form states, 320–1280px widths, 200% text |
| `npm run check` | lint + typecheck + test + build |

## Deploy (EC2, Google Cloud or Azure)

The `Dockerfile` builds a standalone Node server (port 8080, non-root, `/api/health` health check).

1. **Database.** Any managed Postgres: Neon, Amazon RDS, Cloud SQL or Azure Database for PostgreSQL. Use TLS
   (`?sslmode=require`), a separate database or schema for leads, automated backups, and run `npm run db:migrate`
   from CI or a one-off task with a migration-capable connection.
2. **Build the image per environment.** `APP_ENV`, `SITE_URL`, `PRIVACY_EMAIL`, `RESPONSIBLE_OPERATOR_NAME`,
   `LEGAL_REVIEW_APPROVED` and every `NEXT_PUBLIC_*` value are build arguments, because static pages are rendered at
   build time:
   ```bash
   docker build -t knowvia-website \
     --build-arg APP_ENV=preview --build-arg SITE_URL=https://preview.example.com \
     --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=... .
   ```
   A production build fails on purpose until the domain, privacy contact, operator name and
   `LEGAL_REVIEW_APPROVED=true` are set.
3. **Run** with the same non-secret values plus secrets as runtime environment variables from the cloud secret
   manager (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault): `DATABASE_URL`, `LEAD_EMAIL_*`,
   `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RETENTION_JOB_TOKEN`.
   - AWS: ECS/Fargate or EC2 behind an Application Load Balancer, CloudFront in front, AWS WAF.
   - Google Cloud: Cloud Run behind an HTTPS load balancer with Cloud CDN and Cloud Armor.
   - Azure: Container Apps behind Front Door with WAF.
4. **Proxy and rate limits.** `TRUSTED_PROXY_HOPS` is how many proxies you operate between the visitor and the app:
   - EC2 or ECS behind one ALB: `1`. CloudFront in front of the ALB: `2`.
   - Cloud Run directly: `1`. Global HTTPS load balancer in front of Cloud Run: `2`.
   - Azure Container Apps ingress: `1`. Front Door in front of it: `2`.
   Never expose the container port directly; requests without a resolvable address share one bucket. Also add a WAF
   rate rule for `POST /api/public/v1/leads` (for example 20 requests per 5 minutes per IP). The app enforces 10
   submissions per 10 minutes per client address, shared across instances through the database.
5. **CDN caching.** Cache `/_next/static/*` and `/support/*` as immutable. Pages send `s-maxage`; never cache
   `/api/*`, `/confirm` or `/unsubscribe` (they send `no-store`).
6. **Retention job.** Schedule a daily call (cron on EC2, Cloud Scheduler, or an Azure Container Apps job):
   `curl -X POST -H "Authorization: Bearer $RETENTION_JOB_TOKEN" https://<site>/api/internal/retention`
7. **Providers.** Verify the sending domain in Resend (SPF, DKIM, DMARC). In PostHog, enable "Discard client IP
   data" and keep session replay off. Configure Google Ads only after legal review.

## Kill switches

- `LEADS_ENABLED=false`: the lead API returns 503 and the form shows a retry message.
- Unset `NEXT_PUBLIC_POSTHOG_KEY` or `NEXT_PUBLIC_GOOGLE_TAG_ID` and rebuild: that provider can never load.
- Roll back by redeploying the previous image. The schema is additive; never drop lead or consent tables in a
  rollback.

## Content rules

- Every regulatory statement in `src/content/articles.ts` cites a source in `src/content/sources.ts`.
- Partner marks and research claims come only from `src/content/evidence.ts`, with provenance recorded.
- Quotes appear only when `approvedQuotes` has a record with consent date and permissions.
- Walkthrough data in `src/features/marketing/demo-data.ts` is invented and is always labelled "Synthetic example".

See `docs/security.md` for the threat model and the CSP decision, and `docs/iterations/LATEST.md` for status.
