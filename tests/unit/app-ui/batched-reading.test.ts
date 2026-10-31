import { describe, expect, it } from "vitest";
import type { DocumentStage, DocumentView, NextAction } from "@/lib/app-contract";
import { createSerialQueue, planAutoStart } from "@/components/app/documents/auto-start";
import { decidePoll } from "@/components/app/documents/polling";
import {
  MAX_READING_DOCUMENTS,
  documentActions,
  documentsAwaitingReadingPermission,
  documentsReadyToStartReading,
  readingSheetLead,
} from "@/components/app/documents/stage";
import { consentTitle, permissionRevokeExplanation, revokeExplanation } from "@/components/app/consent/consent-copy";

const doc = (id: string, over: Partial<DocumentView> = {}): DocumentView => ({
  id, caseId: "c1", documentKind: "policy_schedule", byteSize: 1000, uploadedAt: "2026-10-20T10:00:00Z",
  stage: "awaiting_checks" as DocumentStage, nextAction: "grant_ocr_consent" as NextAction, label: "x", backendStatus: "received_pending_checks",
  ocr: null, structuring: null, note: "scan_state_not_visible", ...over,
});

describe("documentsAwaitingReadingPermission", () => {
  it("lists documents that still need the permission, oldest first, whatever their checks stage", () => {
    const list = documentsAwaitingReadingPermission(
      [
        doc("c", { uploadedAt: "2026-10-22T10:00:00Z" }),
        doc("a", { uploadedAt: "2026-10-20T10:00:00Z", stage: "received" }),
        doc("b", { uploadedAt: "2026-10-21T10:00:00Z", stage: "awaiting_ocr_consent", backendStatus: "accepted", note: null }),
        doc("held", { nextAction: "wait" }),
        doc("done", { stage: "readable", nextAction: "none", backendStatus: "accepted" }),
        doc("gone", { stage: "deleting", nextAction: "grant_ocr_consent" }),
      ],
      "full",
    );
    expect(list.map((d) => d.id)).toEqual(["a", "b", "c"]);
  });

  it("never lists more than 10", () => {
    const many = Array.from({ length: 14 }, (_, index) => doc(`d${String(index).padStart(2, "0")}`, { uploadedAt: `2026-10-20T10:${String(index).padStart(2, "0")}:00Z` }));
    const list = documentsAwaitingReadingPermission(many, undefined);
    expect(list).toHaveLength(MAX_READING_DOCUMENTS);
    expect(list[0].id).toBe("d00");
  });

  it("offers nothing once the storage permission was withdrawn, and skips documents whose checks are off", () => {
    expect(documentsAwaitingReadingPermission([doc("a")], "permission_withdrawn")).toEqual([]);
    expect(documentsAwaitingReadingPermission([doc("a", { note: "scan_disabled" })], "full")).toEqual([]);
  });
});

describe("documentsReadyToStartReading", () => {
  it("is only accepted documents whose permission is held and which have no job yet", () => {
    const ready = doc("r", { stage: "awaiting_ocr_consent", nextAction: "start_ocr", backendStatus: "accepted", note: null });
    expect(documentsReadyToStartReading([ready, doc("w", { nextAction: "wait" }), doc("g", { stage: "awaiting_ocr_consent", nextAction: "grant_ocr_consent", backendStatus: "accepted" })])).toEqual([ready]);
  });
});

describe("documentActions for the batch", () => {
  it("re-reads a document in its checks only when reading is allowed and checks are on", () => {
    expect(documentActions(doc("a", { nextAction: "wait" })).waitsForChecks).toBe(true);
    expect(documentActions(doc("a", { stage: "received", nextAction: "wait" })).waitsForChecks).toBe(true);
    expect(documentActions(doc("a", { nextAction: "grant_ocr_consent" })).waitsForChecks).toBe(false);
    expect(documentActions(doc("a", { nextAction: "wait", note: "scan_disabled" })).waitsForChecks).toBe(false);
    expect(documentActions(doc("a", { stage: "readable", nextAction: "none" })).waitsForChecks).toBe(false);
  });

  it("offers Allow reading on a document in its checks, but not when checks are off", () => {
    expect(documentActions(doc("a")).primary).toBe("grant_ocr_consent");
    expect(documentActions(doc("a", { note: "scan_disabled" })).primary).toBeNull();
  });
});

