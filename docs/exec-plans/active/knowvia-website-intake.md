# Knowvia public website — CERT intake and execution plan

**Date:** 2026-10-02  
**Owner:** Central integration agent  
**Task class:** S2 — public data collection, consent/analytics, encrypted personal data, third-party providers, deployment/security boundaries, and a high-volume hypothesis  
**Destination:** `knowvia-website/` only; the existing Knowvia product and its dirty backend work are out of scope  
**CERT state:** **CERT = BLOCKED**

## Decision summary

Build a separate Next.js App Router marketing site in `knowvia-website/`. It is a public acquisition and education surface, not a wrapper around the existing product. It must never call the existing SQLite API. Public copy and demonstrations are evidence-aware and synthetic; no page may imply claim approval, insurer authority, production readiness, or legal clearance of the Knowvia name.

The system design is coherent, but implementation is not yet permitted. The isolated folder has no application manifest, lockfile, installed dependency tree, framework smoke test, or integration check. The root repository's `node_modules`, `package.json`, and lockfile belong to the existing product and do not satisfy isolation. CERT becomes READY only after the exact readiness gate in [CERT-T](#cert-t--readiness-proof-and-handoff) passes and this record is updated.

## CERT-C — clarify the work

| Field | Record |
|---|---|
| Task title | Build the isolated Knowvia public website |
| North Star / business outcome | Help a household or benefits team understand Knowvia's bounded promise and take one informed, consented next step without contaminating the existing product codebase. |
| Primary users and triggers | Indian household operators comparing or trying to understand health cover; HR/benefits teams exploring an employee benefit; visitors arriving from brand, partner, article, or referral surfaces. |
| Problem today | Knowvia has product/research artifacts and an existing MVP, but no isolated, production-shaped public web surface that explains the proposition, trust boundaries, evidence, and next action. |
| Desired customer outcome | The visitor can identify the relevant audience path, understand Known / Unknown / Next, safely try a synthetic demonstration, read cited education, and opt into early access with explicit consent. |
| Success metric | A measured, consented early-access conversion event segmented by audience and intent, with no material accessibility, consent, security, or misleading-claim defect. Baseline and numeric conversion target remain to be established before launch. |
| In scope | Public routes, metadata/SEO, visual system, owned visual assets, synthetic family and HR demos, source-backed articles, consent controls, early-access API/data lifecycle, double opt-in, security headers, privacy-safe analytics, tests, and deployment-readiness documentation. |
| Non-goals | Editing or importing the existing application; calling the old SQLite API; authentication; insurer/TPA/hospital integrations; policy advice; claim decisions; free-text AI; production deployment; legal approval; claiming million-user readiness. |
| Known constraints | All writes stay under `knowvia-website/`; use exact approved hero/support/CTA copy; official support marks only; the workspace route is disabled in production and noindexed; public assertions must be source-backed; synthetic demos must be conspicuous; production secrets must never enter client bundles or logs. |
| Stakeholders | Product owner, central integration owner, frontend, backend/data, security/privacy, content/editorial, Indian legal/privacy reviewer, support-mark owners, and deployment/operator owners. |
| Principal risks | Unsupported insurance claims; ambiguous partner endorsement; trademark/domain uncertainty; consent dark patterns; PII exposure; lead enumeration; email abuse; cross-contamination with the old app; inaccessible motion; third-party outages; unproved burst capacity. |
| Open decisions | Production host/region, canonical `SITE_URL`, responsible operator identity, privacy contact, final privacy/terms/cookies text, retention duration and deletion SLA, approved official logo files/licences, final article titles/sources, analytics IDs, provider accounts/regions, and measurable conversion/performance budgets. |

### Public-page contract

- **Target customer:** families managing health-insurance responsibilities and HR/benefits teams evaluating a household-understanding benefit.
- **Message hierarchy:** exact H1 `Know your cover. Before you need it.` → exact approved supporting sentence → audience choice → how Known / Unknown / Next works → bounded proof and trust → early-access CTA.
- **Primary CTA:** `Join early access`.
- **Secondary CTA:** `See how it works`.
- **Audience choice:** family or team; the choice changes the relevant synthetic path and lead intent without implying eligibility.
- **Proof:** product mechanics, source-linked educational content, conspicuously synthetic demonstrations, and accurate acknowledgement `With support from` followed by official vector marks for Lightspeed India, Plum, and Insurance Samadhan. This wording must not be strengthened into partnership, endorsement, customer, or outcome claims.
- **Trust signals:** plain limitations, citations, source/review dates, consent controls, security/privacy pages, deterministic form behavior, and a direct privacy contact once supplied.
- **Primary objection:** “Will this tell me whether a claim is approved or replace my insurer/adviser?” Answer: no; it organizes evidence, uncertainty, and next actions.
- **Conversion event:** a valid early-access submission accepted for double opt-in. Analytics must not treat form display or attempted submission as consent or a confirmed lead.

