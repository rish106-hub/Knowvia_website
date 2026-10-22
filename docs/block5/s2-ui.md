# Block 5 slice S2: /app shell, consent, upload, reading and progress

Status: **Most UI journeys verified against mocks of the BFF contract.** A separate Chromium smoke completed dev sign-in, collect consent, synthetic PDF upload through the real BFF and CoverSaath backend, Home overview and logout. It used Playwright `setInputFiles`, not the native chooser. Depends on decisions D1 (identity) and D2 (topology) staying as in `docs/block5/bff.md`.

Code: `src/app/app/{layout,page}.tsx`, `src/app/app/sign-in/`, `src/app/app/documents/`, `src/components/app/{ui,shell,documents,consent}/`. Tests: `tests/unit/app-ui/`, `tests/e2e/s2/` (visual specs are included; screenshot baselines are intentionally omitted).

## Gate

`src/app/app/layout.tsx` is a server component. It awaits `connection()` (so the flag is read per request, never baked in at build) and calls `notFound()` unless `process.env.APP_ENABLED === "true"`. It sets `robots: noindex, nofollow`, imports `src/app/tokens.css` and `src/components/app/ui/app.css`, and is not in the sitemap. The BFF itself accepts `true` or `1`; the page gate is stricter (`true` only). Set it to exactly `true`.

## Screens

| Route | Purpose |
| --- | --- |
| `/app/sign-in` | Dev sign-in form, "Sign-in is not available yet" state, expired and signed-out states |
| `/app` | Household: people (read only), documents summary, Permissions panel with withdraw |
| `/app/documents` | Add a PDF (kind, file, collect permission), document list with stage badges and per-document actions |

`/app/cover` belongs to S34. The documents page links to it ("Continue to your cover") once any document is `readable`. If S34 has not landed, that link is a 404.

Shell: skip link, header (brand, Home, Documents, Sign out), a "Development preview" bar while `identity.provider === "dev"`, footer. Session and overview live in `SessionProvider` (`useApp()` exposes `state`, `reloadOverview`, `updateDocument`, `handleError`, `signOut`). Other `/app` pages (S34) can use it, or fetch themselves.

## States

| Where | State | What the user sees |
| --- | --- | --- |
| Any app page | session loading | "Loading your household." (status) |
| Any app page | signed out | redirect to `/app/sign-in` |
| Any app page | session check fails (offline, 5xx) | error notice with "Try again" |
| Any app page | `SESSION_EXPIRED` mid-use | redirect to `/app/sign-in?reason=expired` |
| Sign-in | signed out | form plus "Development sign-in" notice (no code is sent, each sign-in is a new household) |
| Sign-in | `reason=expired` | "Your session ended"; "Getting back into the same household is not available yet"; a new sign-in starts an empty household |
| Sign-in | `reason=signed_out` | "You have signed out" |
| Sign-in | 501 `IDENTITY_NOT_IMPLEMENTED` or 404 `APP_DISABLED` | "Sign-in is not available yet. No code was sent, and nothing was saved." Form removed |
| Sign-in | 429 | "Too many attempts", form stays |
| Documents | no documents | "No documents yet" block, collect notice visible |
| Documents | collect not held | notice (from BFF) with draft marker, button "Allow and add this PDF". No checkbox |
| Documents | collect held | note plus "Add this PDF" |
| Documents | notice endpoint down | error plus Try again, grant button disabled |
| Upload | pre-check fail | PDF-only or over-15-MB wording, file dropped, nothing sent |
| Upload | working | status text: setting up case, saving permission, uploading |
| Upload | retryable failure | error plus Retry, **same Idempotency-Key**, setup already done is not repeated |
| Upload | `choose_again` codes (`PDF_ONLY`, `FILE_TOO_LARGE`, `IDEMPOTENCY_*`) | file cleared, message, no Retry |
| Upload | `CONSENT_SCOPE_REQUIRED` | message, overview reloaded, permission shown again |
| Stage `received` | pending badge | "Received. Security checks come next." Check again, Delete |
| Stage `awaiting_checks` | pending badge | "Waiting for security checks. This can take a while." No ETA. Check again, Delete |
| Stage `awaiting_ocr_consent` | attention badge | "Allow reading" (consent dialog) or "Start reading" when `nextAction` is `start_ocr` |
| Stage `processing` | pending badge plus spinner icon | "Reading this PDF." Polls `POST /documents/{id}/ocr/refresh`. No percentage |
| Stage `readable` | done badge | "Knowvia could read the text of this PDF. Nothing has been checked or confirmed from it yet." |
| Stage `unreadable` | problem badge | "Try reading again" (`retry_ocr`), Delete |
| Stage `rejected` | problem badge | Delete only |
| Stage `deleting` | pending badge | polls `GET /documents/{id}` |
| Stage `deleted` | neutral badge | muted row, no actions |
| Polling | 40 polls, or 3 failures in a row | "This is taking longer than usual" or "Could not check on this PDF", with Check again |

Badges differ by shape and icon as well as colour: done solid plus check, pending dotted plus clock, attention dashed plus question mark, problem thick plus alert, neutral plain plus dash.

Polling: first poll after 3 s, then 1.6x up to 20 s, paused while `document.hidden` (resumes on `visibilitychange`), stops when the stage leaves `processing` (or `deleting`), capped at 40 polls. Logic in `src/components/app/documents/polling.ts`.

## Flows and request shapes

