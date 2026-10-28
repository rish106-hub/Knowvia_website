import { getPool } from "@/lib/server/db.mjs";
import { MemoryRateLimiter } from "@/lib/server/request-guards";
import { createVoiceNoteHandler } from "@/lib/server/voice-note-handler";

// Off unless VOICE_NOTES_ENABLED=true. Tables are created by scripts/migrate.mjs, never at request time.
export const POST = createVoiceNoteHandler({
  getPool: () => getPool(),
  env: process.env,
  limiter: new MemoryRateLimiter(4, 60_000),
  devCounter: { notes: 0 },
  logError: (message, code) => console.error(message, code),
});
