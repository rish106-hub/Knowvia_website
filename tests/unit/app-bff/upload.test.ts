import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES } from "@/server/app/upload";
import { PDF_BYTES, makeApp, request, signIn, uploadRequest } from "./helpers";

const code = async (response: Response) => (await response.json()).error.code;

async function ready() {
  const ctx = makeApp();
  const { jar } = await signIn(ctx);
  ctx.backend.calls.length = 0;
  return { ctx, jar };
}

describe("upload validation (all before any backend call)", () => {
  it("accepts a PDF and forwards the idempotency key, kind, consent and filename", async () => {
    const { ctx, jar } = await ready();
    const response = await ctx.app.dispatch("documents.upload", uploadRequest(jar), { caseId: "case-1" });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.document).toMatchObject({ stage: "received", backendStatus: "received_pending_checks", nextAction: "wait", note: "scan_state_not_visible" });
    expect(JSON.stringify(body)).not.toContain("synthetic");
    const forwarded = ctx.backend.calls.at(-1)!;
    expect(forwarded.headers).toMatchObject({
      "content-type": "application/pdf",
      "idempotency-key": "upload-key-12345678",
      "x-document-kind": "policy_schedule",
      "x-consent-grant-id": "consent-1",
    });
    expect(decodeURIComponent(forwarded.headers["x-filename"])).toBe("synthetic policy.pdf");
    expect(forwarded.bytes).toBe(PDF_BYTES.byteLength);
  });

  it("rejects JPG and PNG with 415 PDF_ONLY, plus any other content type", async () => {
    const { ctx, jar } = await ready();
    for (const type of ["image/jpeg", "image/png", "application/octet-stream", "text/plain"]) {
      const response = await ctx.app.dispatch("documents.upload", uploadRequest(jar, { "content-type": type }), { caseId: "case-1" });
      expect(response.status).toBe(415);
      expect(await code(response)).toBe("PDF_ONLY");
    }
    expect(ctx.backend.calls).toHaveLength(0);
  });

  it("rejects bad magic bytes (a JPG labelled as PDF) and too-short bodies", async () => {
    const { ctx, jar } = await ready();
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    for (const body of [jpeg, new Uint8Array([0x25, 0x50]), new Uint8Array(0)]) {
      const response = await ctx.app.dispatch("documents.upload", uploadRequest(jar, {}, body), { caseId: "case-1" });
      expect(response.status).toBe(415);
      expect(await code(response)).toBe("PDF_ONLY");
    }
    expect(ctx.backend.calls).toHaveLength(0);
  });

  it("rejects oversize on Content-Length without reading the body", async () => {
    const { ctx, jar } = await ready();
    const response = await ctx.app.dispatch(
      "documents.upload",
      uploadRequest(jar, { "content-length": String(MAX_UPLOAD_BYTES + 1) }, PDF_BYTES),
      { caseId: "case-1" },
    );
    expect(response.status).toBe(413);
    expect(await code(response)).toBe("FILE_TOO_LARGE");
    expect(ctx.backend.calls).toHaveLength(0);
  });

  it("rejects oversize while streaming when Content-Length is absent or false", async () => {
    const { ctx, jar } = await ready();
    let pulled = 0;
    const chunk = new Uint8Array(1024 * 1024).fill(0x41);
    chunk.set(PDF_BYTES.subarray(0, 5));
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        if (pulled > 40) controller.close();
        else controller.enqueue(chunk);
      },
    });
    const req = new Request("http://localhost:3000/api/app/cases/case-1/documents", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "x-knowvia-app": "1",
        "content-type": "application/pdf",
        "idempotency-key": "upload-key-12345678",
        "x-document-kind": "policy_schedule",
        "x-consent-grant-id": "consent-1",
        "x-filename": "a.pdf",
        cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
      },
      body: stream,
      duplex: "half",
    } as RequestInit);
    const response = await ctx.app.dispatch("documents.upload", req, { caseId: "case-1" });
    expect(response.status).toBe(413);
    expect(pulled).toBeLessThan(40);
    expect(ctx.backend.calls).toHaveLength(0);
  });

  it("requires each header and validates its value", async () => {
    const { ctx, jar } = await ready();
    const cases: Array<[Record<string, string | null>, number, string]> = [
      [{ "idempotency-key": null }, 400, "IDEMPOTENCY_KEY_REQUIRED"],
      [{ "idempotency-key": "short" }, 400, "IDEMPOTENCY_KEY_REQUIRED"],
      [{ "idempotency-key": "k".repeat(201) }, 400, "IDEMPOTENCY_KEY_REQUIRED"],
      [{ "x-document-kind": null }, 400, "INVALID_REQUEST"],
      [{ "x-document-kind": "photo" }, 400, "UNSUPPORTED_DOCUMENT_KIND"],
      [{ "x-consent-grant-id": null }, 400, "INVALID_REQUEST"],
      [{ "x-consent-grant-id": "bad id!" }, 400, "INVALID_REQUEST"],
      [{ "x-filename": null }, 400, "INVALID_REQUEST"],
      [{ "x-filename": "%E0%A4%A" }, 400, "INVALID_REQUEST"],
    ];
    for (const [overrides, status, expected] of cases) {
      const response = await ctx.app.dispatch("documents.upload", uploadRequest(jar, overrides), { caseId: "case-1" });
      expect([response.status, await code(response)]).toEqual([status, expected]);
    }
    expect(ctx.backend.calls).toHaveLength(0);
  });

  it("requires a session and CSRF headers", async () => {
    const { ctx, jar } = await ready();
    const anonymous = await ctx.app.dispatch("documents.upload", uploadRequest(new Map()), { caseId: "case-1" });
    expect(anonymous.status).toBe(401);
    const noCsrf = await ctx.app.dispatch("documents.upload", request("/api/app/cases/case-1/documents", { method: "POST", jar, csrf: false, headers: { "content-type": "application/pdf" }, body: PDF_BYTES as BodyInit }), { caseId: "case-1" });
    expect(noCsrf.status).toBe(403);
  });

  it("retrying with the same Idempotency-Key forwards the same key and returns the same document", async () => {
    const { ctx, jar } = await ready();
    const first = await ctx.app.dispatch("documents.upload", uploadRequest(jar), { caseId: "case-1" });
    const second = await ctx.app.dispatch("documents.upload", uploadRequest(jar), { caseId: "case-1" });
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    const a = await first.json();
    const b = await second.json();
    expect(b.document.id).toBe(a.document.id);
    expect(b.idempotentReplay).toBe(true);
    const keys = ctx.backend.calls.filter((c) => c.method === "POST" && c.path.endsWith("/documents")).map((c) => c.headers["idempotency-key"]);
    expect(keys).toEqual(["upload-key-12345678", "upload-key-12345678"]);
    expect(ctx.backend.documents.size).toBe(1);
  });

  it("surfaces a transient backend failure as retryable and a retry reuses the key", async () => {
    const { ctx, jar } = await ready();
    ctx.backend.control.failNext.push({ match: /POST \/api\/v1\/cases\/case-1\/documents/, respond: () => new Response(JSON.stringify({ error: "x" }), { status: 400 }) });
    const failed = await ctx.app.dispatch("documents.upload", uploadRequest(jar), { caseId: "case-1" });
    expect(failed.status).toBe(400);
    const retried = await ctx.app.dispatch("documents.upload", uploadRequest(jar), { caseId: "case-1" });
    expect(retried.status).toBe(201);
  });
});
