# Block 5 security closure

Date: 2026-10-22

Verdict: **FAIL for Block 5 acceptance.** The real two-session logout flow and website checks pass. One Vite advisory is fixed. Five npm high package findings remain in development-only lint tooling, and the required CoverSaath full check still fails a wall-clock privacy scan assertion. No finding is accepted silently.

## Repository state

- CoverSaath: `block5/frontend-audit`, based at `493ab59`; initially clean. One regression test was added to `tests/backend-api.test.mjs`. No commit was created.
- Knowvia website: `block5/app-v2`, based at `a811eee`; initially clean. The changes in this closure are local and uncommitted. Existing website checkouts were not edited.
- No push, PR, remote merge, deployment or release was performed.

## Dependency audit

The initial `npm audit --json` reported six high package findings. These are package-path findings, not six separate GHSA records: five roll up from `GHSA-vfj7-8cjw-p6xm` in `braces`; the sixth is Vite's `GHSA-587h-7wmj-h5pm`.

| Package finding | Locked version at baseline | Dependency path / environment | Disposition |
| --- | --- | --- | --- |
| `@next/eslint-plugin-next` | 16.3.8 | `eslint-config-next` -> plugin -> `fast-glob` -> `micromatch` -> `braces`; development lint tooling | Unresolved; same braces GHSA below. Latest Next lint plugin still pins `fast-glob` 3.3.1. |
| `braces` | 3.0.3 | Transitive, development-only lint tooling | Unresolved. GHSA-vfj7-8cjw-p6xm covers versions through 3.0.3. npm currently publishes no fixed `braces` release. |
| `eslint-config-next` | 16.3.8 | Direct development dependency; inherits the plugin chain above | Unresolved; same braces GHSA. npm's proposed fix downgrades this to 14.2.35, a major mismatch, and was not applied. |
| `fast-glob` | 3.3.1 | Transitive, development-only lint tooling | Unresolved; same braces GHSA through `micromatch`. No arbitrary override was added. |
| `micromatch` | 4.0.8 | Transitive, development-only lint tooling | Unresolved; same braces GHSA. |
| `vite` | 8.3.2 -> 8.3.5 | `vitest` -> `@vitest/mocker` -> Vite; development/test tooling | Fixed. Vite 8.3.5 is outside the affected 8.3.0-8.3.2 range. Lockfile-only update kept declared package ranges intact. |

`npm audit --omit=dev --json` reported zero production vulnerabilities. This does not clear the five development-tool findings. They remain a release blocker unless a fixed compatible dependency is published or the project owner explicitly accepts the documented development-only exposure.

## Session isolation

| Case | Result | Evidence |
| --- | --- | --- |
| S1: two independent sessions and own resources | PASS | Real loopback BFF-to-CoverSaath smoke created different households; isolated SQLite recorded 3 sessions and 3 distinct token hashes (one setup request plus A and B). |
| S2: A rejected after logout | PASS | Real smoke returned 401 for A after its backend revoke. |
| S3: B remains usable after A logout | PASS | Real smoke returned 200 for B after A logout. |
| S4: B rejected after its own logout | PASS | Real smoke returned 401 for B after its backend revoke. |
| S5: missing, malformed, invalid and expired credentials | PARTIAL | Website BFF unit tests cover missing, tampered and expired cookies. The live smoke exercised post-revoke invalid credentials. Backend expiry was not advanced in the live run. |
| S6: cross-household access | PASS | Real CoverSaath API regression test verifies a token cannot read the other household; BFF smoke confirmed each session resolves to its own household. |
| S7: repeated logout and cleanup | PASS | Real BFF smoke repeated logout after cookie clearing; both cookies were cleared and the request stayed safe. |
| S8: token leakage | PARTIAL | Unit tests verify backend tokens are absent from responses and readable cookie values; live sign-in response had no token field. Logs and browser URL leakage were not dynamically captured in this run. Source logging emits only error class names. |

