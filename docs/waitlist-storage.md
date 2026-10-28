# Waitlist and voice-note storage

The website stores early-list signups and optional voice notes in PostgreSQL, in its own schema
`knowvia_web` inside the shared `coversaath` database. Website code never reads or writes CoverSaath
backend tables, and every website query names `knowvia_web.<table>` explicitly.

## Connection

`src/lib/server/db.mjs` builds the `pg.Pool` options from:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres URL. Any `ssl*` or `uselibpqcompat` query parameters are removed, so they cannot change TLS behaviour. |
| `DATABASE_SSL_CA_PATH` | Path to the database CA certificate (PEM). |
| `DATABASE_SSL_CA` | The same PEM as text, for hosts that only offer environment variables. Literal `\n` sequences are accepted. |

Set at most one of the two CA variables. TLS rules:

- CA given: `ssl: { ca, rejectUnauthorized: true }`.
- No CA, remote host or `NODE_ENV=production`: verified TLS against the system trust store. If the
  server certificate is not signed by a public CA, connections fail. That failure is intended; supply the CA.
- No CA, `localhost` and not production: plain connection, for a local development server only.

Certificate verification is never disabled. A unit test fails if `rejectUnauthorized: false` appears in
`src` or `scripts`.

## Schema changes

Tables are created by migrations, not at request time.

```bash
DATABASE_URL=... DATABASE_SSL_CA_PATH=... node scripts/migrate.mjs
```

- Files: `db/migrations/NNN_name.sql`, applied in name order.
- Each migration runs in one transaction under a transaction-scoped advisory lock, so parallel runs
  serialise. The lock also works through a transaction-mode connection pooler.
- `knowvia_web.schema_migrations` records each applied file with a SHA-256 checksum. Editing an applied
  file stops the run; add a new migration instead.
- The migrating role needs `CREATE` on the database (to create the schema) or an existing `knowvia_web`
  schema it owns. The runtime role needs only `USAGE` on the schema and `SELECT, INSERT, UPDATE, DELETE`
  on its tables.
- `001_waitlist.sql` enables row-level security with no policies (deny for non-owner roles) and revokes the
  schema from `PUBLIC`, and from Supabase's `anon` and `authenticated` roles where they exist.

Rollback of `001`: `DROP SCHEMA knowvia_web CASCADE;` This deletes all waitlist data. Ask before running it.

## Consent

Each waitlist row stores `consent_text_version`, `consented_at` (server time) and `consent_source`
(`website:hero` or `website:closing`). The form sends `consent: true`, and the API rejects signups
without it. Voice notes store the same three fields with source `website:voice-note`.

The notice wording under the forms and on the voice-note checkbox is draft wording (version `draft-1`,
see `WAITLIST_CONSENT_VERSION` and `VOICE_NOTE_CONSENT_VERSION` in `src/lib/server/waitlist-store.mjs`).
It needs legal review before launch. When reviewed wording ships, bump the version so stored rows show
which wording each person saw.

## Abuse limits

- Per instance: an in-memory limiter keyed by the platform client IP (`x-real-ip`, else the last
  `x-forwarded-for` hop). The client-controlled first `x-forwarded-for` entry is ignored. This limiter is
  per serverless instance and is only a first line of defence.
- Per email, in the database: at most 5 waitlist submissions per email per hour (an atomic upsert with a
  window counter on the row) and 3 voice notes per email per hour. Spoofing IPs does not bypass these.
  The voice-note count and insert are one statement; heavy concurrency can overshoot slightly.

## Erasure

`eraseWaitlistEntry(pool, email)` in `src/lib/server/waitlist-store.mjs` deletes the waitlist row and every
voice note for that email in one transaction. Operators run it with:

```bash
DATABASE_URL=... DATABASE_SSL_CA_PATH=... node scripts/erase-waitlist.mjs person@example.test
```

The script prints row counts only. Verify the request came from the address owner first (reply from that
mailbox). There is no self-service erasure link yet. Backups or point-in-time recovery held by the
database host keep deleted rows until they expire; record the request date so a restore can re-apply it.

## Voice notes

`/api/voice-note` returns 404 unless `VOICE_NOTES_ENABLED=true`. Keep it off until legal review signs off
retention, transcription and deletion. No retention job exists yet.

## Tests

- `npm test` runs route, TLS-option and erasure unit tests with an injected fake pool.
- `tests/unit/waitlist/waitlist-pg.integration.test.ts` runs only when `TEST_DATABASE_URL` points at a
  local server, for example `TEST_DATABASE_URL=postgres://coversaath@localhost:54329/postgres npm test`.
  It creates and drops a throwaway database. Without the variable it is skipped and prints why.