describe("decidePoll for documents in their checks", () => {
  const base = { attempt: 0, consecutiveFailures: 0, watching: "checks", hidden: false } as const;
  it("keeps going through received and awaiting_checks, and stops once the document moves on", () => {
    expect(decidePoll({ ...base, stage: "awaiting_checks" })).toEqual({ action: "schedule", delayMs: 3000 });
    expect(decidePoll({ ...base, stage: "received" })).toEqual({ action: "schedule", delayMs: 3000 });
    for (const stage of ["awaiting_ocr_consent", "processing", "readable", "rejected", "deleting"]) {
      expect(decidePoll({ ...base, stage })).toEqual({ action: "stop", reason: "settled" });
    }
  });
});

describe("batch wording (DRAFT, for legal review)", () => {
  it("says what the permission does, with the count", () => {
    expect(readingSheetLead(4)).toBe("Read these 4 documents with a text-reading service so CoverSaath can show you what they say.");
    expect(readingSheetLead(1)).toMatch(/^Read this document with a text-reading service/);
    expect(readingSheetLead(4)).not.toMatch(/up to|today/i);
  });

  it("says withdrawing stops reading for all N documents and erases what was read", () => {
    const consent = { scope: "ocr_sarvam", grantId: "g", documentIds: ["a", "b", "c"], grantedAt: "x", noticeStatus: "draft_needs_legal_review" } as never;
    expect(revokeExplanation(consent)[0]).toBe("Withdrawing stops reading for all 3 documents and erases what was read from them.");
    expect(permissionRevokeExplanation("read_document", 3)[0]).toBe("Withdrawing stops reading for all 3 documents and erases what was read from them.");
    expect(consentTitle(consent, [])).toBe("Read 3 documents with the reading service (OCR)");
  });

  it("keeps the one-document wording unchanged", () => {
    expect(permissionRevokeExplanation("read_document")[0]).toBe("CoverSaath stops sending this PDF to the reading service.");
  });
});

describe("automatic start (pure parts of useAutoStartReading)", () => {
  const ready = (id: string) => doc(id, { stage: "awaiting_ocr_consent", nextAction: "start_ocr", backendStatus: "accepted", note: null });

  it("plans a start only for documents whose nextAction is start_ocr", () => {
    const documents = [
      ready("r"),
      doc("asks", { stage: "awaiting_ocr_consent", nextAction: "grant_ocr_consent", backendStatus: "accepted" }),
      doc("waits", { nextAction: "wait" }),
      doc("reading", { stage: "processing", nextAction: "wait", backendStatus: "accepted" }),
      doc("retry", { stage: "unreadable", nextAction: "retry_ocr", backendStatus: "accepted" }),
      doc("checks", { stage: "awaiting_ocr_consent", nextAction: "start_ocr", backendStatus: "received_pending_checks" }),
    ];
    const ids = documentsReadyToStartReading(documents).map((d) => d.id);
    expect(ids).toEqual(["r"]);
    expect(planAutoStart(ids, new Set()).start).toEqual(["r"]);
  });

  it("tries each document once, however often the screen re-renders", () => {
    const first = planAutoStart(["b", "a"], new Set());
    expect(first.start).toEqual(["a", "b"]);
    const second = planAutoStart(["a", "b"], first.tried);
    expect(second.start).toEqual([]);
    const third = planAutoStart(["a", "b", "c"], second.tried);
    expect(third.start).toEqual(["c"]);
  });

  it("forgets a document that left the ready state, so a later permission can start it again", () => {
    const first = planAutoStart(["a"], new Set());
    const gone = planAutoStart([], first.tried);
    expect(gone.tried.size).toBe(0);
    expect(planAutoStart(["a"], gone.tried).start).toEqual(["a"]);
  });

  it("runs tasks one at a time, in the order added, and carries on after a failure", async () => {
    const enqueue = createSerialQueue();
    const log: string[] = [];
    let running = 0;
    let peak = 0;
    const task = (name: string, fail = false) => async () => {
      running += 1;
      peak = Math.max(peak, running);
      log.push(`start ${name}`);
      await new Promise((resolve) => setTimeout(resolve, 5));
      log.push(`end ${name}`);
      running -= 1;
      if (fail) throw new Error("boom");
    };
    await Promise.all([enqueue(task("a")), enqueue(task("b", true)), enqueue(task("c"))]);
    expect(peak).toBe(1);
    expect(log).toEqual(["start a", "end a", "start b", "end b", "start c", "end c"]);
  });
});
