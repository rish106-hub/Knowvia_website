# Knowvia Website

A modern, privacy-first marketing website for Knowvia - an insurance education platform helping families and teams understand health insurance policies in India.

## Overview

This is the public-facing website for Knowvia, completely separate from the Knowvia product (CoverSaath repository). It features:

- **Marketing Pages**: Comprehensive landing pages for families, employers, and teams
- **Synthetic Product Walkthroughs**: Interactive demos showcasing insurance concepts
- **Educational Guides**: Six well-researched guides on insurance topics with cited sources
- **Lead Capture System**: Consent-driven, double-opt-in early access list with privacy protections
- **Blog Platform**: Content management for insurance education articles
- **Motion Design**: Animated components and interactive elements for enhanced user experience

## Tech Stack

### Core Framework
- **Next.js 16** (App Router, static pages, server components)
- **React 19** (latest features and performance improvements)
- **TypeScript** (type safety across the codebase)

### Database & ORM
- **PostgreSQL** (lead storage and consent tracking)
- **Drizzle ORM** (type-safe database queries)
- **pg** (PostgreSQL client)

### Third-Party Services
- **Resend** (transactional email for confirmations)
- **Cloudflare Turnstile** (bot protection and CAPTCHA)
- **PostHog** (analytics, loaded only after consent)
- **Google Ads** (conversion tracking, loaded only after consent)

### Testing & Quality
- **Vitest** (unit tests)
- **Playwright** (end-to-end tests, accessibility testing)
- **@axe-core/playwright** (WCAG 2.2 AA compliance)
- **ESLint** (code linting with Next.js and React hooks rules)

### Development Tools
- **Drizzle Kit** (database migrations)
- **TypeScript** (static type checking)
- **PGlite** (in-memory Postgres for testing)

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── about/              # About page
│   │   ├── blog/               # Blog listing and article pages
│   │   ├── for-employers/      # Employer-focused landing page
│   │   ├── for-families/       # Family-focused landing page
│   │   ├── how-it-works/       # How the platform works
│   │   ├── trust/              # Trust and security page
│   │   ├── privacy/            # Privacy policy
│   │   ├── terms/              # Terms of service
│   │   ├── cookies/            # Cookie policy
│   │   ├── api/                # API routes
│   │   │   ├── public/v1/leads/      # Lead capture endpoints
│   │   │   └── internal/              # Internal retention job
│   │   └── confirm/            # Email confirmation page
│   ├── components/
│   │   ├── consent/            # Cookie consent management
│   │   ├── guide/              # Guide display components
│   │   ├── home/               # Homepage-specific components
│   │   ├── layout/             # Layout components
│   │   ├── leads/              # Lead capture forms
│   │   ├── marketing/          # Marketing components (Hero, features, etc.)
│   │   ├── media/              # Media (video, image) components
│   │   ├── motion/             # Animation and motion components
│   │   ├── route/              # Route-specific components
│   │   └── site/               # Site-wide components (Header, Footer)
│   ├── content/
│   │   ├── articles.ts         # Educational articles content
│   │   ├── sources.ts          # Source citations for articles
│   │   ├── evidence.ts         # Partner marks and research claims
│   │   ├── videos.ts           # Video content metadata
│   │   └── walkthrough-videos.ts # Walkthrough video data
│   ├── features/
│   │   └── marketing/          # Feature-rich marketing components
│   │       ├── CashScenarioDemo.tsx
│   │       ├── Walkthrough.tsx
│   │       └── demo-data.ts
│   └── lib/
│       ├── analytics/          # PostHog and Google Analytics integration
│       ├── consent/            # Consent management logic
│       ├── db/                 # Database schema and connection
│       ├── leads/              # Lead capture business logic
│       ├── seo.tsx             # SEO metadata generation
│       └── site.ts             # Site configuration
├── docs/
│   ├── security.md             # Security model and threat analysis
│   └── iterations/             # Development iteration notes
├── drizzle/                    # Database migrations
├── public/                     # Static assets
│   ├── support/                # Partner logos and images
│   ├── videos/                 # Video files
│   └── walkthroughs/           # Walkthrough assets
└── tests/
    ├── e2e/                    # Playwright end-to-end tests
    └── unit/                   # Vitest unit tests
