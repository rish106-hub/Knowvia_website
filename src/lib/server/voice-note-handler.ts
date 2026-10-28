import { z } from "zod";
import { MemoryRateLimiter, platformClientIp } from "./request-guards";
import { saveVoiceNote, type PoolLike } from "./waitlist-store.mjs";

// Optional 60-second voice notes from the early-list form. Off unless VOICE_NOTES_ENABLED=true,
// because retention, transcription and deletion still need legal sign-off.
export const MAX_VOICE_BYTES = 2_500_000;

const fieldsSchema = z.object({
  email: z.email().max(320),
  consent: z.literal("yes"),
  duration: z.coerce.number().int().min(1).max(60),
});

export type VoiceNoteDeps = {
  getPool: () => PoolLike | null;
  env: { NODE_ENV?: string; VOICE_NOTES_ENABLED?: string };
  limiter: MemoryRateLimiter;
  devCounter: { notes: number };
  logError: (message: string, code: string) => void;
};

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") return error.code;
  return error instanceof Error ? error.name : "unknown";
}

export function createVoiceNoteHandler(deps: VoiceNoteDeps) {
  return async function POST(request: Request): Promise<Response> {
    if (deps.env.VOICE_NOTES_ENABLED !== "true") return Response.json({ message: "Voice notes are not available yet." }, { status: 404 });
    if (deps.limiter.hit(platformClientIp(request.headers))) return Response.json({ message: "Too many attempts. Try again in a minute." }, { status: 429 });

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return Response.json({ message: "That recording could not be read. Try again, or write it instead." }, { status: 400 });
    }
    const fields = fieldsSchema.safeParse({ email: form.get("email"), consent: form.get("consent"), duration: form.get("duration") });
    if (!fields.success) return Response.json({ message: "Tick the consent box and try again." }, { status: 400 });
    const audio = form.get("audio");
    if (!(audio instanceof File) || !audio.type.startsWith("audio/") || audio.size === 0 || audio.size > MAX_VOICE_BYTES) {
      return Response.json({ message: "That recording could not be read. Try again, or write it instead." }, { status: 400 });
    }

    try {
      const pool = deps.getPool();
      if (!pool) {
        if (deps.env.NODE_ENV === "production") throw new Error("Voice note storage is not configured.");
        deps.devCounter.notes += 1;
        return Response.json({ message: "Voice note saved." }, { status: 201 });
      }
      const result = await saveVoiceNote(pool, {
        email: fields.data.email,
        audio: Buffer.from(await audio.arrayBuffer()),
        mimeType: audio.type,
        durationSeconds: fields.data.duration,
        consentSource: "website:voice-note",
      });
      if (result.status === "throttled") return Response.json({ message: "Too many attempts. Try again in a minute." }, { status: 429 });
      return Response.json({ message: "Voice note saved." }, { status: 201 });
    } catch (error) {
      deps.logError("Voice note upload failed", errorCode(error));
      return Response.json({ message: "We could not save that recording right now." }, { status: 503 });
    }
  };
}