### Accepted routes and journey

| Route | User job | Outcome and boundary |
|---|---|---|
| `/` | Understand the proposition quickly | Exact hero copy, audience choice, support strip, proof, and CTAs. |
| `/for-families` | See household relevance | Functional synthetic scenario showing Known / Unknown / Next; no real-document input. |
| `/for-employers` | Assess team benefit | Functional synthetic HR scenario; no employee or policy data collection. |
| `/how-it-works` | Understand process and limits | Evidence-first process, explicit deterministic/human boundaries, and failure/unknown states. |
| `/blog` and `/blog/[slug]` | Learn from sourced content | Six planned source-backed articles with author, reviewer, dates, citations, and Article JSON-LD. |
| `/about` | Understand entity and mission | Accurate team/operator information only; unknown facts remain placeholders blocked from production. |
| `/trust` | Inspect security/privacy/AI boundaries | Security posture without unverified certifications or guarantees. |
| `/privacy`, `/terms`, `/cookies` | Understand legal/data terms | Must be reviewed for India before production; no invented legal assurances. |
| `/workspace` | Preserve a future product entry | Noindex; disabled in production; may show a development-only gate, never the old product. |

**Happy path:** visitor chooses an audience, explores the corresponding synthetic demonstration, reads the boundary and sources, opens early access, makes an equal consent choice, submits a valid form, receives an enumeration-safe 202 response, and confirms through a double-opt-in email.

**Alternative path:** visitor declines analytics/cookies and can still access all content and submit early access; analytics requests remain absent.

**Failure path:** validation, Turnstile, database, or email-provider failure produces a safe, non-enumerating message with retry guidance. A database record must not be represented as subscribed until confirmation succeeds.

**Permission boundary:** public content is read-only. The lead endpoint accepts only allowlisted fields and server-side validation. No browser-held credential grants database, Resend, PostHog, Google, or existing-product access.

**Irreversible actions:** sending opt-in email and retaining lead data require explicit notice/consent, idempotency, auditability, suppression, deletion, and operator ownership. Production deployment requires separate approval.

**Recovery:** disable lead submission, email adapter, analytics, or the entire release independently; retain static educational pages where safe; roll back to the last verified artifact.

## CERT-E — environment and graph evidence

### Repository map and impact

- Root repomap generation succeeded: **184 code files and 1,500 call edges**.
- `impact --changed` identifies the existing dirty backend work as **HIGH risk**.
- The task-relevant graph conclusion is therefore a hard boundary: `knowvia-website/` is a new application root, with no imports, runtime calls, build output, manifests, migrations, or shared mutable files from the existing product.
- The new application is not yet represented in the graph because only these intake documents exist. Re-run map and task-specific impact after scaffolding and after final structure changes.

### Git and workspace

- Repository: `/Users/somilthakur/Desktop/Project/CoverSaath`.
- Branch observed: `claude/policy-backend`.
- Existing tracked and untracked backend changes are present. They belong to another workstream and must be preserved untouched.
- Remote observed: `origin` points to `rish106-hub/CoverSaath`.
- Current root handoff reports a policy-breakdown backend with 264 tests/build previously passing, live-provider work outstanding, and nothing committed. That evidence is historical for the dirty root state; the central agent must rerun the root gate before claiming no regression.

### Runtime, manifests, and tooling

- Node `v24.21.0`, npm `11.19.0`, and npx are callable.
- Root `package.json`/`package-lock.json` exist and root Vite `8.3.0` is installed. They belong to `knowvia-mvp`, not this new site.
- `repomap` is not globally installed. Approved use is pinned `npx -y @sylphx/repomap@1.5.0`; do not run `setup` because it modifies global editor/agent configuration.
- `docs/CERT.md` is absent; the complete mandatory CERT procedure is embedded in root `AGENTS.md` and followed here.
- The docs skill was read. Its external docs connector is unavailable, so repository-native Markdown and `apply_patch` are the approved fallback for these records.

