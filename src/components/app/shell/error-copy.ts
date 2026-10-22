// Maps BFF error codes to recoverable, human copy. Pure: unit tested in tests/unit/app-ui.
// The BFF already discards backend message text and sends its own; this table is the UI's wording so each screen can
// say what to do next. All wording is product copy, not legal copy.
export const PDF_ONLY_MESSAGE = "Only PDF files can be added. Choose a PDF.";
export const FILE_TOO_LARGE_MESSAGE = "This file is over 15 MB. Try a smaller PDF.";
export const EMPTY_FILE_MESSAGE = "This file is empty. Choose a different PDF.";
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export type ErrorLike = { code: string; status: number; retryable: boolean };

export type ErrorAction =
  | "retry" // same request again (same Idempotency-Key for uploads)
  | "choose_again" // the file or its key cannot be reused: pick the file again
  | "reload" // state is stale: reload
  | "sign_in" // session gone
  | "none";

export type ErrorCopy = { title: string; message: string; action: ErrorAction };

const TRY_LATER = "Try again in a moment.";

const BY_CODE: Record<string, Omit<ErrorCopy, "action"> & { action?: ErrorAction }> = {
  SESSION_REQUIRED: { title: "Sign in to continue", message: "You are not signed in.", action: "sign_in" },
  SESSION_EXPIRED: {
    title: "Your session ended",
    message: "Signing back in to the same household is not available yet.",
    action: "sign_in",
  },
  CSRF_BLOCKED: { title: "Request blocked", message: "Your browser blocked this request for safety. Reload the page and try again.", action: "reload" },
  RATE_LIMITED: { title: "Too many attempts", message: "Wait a few minutes, then try again.", action: "none" },
  IDENTITY_NOT_IMPLEMENTED: { title: "Sign-in is not available yet", message: "Knowvia accounts are not open yet.", action: "none" },
  APP_DISABLED: { title: "Sign-in is not available yet", message: "Knowvia accounts are not open yet.", action: "none" },
  APP_MISCONFIGURED: { title: "Knowvia is not set up here yet", message: "Nothing was changed.", action: "none" },
  BACKEND_AUTH_FAILED: { title: "Knowvia could not finish that", message: `Our service is not responding properly. ${TRY_LATER}`, action: "retry" },
  BACKEND_UNREACHABLE: { title: "Knowvia could not be reached", message: `Our service is not responding. ${TRY_LATER}`, action: "retry" },
  BACKEND_TIMEOUT: { title: "That took too long", message: `Our service did not answer in time. ${TRY_LATER}`, action: "retry" },
  BACKEND_BAD_RESPONSE: { title: "Knowvia could not finish that", message: `Our service sent an answer we could not use. ${TRY_LATER}`, action: "retry" },
  NETWORK_UNREACHABLE: {
    title: "You look offline",
    message: "We could not reach Knowvia. Check your connection, then try again.",
    action: "retry",
  },
  UNEXPECTED_RESPONSE: { title: "Something went wrong", message: "Knowvia sent an answer we could not read.", action: "retry" },
  INVALID_REQUEST: { title: "Check what you entered", message: "Something was not accepted. Check the details and try again.", action: "none" },
  CONSENT_SUBJECT_REQUIRED: {
    title: "Another adult is needed",
    message: "This permission has to come from an adult in the household who is not set up yet.",
    action: "none",
  },
  DOCUMENT_NOT_FOUND: { title: "Document not found", message: "It may have been deleted. Reload to see what is there now.", action: "reload" },
  CONSENT_NOT_FOUND: { title: "Permission not found", message: "It may already be withdrawn. Reload to see the current list.", action: "reload" },
  CONSENT_REQUIRED: { title: "Permission needed", message: "This step needs your permission first. Allow it, then try again.", action: "reload" },
  CONSENT_SCOPE_REQUIRED: {
    title: "Permission needed",
    message: "Knowvia does not have your permission to store this PDF. Allow it, then try again.",
    action: "reload",
  },
  FIELD_ACCESS_REQUIRED: { title: "Permission needed", message: "Knowvia cannot open this until you allow storing your PDFs again.", action: "none" },
  OCR_PROVIDER_DISABLED: { title: "Reading is not available yet", message: "Knowvia cannot read documents here yet. Your PDF is still stored.", action: "none" },
  OCR_PROVIDER_NOT_CONFIGURED: { title: "Reading is not available yet", message: "Knowvia cannot read documents here yet. Your PDF is still stored.", action: "none" },
  EVIDENCE_DISABLED: { title: "Questions are not available yet", message: "Knowvia cannot answer questions about your documents here yet.", action: "none" },
  POLICY_EVIDENCE_UNAVAILABLE: { title: "Nothing to read yet", message: "These documents have not been read yet, so there is nothing to answer from.", action: "none" },
  UPLOAD_IN_PROGRESS: { title: "One upload at a time", message: "Another upload is still in progress. Wait for it to finish, then try again.", action: "retry" },
  PDF_ONLY: { title: "PDF only", message: PDF_ONLY_MESSAGE, action: "choose_again" },
  FILE_TOO_LARGE: { title: "File too large", message: FILE_TOO_LARGE_MESSAGE, action: "choose_again" },
  IDEMPOTENCY_KEY_REQUIRED: { title: "Upload not started", message: "Something went wrong preparing the upload. Choose the file again.", action: "choose_again" },
  IDEMPOTENCY_CONFLICT: { title: "Upload clashed", message: "This upload clashed with an earlier attempt. Choose the file again.", action: "choose_again" },
  UNSUPPORTED_DOCUMENT_KIND: { title: "Choose a document type", message: "Say what kind of document this is, then try again.", action: "none" },
  DOCUMENT_STORAGE_NOT_CONFIGURED: { title: "Adding PDFs is not available yet", message: "Nothing was uploaded.", action: "none" },
  DUPLICATE_DOCUMENT: { title: "Already added", message: "You have already added this PDF.", action: "reload" },
  UPLOAD_CAPACITY_REACHED: { title: "Knowvia is busy", message: "Too many files are arriving at once. Try again in a few minutes.", action: "retry" },
  DOCUMENT_DELETE_FORBIDDEN: { title: "Cannot delete", message: "You are not allowed to delete this document.", action: "none" },
  OCR_JOB_NOT_STARTED: { title: "Reading has not started", message: "Start reading this PDF first.", action: "reload" },
  STATE_LIMIT_REACHED: { title: "Limit reached", message: "This household has reached what can be saved for now.", action: "none" },
  NOT_FOUND: { title: "Not found", message: "That is no longer there. Reload the page.", action: "reload" },
  METHOD_NOT_ALLOWED: { title: "Not supported", message: "Knowvia cannot do that here.", action: "none" },
};

