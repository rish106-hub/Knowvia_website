// One client-safe error type for the whole BFF. Backend messages are never passed through verbatim:
// the client sees a message from this table keyed by code, or a generic message keyed by status.

export type AppErrorInit = {
  status: number;
  code: string;
  message?: string;
  retryable?: boolean;
  fields?: string[];
  clearSession?: boolean;
};

const MESSAGES: Record<string, string> = {
  APP_DISABLED: "This area is not available.",
  APP_MISCONFIGURED: "This service is not configured.",
  CSRF_BLOCKED: "This request was blocked.",
  RATE_LIMITED: "Too many attempts. Try again later.",
  SESSION_REQUIRED: "Sign in to continue.",
  SESSION_EXPIRED: "Your session has ended. Sign in again.",
  IDENTITY_NOT_IMPLEMENTED: "Sign-in is not available yet.",
  INVALID_REQUEST: "The request was not valid.",
  PDF_ONLY: "Only PDF files can be added.",
  FILE_TOO_LARGE: "That file is larger than 15 MB.",
  IDEMPOTENCY_KEY_REQUIRED: "A stable Idempotency-Key header of 8 to 200 characters is required.",
  UNSUPPORTED_DOCUMENT_KIND: "That document kind is not supported.",
  NOT_FOUND: "Not found.",
  METHOD_NOT_ALLOWED: "That method is not allowed here.",
  STATE_LIMIT_REACHED: "Too many items are being tracked in this session.",
  CONSENT_REQUIRED: "Permission is needed before this can continue.",
  CONSENT_SCOPE_REQUIRED: "The permission given does not cover this.",
  CONSENT_SUBJECT_REQUIRED: "Only the person concerned can give this permission.",
  FIELD_ACCESS_REQUIRED: "You do not have access to this.",
  DOCUMENT_NOT_FOUND: "Document not found.",
  CASE_NOT_FOUND: "Case not found.",
  HOUSEHOLD_NOT_FOUND: "Household not found.",
  CONSENT_NOT_FOUND: "Permission record not found.",
  DOCUMENT_STORAGE_NOT_CONFIGURED: "Document storage is not available right now.",
  DUPLICATE_DOCUMENT: "That document was already added.",
  UPLOAD_CAPACITY_REACHED: "Too many documents are waiting to be checked.",
  DOCUMENT_DELETE_FORBIDDEN: "You cannot delete this document.",
  IDEMPOTENCY_CONFLICT: "That request key was already used for something different.",
  IDEMPOTENCY_IN_PROGRESS: "That request is still being worked on. Try again shortly.",
  OCR_JOB_NOT_STARTED: "Reading has not been started for this document.",
  OCR_PROVIDER_DISABLED: "Reading documents is not available yet.",
  OCR_PROVIDER_NOT_CONFIGURED: "Reading documents is not available yet.",
  EVIDENCE_DISABLED: "Questions about your documents are not available yet.",
  POLICY_EVIDENCE_UNAVAILABLE: "These documents have not been read yet.",
  UPLOAD_IN_PROGRESS: "Another upload is still in progress. Wait for it to finish.",
  BACKEND_UNREACHABLE: "The service is not reachable. Try again.",
  BACKEND_TIMEOUT: "The service took too long. Try again.",
  BACKEND_BAD_RESPONSE: "The service gave an unexpected answer.",
  BACKEND_AUTH_FAILED: "The service could not be reached securely.",
  BACKEND_REQUEST_FAILED: "The request could not be completed.",
  INTERNAL: "Something went wrong.",
};

const GENERIC_BY_STATUS = (status: number) => {
  if (status === 401) return MESSAGES.SESSION_EXPIRED;
  if (status === 403) return MESSAGES.CONSENT_REQUIRED;
  if (status === 404) return MESSAGES.NOT_FOUND;
  if (status === 413) return MESSAGES.FILE_TOO_LARGE;
  if (status === 429) return MESSAGES.RATE_LIMITED;
  if (status >= 500) return MESSAGES.BACKEND_REQUEST_FAILED;
  return MESSAGES.INVALID_REQUEST;
};

export const isTransientStatus = (status: number) => status === 408 || status === 429 || status >= 500;

// A feature that is switched off or not configured is not fixed by trying again, whatever the HTTP status.
const NOT_RETRYABLE_CODES = new Set(["OCR_PROVIDER_DISABLED", "OCR_PROVIDER_NOT_CONFIGURED", "EVIDENCE_DISABLED", "DOCUMENT_STORAGE_NOT_CONFIGURED"]);

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  readonly fields: string[];
  readonly clearSession: boolean;

  constructor(init: AppErrorInit) {
    super(init.message ?? MESSAGES[init.code] ?? GENERIC_BY_STATUS(init.status));
    this.name = "AppError";
    this.status = init.status;
    this.code = init.code;
    this.retryable = init.retryable ?? (isTransientStatus(init.status) && !NOT_RETRYABLE_CODES.has(init.code));
    this.fields = init.fields ?? [];
    this.clearSession = init.clearSession ?? false;
  }
}

export const appError = (status: number, code: string, extra: Partial<AppErrorInit> = {}) =>
  new AppError({ status, code, ...extra });

export type ErrorBody = { error: { code: string; message: string; retryable: boolean; fields?: string[] } };

export function errorBody(error: AppError): ErrorBody {
  return {
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      ...(error.fields.length ? { fields: error.fields } : {}),
    },
  };
}

const PUBLIC_CODE = /^[A-Z][A-Z0-9]*_[A-Z0-9_]{1,78}$/;

/**
 * Normalises both backend error shapes plus unusable bodies into an AppError.
 *  - { error: { code, message } }   (route errors)
 *  - { error: "string" }            (publicError / local guard)
 * The backend message text is intentionally discarded.
 */
export function normalizeBackendFailure(
  status: number,
  body: unknown,
  { authenticated }: { authenticated: boolean },
): AppError {
  let code: string | null = null;
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error: unknown }).error;
    if (error && typeof error === "object" && typeof (error as { code?: unknown }).code === "string") {
      const candidate = (error as { code: string }).code;
      if (PUBLIC_CODE.test(candidate) && !candidate.startsWith("ERR_")) code = candidate;
    }
    // The string shape carries no code. It is treated as an uncoded failure of that status.
  }
  if (status === 401) {
    if (authenticated) return new AppError({ status: 401, code: "SESSION_EXPIRED", clearSession: true });
    // A 401 on the bootstrap call is our configuration, never the visitor's mistake.
    return new AppError({ status: 502, code: "BACKEND_AUTH_FAILED", retryable: false });
  }
  if (status === 503 && code === "AUTH_NOT_CONFIGURED") {
    return new AppError({ status: 502, code: "BACKEND_AUTH_FAILED", retryable: false });
  }
  const safeStatus = status >= 400 && status <= 599 ? status : 502;
  return new AppError({ status: safeStatus, code: code ?? "BACKEND_REQUEST_FAILED" });
}