### Targeted source and brand evidence

- `README.md` defines Knowvia as a local synthetic prototype and explicitly says it is not an adviser, staffed support service, or claims platform.
- `research/01-product.md` supplies the public brand system: Deep Tide `#163F42`, Harbour `#176F69`, Signal Gold `#E0A02B`, Mist `#F3F7F6`, Paper, Ink, Slate, Fog, Brick; calm/exact/adult/candid voice; Known / Unknown / Next; accessible type and contrast rules.
- `docs/assets/knowvia-brand-note.md` approves the exact tagline and K route/destination-mark logic.
- Existing Knowvia wordmark/logo SVGs are available as design references. No official Lightspeed India, Plum, or Insurance Samadhan vector files were located in `docs/assets`; acquisition and licence/usage verification are blocking for the support strip, and temporary text or fabricated marks are forbidden.
- `research/04-market-and-sources.md` distinguishes brand observations from causal proof, requires source-backed claims, and states that Knowvia naming still needs formal legal clearance.
- The superseded `research/06-viability-audit.md` is provenance only and must not supply current public claims.

## CERT-R — system design and capability decisions

### Architecture

```text
Browser
  ├─ Next.js App Router server/static public pages
  ├─ scoped client islands: theme, motion, synthetic demos, consent, form
  └─ POST /api/public/v1/leads
         ├─ origin/content-type/body-limit/rate controls
         ├─ Zod schema + normalized allowlist
         ├─ Turnstile verification
         ├─ idempotency and enumeration-safe response
         ├─ HMAC lookup hash + encrypted email
         ├─ Drizzle transaction → Neon Postgres
         └─ Resend adapter → double-opt-in email

Consent state
  ├─ essential-only default
  ├─ equal accept/reject/customize controls
  ├─ PostHog manual events only; no autocapture/replay
  └─ Google Basic Consent Mode; no analytics request before consent
```

### Frontend design

- Next.js `16.3.8`, React `19.3` compatible, App Router, and TypeScript.
- Default to server components/static generation. Client components are limited to interactive demos, theme/consent controls, guide, form, and necessary motion.
- Visual character: asymmetric hero, route/perspective composition, restrained information density, and the approved dials **7 / 6 / 3**. Motion must not communicate essential meaning.
- Use CSS perspective plus `motion` for route movement; provide static output before hydration and when `prefers-reduced-motion` is set.
- Use `@phosphor-icons/react` only for accessible supporting icons; no icon-only controls without names.
- Typeface: Source Sans 3, preferably self-hosted from a verified SIL Open Font License artifact; otherwise a verified compatible self-hosted sans. Do not introduce remote font calls without explicit privacy/performance approval.
- Theme: light/dark toggle with correct initial paint, keyboard operation, persisted preference, system fallback, and equivalent contrast.
- Required responsive widths: 320, 360, 390, 412, and 768 CSS pixels plus a representative desktop width. No horizontal scroll at 320px; test 200% zoom and text-spacing override.
- Three generated owned assets: route hero, Indian family scene, and Indian HR scene. Each needs provenance, alt-text decision, optimized dimensions/formats, dark/light suitability, and a static fallback. No real person or misleading documentary context.
- Floating guide exposes fixed, allowlisted actions only. It has no free text, model call, hidden prompt, or decision authority.

### Content and search design

- Six planned articles must be named in the implementation plan before writing and each must have: stable slug, explicit audience/search intent, named author and reviewer, published/updated dates, primary citations, material-limit callouts, internal links, canonical URL, Open Graph data, and Article JSON-LD matching visible facts.
- Site metadata includes accurate titles/descriptions, one H1 per page, canonical URLs derived from `SITE_URL`, robots rules, sitemap, Open Graph, and only schema supported by visible content.
- Marketing copy cannot cite the superseded viability audit or convert hypotheses, support acknowledgements, synthetic demo results, or the existing prototype into proven outcomes.

### Lead/data contract

`POST /api/public/v1/leads` accepts only:

```text
audience, intent, noticeVersion, consent, turnstileToken, source
```

The final schema must define enum values, exact lengths, normalized representation, body-size limit, unknown-key rejection, and whether the email is transported in a separately named field. The accepted brief requires encrypted email plus HMAC lookup hash, yet the supplied field list omits `email`; this contract inconsistency is an explicit blocker to implementation until resolved in the API contract. Never overload `source` or `intent` to carry an email address.

