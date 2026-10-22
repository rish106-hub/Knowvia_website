# Block 5 BFF (slice S1): server-only backend-for-frontend

Status: **PROVISIONAL.** Unit tests use a fake backend; on 2026-10-22 it was also run against a real, isolated CoverSaath (see "Real-backend verification" below). Decisions **D1 (identity)** and **D2 (topology)** are OPEN. This is a seam, not a product.

Code: `src/server/app/**` (logic), `src/app/api/app/**` (thin Next route files), `src/lib/app-contract.ts` (types-only bridge for UI code). Tests: `tests/unit/app-bff/**`. Bundle check: `scripts/check-no-secrets-in-client.mjs`.

Backend facts were read from CoverSaath `v1-backend-routes.js`, `tenant-access-service.js`, `document-upload-service.js`, `ocr-service.js`, `policy-evidence.js`, and (for coverage-preview and the consent chain) branch `block4/household-reasoning`: `household-reasoning.md` and `tests/support/household-api-harness.mjs`. The coverage-preview route is not on the audited branch `block5/frontend-audit`; the BFF assumes it exists as on `block4/household-reasoning`.

## Shape

```
browser --same-origin--> Next /api/app/* (this BFF) --server-to-server--> CoverSaath /api/v1/*
        httpOnly cookies                                bearer token (never leaves the server)
```

- The backend bearer token lives only inside the AES-256-GCM sealed `kv_session` cookie. It is never in a response body, a readable cookie value, a log line or the client bundle.
- `COVERSAATH_BOOTSTRAP_TOKEN` is used only for `POST /api/v1/households`.
- Everything is off unless `APP_ENABLED=true`. When off, **every** method of **every** `/api/app/*` path answers `404 APP_DISABLED` (a catch-all route plus per-route method fallbacks).

## Environment (server-only; never `NEXT_PUBLIC_`)

| Name | Required when enabled | Notes |
| --- | --- | --- |
| `APP_ENABLED` | n/a | `true`/`1` turns the BFF on. Default off. |
| `COVERSAATH_API_URL` | yes | http(s) URL of a non-public backend. Trailing slash removed. |
| `COVERSAATH_BOOTSTRAP_TOKEN` | yes | 32 to 256 chars `[A-Za-z0-9_-]` (the backend bearer pattern). |
| `APP_SESSION_SECRET` | yes | at least 32 chars. HKDF-SHA256 derives one AES-256 key per cookie kind. Rotating it signs everyone out. |
| `APP_DEV_IDENTITY` | no (default off) | enables the dev identity provider. **Production is the default: it is refused (config error) unless `NODE_ENV` is exactly `development` or `test`.** Accepts reserved test email domains only (`.test`, `.invalid`, `.example`, `.localhost`, `example.com/org/net`). |
| `APP_TRUSTED_PROXY_HOPS` | no (default `0`) | Trusted proxies that append to `X-Forwarded-For` (0 to 5). `0` ignores `X-Forwarded-For` and `X-Real-IP`, so every caller shares one sign-in bucket. With N, the client is the entry N hops from the right. A global sign-in ceiling (60 per 10 minutes per instance) applies on top. |
| `APP_ALLOWED_ORIGINS` | no | extra comma-separated origins for the CSRF check. `NEXT_PUBLIC_SITE_URL` is always allowed; `http://localhost:3000` and `http://127.0.0.1:3000` are allowed outside production. |

Invalid configuration answers `500 APP_MISCONFIGURED` and logs field names only, never values. All are documented in `.env.example`.

## Cookies

| Cookie (production name `__Host-` prefix) | Content | Attributes |
| --- | --- | --- |
| `kv_session` | sealed `{token, expiresAt, householdId, adultId, memberId}` | httpOnly, SameSite=Lax, Path=/, Secure in production, Max-Age to `expiresAt` |
| `kv_state` | sealed `{caseId, consents[{id, scope, docs, at}], ocrJobs{docId: jobId}}` | same |

Envelope: `v1.<iv>.<ciphertext>.<tag>` (base64url), random 96-bit IV per seal, AAD = `knowvia-app:v1:<kind>` so a session cookie cannot be replayed as a state cookie. A tampered, wrong-version, wrong-kind or expired cookie is rejected; an expired session gives `401 SESSION_EXPIRED` and both cookies are cleared. A state cookie that fails to open, or belongs to another household, is dropped and replaced by an empty state.

