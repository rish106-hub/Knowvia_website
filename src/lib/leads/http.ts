import "server-only";
import { MAX_LEAD_BODY_BYTES } from "./schema";

export function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

/** Reads a bounded JSON body. Returns a Response for any transport-level rejection. */
export async function readJsonBody(request: Request): Promise<{ body: unknown } | { response: Response }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { response: json(415, { error: "unsupported_media_type" }) };
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_LEAD_BODY_BYTES) return { response: json(413, { error: "payload_too_large" }) };
  // Stream with a hard cap so a chunked body without Content-Length is never buffered in full.
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_LEAD_BODY_BYTES) {
        await reader.cancel();
        return { response: json(413, { error: "payload_too_large" }) };
      }
      chunks.push(value);
    }
  }
  const text = new TextDecoder().decode(Buffer.concat(chunks));
  try {
    return { body: JSON.parse(text) as unknown };
  } catch {
    return { response: json(400, { error: "invalid_request", fields: ["body"] }) };
  }
}
