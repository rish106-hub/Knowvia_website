# Block 5 slices S3 and S4: evidence view and coverage preview

Status: **PROVISIONAL, verified against mocked payloads only.** No real CoverSaath, no real BFF behaviour and no model call was used. Payload shapes were read from CoverSaath branch `block4/household-reasoning` (`policy-evidence.js`, `investigate.js`, `decision-catalogue/handoff.js`, `household-reasoning/*`, `docs/architecture/household-reasoning.md`, `decision-catalogue.md`, `reviewer-security.md`). Synthetic data only.

## Where things are

| Area | Path |
| --- | --- |
| Routes | `src/app/app/cover/page.tsx` (evidence), `src/app/app/cover/preview/page.tsx` (preview) |
| Screens and primitives | `src/components/app/evidence/**`, `src/components/app/preview/**` |
| Pure logic (no React) | `src/lib/app-evidence/**`: `schemas.ts` (zod boundary), `evidence-view.ts`, `preview-view.ts`, `scenario.ts` (reducer), `idempotency.ts`, `errors.ts`, `storage.ts`, `format.ts`, `labels.ts`; `api.ts` is the thin appFetch layer |
| Unit tests | `tests/unit/app-evidence/` (83 tests, includes fail-closed and never-upgrade cases) |
| E2E | `tests/e2e/s34/` (39 specs, mocks every `/api/app/**` call with `page.route`; screenshot baselines intentionally omitted) |
| Fixtures | `tests/unit/app-evidence/fixtures.ts`, shared by unit and e2e |

## Screens

### `/app/cover` (evidence view)

