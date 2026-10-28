// Browser-side fetch wrapper for the /api/app BFF. Shared by every /app screen.
// Never holds a credential: the session lives in an httpOnly cookie the browser sends itself.
import type { ErrorBody } from "./app-contract";

export class AppApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  readonly fields?: unknown;

  constructor(status: number, body: ErrorBody["error"]) {
    super(body.message);
    this.name = "AppApiError";
    this.status = status;
    this.code = body.code;
    this.retryable = body.retryable;
    this.fields = body.fields;
  }
}

const NETWORK_ERROR = {
  code: "NETWORK_UNREACHABLE",
  message: "We could not reach Knowvia. Check your connection and try again.",
  retryable: true,
} as ErrorBody["error"];

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  json?: unknown;
  body?: BodyInit;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export async function appFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { ...options.headers };
  let body = options.body;
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }
  // Every request carries the marker: writes need it, and the GETs that poll the OCR provider need it too.
  headers["X-Knowvia-App"] = "1";

  let response: Response;
  try {
    response = await fetch(`/api/app${path}`, { method, headers, body, signal: options.signal, credentials: "same-origin" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AppApiError(0, NETWORK_ERROR);
  }

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!response.ok) {
    const error = (parsed as ErrorBody | null)?.error;
    throw new AppApiError(
      response.status,
      error ?? { code: "UNEXPECTED_RESPONSE", message: "Something went wrong. Try again.", retryable: response.status >= 500 },
    );
  }
  return parsed as T;
}

export function newIdempotencyKey(): string {
  return `kv-${crypto.randomUUID()}`;
}