```

## Key Features

### Privacy & Security
- **Consent-First Analytics**: PostHog and Google Ads load only after explicit user consent
- **Encrypted Lead Storage**: Email addresses encrypted with AES-256-GCM
- **Rate Limiting**: Database-backed rate limiting to prevent abuse
- **CSP Protection**: Content Security Policy to prevent XSS attacks
- **No User-Generated Content**: Static rendering eliminates XSS risks from user input

### Lead Capture System
- **Double Opt-In**: Email confirmation required before subscription
- **Bot Protection**: Cloudflare Turnstile integration
- **Idempotency**: Prevents duplicate submissions
- **Unsubscribe Support**: Easy opt-out with HMAC-signed links
- **Data Retention**: Automated cleanup of expired leads

### Content Management
- **Sourced Articles**: Every regulatory statement cites a primary source
- **Partner Evidence**: Partner marks and research claims tracked with provenance
- **Approved Quotes**: Testimonials only shown with explicit consent records
- **Synthetic Demos**: All walkthrough data is clearly labeled as synthetic

### Accessibility
- **WCAG 2.2 AA**: Compliance tested with @axe-core/playwright
- **Keyboard Navigation**: Full keyboard support tested
- **Responsive Design**: Tested from 320px to 1280px widths
- **Text Scaling**: Tested at 200% text size

## Run Locally

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

## Development Workflow

### Prerequisites
- Node.js >= 22.12
- PostgreSQL database (or use PGlite for local testing)
- Environment variables configured

### Setting Up

1. **Install dependencies**
```bash
npm ci
```

2. **Configure environment**
```bash
cp .env.example .env.local
# Fill in required variables for your environment
```

3. **Set up database**
```bash
npm run db:migrate
```

4. **Start development server**
```bash
npm run dev
# Visit http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run unit tests with Vitest |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run db:generate` | Generate database migrations |
| `npm run db:migrate` | Apply database migrations |
| `npm run check` | Run all checks (lint, typecheck, test, build) |

### Lead Capture Local Development

For lead capture to work locally, you need:
- `DATABASE_URL` - PostgreSQL connection string
- `LEAD_EMAIL_ENCRYPTION_KEY` - Generate with `openssl rand -base64 32`
- `LEAD_EMAIL_HMAC_KEY` - Generate with `openssl rand -base64 32`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Use test key: `1x00000000000000000000AA`
- `TURNSTILE_SECRET_KEY` - Use test key: `1x0000000000000000000000000000000AA`

Without `RESEND_API_KEY`, the confirmation link is printed to the server log instead of being sent via email.

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

## Testing Strategy

### Unit Tests
- Consent logic validation
- Analytics event allowlist verification
- Content integrity checks
- Cash scenario calculations
- Lead API contract tests against in-memory Postgres (PGlite)

### End-to-End Tests
- All pages render correctly at desktop and mobile viewports
- WCAG 2.2 AA accessibility compliance (@axe-core/playwright)
- No JavaScript console errors
- Proper metadata and headers
- Consent network request validation
- Keyboard navigation testing
- Form state testing
- Responsive layout (320px to 1280px widths)
- 200% text scaling support

### Running Tests
```bash
# Unit tests only
npm test

# Full E2E test suite (builds with test analytics IDs)
npm run test:e2e

# All checks together
npm run check
```

## Environment Variables

### Required for Production
- `APP_ENV` - Set to `production`
- `SITE_URL` - Canonical origin (no trailing slash)
- `PRIVACY_EMAIL` - Contact email for privacy inquiries
- `RESPONSIBLE_OPERATOR_NAME` - Legal entity name
- `LEGAL_REVIEW_APPROVED` - Must be `true` after legal review