The test-only fake backend now mints distinct credentials and models per-session revocation. The separate CoverSaath API test exercises actual backend sessions, and the live smoke exercised both actual backend and BFF behavior. An independent read-only review found no defect in the regression-test logic and confirmed the live test closed its earlier end-to-end coverage gap.

## Verification

- Website `npm run check`: PASS. Lint and typecheck passed; 17 test files / 234 unit tests passed; production build passed.
- Screenshot-free browser run (four functional spec files): PASS, 90/90 tests.
- Full Block 5 browser run: 90 tests passed and 30 screenshot baseline checks failed because no screenshot baselines exist. No baselines were added.
- `bash scripts/design-port/check-regen.sh`: PASS.
- `node scripts/check-no-secrets-in-client.mjs`: PASS; 47 files and five names scanned, no secret values were configured, no BFF secret names/values were found in `.next/static`.
- `npm audit --omit=dev --json`: PASS, zero production findings. Full `npm audit --json`: five high package findings remain.
- Real loopback BFF/backend smoke with an isolated temporary SQLite database and synthetic identities: PASS for S1-S4 and S7. Three distinct token hashes were counted without printing token values. Temporary database and servers were removed/stopped.
- CoverSaath `node --test tests/backend-api.test.mjs`: PASS, 1/1 test. This includes distinct-token household and logout isolation assertions.
- CoverSaath `npm run eval:safety`: PASS, 28/28, deterministic offline, zero network calls.
- CoverSaath `npm run check`: FAIL twice at `tests/privacy-gate-r2.test.mjs` G4. Full run totals were 1,383 passed, 75 skipped, 1 failed; `spacedDigits` took 264.6 ms and 206.3 ms against a 200 ms bound. The isolated G4 case passed at 94.7 ms. This points to load sensitivity, but does not make the full check pass. PostgreSQL and clamd tests were skipped because their opt-in services were not configured.

No paid provider calls were made. OCR success and model-answer accuracy remain unverified. D1 identity, D2 deployment topology and D7 legal review remain open.

## Remaining blockers and review boundaries

1. Replace or safely update the vulnerable `braces` chain without downgrading Next.js tooling or adding an unverified override.
2. Make the CoverSaath G4 timing verification reliable under the repository's standard full test command without weakening its security bound, then rerun the full check.
3. Dynamically verify S8 log and URL non-disclosure if that evidence is required for release.
4. Keep D1, D2, D7, real OCR and model-answer accuracy open until their owners/evidence resolve them.

Suggested local commit boundaries, not created: (1) Vite lockfile fix; (2) distinct-session BFF and backend regression tests; (3) this security closure record.

## Independent BFF review (2026-10-28)

Scope: the state-cookie size probe, the OCR job recording, and the backend client's retry guard. Read-only review, 0 P0, 0 P1, 4 P2, 8 P3. Backend behaviour was cross-read in CoverSaath (`policy-evidence-service.js`, `document-upload-service.js`, `consent-repository.js`). The review did not run tests; the fixes below were verified afterwards.

### Fixed (regression tests failed first)

| Finding | Fix | Test |
| --- | --- | --- |
| P2: `throw failure` inside the `try` was caught by the same `catch`, so any retryable status of 500 or above (500, 501, 505, 507, 511) was retried on upload, `askQuestion` and catalogue review. A backend 500 after a paid model call caused a second paid call. | `send` retries once, with the same key, only on a refused connection or a 502/503/504 answer. | `errors-and-client.test.ts`, five status cases plus the 502/503/504 case |
| P2/P3: a client-side timeout was retried while the first request could still be running. The backend has no in-flight claim per idempotency key, so this could double a model call or return a spurious `409 DUPLICATE_DOCUMENT`. | A timeout is never retried. | timeout case |
| P3: `response.text()` buffered an upstream body without a cap. | 2 MiB streamed cap, refused as `BACKEND_BAD_RESPONSE`. | oversized-body case |
| P3 (latent): an unexpected non-`AppError` after a backend side effect skipped the kept state cookie. | The state cookie is kept on every failure path except a cleared session. | none (no reachable trigger); covered by reasoning only |