Behavior requirements:

- Server-side validation and deny-by-default field handling.
- Same-origin policy and explicit CORS denial unless a later approved origin is required.
- Turnstile verified server-side with bounded timeout and fail-closed behavior.
- Idempotency key scoped to normalized submission and notice version; concurrent duplicate tests required.
- Always return a semantically safe, enumeration-resistant `202` for accepted/already-known addresses; do not reveal subscription state.
- Encrypt email with a versioned authenticated-encryption envelope and key ID; store a separate versioned HMAC hash for lookup/deduplication. Raw email never enters logs, analytics, traces, URLs, or test fixtures.
- Drizzle schema/migrations own isolated lead, consent/audit, confirmation-token, suppression, and retention fields in Neon Lakebase Postgres. No existing SQLite access.
- Resend adapter sends double opt-in only after durable acceptance. Confirmation token must be single-use, expiry-bounded, hash-stored, and suppression-aware.
- Define retention/deletion, export/erasure process, backups, key rotation, and failed-email reconciliation before production.

### Security and privacy controls

- Content Security Policy with nonce/hash strategy compatible with Next.js and required providers; `frame-ancestors 'none'`, `object-src 'none'`, constrained `connect-src`, `form-action`, `base-uri`, and script/style sources.
- HSTS only on verified HTTPS production, plus restrictive referrer and permissions policies, MIME-sniffing protection, and explicit framing denial.
- Secret values remain server-only. Validate environment configuration at startup/build boundary without printing values.
- Rate-limit design must be selected for the deployment runtime and tested; a per-process memory limiter is not sufficient evidence for a distributed production deployment.
- Treat provider responses and article/asset sources as untrusted. Bound retries, timeouts, redirects, and response sizes.
- Privacy, terms, cookies, consent copy, operator identity, retention, subprocessors, and Indian legal basis require qualified review before production.

### Analytics contract

- PostHog: manual allowlisted events, no autocapture, no session replay, no raw form fields/PII, and no SDK network request until analytics consent.
- Google: Basic Consent Mode only; default denied, update after explicit choice, and no Advanced Consent Mode cookieless pings.
- Equal-prominence accept/reject controls and a persistent way to reopen settings.
- Suggested allowlisted events: `audience_path_selected`, `synthetic_demo_completed`, `article_opened`, `early_access_started`, `early_access_accepted`, and `consent_preference_updated`. Final property schema, business question, owner, retention, and privacy classification are required before implementation.

### AI design and scale status

- **AI DESIGN = NOT_APPLICABLE.** The shipped website uses no model, RAG, free-text assistant, or AI decision path. Generated illustrations are build-time owned media, not a runtime AI feature. The fixed-action guide is deterministic.
- **SCALE = BLOCKED.** Hypothesis: 1,000,000 arrivals in 10 minutes, mostly CDN-served, with a 1% lead rate (about 10,000 lead submissions). This is not a readiness claim. Before production, define regional distribution, RPS shape, payload sizes, SLOs/error budget, database/connection limits, Turnstile/Resend/PostHog quotas, rate-limit store, cost ceiling, abuse assumptions, and recovery objectives; then run burst, dependency-degradation, and recovery tests.

### Capability decision matrix