### Lead Capture (Optional)
- `LEADS_ENABLED` - Toggle lead capture on/off
- `DATABASE_URL` - PostgreSQL connection with TLS
- `LEAD_EMAIL_ENCRYPTION_KEY` - 32-byte key for email encryption
- `LEAD_EMAIL_HMAC_KEY` - 32-byte key for email hashing
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret key
- `RESEND_API_KEY` - Resend API key for emails
- `RESEND_FROM_EMAIL` - From address for emails
- `RETENTION_JOB_TOKEN` - Bearer token for retention job

### Analytics (Optional)
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog API host
- `NEXT_PUBLIC_GOOGLE_TAG_ID` - Google Analytics/GTM ID
- `NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION` - Google Ads conversion ID

## Performance Optimization

### Build-Time Optimizations
- Static page prerendering for all public pages
- Image optimization with Next.js Image component
- CSS module code splitting
- Tree shaking for unused code

### Runtime Optimizations
- Database connection pooling (max 5 connections)
- Rate limiting to prevent abuse
- CDN-friendly caching headers
- Minimal JavaScript bundles

### CDN Caching Strategy
- `/_next/static/*` - Cache as immutable
- `/support/*` - Cache as immutable (partner logos)
- Pages - Send `s-maxage` for CDN caching
- `/api/*` - Never cache (send `no-store`)
- `/confirm` and `/unsubscribe` - Never cache (send `no-store`)

## Security Considerations

### Threat Model
See `docs/security.md` for a detailed threat model including:
- Asset protection and trust boundaries
- Lead API security controls
- Content Security Policy decisions
- Consent implementation details

### Key Security Features
- **Email Encryption**: AES-256-GCM envelope encryption for stored emails
- **Hash-based Lookup**: HMAC-SHA256 for email deduplication (not plain hashes)
- **Secure Tokens**: Random 32-byte confirmation tokens, SHA-256 hashed
- **Same-Origin Enforcement**: No CORS headers, browser-enforced same-origin
- **Input Validation**: Strict Zod schemas with unknown key rejection
- **Rate Limiting**: Database-backed per-IP rate limiting
- **Enumeration Safety**: Generic error messages prevent email enumeration

### Production Checklist
- [ ] Indian legal review of `/privacy`, `/terms`, `/cookies`
- [ ] Provider data-processing terms (Resend, PostHog, Cloudflare, Google)
- [ ] Database TLS configuration (`?sslmode=require`)
- [ ] Automated backups configured
- [ ] WAF rule for lead endpoint
- [ ] Key rotation runbook documented
- [ ] Monitoring and alerting for 5xx and 429 rates
- [ ] SPF, DKIM, DMARC configured for email domain

## Troubleshooting

### Build Fails
- Ensure all required environment variables are set
- Check that `LEGAL_REVIEW_APPROVED=true` for production builds
- Verify Node.js version >= 22.12

### Lead Capture Not Working
- Verify `LEADS_ENABLED=true`
- Check database connection with `DATABASE_URL`
- Ensure Turnstile keys are correct
- Check Resend API key is valid

### Tests Failing
- Ensure database migrations are applied: `npm run db:migrate`
- Check that test environment variables are set
- Verify all dependencies are installed: `npm ci`

## Contributing

This is a production website with strict requirements:
- All regulatory statements must cite sources
- Partner marks must be in `src/content/evidence.ts`
- Never introduce user-generated content features
- Follow existing code patterns and conventions
- Run `npm run check` before committing
- Ensure accessibility compliance (WCAG 2.2 AA)

## License

Proprietary - All rights reserved.

## Support

For questions about:
- **Deployment**: See deployment section above
- **Security**: Review `docs/security.md`
- **Development**: Check AGENTS.md for project-specific guidelines

See `docs/security.md` for the threat model and the CSP decision, and `docs/iterations/LATEST.md` for status.