`docs/block5/bff.md` now states the real retry rule. Website `npm run check` passes; 17 files, 242 unit tests (234 before, 8 new). Client-bundle secret scan OK. The fixes have not been independently re-reviewed.

### Checked, no finding

State-cookie probes use 96-character ids against real ids of 36 to 44 characters, so they over-estimate. The worst-case state `Set-Cookie` is 3873 bytes, under 4096. Non-idempotent calls (`createCase`, `startOcr`, `grantConsent`, `deleteDocument`, revoke) are not retried. Catalogue review retry is safe (the backend replays by household, case, key and digest). Cookie attributes, per-kind AAD and HKDF, CSRF origin plus `X-Knowvia-App`, token absence from responses and logs, and backend message discarding all held.

### Open

| Severity | Item | Needs |
| --- | --- | --- |
| P2 | `POST /consents` has no idempotency key. If the backend commits and the BFF then times out, the grant is unrecorded and a retry creates a second one. | Backend accepts a client-supplied grant id or key; BFF derives it from household and key. |
| P2 | Two concurrent mutations from one browser lose a grant (last Set-Cookie wins). | Server-side state (D2). A per-household mutex covers one instance only. |
| P2 | Backend `ask()` has no in-flight claim per idempotency key, so a concurrent duplicate runs the model twice. | Backend reserves (household, case, key) before the model call. |
| P3 | GET `overview` and document routes call the OCR refresh (a provider poll) and are reachable by cross-site top-level GET. | Require `X-Knowvia-App` on those GETs, or move refresh to POST only. May change the UI contract. |
| P3 | `APP_TRUSTED_PROXY_HOPS=0` puts every sign-in in one bucket (10 per 10 minutes). | Require hops of at least 1 in production, or document it. |
| P3 | Production is inferred from `NODE_ENV` only. | Explicit `APP_ENV=production`, or refuse the dev identity off loopback. |
| P3 | `startOcr` timeout after the provider accepted the job leaves a paid job the UI does not show until start is called again. It self-heals because the job is per document. | Retryable "check status" reply. |
| P3 | If both backend revokes fail on sign-out, the token stays live until expiry. | Server-side revocation (D2). |

The earlier blockers (the `braces` chain, G4 timing, S8 log capture, D1, D2, D7) are unchanged by this review. The G4 timing test passed on 2026-10-28 in a full `npm run check` with nothing else running (1,459 tests, 0 failed), so it is still intermittent rather than fixed.

## Follow-up to the 2026-10-28 review: fixes, second review, live evidence

Same day, after the independent review above. Nothing here is committed. CoverSaath changes sit in its working tree on `codex/block5-session-isolation`.

### Fixed

| Finding | Fix | Evidence |
| --- | --- | --- |
| P2: `POST /consents` had no idempotency key, so a timeout after the commit orphaned a grant and a retry made a second one. | CoverSaath: optional `Idempotency-Key` derives the grant id from household, adult and key (`consent-<hex>`). The same request returns the same grant (200, `idempotentReplay`); a different request is `IDEMPOTENCY_CONFLICT`; a revoked or expired grant is `CONSENT_REVOKED` / `CONSENT_EXPIRED`; replays and refusals are audited with no scope or purpose. BFF forwards the client's key and retries a failed connection once only when a key was sent. The app sends one key per consent action (kept until the grant succeeds). | `tests/consent-idempotency-api.test.mjs` (8), BFF `real-backend-regressions.test.ts` (3) |
| P2: CoverSaath `ask()` had no in-flight claim per idempotency key, so a duplicate while the first ran billed the model twice. | Per-process claim; a duplicate gets `409 IDEMPOTENCY_IN_PROGRESS` until the first settles, then replays. | `policy-evidence-document-versions.test.mjs` D5 (2) |
| P3: GET routes that poll the OCR provider were reachable by cross-site navigation. | `overview`, a case's document list and a single document need `X-Knowvia-App: 1`. | `real-backend-regressions.test.ts` |
| Second review, P3: expired/revoked replays, missing audit, test that released the wrong call, G4 had lost its wall-clock guard. | As above, plus a 2 s wall-clock backstop in G4. | tests above |