Why a state cookie: the backend has no route to list cases, consent grants or OCR jobs for a household, but the BFF needs those ids. This is a **provisional** stand-in for server-side storage (D2). Limits: 24 consents, 24 OCR jobs, 3800 bytes sealed; beyond that `409 STATE_LIMIT_REACHED`. If the cookie is lost while the session survives (not possible today, both share one lifetime), a second case would be created.

## CSRF and rate limit

- Every non-GET/HEAD/OPTIONS request to `/api/app/*` needs `Origin` equal to an allowed app origin **and** header `X-Knowvia-App: 1`, else `403 CSRF_BLOCKED`. Checked before the session, before parsing and before any backend call.
- `POST /api/app/session` is limited to 10 per client per 10 minutes plus a global ceiling of 60 per 10 minutes, in memory, **per server instance only** (resets on restart, scales with instance count). The client key comes from `X-Forwarded-For` only when `APP_TRUSTED_PROXY_HOPS` > 0 (rightmost-hops entry); otherwise all callers share one bucket. Failed validation still counts, so an anonymous caller can exhaust the shared bucket (accepted while identity is dev-only; revisit with D1).
- Request JSON bodies are read with a streamed 64 KiB cap. Uploads are limited to 2 concurrent per adult (`429 UPLOAD_IN_PROGRESS`); there is no overall body-read deadline yet.
- A re-sign-in revokes the previous backend session; sign-out retries the backend revoke once and reports `backendRevoked`.

## Routes

Auth: `session` means a valid `kv_session` is required (401 `SESSION_REQUIRED` / `SESSION_EXPIRED` otherwise). CSRF applies to every non-GET. Idempotency-Key is a client-supplied header (8 to 200 chars) that the BFF forwards **unchanged**; the backend client retries once on network failure/timeout/502-504 for keyed calls with the same key. Bodies below are JSON; "pass-through" means the backend body is returned unchanged.

