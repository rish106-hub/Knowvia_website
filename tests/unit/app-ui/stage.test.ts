import { describe, expect, it } from "vitest";
import type { DocumentStage, NextAction } from "@/lib/app-contract";
import { AWAITING_CHECKS_TEXT, documentActions, documentKindLabel, primaryActionLabel, stageInfo } from "@/components/app/documents/stage";
import { consentTitle, revokeExplanation } from "@/components/app/consent/consent-copy";
import { caseIdOf, collectGrant, replaceDocument, sortDocuments } from "@/components/app/shell/overview-utils";
import { formatBytes } from "@/components/app/documents/format";

const STAGES: DocumentStage[] = ["received", "awaiting_checks", "awaiting_ocr_consent", "processing", "readable", "unreadable", "rejected", "deleting", "deleted"];

const doc = (over: Partial<Parameters<typeof replaceDocument>[1]> = {}) => ({
  id: "d1", caseId: "c1", documentKind: "policy_schedule", byteSize: 1000, uploadedAt: "2026-10-20T10:00:00Z",
  stage: "received" as DocumentStage, nextAction: "wait" as NextAction, label: "x", backendStatus: "accepted" as const,
  ocr: null, structuring: null, note: null, ...over,
});

describe("stageInfo", () => {
  it("covers every stage with a label, tone and sentence", () => {
    for (const stage of STAGES) {
      const info = stageInfo(stage);
      expect(info.label.length).toBeGreaterThan(0);
      expect(info.description.endsWith(".")).toBe(true);
    }
  });

  it("awaiting_checks has no ETA and says so plainly", () => {
    expect(stageInfo("awaiting_checks").description).toBe("Waiting for security checks. This can take a while.");
    expect(AWAITING_CHECKS_TEXT).toBe(stageInfo("awaiting_checks").description);
    expect(stageInfo("awaiting_checks").description).not.toMatch(/\d|minute|second|soon/i);
  });

  it("never implies approval, confirmation or extraction success", () => {
    for (const stage of STAGES) {
      const text = `${stageInfo(stage).label} ${stageInfo(stage).description}`;
      expect(text, stage).not.toMatch(/approved|cashless|extracted|success|covered|%/i);
    }
  });

  it("differs by tone shape: pending, attention and problem are different tones", () => {
    expect(stageInfo("processing").tone).toBe("pending");
    expect(stageInfo("awaiting_ocr_consent").tone).toBe("attention");
    expect(stageInfo("unreadable").tone).toBe("problem");
    expect(stageInfo("readable").tone).toBe("done");
    expect(stageInfo("processing").indeterminate).toBe(true);
    expect(stageInfo("readable").indeterminate).toBe(false);
  });
});

describe("documentActions", () => {
  it("maps nextAction to the one primary action", () => {
    expect(documentActions(doc({ stage: "awaiting_ocr_consent", nextAction: "grant_ocr_consent" })).primary).toBe("grant_ocr_consent");
    expect(documentActions(doc({ stage: "awaiting_ocr_consent", nextAction: "start_ocr" })).primary).toBe("start_ocr");
    expect(documentActions(doc({ stage: "unreadable", nextAction: "retry_ocr" })).primary).toBe("retry_ocr");
    expect(documentActions(doc({ stage: "processing", nextAction: "wait" })).primary).toBeNull();
    expect(documentActions(doc({ stage: "readable", nextAction: "none" })).primary).toBeNull();
  });

  it("polls only processing (refresh) and deleting (read), and offers re-check only for no-ETA stages", () => {
    expect(documentActions(doc({ stage: "processing" })).polls).toBe("ocr_refresh");
    expect(documentActions(doc({ stage: "deleting" })).polls).toBe("read");
    for (const stage of STAGES.filter((s) => s !== "processing" && s !== "deleting")) expect(documentActions(doc({ stage })).polls, stage).toBeNull();
    expect(documentActions(doc({ stage: "awaiting_checks" })).canRecheck).toBe(true);
    expect(documentActions(doc({ stage: "processing" })).canRecheck).toBe(false);
  });

  it("allows delete until the document is deleting or deleted", () => {
    for (const stage of STAGES) expect(documentActions(doc({ stage })).canDelete, stage).toBe(stage !== "deleting" && stage !== "deleted");
  });

  it("labels the actions", () => {
    expect(primaryActionLabel("grant_ocr_consent")).toBe("Allow reading");
    expect(primaryActionLabel("start_ocr")).toBe("Start reading");
    expect(primaryActionLabel("retry_ocr")).toBe("Try reading again");
  });
});

describe("labels and formatting", () => {
  it("names document kinds and falls back safely", () => {
    expect(documentKindLabel("policy_wording")).toBe("Policy wording");
    expect(documentKindLabel("weird")).toBe("Document");
    expect(formatBytes(1_258_291)).toBe("1.2 MB");
    expect(formatBytes(640 * 1024)).toBe("640 KB");
    expect(formatBytes(15 * 1024 * 1024)).toBe("15 MB");
  });

  it("revoke wording says what stops and that derived answers are erased", () => {
    const consent = (scope: "collect" | "ocr_sarvam" | "question_gemini", documentIds: string[] = []) => ({
      scope, grantId: "g", documentIds, grantedAt: "2026-10-20T10:00:00Z", noticeStatus: "draft_needs_legal_review" as const,
    });
    for (const scope of ["collect", "ocr_sarvam", "question_gemini"] as const) {
      const lines = revokeExplanation(consent(scope, ["d1"])).join(" ");
      expect(lines, scope).toMatch(/stops/i);
      expect(lines, scope).toMatch(/erase/i);
    }
    expect(consentTitle(consent("ocr_sarvam", ["d1"]), [doc()])).toBe("Read policy schedule with the reading service (OCR)");
    expect(consentTitle(consent("question_gemini", ["a", "b"]), [])).toBe("Use 2 documents to answer your questions");
  });
});

describe("overview helpers", () => {
  const overview = {
    session: { expiresAt: "x" }, household: { id: "h", viewerRole: "owner" }, owner: { adultId: "a", memberId: "m" }, members: [],
    cases: [{ id: "c1" }], documents: [doc({ id: "a", uploadedAt: "2026-10-01T00:00:00Z" }), doc({ id: "b", uploadedAt: "2026-10-02T00:00:00Z" }), doc({ id: "z", stage: "deleted", uploadedAt: "2026-10-09T00:00:00Z" })],
    consents: [{ scope: "ocr_sarvam" as const, grantId: "g2", documentIds: ["a"], grantedAt: "x", noticeStatus: "draft_needs_legal_review" as const }],
  };

  it("replaces by id without mutating and appends unknown documents", () => {
    const next = replaceDocument(overview, doc({ id: "a", stage: "readable" }));
    expect(next.documents.find((d) => d.id === "a")?.stage).toBe("readable");
    expect(overview.documents.find((d) => d.id === "a")?.stage).toBe("received");
    expect(replaceDocument(overview, doc({ id: "new" })).documents).toHaveLength(4);
  });

  it("sorts newest first with deleted last, and finds case and collect grant", () => {
    expect(sortDocuments(overview.documents).map((d) => d.id)).toEqual(["b", "a", "z"]);
    expect(caseIdOf(overview)).toBe("c1");
    expect(caseIdOf({ ...overview, cases: [] })).toBeNull();
    expect(collectGrant(overview)).toBeNull();
  });
});
