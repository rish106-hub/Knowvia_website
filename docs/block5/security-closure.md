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
