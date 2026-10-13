# Knowvia web

The public Knowvia site and onboarding prototype, rebuilt from the supplied October 2026 design package.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Run `npm install`.
3. Run `npm run dev`.

The site is available at `http://localhost:3000`.

## Production settings

- `DATABASE_URL` stores waitlist signups in PostgreSQL. Production submissions fail closed when it is missing.
- `NEXT_PUBLIC_GOOGLE_TAG_ID` enables Google Analytics after visitor consent.
- `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` records a lead conversion after a successful signup.
- `NEXT_PUBLIC_META_PIXEL_ID` enables the Meta Pixel after visitor consent.
- `NEXT_PUBLIC_SITE_URL` sets canonical URLs.
- `NEXT_PUBLIC_CONTACT_EMAIL` sets the public contact address.

## Main routes

- `/` public site
- `/onboarding` interactive product flow
- `/for-partners` partner page
- `/privacy` privacy notice
- `/terms` terms
- `/api/waitlist` waitlist submission endpoint

## Checks

Run `npm run check` before deployment.
