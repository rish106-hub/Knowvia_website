# Website operating notes

## Scope

This repository contains the public Knowvia landing site and a non-indexed onboarding preview. It is a small Next.js application, not a backend platform.

The main public routes are `/`, `/for-partners`, `/privacy`, and `/terms`. The onboarding preview is under `/onboarding`.

## UI source

The landing page sections, navigation, footer, and onboarding screens are generated from the artboards in `design/claude-design/`. Change those files first, then run:

```bash
python3 scripts/design-port/gen_site.py design/claude-design .
```

`src/components/home/LandingPage.tsx` is hand-written and owns landing-page section order. The generated files are listed in `scripts/design-port/README.md`.

## Hosting and data

Vercel is the current hosting target. Azure is future work.

The landing page sends waitlist signups to `/api/waitlist`. PostgreSQL stores this limited signup data when `DATABASE_URL` is configured. The page sends email and form location. The endpoint still accepts its existing optional fields for compatibility.

`/api/voice-note` exists but voice notes are disabled. Do not enable them until retention, transcription, deletion, and consent rules are approved.

## Boundaries and known gaps

- The site does not provide insurance advice or decide claims.
- Generated UI must be changed through the artboard workflow.
- The waitlist endpoint currently manages its table at request time instead of through a migration.
- There is no repository CI configuration.
- Production checks, analytics consent, database availability, and environment values still need verification in the deployment environment.

## Local verification

Run `npm run check`, then test the landing page at desktop and mobile widths. Check keyboard order, focus visibility, form errors, successful and failed signup states, reduced motion, and horizontal overflow.

Rollback is a normal Git revert of the relevant change. Database rollback is not needed for frontend-only work because no schema changes are made.