1. `GET /overview`. No case or no readable document: empty state linking to `/app/documents` (a document still being prepared is listed with its own status label instead).
2. Readable documents but no `question_gemini` grant covering all of them: consent gate. It shows the server's DRAFT notice (`GET /consents/notices`) with a visible "Draft wording, pending legal review" marker, says plainly that text from the document goes to Gemini, and that withdrawing erases the answer. The grant button stays unavailable until the notice has loaded. `POST /consents {scope:"question_gemini", documentIds}`.
3. `POST /cases/{id}/questions` with a fixed neutral question and a **stable** `Idempotency-Key` = `kv-q-` + first 48 hex of SHA-256 of `[case, sorted unique documentIds, "first-read-v1", generation]`. The `answerId` is kept in `sessionStorage` per case, so a reload does `GET /cases/{id}/answers/{answerId}` (no cost). If storage is gone, the same key is sent again and the backend replays the stored answer at no extra cost. `generation` is only bumped after a stale or conflict error, so asking again is deliberate. The waiting state says "Reading your document", has no percentage, adds "Still reading" after 20 s and a "Check again" button after 75 s; the request is aborted after 150 s.
4. `GET /cases/{id}/decision-catalogue?answerId=` (handoff). Quotes come from the answer's `sources` joined on `clauseId` (the handoff itself carries page and clause ids but no quote).
5. Per policy group: fact cards (state badge, statement, citation quote and "Document kind, Page N" button that opens the source sheet), a "Not confirmed" list, "What we could not tell" (the answer's own `unknowns` plus a retrieval caveat) and ONE next step (to the preview).
6. Self-confirmation: "Confirm this from the document" appears only on an unreviewed open-ended finding that has a visible quote. First use calls `POST /catalogue-confirmers {adultUserId: owner.adultId}` (409 treated as already designated; flag kept in sessionStorage), then `POST /cases/{id}/catalogue-reviews` with its own derived `Idempotency-Key` (`kv-r-...`). "No, this is not right" records `rejected`/`does_not_match_clause` and the backend drops the item.

### `/app/cover/preview` (household coverage preview)

- Reads the stored answer (and the answer itself, for quotes), then `POST /coverage-preview` with only `{contractVersion:"household-scenario/v1", sources:[{caseId, answerId}], scenario:{scenarioType, answers}}`. Every scenario change re-sends the full scenario: the contract is stateless and `scenario.answers` lives in a reducer and in `sessionStorage`.
- Shows: assessment banner, one prioritised next action (P0 gap before P1 before P2, blocking first, fixed action order; other open steps are in a closed `<details>`), at most 2 questions with Save, Skip and "I do not know" always present, per-person policy section (owner only today), "Not confirmed", "Not checked", external checks, overlap and coordination notes, "What this does not tell you".
- Client guards on top of the server's: max 2 questions, none already answered locally, none with an unknown key or mismatched id, none once 5 journey questions are used; answers are validated by type before sending.

### Source sheet

A native `<dialog>` opened with `showModal()`: quote, document kind, "Page N", clause reference, and "We cannot open the original file here". It traps Tab, closes on Escape or backdrop click and returns focus to the opener. There is no PDF viewer and no link to the file (no route serves bytes, decision D4). A quote flagged `verbatim:false` says some personal details are hidden.

## Evidence state to UI mapping

Colour is the third cue: each state has its own border shape, icon and words (`--state-*` tokens).

| Backend state | Condition | UI kind | Label | Border and icon |
| --- | --- | --- | --- | --- |
| item `known` | citation, `associationVerified`, policy association verified, non-null value | `known` | Known | solid, check |
| item `known` | any of those missing | `from_document` | From the document, not yet confirmed | dotted, page |
| item `not_permitted` / `not_selected` / `available_not_selected` | citation and verified association | `known` with detail "Documented: ..." | Known | solid, check |
| same | evidence incomplete | `from_document` | From the document, not yet confirmed | dotted, page |
| item `unverified`, open-ended finding unreviewed | | `from_document` | From the document, not yet confirmed | dotted, page |
| finding with accepted household review (current) | `verified` not true | `confirmed_by_you` | Confirmed by you (and "not verified by Knowvia or your insurer") | solid harbour, person-check |
| finding with accepted independent review | backend also `verified:true` and a citation | `known` | Known, "Reviewed by an independent reviewer" | solid, check |
| disputed review, item `conflicting`, catalogue conflict | | `conflicting` | Documents disagree | thick brick, alert |
| item `missing` or unrecognised state | | `not_confirmed` with reason | Not confirmed | dashed gold, question |
| item `dynamic_check`, preview `dynamicChecks`, `externalChecks` | whatever status the server sends | `not_checked` | Not checked, "confirm with your insurer or hospital" | dotted, clock |
| stale, revoked or reviewer_revoked review | | ignored | | |
| next action `status:"completed"` | | shown as "Not done yet" | | |

Rules enforced in code and tested: nothing is ever upgraded; a missing item is never worded as an exclusion; no line numbers (a page is shown only when the backend gave an integer, else "Page not recorded"); no money arithmetic (a documented amount is only formatted, with "A limit in the policy. It is not cash and is not added to any other policy."); no approval, payment or cashless wording.

## Fail-closed behaviour

- `parseHandoff` refuses the whole payload on a wrong `handoffVersion`, a non-null `combinedConfirmedCover`, or a policy that is not `spendableCash:false` (same invariants as the backend `assertHandoffContract`). The screen then shows every answer entry as "From the document, not yet confirmed" with "none of them is shown as confirmed".
- `parsePreview` refuses a wrong `contractVersion`; an unknown `assessmentState` becomes "We could not tell how complete this is".
- Malformed list elements are dropped and counted ("Some entries in the response could not be read and are not shown"), never guessed.
- Error text from the backend is never shown; `errors.ts` maps codes to one message and one recovery path (retry, sign in, consent again, read again, documents, change answer).

## Copy that needs legal review

All of it is draft. In particular: the consent gate sentences ("sends text from it to Gemini", "withdraw this later from your home page", "the answer made from your document is erased"); the server notice text it displays (DRAFT, owned by the BFF); the self-confirmation text ("Your confirmation is recorded as yours. It does not make this verified..."); "Confirmed by you"; every "Not checked / confirm with your insurer or hospital" line; the assessment banners; "This reads your document. It is not a claim decision, and it does not say what your insurer will pay"; the one-line money note under limits; "Seek care first. Nothing here delays care" (backend text). The "erased on withdrawal" statement relies on a backend invariant that was not exercised here.

## Not verified

- Nothing ran against a real backend, a real BFF, a real model, or real documents. Shapes are from source and tests read, not from a live response.
- The coverage-preview route exists only on CoverSaath `block4/household-reasoning`.
- Real `viewerRole` values, the exact `409` behaviour of `POST /catalogue-reviewers` for an already designated adult, and the HTTP status of a replayed question after a consent revoke and regrant were assumed, not observed (the UI tolerates a 409 on designation and bumps the idempotency generation on a conflict).
- Visual specs are included, but screenshot baselines were intentionally omitted. No visual snapshot comparison was run.
- Accessibility was checked by assertions (labels, roles, heading order, 44px targets, 320px no horizontal scroll, focus return, Tab trap) and by eye on baselines. There was no screen-reader run and no automated contrast audit (no new dependency).
- Keyboard behaviour inside the native dialog was tested in Chromium only.

## Known gaps

- **Most previews will be `insufficient_evidence` or `conditional`.** Block 3 turns a model reading into a known fact only through an independent reviewer (operator granted, `CATALOGUE_INDEPENDENT_REVIEW_ENABLED` default off). A household self-confirmation is `reported` and never `known`, so it does not change a preview. Today the "Known" path is exercised only by fixtures.
- **No explicit "you may confirm" flag in the handoff.** The UI offers confirmation on an unreviewed finding with a visible quote and relies on the backend refusing (404) a caller who is not the household owner. A flag from the backend would be better.
- Document name: the BFF does not keep file names, so a citation reads "Policy wording, Page 4" (kind, and an upload date when two documents share a kind).
- All readable documents of the case (up to 10) are read together as one policy request. The answer says that their belonging to one policy is not verified. There is no document picker.
- Only the owner exists as a member (no member creation, D3), so "per member" is one person.
- The preview needs `memberId` from `Q_MEMBER`; with no members returned, the question can only be skipped or answered "I do not know".
- Scenario options are a fixed list; there is no free-text scenario beyond the planner's questions.
- Revoke lives on the home page (S2). The cover screens only recover from a revoke; they do not revoke.
- The next action on the evidence view is always "go to the preview". Reviewer, insurer and hospital steps appear only on the preview.

## Commands

```
npm run lint
npm run typecheck
npm test
NEXT_DIST_DIR=.next-s34-build npm run build
E2E_PORT=3102 NEXT_DIST_DIR=.next-s34 npx playwright test -c playwright.app.config.ts tests/e2e/s34
# update baselines
E2E_PORT=3102 NEXT_DIST_DIR=.next-s34 npx playwright test -c playwright.app.config.ts tests/e2e/s34/visual.spec.ts --update-snapshots
```
