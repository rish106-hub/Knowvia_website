<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Agent Rules

## Mission

- Make the smallest safe change that meets the written outcome.
- Treat the repository as the source of truth. Separate confirmed facts, reasonable inferences, and unknowns.
- Do not expand scope, add dependencies, or change infrastructure without a clear need.

## Start Here

- Read this file and only the project documents relevant to the task.
- Inspect the smallest relevant part of the repository before editing.
- Preserve unrelated and untracked work.
- Ask only about unknowns that would materially change the product or architecture.

## Repository Facts

- This is a Next.js landing site and onboarding preview.
- The landing page, site navigation, footer, and onboarding UI are generated from `design/claude-design/`.
- Change generated UI in the design source, then run the design generator.
- Vercel is the current hosting target. Azure is future work.
- PostgreSQL is used only for waitlist data today.
- Voice notes are disabled until their retention, transcription, and deletion rules are approved.
- There is no repository CI configuration. Do not add one unless the task requires it.

## Before Implementation

- Restate the user outcome, acceptance criteria, and non-goals.
- Identify affected UI, data, APIs, permissions, services, and user journeys.
- Classify risk as normal, data-sensitive, security-sensitive, migration-sensitive, or infrastructure-sensitive.
- Write a short implementation and verification plan.

## Implementation Rules

- Build one coherent vertical slice at a time.
- Preserve behavior outside the agreed scope.
- Validate inputs and authorization at server boundaries.
- Protect database invariants with constraints and transactions.
- Add idempotency where retries could duplicate work.
- Do not change database schemas, API contracts, or deployment settings without explicit scope.
- Run narrow checks after each slice and inspect failures before changing the approach.

## Commands

- Install exact dependencies: `npm ci`
- Start locally: `npm run dev`
- Regenerate designed UI: `python3 scripts/design-port/gen_site.py design/claude-design .`
- Run all checks: `npm run check`
- Check patch formatting: `git diff --check`

## Completion

- Test the real user journey where possible.
- Review accessibility, permissions, sensitive data, failure paths, retries, observability, and rollback.
- Review the final diff for scope creep and generated-file churn.
- Report what changed, evidence, checks, unverified items, data implications, rollback, and follow-up work.
- Do not claim completion when required evidence is missing.