export function errorCopy(error: ErrorLike): ErrorCopy {
  const known = BY_CODE[error.code];
  if (known) {
    const action = known.action ?? "none";
    return { title: known.title, message: known.message, action: error.retryable && action === "none" ? "retry" : action };
  }
  if (error.status === 401) return { ...BY_CODE.SESSION_REQUIRED, action: "sign_in" };
  if (error.status === 413) return { title: BY_CODE.FILE_TOO_LARGE.title, message: FILE_TOO_LARGE_MESSAGE, action: "choose_again" };
  if (error.status === 415) return { title: BY_CODE.PDF_ONLY.title, message: PDF_ONLY_MESSAGE, action: "choose_again" };
  if (error.status === 429) return { ...BY_CODE.RATE_LIMITED, action: "none" } as ErrorCopy;
  if (error.status === 403) return { title: "Not allowed", message: "Knowvia cannot do that for you.", action: "none" };
  if (error.status === 404) return { ...BY_CODE.NOT_FOUND, action: "reload" } as ErrorCopy;
  if (error.status === 0 || error.status >= 500 || error.retryable) {
    return { title: "Something went wrong", message: `Knowvia could not finish that. ${TRY_LATER}`, action: "retry" };
  }
  return { title: "Something went wrong", message: "Knowvia could not finish that.", action: "none" };
}

/** True for the two codes that mean the cookie session is gone. */
export function isSessionError(error: { code: string }): boolean {
  return error.code === "SESSION_EXPIRED" || error.code === "SESSION_REQUIRED";
}

/** Sign-in specific: the BFF answers these when real identity is not built or the BFF is off. */
export function isSignInUnavailable(error: { code: string; status: number }): boolean {
  return error.code === "IDENTITY_NOT_IMPLEMENTED" || error.code === "APP_DISABLED" || (error.status === 501 && error.code !== "RATE_LIMITED");
}