| Capability | Need and existing alternative | Candidate / integration | Risk and verification | Decision |
|---|---|---|---|---|
| Web framework | Indexable multi-route public site; plain static HTML would make route metadata/API integration harder | `next@16.3.8`, App Router | Pin and licence/security review; dev/build/route smoke; server/client boundary review | **BLOCKED — not installed** |
| UI runtime | Required by Next | React/React DOM `19.3` compatible with selected Next release | Verify compatibility from official package metadata and clean install | **BLOCKED — not installed** |
| Language/tooling | Typed API, metadata, and UI contracts | TypeScript plus repository-approved lint/test config | Typecheck, strict settings, no client secret imports | **BLOCKED — not installed/configured** |
| Motion | Approved route animation; CSS-only is fallback | `motion` | Bundle/reduced-motion/static fallback/browser test | **BLOCKED — not installed** |
| Icons | Consistent accessible icon set; inline icons are possible but increase bespoke assets | `@phosphor-icons/react` | Tree-shaking/bundle and accessible-name test | **BLOCKED — not installed** |
| Validation | Server contract and env schemas | `zod` | Unknown-key, size/boundary, malformed and hostile-input tests | **BLOCKED — not installed** |
| Database ORM | Versioned isolated schema/migrations | `drizzle-orm`, `drizzle-kit` | Migration generate/apply/rollback-forward-fix and schema test | **BLOCKED — not installed** |
| Postgres driver/pooling | Neon transactional lead storage | `pg`, `@types/pg`, `@vercel/functions` pool helper | Clean connection, bounded pool, transaction, outage/recovery test | **BLOCKED — not installed/configured** |
| Database service | Durable isolated lead/consent records | Neon Lakebase Postgres | Branch-first dev DB, region/privacy/backup/quota/cost review | **BLOCKED — account/config absent** |
| Email | Double opt-in | Resend SDK/adapter | Domain auth, sandbox, idempotency, bounce/suppression/outage tests | **BLOCKED — not installed/configured** |
| Bot protection | Public-form abuse reduction | Cloudflare Turnstile | Server verification, timeout, duplicate and denial tests; accessible failure path | **BLOCKED — keys/site setup absent** |
| Product analytics | Consent-gated funnel measurement | `posthog-js` manual events | No pre-consent calls, no capture/replay/PII, opt-out persistence | **BLOCKED — not installed/configured** |
| Google analytics | Explicitly accepted Basic Consent Mode | Google tag/config | Network proof for denied/accepted/revoked states | **BLOCKED — configuration absent** |
| Browser/a11y | Required viewports and WCAG checks | Playwright plus axe integration, version to be pinned | Installed-browser smoke, responsive/keyboard/axe suite | **BLOCKED — not selected/installed** |
| Repository map | Mandatory graph/impact gate | `@sylphx/repomap@1.5.0` through pinned npx | Root map succeeded; rerun after scaffold and final structure | **VERIFIED for intake** |
| Design skill | Required by root policy for public landing-page visual work | existing `design-taste-frontend` skill | Read before product work; follow preflight; browser visual QA | **REQUIRED; activation belongs to frontend owner** |
| External AI/RAG | No product need | None | Negative test: no model SDK/runtime calls in new site | **NOT_APPLICABLE** |
| Queue/cache/Kafka/Redis/Kubernetes | No demonstrated need | None | Do not add absent measured need | **NOT_APPLICABLE** |

### Environment variable names

No values belong in this record. Final names should be minimized and documented in `.env.example` after the owning adapter exists.

```text
SITE_URL
PRIVACY_EMAIL
RESPONSIBLE_OPERATOR_NAME
DATABASE_URL
LEAD_EMAIL_ENCRYPTION_KEY
LEAD_EMAIL_ENCRYPTION_KEY_ID
LEAD_EMAIL_HMAC_KEY
LEAD_NOTICE_VERSION
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
POSTHOG_KEY
POSTHOG_HOST
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_GOOGLE_TAG_ID
```

Public-prefix variables must be demonstrably safe for browser disclosure. Remove duplicate server/public PostHog names once the exact adapter is designed. Provider secrets must be server-only.

## Implementation sequence and file ownership

No two agents may edit the same file concurrently. The central integration owner approves contracts and integrates in this order:

1. **Bootstrap owner:** after CERT gate approval, create only the isolated manifest/lockfile/config, install pinned packages, and prove clean dev/build/typecheck/test startup.
2. **Content/design owner:** lock sitemap, exact copy, article names/source packets, tokens, component inventory, asset provenance, and responsive layouts.
3. **Data/API owner:** write the lead API contract, resolve the missing email-field inconsistency, create isolated Drizzle schema/migrations/adapters, and add contract tests.
4. **Frontend owner:** implement server pages, metadata, deterministic demos, theme, consent UI, fixed guide, and form against approved contracts.
5. **Security/privacy owner:** headers, secret boundaries, consent network proof, threat model, retention/erasure, and legal-review checklist.
6. **QA owner:** unit/contract/browser/axe/viewports/motion/metadata/JSON-LD/provider-failure checks.
7. **Independent reviewer:** compare implementation with this plan and original brief; report material findings before final verification.
8. **Central owner:** fix findings, rerun root and isolated checks, rerun repomap, update iteration handoff, and decide release status.

### Dispatch record

The requested model labels are checked against the currently exposed agent roster before each dispatch. This intake role was requested as GPT-5.6 Luna, but the central runtime must record the actual supported fallback if that exact label is unavailable; it must not silently use a model above GPT-5.6 Sol.

