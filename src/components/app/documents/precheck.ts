// Client-side file pre-check. Uses the same wording as the BFF errors PDF_ONLY and FILE_TOO_LARGE
// (src/components/app/shell/error-copy.ts) so a rejection reads the same wherever it is caught.
import { EMPTY_FILE_MESSAGE, FILE_TOO_LARGE_MESSAGE, MAX_UPLOAD_BYTES, PDF_ONLY_MESSAGE } from "../shell/error-copy";

export type PrecheckResult = { ok: true } | { ok: false; code: "PDF_ONLY" | "FILE_TOO_LARGE" | "EMPTY_FILE"; message: string };

type FileLike = { name: string; type: string; size: number; slice: (start: number, end: number) => { text: () => Promise<string> } };

/** Cheap checks first (size, type, extension), then the %PDF- magic bytes the BFF also checks. */
export async function precheckPdf(file: FileLike): Promise<PrecheckResult> {
  if (file.size === 0) return { ok: false, code: "EMPTY_FILE", message: EMPTY_FILE_MESSAGE };
  const looksLikePdf = file.type === "application/pdf" || (file.type === "" && /\.pdf$/i.test(file.name));
  if (!looksLikePdf) return { ok: false, code: "PDF_ONLY", message: PDF_ONLY_MESSAGE };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, code: "FILE_TOO_LARGE", message: FILE_TOO_LARGE_MESSAGE };
  try {
    const head = await file.slice(0, 5).text();
    if (head !== "%PDF-") return { ok: false, code: "PDF_ONLY", message: PDF_ONLY_MESSAGE };
  } catch {
    // Unreadable in the browser: let the BFF decide.
  }
  return { ok: true };
}
