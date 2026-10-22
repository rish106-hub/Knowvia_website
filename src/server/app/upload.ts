// Upload validation. Everything here runs BEFORE any byte is forwarded to the backend.
import { DOCUMENT_KINDS } from "./contract";
import { appError } from "./errors";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

export type UploadHeaders = {
  idempotencyKey: string;
  documentKind: string;
  consentGrantId: string;
  filename: string; // percent-encoded, forwarded unchanged
};

const requireHeader = (request: Request, name: string, code = "INVALID_REQUEST") => {
  const value = request.headers.get(name)?.trim();
  if (!value) throw appError(400, code, { fields: [name] });
  return value;
};

export function validateUploadHeaders(request: Request): UploadHeaders {
  const contentType = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  // JPG and PNG are explicitly refused (D6): the backend is PDF-only. Everything that is not a PDF is refused alike.
  if (contentType !== "application/pdf") throw appError(415, "PDF_ONLY");

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (idempotencyKey.length < 8 || idempotencyKey.length > 200) throw appError(400, "IDEMPOTENCY_KEY_REQUIRED", { fields: ["Idempotency-Key"] });

  const documentKind = requireHeader(request, "x-document-kind");
  if (!(DOCUMENT_KINDS as readonly string[]).includes(documentKind)) throw appError(400, "UNSUPPORTED_DOCUMENT_KIND", { fields: ["X-Document-Kind"] });

  const consentGrantId = requireHeader(request, "x-consent-grant-id");
  if (consentGrantId.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(consentGrantId)) throw appError(400, "INVALID_REQUEST", { fields: ["X-Consent-Grant-Id"] });

  const filename = requireHeader(request, "x-filename");
  if (filename.length > 600) throw appError(400, "INVALID_REQUEST", { fields: ["X-Filename"] });
  try {
    decodeURIComponent(filename);
  } catch {
    throw appError(400, "INVALID_REQUEST", { fields: ["X-Filename"] });
  }
  return { idempotencyKey, documentKind, consentGrantId, filename };
}

/** Reads the body with a hard cap, checking Content-Length first and the running size while streaming. */
export async function readPdfBody(request: Request, maxBytes = MAX_UPLOAD_BYTES): Promise<Uint8Array> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const length = Number(declared);
    if (!Number.isFinite(length) || length < 0) throw appError(400, "INVALID_REQUEST", { fields: ["Content-Length"] });
    if (length > maxBytes) throw appError(413, "FILE_TOO_LARGE");
  }
  if (!request.body) throw appError(415, "PDF_ONLY");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let magicChecked = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw appError(413, "FILE_TOO_LARGE");
      chunks.push(value);
      if (!magicChecked && total >= PDF_MAGIC.length) {
        assertPdfMagic(concat(chunks, total));
        magicChecked = true;
      }
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  if (total < PDF_MAGIC.length) throw appError(415, "PDF_ONLY");
  return concat(chunks, total);
}

function assertPdfMagic(bytes: Uint8Array) {
  for (let index = 0; index < PDF_MAGIC.length; index += 1) if (bytes[index] !== PDF_MAGIC[index]) throw appError(415, "PDF_ONLY");
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}