| Agent / role | Task and graph scope | Model / effort | Required tools/skills | Input → expected artifact | Cost/latency target | Fallback | Verification gate |
|---|---|---|---|---|---|---|---|
| Requirements/CERT | New-folder boundary and readiness only | GPT-5.6 Luna / Medium | repomap, docs | Accepted brief + root policy → this intake | One bounded pass | Supported model at or below ceiling, record actual | A1/A4 complete; no product edits |
| Central/integration | Contracts, sequencing, final outcome | GPT-5.6 Sol / High | repomap, Git, targeted tests | Intake + specialist handoffs → integrated release | Targeted reads, no repo-wide rereads | Sequential distinct handoffs | All material findings closed |
| Frontend/design | Public routes/assets/demos | GPT-5.6 Terra / Medium | design-taste-frontend, browser QA | Approved content/design contracts → UI | Reuse primitives; bundle budget set before additions | Luna for bounded extraction only | Build, viewports, keyboard, visual/reduced-motion QA |
| Backend/data | Lead endpoint and isolated data | GPT-5.6 Terra / High | Node, Neon/Drizzle tooling | API/data contract → tested adapters/migrations | One transaction, bounded provider calls | Sol only for difficult integration | Contract, migration, idempotency, outage tests |
| Security/privacy review | Threat, headers, consent, crypto boundary | GPT-5.6 Sol / High | network inspection, security tests | Integrated build → findings report | No external writes/deploys | Manual sequential review | No high/critical finding open |
| Independent final review | Original brief vs build | GPT-5.6 Sol / High | read-only diff, full gates | Final candidate → disposition | Focused evidence review | None above ceiling | VERIFIED/PARTIAL/FAIL/BLOCKED |

## Verification plan

Commands are provisional until the isolated `package.json` defines their exact names. Builders must not invent or report them as run before then.

```text
1. Root preservation
   git diff -- <all paths outside knowvia-website>
   npm run check                         # root; must be rerun from root

2. Isolated dependency/readiness proof
   npm ci                                # from knowvia-website after lockfile exists
   npm ls --depth=0
   npm run typecheck
   npm run lint
   npm test
   npm run build

3. Contracts and data
   unit tests for validation, normalization, crypto envelope and consent
   API tests for malformed/oversize/unknown fields, idempotency/concurrency,
   Turnstile denial/timeout, database outage, Resend outage, enumeration safety
   migration apply on an isolated Neon branch and documented recovery test

4. Browser and public-web quality
   Playwright at 320/360/390/412/768 and representative desktop widths
   keyboard/focus, 200% zoom, text-spacing, light/dark, reduced motion
   axe WCAG checks and manual semantic/contrast review
   metadata, canonical, robots, sitemap, Open Graph and JSON-LD validation
   consent network capture: denied / accepted / revoked
   workspace production denial/noindex

5. Security/performance
   response-header/CSP tests; client-bundle secret scan; dependency audit triage
   static/JS asset and route budgets; Core Web Vitals in production-like preview
   burst/load, provider quota/degradation and recovery tests after thresholds exist

6. Map and independent review
   pinned repomap map and task-specific impact query
   independent findings resolved, then repeat affected checks and final gates
```

## Rollout and rollback

- Develop against synthetic content and a disposable Neon branch only.
- Preview deployment is permitted only after secrets/config, headers, consent, legal placeholders, and provider sandbox behavior pass.
- Production remains blocked pending the named operational configuration and Indian legal review.
- Roll out static pages first if needed; keep lead submission, email, analytics, and guide actions independently disableable.
- Rollback is deployment reversion to the last verified artifact plus feature/provider kill switches. Database migrations must be backward-compatible or have a tested forward-fix; never destroy lead/consent evidence during rollback.
- Removing the entire `knowvia-website/` tree restores the code boundary because no existing product file may be modified. External rollback separately deletes the disposable Neon branch and revokes sandbox/provider keys according to owner procedures.

## CERT-T — readiness proof and handoff

