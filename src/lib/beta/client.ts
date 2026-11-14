// Browser helpers for the beta flow. Talks only to /api/beta/* (same origin); the backend token never reaches this code.
export type ApiError = { code: string; message: string; status: number };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin", ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = (data as { error?: { code?: string; message?: string } }).error;
    throw { code: e?.code || "BETA_FAILED", message: e?.message || "Something went wrong. Try again.", status: res.status } satisfies ApiError;
  }
  return data as T;
}

export type ChatSource = { kind?: string; document_id?: string; page?: number | null; quote?: string | null; fact_key?: string };
// `card` is the backend answer-card/v1 released by its guard (CoverSaath chat-answer-card); older backends send only the text fields.
export type ChatAnswer = { status: "evidence_found" | "unknown"; answer: string; sources: ChatSource[]; card?: unknown };

/** Parses a text/event-stream body and returns the `answer` event (or throws the coded `error` event). */
export async function readAnswer(res: Response): Promise<ChatAnswer> {
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    const e = (data as { error?: { code?: string; message?: string } }).error;
    throw { code: e?.code || "CHAT_FAILED", message: e?.message || "No answer came back.", status: res.status } satisfies ApiError;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer: ChatAnswer | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    let at: number;
    while ((at = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, at);
      buffer = buffer.slice(at + 2);
      const event = /^event: (.+)$/m.exec(block)?.[1];
      const dataLine = /^data: (.+)$/m.exec(block)?.[1];
      if (!event || !dataLine) continue;
      const data = JSON.parse(dataLine);
      if (event === "error") throw { code: String(data.code || "CHAT_TURN_FAILED"), message: "We could not answer that. Try again.", status: 500 } satisfies ApiError;
      if (event === "answer") answer = { status: data.status === "evidence_found" ? "evidence_found" : "unknown", answer: String(data.answer || ""), sources: Array.isArray(data.sources) ? data.sources : [], card: data.card ?? undefined };
    }
    if (done) break;
  }
  if (!answer) throw { code: "CHAT_TURN_FAILED", message: "No answer came back.", status: 502 } satisfies ApiError;
  return answer;
}

export function prettyKey(key: string) {
  const text = key.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatValue(value: unknown, unit?: string | null): string {
  if (value === null || value === undefined) return "Not stated";
  if (typeof value === "number") return unit === "inr" || unit === "INR" ? `Rs ${value.toLocaleString("en-IN")}` : unit ? `${value} ${unit}` : String(value);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(v => formatValue(v)).join(", ");
  return Object.entries(value as Record<string, unknown>).map(([k, v]) => `${prettyKey(k)}: ${formatValue(v)}`).join(", ");
}
