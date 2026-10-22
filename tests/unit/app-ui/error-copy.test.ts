import { describe, expect, it } from "vitest";
import {
  FILE_TOO_LARGE_MESSAGE,
  MAX_UPLOAD_BYTES,
  PDF_ONLY_MESSAGE,
  errorCopy,
  isSessionError,
  isSignInUnavailable,
} from "@/components/app/shell/error-copy";
import { precheckPdf } from "@/components/app/documents/precheck";

const file = (name: string, type: string, size: number, head = "%PDF-") => ({ name, type, size, slice: () => ({ text: async () => head }) });

describe("errorCopy", () => {
  it("gives specific copy for every BFF code the screens can meet", () => {
    const codes = [
      "SESSION_REQUIRED", "SESSION_EXPIRED", "CSRF_BLOCKED", "RATE_LIMITED", "IDENTITY_NOT_IMPLEMENTED", "APP_DISABLED",
      "APP_MISCONFIGURED", "BACKEND_AUTH_FAILED", "BACKEND_UNREACHABLE", "BACKEND_TIMEOUT", "BACKEND_BAD_RESPONSE",
      "NETWORK_UNREACHABLE", "UNEXPECTED_RESPONSE", "INVALID_REQUEST", "CONSENT_SUBJECT_REQUIRED", "DOCUMENT_NOT_FOUND",
      "CONSENT_NOT_FOUND", "CONSENT_REQUIRED", "CONSENT_SCOPE_REQUIRED", "PDF_ONLY", "FILE_TOO_LARGE",
      "IDEMPOTENCY_KEY_REQUIRED", "IDEMPOTENCY_CONFLICT", "UNSUPPORTED_DOCUMENT_KIND", "DOCUMENT_STORAGE_NOT_CONFIGURED",
      "DUPLICATE_DOCUMENT", "UPLOAD_CAPACITY_REACHED", "DOCUMENT_DELETE_FORBIDDEN", "OCR_JOB_NOT_STARTED",
      "STATE_LIMIT_REACHED", "NOT_FOUND", "METHOD_NOT_ALLOWED", "FIELD_ACCESS_REQUIRED", "OCR_PROVIDER_DISABLED",
      "OCR_PROVIDER_NOT_CONFIGURED", "EVIDENCE_DISABLED", "POLICY_EVIDENCE_UNAVAILABLE", "UPLOAD_IN_PROGRESS",
    ];
    const seen = new Set<string>();
    for (const code of codes) {
      const copy = errorCopy({ code, status: 400, retryable: false });
      expect(copy.title.length, code).toBeGreaterThan(0);
      expect(copy.message.length, code).toBeGreaterThan(0);
      expect(copy.message, code).not.toMatch(/undefined|\[object/);
      seen.add(copy.message);
    }
    expect(seen.size).toBeGreaterThan(codes.length - 6);
  });

  it("uses the same wording as the client pre-check for PDF_ONLY and FILE_TOO_LARGE", () => {
    expect(errorCopy({ code: "PDF_ONLY", status: 415, retryable: false })).toMatchObject({ message: PDF_ONLY_MESSAGE, action: "choose_again" });
    expect(errorCopy({ code: "FILE_TOO_LARGE", status: 413, retryable: false })).toMatchObject({ message: FILE_TOO_LARGE_MESSAGE, action: "choose_again" });
    expect(errorCopy({ code: "SOMETHING_NEW", status: 413, retryable: false }).message).toBe(FILE_TOO_LARGE_MESSAGE);
    expect(errorCopy({ code: "SOMETHING_NEW", status: 415, retryable: false }).message).toBe(PDF_ONLY_MESSAGE);
  });

  it("offers retry for network and server failures, and sign-in for session errors", () => {
    expect(errorCopy({ code: "NETWORK_UNREACHABLE", status: 0, retryable: true }).action).toBe("retry");
    expect(errorCopy({ code: "BACKEND_UNREACHABLE", status: 503, retryable: true }).action).toBe("retry");
    expect(errorCopy({ code: "WHO_KNOWS", status: 502, retryable: true }).action).toBe("retry");
    expect(errorCopy({ code: "SESSION_EXPIRED", status: 401, retryable: false }).action).toBe("sign_in");
    expect(errorCopy({ code: "WHO_KNOWS", status: 401, retryable: false }).action).toBe("sign_in");
    expect(errorCopy({ code: "INVALID_REQUEST", status: 400, retryable: false }).action).toBe("none");
  });

  it("an unknown retryable code still becomes a retry, an unknown final code does not", () => {
    expect(errorCopy({ code: "WHO_KNOWS", status: 400, retryable: true }).action).toBe("retry");
    expect(errorCopy({ code: "WHO_KNOWS", status: 400, retryable: false }).action).toBe("none");
  });

  it("never promises recovery of an expired session", () => {
    const copy = errorCopy({ code: "SESSION_EXPIRED", status: 401, retryable: false });
    expect(copy.message).toMatch(/not available yet/i);
  });

  it("classifies session and sign-in-unavailable errors", () => {
    expect(isSessionError({ code: "SESSION_EXPIRED" })).toBe(true);
    expect(isSessionError({ code: "SESSION_REQUIRED" })).toBe(true);
    expect(isSessionError({ code: "RATE_LIMITED" })).toBe(false);
    expect(isSignInUnavailable({ code: "IDENTITY_NOT_IMPLEMENTED", status: 501 })).toBe(true);
    expect(isSignInUnavailable({ code: "APP_DISABLED", status: 404 })).toBe(true);
    expect(isSignInUnavailable({ code: "RATE_LIMITED", status: 429 })).toBe(false);
    expect(isSignInUnavailable({ code: "BACKEND_UNREACHABLE", status: 503 })).toBe(false);
  });
});

describe("precheckPdf", () => {
  it("accepts a PDF up to exactly 15 MB", async () => {
    expect(await precheckPdf(file("a.pdf", "application/pdf", 1000))).toEqual({ ok: true });
    expect((await precheckPdf(file("a.pdf", "application/pdf", MAX_UPLOAD_BYTES))).ok).toBe(true);
    expect((await precheckPdf(file("noext", "", 1000))).ok).toBe(false);
    expect((await precheckPdf(file("scan.PDF", "", 1000))).ok).toBe(true);
  });

  it("rejects non-PDF types and wrong magic bytes with the PDF-only wording", async () => {
    for (const bad of [file("a.jpg", "image/jpeg", 100), file("a.png", "image/png", 100), file("a.pdf", "application/pdf", 100, "GIF89")]) {
      expect(await precheckPdf(bad)).toMatchObject({ ok: false, code: "PDF_ONLY", message: PDF_ONLY_MESSAGE });
    }
  });

  it("rejects oversize with the same wording as FILE_TOO_LARGE, and empty files", async () => {
    expect(await precheckPdf(file("a.pdf", "application/pdf", MAX_UPLOAD_BYTES + 1))).toMatchObject({ ok: false, code: "FILE_TOO_LARGE", message: FILE_TOO_LARGE_MESSAGE });
    expect(await precheckPdf(file("a.pdf", "application/pdf", 0))).toMatchObject({ ok: false, code: "EMPTY_FILE" });
  });
});

describe("errorCopy: switched-off features are not presented as transient", () => {
  it("offers no retry for a disabled provider or disabled questions", () => {
    for (const code of ["OCR_PROVIDER_DISABLED", "EVIDENCE_DISABLED", "POLICY_EVIDENCE_UNAVAILABLE"]) {
      const copy = errorCopy({ code, status: 503, retryable: false });
      expect(copy.action, code).toBe("none");
      expect(copy.message, code).not.toMatch(/try again/i);
    }
  });
});