| Readiness item | Evidence / result |
|---|---|
| Map exists and task query succeeds | Root map succeeded; 184 code files / 1,500 edges. Dirty backend impact is HIGH. Isolation boundary selected. **PASS for intake; rerun required after scaffold.** |
| Requirements and non-goals explicit | Recorded above from accepted brief. **PASS.** |
| Task class and plan recorded | S2 with design, sequence, rollout and rollback. **PASS.** |
| System design coherent | Separate Next app; no old API; explicit public/data/provider boundaries. **PASS subject to API email-field resolution.** |
| Packages/tools installed and callable | Node/npm/npx and intake repomap path callable. New app manifest, lockfile, packages, test/browser tools absent. **FAIL.** |
| Permissions/env names known | Workspace write boundary known; variable names drafted. Production provider access and values absent. **PARTIAL.** |
| Verification and rollback exist | Plan recorded; commands cannot run until isolated scripts/packages exist. **PARTIAL.** |
| Roles, ownership and order clear | Recorded above. **PASS.** |

### Exact gate to change CERT to READY

All of the following are required:

1. Resolve and document the canonical lead request schema, including a separately named email field and consent semantics.
2. Approve provider/hosting region, official support-mark files and usage rights, six article names/source packets, legal placeholders/owner, retention/deletion policy, and analytics event schemas.
3. Create an isolated `knowvia-website/package.json` and lockfile with the approved, pinned compatible dependency set; do not modify root manifests or lockfile.
4. Install from the isolated lockfile and record package versions, licences/security review, and ownership.
5. Add repository scripts and make clean install, framework startup, typecheck, lint, unit smoke, and production build pass in `knowvia-website/`.
6. Verify a disposable Neon branch connection/migration and sandbox Turnstile/Resend behavior without real customer data; verify analytics denied-by-default in a minimal integration smoke test.
7. Rerun pinned repomap after scaffolding and confirm no import/build/runtime dependency on existing product modules.
8. Update this document and `docs/iterations/LATEST.md` with evidence and set exactly one CERT state.

Until then: **CERT = BLOCKED. No product-code implementation is authorized.**

## A4 handoff

```text
CERT state: BLOCKED
Task class: S2
Business objective: Isolated, accessible, evidence-aware Knowvia acquisition and education website with safe early-access collection.
Approved scope / non-goals: Public site and isolated lead lifecycle only; no old app edits/API, auth, advice, claim authority, runtime AI, or production deploy.
Graph findings: Root map succeeded; dirty backend impact HIGH; new-folder isolation is mandatory.
System design: Next App Router server/static site with scoped client islands and a separate validated, consented lead pipeline to Neon and Resend.
Selected stack and capability decisions: Listed above; required app packages/services are not yet installed/configured.
Installed and verified tools: Node 24.21.0, npm 11.19.0, npx; intake map evidence. Root Vite is not a new-site dependency.
Agent assignments: Central owner; bootstrap, frontend/design, backend/data, security/privacy, QA, independent review.
File/module ownership: All new work under knowvia-website; sequential ownership for shared configs/contracts.
Implementation sequence: Contract decisions → isolated bootstrap/readiness → content/data → UI → security/QA → independent review → final verification.
Verification commands: Defined provisionally above; exact scripts must come from isolated manifest.
Rollback: Revert isolated deployment/tree; provider kill switches; disposable DB branch deletion; compatibility-safe migration recovery.
Risks, blockers, and open decisions: Missing isolated dependency proof, unresolved email request field, provider/legal/asset/content/retention decisions, no scale evidence.
```


---

## CERT update — 2026-10-02 (implementation session)

**CERT = READY for preview; production remains gated.** All gate items that do not need external accounts or legal
sign-off passed with evidence in `docs/iterations/LATEST.md`.

Resolved since intake:

- Lead schema: the accepted brief includes `email: string`; the "missing email field" blocker was a misreading.
- Hosting changed by the owner from Vercel to self-hosted Docker on EC2, Google Cloud or Azure. `@vercel/functions`
  was not used; any Postgres via `DATABASE_URL`; retention runs through a token-protected internal endpoint.
- Repository: moved out of CoverSaath into its own folder and git repository (`CoverSaath Website`).
- Support marks: official SVGs retrieved from lsvp.com, plumhq.com and insurancesamadhan.com, recorded with source,
  SHA-256 and approval in `src/content/evidence.ts`.
- Motion and Three.js: not used. The 3D route is CSS perspective; Motion was removed after measuring about 43 KB
  gzipped for a panel fade.

Still blocked (production): Indian legal review (`LEGAL_REVIEW_APPROVED`), canonical domain, privacy email, operator
name, provider accounts (Postgres, Resend domain, Turnstile, PostHog, Google Ads), named expert reviewer for guides,
real-Postgres concurrency test, and load testing. **SCALE = BLOCKED** as before.
