// Maps BFF / backend error codes to plain-language messages and one recovery path. Duck-typed on purpose (no import of
// the client class) so it stays pure and testable. Backend message text is never shown; only these strings are.
export type Recovery = "retry" | "sign_in" | "consent" | "ask_again" | "documents" | "change_answer" | "none";
export type ErrorContext = "overview" | "consent" | "ask" | "answer" | "handoff" | "review" | "preview";
export type ErrorView = { code: string; title: string; message: string; recovery: Recovery; retryable: boolean };

type ErrorLike = { status?: unknown; code?: unknown; retryable?: unknown };

const view = (code: string, title: string, message: string, recovery: Recovery, retryable = recovery === "retry"): ErrorView => ({ code, title, message, recovery, retryable });

export function describeError(error: unknown, context: ErrorContext): ErrorView {
  const e = (error && typeof error === "object" ? error : {}) as ErrorLike;
  const code = typeof e.code === "string" ? e.code : "UNKNOWN";
  const status = typeof e.status === "number" ? e.status : 0;
  switch (code) {
    case "NETWORK_UNREACHABLE":
      return view(code, "We could not reach Knowvia", "Check your connection and try again. Nothing you have done here has been lost.", "retry");
    case "SESSION_REQUIRED":
    case "SESSION_EXPIRED":
      return view(code, "You are signed out", "Sign in again to carry on.", "sign_in");
    case "CONSENT_REQUIRED":
    case "CONSENT_SCOPE_REQUIRED":
      return view(code, "We need your permission again", "Permission for this document has ended or was withdrawn, so the answer that depended on it is no longer kept.", "consent");
    case "POLICY_EVIDENCE_NOT_FOUND":
    case "CASE_NOT_FOUND":
      return view(code, "This answer is no longer stored", "That happens when permission is withdrawn or a document is deleted. Nothing is shown from it. You can read the document again.", "ask_again");
    case "POLICY_EVIDENCE_ANSWER_STALE":
    case "POLICY_EVIDENCE_SUPERSEDED":
      return view(code, "A document has changed", "The document behind this answer was replaced or updated. Read it again to see what it says now.", "ask_again");
    case "IDEMPOTENCY_CONFLICT":
      return view(code, "We need to read your document again", "The earlier request cannot be reused. Read it again to continue.", "ask_again");
    case "POLICY_EVIDENCE_UNAVAILABLE":
    case "POLICY_EVIDENCE_DOCUMENTS_REQUIRED":
      return view(code, "Your document is not ready to read yet", "The text of your document is not ready. Check its status in your documents.", "documents");
    case "EVIDENCE_BUSY":
      return view(code, "Knowvia is busy right now", "Too many documents are being read. Wait a minute and try again.", "retry", true);
    case "EVIDENCE_DISABLED":
      return view(code, "Reading is switched off", "Reading documents is not available right now. Try again later.", "none", false);
    case "RATE_LIMITED":
      return view(code, "Too many tries", "Wait a little and try again.", "retry", true);
    case "BACKEND_TIMEOUT":
    case "BACKEND_UNREACHABLE":
    case "BACKEND_BAD_RESPONSE":
      return view(code, "Reading took too long or failed", context === "ask" ? "Your document is unchanged. Try again. If it was read already, trying again shows the same answer without extra cost." : "Try again in a moment.", "retry", true);
    case "HOUSEHOLD_SCENARIO_CONTRADICTORY":
      return view(code, "Two of your answers do not fit together", "Change or remove the last answer you gave, then try again.", "change_answer");
    case "HOUSEHOLD_SCENARIO_INVALID":
    case "HOUSEHOLD_SCENARIO_UNKNOWN_FIELD":
    case "HOUSEHOLD_SCENARIO_FORBIDDEN_FIELD":
    case "HOUSEHOLD_SCENARIO_TOO_LARGE":
    case "HOUSEHOLD_SCENARIO_DUPLICATE_SOURCE":
    case "HOUSEHOLD_SCENARIO_VERSION_UNSUPPORTED":
      return view(code, "We could not use that answer", "Check what you entered and try again, or choose Skip.", "change_answer");
    case "HOUSEHOLD_PREVIEW_BOUND_EXCEEDED":
      return view(code, "There is too much to summarise", "Your documents hold more than this preview can show safely.", "none", false);
    case "HOUSEHOLD_NOT_FOUND":
      return view(code, "We could not find your household", "Sign in again.", "sign_in");
    case "NOT_FOUND":
      if (context === "review") return view(code, "You cannot confirm this here", "Only the person who owns this household can confirm what the document says.", "none", false);
      break;
    case "DOCUMENT_NOT_FOUND":
      return view(code, "A document could not be found", "It may have been deleted. Check your documents.", "documents");
    case "CSRF_BLOCKED":
      return view(code, "This request was blocked", "Reload the page and try again.", "retry", true);
    case "UNEXPECTED_RESPONSE":
      break;
  }
  if (status === 404 && context === "review") return view("NOT_FOUND", "You cannot confirm this here", "Only the person who owns this household can confirm what the document says.", "none", false);
  if (status >= 500 || e.retryable === true) return view(code, "Something went wrong on our side", "Try again in a moment.", "retry", true);
  if (status === 401) return view(code, "You are signed out", "Sign in again to carry on.", "sign_in");
  return view(code, "Something went wrong", "Try again. If it keeps happening, come back later.", "retry", true);
}

/** True when the error means the stored answer can no longer be used and must be forgotten. */
export function answerIsGone(error: unknown): boolean {
  const code = (error && typeof error === "object" ? (error as ErrorLike).code : null) as string | null;
  return code === "POLICY_EVIDENCE_NOT_FOUND" || code === "CONSENT_REQUIRED" || code === "CONSENT_SCOPE_REQUIRED" || code === "POLICY_EVIDENCE_ANSWER_STALE" || code === "POLICY_EVIDENCE_SUPERSEDED" || code === "CASE_NOT_FOUND";
}
