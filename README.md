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
- `VOICE_NOTES_ENABLED` and `NEXT_PUBLIC_VOICE_NOTES_ENABLED` turn on the optional voice note in the early-list form. Keep both `false` until legal review signs off retention, transcription and deletion.

## Main routes

- `/` public site
- `/onboarding`, `/onboarding/coming-up`, `/onboarding/people`, `/onboarding/sharing`, `/onboarding/add-policies`, `/onboarding/reading`, `/onboarding/your-cover`: onboarding preview, one route per designed screen (not indexed)
- `/for-partners` partner page
- `/privacy` privacy notice
- `/terms` terms
- `/api/waitlist` waitlist submission endpoint
- `/api/voice-note` optional voice-note upload (off unless enabled)

## Design source

The home page, navigation, footer and onboarding screens are generated from the approved Claude Design artboards. See `scripts/design-port/README.md`.

## Checks

Run `npm run check` before deployment.
