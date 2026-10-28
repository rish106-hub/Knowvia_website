// @ts-check
// Waitlist and voice-note persistence in the knowvia_web schema. All functions take an injected pool,
// so routes, scripts and tests share one implementation. Schema changes live in db/migrations, never here.
import { WEB_SCHEMA } from "./db.mjs";

// The notice shown beside the waitlist forms is draft wording. It needs legal review before launch;
// change this version whenever the reviewed wording replaces it.
export const WAITLIST_CONSENT_VERSION = "draft-1";
// The voice-note consent checkbox wording is also a draft that needs legal review.
export const VOICE_NOTE_CONSENT_VERSION = "draft-1";

/** Submissions per email per hour before the database throttle answers "too many". */
export const EMAIL_HOURLY_LIMIT = 5;
export const VOICE_NOTES_HOURLY_LIMIT = 3;

/**
 * @typedef {{ query: (text: string, values?: unknown[]) => Promise<{ rows: any[], rowCount: number | null }> }} Queryable
 * @typedef {Queryable & { connect: () => Promise<Queryable & { release: () => void }> }} PoolLike
 */

/** @param {string} email */
export function normaliseEmail(email) {
  return email.trim().toLowerCase();
}

/**
 * Inserts or refreshes a waitlist row. Returns { status: "saved" } or { status: "throttled" } when the
 * email has already been submitted EMAIL_HOURLY_LIMIT times in the current hour. Atomic in one statement.
 * @param {Queryable} pool
 * @param {{ email: string, firstName: string | null, events: string[], policies: string[], location: "hero" | "closing", attribution: Record<string, string | undefined>, consentSource: string }} lead
 * @returns {Promise<{ status: "saved" | "throttled" }>}
 */
export async function saveWaitlistEntry(pool, lead) {
  const result = await pool.query(
    `INSERT INTO ${WEB_SCHEMA}.waitlist AS w
       (email, first_name, events, policies, signup_location, attribution, consent_text_version, consented_at, consent_source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8)
     ON CONFLICT (email) DO UPDATE SET
       first_name = COALESCE(EXCLUDED.first_name, w.first_name),
       events = EXCLUDED.events,
       policies = EXCLUDED.policies,
       signup_location = EXCLUDED.signup_location,
       attribution = EXCLUDED.attribution,
       consent_text_version = EXCLUDED.consent_text_version,
       consented_at = EXCLUDED.consented_at,
       consent_source = EXCLUDED.consent_source,
       window_started_at = CASE WHEN w.window_started_at <= now() - interval '1 hour' THEN now() ELSE w.window_started_at END,
       window_count = CASE WHEN w.window_started_at <= now() - interval '1 hour' THEN 1 ELSE w.window_count + 1 END,
       updated_at = now()
     WHERE w.window_started_at <= now() - interval '1 hour' OR w.window_count < $9
     RETURNING id`,
    [
      normaliseEmail(lead.email),
      lead.firstName,
      lead.events,
      lead.policies,
      lead.location,
      JSON.stringify(lead.attribution),
      WAITLIST_CONSENT_VERSION,
      lead.consentSource,
      EMAIL_HOURLY_LIMIT,
    ],
  );
  return { status: result.rowCount === 1 ? "saved" : "throttled" };
}

/**
 * Stores a voice note unless this email already sent VOICE_NOTES_HOURLY_LIMIT in the last hour.
 * The count-and-insert is one statement; concurrent requests can overshoot the limit slightly.
 * @param {Queryable} pool
 * @param {{ email: string, audio: Buffer, mimeType: string, durationSeconds: number, consentSource: string }} note
 * @returns {Promise<{ status: "saved" | "throttled" }>}
 */
export async function saveVoiceNote(pool, note) {
  const result = await pool.query(
    `INSERT INTO ${WEB_SCHEMA}.voice_notes (email, audio, mime_type, duration_seconds, consent_text_version, consented_at, consent_source)
     SELECT $1, $2, $3, $4, $5, now(), $6
     WHERE (SELECT count(*) FROM ${WEB_SCHEMA}.voice_notes WHERE email = $1 AND created_at > now() - interval '1 hour') < $7
     RETURNING id`,
    [normaliseEmail(note.email), note.audio, note.mimeType.slice(0, 80), note.durationSeconds, VOICE_NOTE_CONSENT_VERSION, note.consentSource, VOICE_NOTES_HOURLY_LIMIT],
  );
  return { status: result.rowCount === 1 ? "saved" : "throttled" };
}

/**
 * Erases everything the website holds for an email: the waitlist row and every voice note.
 * Runs in one transaction. Returns the number of rows removed from each table.
 * @param {PoolLike} pool
 * @param {string} email
 * @returns {Promise<{ waitlist: number, voiceNotes: number }>}
 */
export async function eraseWaitlistEntry(pool, email) {
  const address = normaliseEmail(email);
  if (!address.includes("@")) throw new Error("eraseWaitlistEntry needs an email address.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const voice = await client.query(`DELETE FROM ${WEB_SCHEMA}.voice_notes WHERE email = $1`, [address]);
    const lead = await client.query(`DELETE FROM ${WEB_SCHEMA}.waitlist WHERE email = $1`, [address]);
    await client.query("COMMIT");
    return { waitlist: lead.rowCount ?? 0, voiceNotes: voice.rowCount ?? 0 };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