### Dependencies (supersedes the audit table above)

Run on 2026-10-28. The earlier `braces` chain no longer appears. Website: `next` 16.3.8 had three advisories (image-optimizer RCE with SVG, Server Actions DoS, `use cache` typed-array RCE) and `zod` one; the site does not use `next/image` or `use cache`, so exposure was low, but `next` is a production dependency. Pinned `next` 16.4.3, `zod` 4.6.7, `eslint-config-next` 16.4.3; `npm audit` and `npm audit --omit=dev` both report 0. CoverSaath: `undici` 7.30.1 and `zod` 4.6.7 by lockfile-only `npm audit fix`; 0 vulnerabilities.

### G4 timing blocker

Reproduced under CPU oversubscription (wall-clock 380 to 410 ms against the 200 ms bound). G4 and the round-4 bound test now measure process CPU time, take the best of up to three attempts, and keep the 200 ms bound plus a 2 s wall-clock backstop. Five full runs with PostgreSQL and clamd: the first G4 run failed at 216 ms CPU before best-of-three, a round-4 wall-clock failure (226 ms) appeared once and was fixed the same way, and the last four runs passed. G4 CPU peaked at 198 ms under that load, so it is mitigated, not immune. A mutation check that plants a backtracking regex was not run.

### Live evidence (synthetic data only)

- Sarvam Digitise: `npm run test:sarvam-live` passed (1 page, 3.2 s, 212 characters, about INR 0.5).
- Real journey through the BFF against an isolated CoverSaath (real clamd, real Sarvam): sign-in, collect consent, upload, scan accepted, OCR refused without consent (403), OCR consent, OCR succeeded and stage `readable`, other household gets 404, OCR revoke returns the document to `grant_ocr_consent` with no OCR, delete, sign-out revokes the backend session and the old cookie gets 401. S8: the session token, bootstrap token and session secret appear in no response, header, URL or server log of that run. After revoke and delete the database holds a tombstone (`[deleted]` name, storage file gone, OCR text, result JSON and blocks null). Dev-mode server logs only; production logging is untested.
- Gemini: not run. The key's prepayment credits were depleted (HTTP 402) on two attempts, so evidence answers and the coverage preview are still unverified against a real model.

### Verification

CoverSaath `npm run check` with PostgreSQL 17.11 and real clamd: 1469 tests, 1466 passed, 0 failed, 3 skipped (custom clamd, live Sarvam, Gemini negative control). `eval:safety` 28/28, `eval:household` pass, `eval:retrieval` recall 1.0 over 62 expected clauses, parse eval pass; the last two use the single real-policy golden under `.local/eval/` and say nothing about other insurers. Website `npm run check`: 247 tests; Playwright functional specs 90/90; bundle secret scan OK.

### Still open

D1, D2, D7, the Gemini-dependent journeys. The multi-instance gaps: the in-flight claim is per process, and the consent lookup and insert are not one transaction across processes (SQLite single-process runtime today; PostgreSQL needs a database claim). Concurrent mutations in two tabs still lose a grant (state lives in the cookie). `APP_TRUSTED_PROXY_HOPS=0` shares one sign-in bucket, and production is inferred from `NODE_ENV`; both depend on deployment topology (D2). If both backend revokes fail on sign-out the token stays live until expiry. These fixes had one independent review round (findings above, fixed); the second round of fixes was not re-reviewed.