- Upload: `POST /cases` only when the overview has no case, then `POST /consents {scope:"collect"}` only when no collect grant is held, then `POST /cases/{id}/documents` with raw `File` body and headers `Content-Type: application/pdf`, `Idempotency-Key` (one key per file+kind, regenerated when either changes, reused on retry), `X-Document-Kind`, `X-Consent-Grant-Id`, `X-Filename` (percent-encoded). Document kinds offered: `policy_schedule`, `policy_wording`, `endorsement`; the user must pick one.
- OCR: dialog with the `ocr_sarvam` notice, then `POST /consents {scope:"ocr_sarvam", documentId}` then `POST /documents/{id}/ocr`. If the grant works and the start fails, the row shows the error with Retry (start only).
- Delete: confirm dialog (Cancel is focused first), `DELETE /documents/{id}`, row becomes `deleting`.
- Withdraw: Permissions panel on `/app`, `POST /consents/revoke` with the same body shape as the grant. The dialog says what stops and that derived answers are erased.
- Sign out: `DELETE /session`.
- `question_gemini` is not built here (S34). The Permissions panel can list and withdraw it if it exists.

## Copy that needs legal or product review

Everything below is product copy, **not** final legal wording.

- All consent notice text (title, body, version) comes from `GET /consents/notices` and is shown with the marker "Draft wording, pending legal review". The one-sentence leads above each notice are ours: "Adding a PDF means Knowvia stores it for your case. This permission covers the PDFs you add until you withdraw it on the Home page." and "This sends your ... to an outside reading service (OCR) so its text can be read. This permission covers this one PDF."
- Withdraw explanations (`consent/consent-copy.ts`): "Withdrawing also erases answers Knowvia worked out using this permission", "erases the text and answers Knowvia derived from this PDF", "PDFs you already added are not removed by this". These state the AGENTS.md invariant (revocation erases derived data). **Not verified against the backend.**
- Delete dialog: "This deletes the PDF and the text and answers Knowvia built from it." Not verified against the deletion inventory.
- Development sign-in notice, the expired-session note, and the dev preview bar.
- Footer: "Nothing here is advice on what your insurer will pay."
- "PDF, up to 15 MB each" (the BFF limit is 15 MiB).
- Readable wording ("Nothing has been checked or confirmed from it yet") and the unreadable and rejected sentences.
- Names of document kinds and their one-line hints.

Claims deliberately not made: encryption, email notifications, invites, sharing, insurer approval, cashless confirmation, extraction success, any ETA.

## Accessibility notes (target WCAG 2.2 AA)

- Real `label`s and `fieldset/legend`; errors have `role="alert"`; field errors are linked with `aria-describedby`.
- Visible focus: 2 px Tide outline plus Gold halo on every control; the visually hidden file input draws its ring on its label.
- Keyboard: whole flow operable by keyboard (tested: radio arrows, Tab to file input, Enter on the add button). The native file chooser is the one step automation cannot press; a labelled file input is always present.
- Live regions: upload status in a persistent `role="status"`; each document row has a `role="status"` sentence; withdraw announces via status.
- Dialogs: native `<dialog>` modal, Escape closes (unless an action is in flight), Tab wraps inside, focus returns to the opener, Cancel is the initial focus. After deleting, focus goes to the row because the Delete button disappears.
- Reduced motion: spinner and all transitions are off under `prefers-reduced-motion`. Under reduced motion the "Reading" cue is the spinner icon (static), badge and sentence.
- Touch targets: buttons, links, radio rows and the file label are at least 44 px high (asserted at 320 px). Radio inputs are 22 px but sit inside 48 px labels.
- 320 px: no horizontal scroll (asserted). Header wraps to two rows.
- Colour is never the only cue (see badges). Brick, Gold ink and Forest/Tide text on their grounds were taken from the approved artboards and `tokens.css`; a contrast measurement was **not** run.

## Tests

- Unit (`tests/unit/app-ui/`): polling backoff and decisions, error code to copy, pre-check, stage mapping, actions, consent copy, overview helpers.
- E2E (`tests/e2e/s2/`, all BFF calls mocked with `page.route`, fake in `fake-bff.ts`): signed out, sign-in unavailable (501, 404), rate limit, expired (on arrival and mid-use), sign out, read-only people, empty, consent notice and draft marker, upload success with header assertions, same-key retry, different file new key, JPG, fake `.pdf`, oversize, BFF `PDF_ONLY`/`FILE_TOO_LARGE`, missing kind or file, offline, storage not configured, consent revoked, all nine stages, awaiting_checks no ETA, OCR consent to readable with backoff (fake clock), OCR failure and retry, polling stall, hidden tab pause, delete confirm and cancel, Escape, focus trap, withdraw, keyboard-only upload, 44 px targets and no overflow at 320 px.
- Visual specs cover signed out, empty documents and mixed stages at 320, 375, 768, 1024 and 1440. Screenshot baselines were intentionally omitted. The Next dev badge is hidden by `screenshot.css`.

## Unverified

- Most E2E cases mock every `/api/app/**` response, so those checks prove UI behavior against the contract, not backend enforcement. The real-browser smoke covers only the sign-in, collect consent, upload, overview and logout path described above.
- A real file chosen through the native picker, and a real 15 MiB upload, are untested (Playwright sets files on the input).
- Drag and drop is implemented but has no automated test.
- With `APP_ENABLED` unset the layout 404s: checked by hand against a dev server, not in e2e (the e2e config always sets it to `true`).
- React StrictMode in dev runs effects twice, so the notices endpoint is asked twice in dev (specs account for it). Production behaviour was not observed.
- Screenshots are macOS Chromium with next/font; other platforms will differ.
- Contrast ratios not measured; no screen reader pass was done.
- The link to `/app/cover` depends on S34.
- Dates use `Intl` `en-IN` in the browser's time zone.