| Route | Method | Auth | Backend call | Request | Response | Notable errors |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/app/session` | POST | none (rate limited) | `POST /households` (bootstrap) | `{provider?: "dev", email, displayName?}` | 201 `SessionView` (no token). Sets both cookies. | 501 `IDENTITY_NOT_IMPLEMENTED`, 429 `RATE_LIMITED`, 502 `BACKEND_AUTH_FAILED` |
| `/api/app/session` | GET | none | none | | `SessionView` (`authenticated:false` plus `reason: none/expired` when signed out; clears cookies on a bad cookie) | |
| `/api/app/session` | DELETE | none | `POST /sessions/current/revoke` | | `{signedOut:true, backendRevoked:boolean}`; cookies cleared even if the backend is unreachable | |
| `/api/app/overview` | GET | session | `GET /households/{id}`, `GET /cases/{id}/documents`, `POST /ocr-jobs/{id}/refresh` per known job | | `Overview`: session expiry, household, owner, members, cases (0 or 1), documents with stages, active consents | `SESSION_EXPIRED`, backend codes |
| `/api/app/integrations` | GET | session | `GET /integrations` | | pass-through | |
| `/api/app/cases` | POST | session | `POST /cases` (once per household) | `{triggerType?}` default `planned_care` | `{caseId, created}` (201 first, 200 afterwards) | |
| `/api/app/consents/notices` | GET | none | none | | `{notices[]}` DRAFT, needs legal review | |
| `/api/app/consents` | POST | session | `POST /consents` | `{scope: collect, ocr_sarvam, question_gemini; documentId (ocr); documentIds 1..10 (question)}` | `{consent: ConsentView, reused}`; `collect` also ensures the case | `INVALID_REQUEST` with `fields`, `CONSENT_SUBJECT_REQUIRED`, `DOCUMENT_NOT_FOUND` |
| `/api/app/consents/revoke` | POST | session | `POST /consents/{id}/revoke` | same shape as grant | `{revoked:n}`. Forgets the OCR job for `ocr_sarvam`. The backend erases derived data on revoke (backend invariant, not verified here). | 404 `CONSENT_NOT_FOUND` |
| `/api/app/cases/{caseId}/documents` | GET | session | `GET /cases/{id}/documents` + job refresh | | `{caseId, documents: DocumentView[]}` | |
| `/api/app/cases/{caseId}/documents` | POST | session | `POST /cases/{id}/documents` | raw PDF body; headers `Content-Type: application/pdf`, `Idempotency-Key`, `X-Document-Kind` (policy_wording/policy_schedule/endorsement), `X-Consent-Grant-Id`, `X-Filename` (percent-encoded) | 201 (200 on replay) `{document: DocumentView, idempotentReplay}`; first response has stage `received` | 415 `PDF_ONLY` (JPG/PNG, any non-PDF, bad `%PDF-` magic), 413 `FILE_TOO_LARGE` (> 15 MiB on Content-Length or while streaming), 400 `IDEMPOTENCY_KEY_REQUIRED` / `UNSUPPORTED_DOCUMENT_KIND` / `INVALID_REQUEST` (with `fields`), 503 `DOCUMENT_STORAGE_NOT_CONFIGURED`, 403 `CONSENT_SCOPE_REQUIRED`, 409 `DUPLICATE_DOCUMENT` / `IDEMPOTENCY_CONFLICT`, 429 `UPLOAD_CAPACITY_REACHED` |
| `/api/app/cases/{caseId}/deletion-inventory` | GET | session | `GET /cases/{id}/documents/deletion-inventory` | | `{caseId, documents: DocumentView[]}` | |
| `/api/app/documents/{id}` | GET | session | `GET /documents/{id}` (+ refresh) | | `{document: DocumentView}` | 404 `DOCUMENT_NOT_FOUND` |
| `/api/app/documents/{id}` | DELETE | session | `DELETE /documents/{id}` | | 200/202 `{document}` (stage `deleting` or `deleted`) | 403 `DOCUMENT_DELETE_FORBIDDEN` |
| `/api/app/documents/{id}/ocr` | POST | session | `POST /documents/{id}/ocr-jobs` | none | 202 `{document}` | 403 `CONSENT_REQUIRED` (no `ocr_sarvam` grant held) |
| `/api/app/documents/{id}/ocr/refresh` | POST | session | `POST /ocr-jobs/{id}/refresh` | none | `{document}` | 409 `OCR_JOB_NOT_STARTED` |
| `/api/app/cases/{caseId}/questions` | POST | session | `POST /cases/{id}/questions` | `{question (1..2000), documentIds?}`, header `Idempotency-Key` | pass-through `{answerId, replayed, answer}` | 403 `CONSENT_REQUIRED` (no `question_gemini` grant), 400 `IDEMPOTENCY_KEY_REQUIRED`, 409 `POLICY_EVIDENCE_ANSWER_STALE` |
| `/api/app/cases/{caseId}/answers/{answerId}` | GET | session | `GET /cases/{id}/questions/{answerId}` | | pass-through `{answerId, current, answer}` | 404 `POLICY_EVIDENCE_NOT_FOUND` |
| `/api/app/cases/{caseId}/decision-catalogue` | GET | session | `GET /cases/{id}/decision-catalogue?format=handoff` | query `answerId`, `asOf`, `memberId` | pass-through handoff | |
| `/api/app/cases/{caseId}/catalogue-reviews` | POST | session | `POST /cases/{id}/decision-catalogue/reviews` | `{answerId, factId, decision, reasonCode, attestedSourceType?, attestsPolicyAssociation?, asOf?, memberId?}`, header `Idempotency-Key` | pass-through | |
| `/api/app/catalogue-confirmers` | POST | session | `POST /households/{id}/catalogue-reviewers` | `{adultUserId}` | 201 pass-through | |
| `/api/app/coverage-preview` | POST | session | `POST /households/{id}/coverage-preview` | `{contractVersion:"household-scenario/v1", sources[1..5]{caseId, answerId}, scenario}` (scenario validated by the backend) | pass-through | backend `HOUSEHOLD_SCENARIO_*` codes |
| `/api/app/cases/{caseId}/source-pack` | GET | session | `GET /cases/{id}/source-pack` | | pass-through | |
| `/api/app/*` (anything else) | any | none | none | | 404 `NOT_FOUND`; 405 `METHOD_NOT_ALLOWED` for a known path with an unsupported method | |

Structuring (`startStructuring`, `getStructuring`) exists in the backend client only. It needs an analysis `workflowRunId` the BFF does not own and is not on the evidence-first path, so there is no BFF route.

### Error body (all failures)

`{ "error": { "code", "message", "retryable", "fields"? } }`. Messages come from a BFF table keyed by code (or a generic message by status); backend message text is discarded. Both backend shapes (`{error:{code,message}}` and `{error:"string"}`), network failure (503 `BACKEND_UNREACHABLE`), timeout (504 `BACKEND_TIMEOUT`) and unusable bodies (502 `BACKEND_BAD_RESPONSE`) normalise into this. A backend 401 on a session call becomes 401 `SESSION_EXPIRED` and clears the cookies; a 401 on the bootstrap call is our configuration and becomes 502 `BACKEND_AUTH_FAILED`. Backend codes are passed through only when they look like application codes (`UPPER_SNAKE`, not `ERR_*`, not an OS error). Tokens, bodies and filenames are never logged; unexpected failures log only the error class name.

## Document stages (`DocumentView.stage`)

Composed from backend document status, the OCR job and (optionally) structuring. The UI should switch on `stage` and `nextAction` only.

| Stage | When | `nextAction` |
| --- | --- | --- |
| `received` | the upload response itself (`received_pending_checks`) | wait |
| `awaiting_checks` | `received_pending_checks` on any later read | wait |
| `awaiting_ocr_consent` | `accepted` and no `ocr_sarvam` grant held, or held but no job started | `grant_ocr_consent` / `start_ocr` |
| `processing` | job `queued`, `submitted` or `processing` | wait |
| `readable` | job `succeeded` | none |
| `unreadable` | job `failed` or `cancelled` | `retry_ocr` |
| `rejected` | backend `rejected` | none |
| `deleting` | backend `deletion_pending` | wait |
| `deleted` | backend `deleted` | none |

`awaiting_checks` carries `note: "scan_state_not_visible"`: the backend maps quarantine, scanning, scan-disabled and scan-failed all to `received_pending_checks`, so the BFF cannot say whether a scan is running or disabled (`DOCUMENT_SCAN_MODE` defaults to `disabled`, where a document stays here forever). The UI must not promise a completion time. Structuring status is exposed as a secondary field and does not gate `readable`.

The overview calls `POST /ocr-jobs/{id}/refresh` for each known job (there is no GET job route). Refreshing a terminal job is a cheap read; refreshing an in-flight job polls the provider. So `GET /overview` is polling-safe but not side-effect-free.

## Consent scopes (client names a scope; the BFF builds the backend shape)

| Scope | Backend grant |
| --- | --- |
| `collect` | purpose `document_processing`; scopes `{document, collect, insurance_document}` and `{case, resourceId: caseId, read, source_pack_metadata, recipient: adultId}` |
| `ocr_sarvam` (one document) | `grantedToActor: "sarvam"`; `{document, resourceId, derive, insurance_document, recipient: "sarvam"}` |
| `question_gemini` (1 to 10 documents) | `grantedToActor: "google-gemini"`; one `{document, resourceId, derive, insurance_question, recipient: "google-gemini"}` per document |

All use `evidenceMethod: "typed"`, no expiry, `noticeVersion: "draft-v0-needs-legal-review"`. **All consent notice text is DRAFT and needs legal review** (D7); the expiry policy also needs review. The chain a first answer needs is: case, `collect`, upload, scan, `ocr_sarvam`, OCR job and refresh, `question_gemini`, question.

## PROVISIONAL items

- Identity (D1): the `dev` provider has **no verification** and creates a **brand new household on every sign-in** (the backend has no login, lookup or identity-to-adult mapping). Synthetic data only. `APP_DEV_IDENTITY` is refused in production.
- Topology (D2): same-origin BFF to a non-public API is assumed; cookie/CSRF/CORS policy, proxy trust (`X-Forwarded-For`), the backend Host/Origin allowlist and loopback logic are not changed or reviewed here.
- State cookie standing in for server-side storage; per-instance rate limit; upload buffered in memory (up to 15 MiB) before forwarding.
- Consent wording, notice version, absence of expiry: DRAFT.
- Coverage-preview contract copied from `block4/household-reasoning`, not the audited branch.
- Security-sensitive: an independent read-only review was completed 2026-10-22 before the local C3 commit. The re-sign-in failure path fails closed without issuing a replacement cookie and best-effort revokes the newly created token. If the backend is unavailable for both revokes, a backend session can remain live until its expiry. The regression fake reuses one token, so distinct old/new token cleanup is not proven. This review does not authorize production exposure.

## NOT_IMPLEMENTED

- Real identity: OTP, magic link, OIDC. Typed stubs answer `501 IDENTITY_NOT_IMPLEMENTED`; so does `dev` when `APP_DEV_IDENTITY` is off.
- **Session recovery after expiry.** The backend cannot re-issue a session, so `SESSION_EXPIRED` is a dead end except for a brand-new household (dev provider). Needs D1 and a backend identity-to-adult mapping.
- Member creation and adult invitation (D3), serving PDF bytes (D4), OCR text or clause read routes, email or notification transport, cookie-less/mobile clients, CORS.
- Structuring BFF routes, `analysis-runs`, `curated-products`.
- Server-side session storage, distributed rate limiting, refresh of a nearly expired session.
- Recovering the case id if the state cookie is lost.

## Real-backend verification (2026-10-22)

Isolated CoverSaath (branch `block4/household-reasoning` exported, temp SQLite and encrypted storage under `.local`, real local clamd for scanning, no provider keys, loopback only) with this BFF in `next dev`. Confirmed end to end: dev sign-in, household, case, collect consent, PDF upload (and idempotent replay and conflict), clamd scan moving the document to `accepted`, OCR and question consents, OCR start (backend answers 503 `OCR_PROVIDER_DISABLED`: no provider key), question (409 `POLICY_EVIDENCE_UNAVAILABLE`: nothing was read), consent revocation, document deletion (stored bytes erased), sign-out with backend token revocation, foreign-household denial (BFF and direct backend), tampered and replayed cookies. Not exercised: OCR success, evidence answers, catalogue handoff content, coverage-preview with a real answer (they need paid Sarvam and Gemini calls).

The later C4 browser smoke used a separate ephemeral BFF and synthetic backend with the same local clamd service. A real Chromium page completed development sign-in, collect consent, synthetic PDF upload, Home overview and sign-out/session revocation. It did not exercise OCR success or model calls.

Defects the real run found, now fixed with regression tests (`tests/unit/app-bff/real-backend-regressions.test.ts`):
- Withdrawing the `collect` permission made the backend answer 403 `FIELD_ACCESS_REQUIRED` on the list and get routes, so Home and Documents failed to load and the person could not reach the delete button. The BFF now falls back to the deletion inventory and reports `documentsAccess: "permission_withdrawn"`.
- OCR_PROVIDER_DISABLED, EVIDENCE_DISABLED and DOCUMENT_STORAGE_NOT_CONFIGURED were reported as retryable with generic copy.
- `GET /documents/{id}` hid failed OCR refreshes behind an "idle" stage.
- A backend consent grant could be created that the cookie could not record (about 5 grants of 10 documents), making it unrevocable. Room is now proven before the backend call (also for OCR jobs).
- Rate-limit key trusted client-supplied `X-Forwarded-For`; rotating it created 78 sessions and filled the backend's global 100-session cap, locking everyone out.

Known gaps that remain (backend or topology work, not BFF code): no list-cases or list-grants backend route, so a lost `kv_state` cookie orphans a case or grants (the backend case cap is global, 100); the backend rate limiter keys on the socket address, so every user shares one 600/min bucket behind the BFF; the backend Host guard allows only loopback Hosts, so the BFF must run on the same host and call `127.0.0.1` or `localhost` on the bound port (a remote API gets 403 `Local access only.`); last-writer-wins races on the state cookie between tabs; an ambiguous backend timeout after a grant commits can leave an unrecorded grant; GET routes poll OCR providers.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test` (BFF tests in `tests/unit/app-bff/`).
- Unit tests use a **fake backend** (injected `fetch`, fake secrets). The real-backend run above exercised the paths it lists; everything else (OCR success, answers, handoff, preview content) is still fake-only.
- `npm run build` with fake env values, then `node scripts/check-no-secrets-in-client.mjs [static-dir]`, scans the selected client bundle for secret env names and values (a planted value was detected in a negative control). The C3 and C4 builds passed this scan.
- Server-only boundary: `tests/unit/app-bff/no-client-import.test.ts` fails if any page/layout, `src/components/**` or `src/lib/**` imports `src/server/app/**`, except the type-only re-export in `src/lib/app-contract.ts`. This replaces the `server-only` package, which is not a dependency.
