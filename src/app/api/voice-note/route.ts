import { createHash } from "node:crypto";
import { Pool } from "pg";
import { z } from "zod";

// Optional 60-second voice notes from the early-list form. Off unless VOICE_NOTES_ENABLED=true,
// because retention, transcription and deletion still need legal sign-off.
const MAX_BYTES = 2_500_000;
const fieldsSchema = z.object({
  email: z.email().max(320),
  consent: z.literal("yes"),
  duration: z.coerce.number().int().min(1).max(60),
});

type VoiceStore = { attempts: Map<string, number[]>; notes: number };
const globalStore = globalThis as typeof globalThis & { knowviaVoice?: VoiceStore; knowviaPool?: Pool };
globalStore.knowviaVoice ??= { attempts: new Map(), notes: 0 };

function rateLimited(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = createHash("sha256").update(address).digest("hex").slice(0, 16);
  const now = Date.now();
  const recent = (globalStore.knowviaVoice?.attempts.get(key) || []).filter((time) => now - time < 60_000);
  recent.push(now);
  globalStore.knowviaVoice?.attempts.set(key, recent);
  return recent.length > 4;
}

export async function POST(request: Request) {
  if (process.env.VOICE_NOTES_ENABLED !== "true") return Response.json({ message: "Voice notes are not available yet." }, { status: 404 });
  if (rateLimited(request)) return Response.json({ message: "Too many attempts. Try again in a minute." }, { status: 429 });
  try {
    const form = await request.formData();
    const fields = fieldsSchema.parse({ email: form.get("email"), consent: form.get("consent"), duration: form.get("duration") });
    const audio = form.get("audio");
    if (!(audio instanceof File) || !audio.type.startsWith("audio/") || audio.size === 0 || audio.size > MAX_BYTES) {
      return Response.json({ message: "That recording could not be read. Try again, or write it instead." }, { status: 400 });
    }
    const bytes = Buffer.from(await audio.arrayBuffer());
    if (!process.env.DATABASE_URL) {
      if (process.env.NODE_ENV === "production") throw new Error("Voice note storage is not configured.");
      globalStore.knowviaVoice!.notes += 1;
      return Response.json({ message: "Voice note saved." }, { status: 201 });
    }
    globalStore.knowviaPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 4, ssl: process.env.DATABASE_URL.includes("localhost") ? undefined : { rejectUnauthorized: false } });
    const pool = globalStore.knowviaPool;
    await pool.query(`CREATE TABLE IF NOT EXISTS knowvia_voice_notes (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      audio BYTEA NOT NULL,
      mime_type TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      consent_text TEXT NOT NULL,
      consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await pool.query(
      `INSERT INTO knowvia_voice_notes (email, audio, mime_type, duration_seconds, consent_text) VALUES ($1, $2, $3, $4, $5)`,
      [fields.email.toLowerCase(), bytes, audio.type.slice(0, 80), fields.duration, "I agree that Knowvia can store this voice note to understand my family's cover."],
    );
    return Response.json({ message: "Voice note saved." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ message: "Tick the consent box and try again." }, { status: 400 });
    console.error("Voice note upload failed", error);
    return Response.json({ message: "We could not save that recording right now." }, { status: 503 });
  }
}
