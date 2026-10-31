import { describe, expect, it } from "vitest";
import type { ConnectorView } from "@/lib/app-contract";
import { CONNECTORS, listConnectors } from "@/server/app/connectors";
import { permissionRevokeExplanation, revokeExplanation } from "@/components/app/consent/consent-copy";
import { blockFor, CONNECTOR_BLOCKS, connectHref, dataWords, groupConnectors, isConnectorId, onlyUpload, scopeWords } from "@/components/app/blocks/registry";
import { KIND_CHOICES, SCAN_OFF_TEXT, AWAITING_CHECKS_TEXT, documentKindLabel, stageDescription, stageInfo } from "@/components/app/documents/stage";

describe("connector registry", () => {
  it("has a presentation block for every descriptor the BFF returns, and no others", () => {
    expect(Object.keys(CONNECTOR_BLOCKS).sort()).toEqual(CONNECTORS.map((connector) => connector.id).sort());
    for (const connector of CONNECTORS) expect(blockFor(connector).title.length).toBeGreaterThan(0);
  });

  it("isConnectorId accepts only known ids (and not inherited object keys)", () => {
    expect(isConnectorId("gmail")).toBe(true);
    expect(isConnectorId("carrier_pigeon")).toBe(false);
    expect(isConnectorId("constructor")).toBe(false);
    expect(isConnectorId("__proto__")).toBe(false);
  });

  it("upload goes straight to the upload panel; everything else to its consent sheet", () => {
    expect(connectHref({ id: "upload", availability: "available" })).toBe("/app/documents");
    expect(connectHref({ id: "gmail", availability: "later" })).toBe("/app/connect/gmail");
    expect(connectHref({ id: "voice", availability: "stub" })).toBe("/app/connect/voice");
  });

  it("S05 is skipped when upload is the only real option, and shown when there is more than one", () => {
    expect(onlyUpload(listConnectors(false))).toBe(true);
    expect(onlyUpload(listConnectors(true))).toBe(false);
    expect(onlyUpload([])).toBe(false);
  });

  it("groups by availability and keeps contract order inside each group", () => {
    const groups = groupConnectors(listConnectors(true));
    expect(groups.now.map((c: ConnectorView) => c.id)).toEqual(["upload"]);
    expect(groups.soon.map((c: ConnectorView) => c.id)).toEqual(["camera", "email_forward", "voice"]);
    expect(groups.later.map((c: ConnectorView) => c.id)).toEqual(["gmail", "outlook", "insurer_portal", "hr_portal", "digilocker", "whatsapp"]);
  });

  it("has plain words for every scope and data code in the descriptors, with a safe fallback", () => {
    for (const connector of CONNECTORS) {
      for (const code of connector.scopesRequested) expect(scopeWords(code), code).not.toMatch(/not yet described/);
      for (const code of connector.dataReturned) expect(dataWords(code), code).not.toMatch(/not yet described/);
    }
    expect(scopeWords("made:up")).toMatch(/not yet described/);
  });
});

describe("member_card and the waiting copy", () => {
  it("lists the health card first", () => {
    expect(KIND_CHOICES[0]).toMatchObject({ value: "member_card", label: "Health card (e-card)" });
    expect(documentKindLabel("member_card")).toBe("Health card (e-card)");
  });

  it("awaiting_checks says there is usually nothing to do, with no ETA", () => {
    expect(stageDescription({ stage: "awaiting_checks", note: "scan_state_not_visible" })).toBe("Waiting for security checks. This usually needs no action.");
    expect(AWAITING_CHECKS_TEXT).not.toMatch(/\d|minute|second|soon/i);
  });

  it("awaiting_checks with scanning off uses the scan-off copy (DRAFT)", () => {
    expect(stageDescription({ stage: "awaiting_checks", note: "scan_disabled" })).toBe(SCAN_OFF_TEXT);
    expect(SCAN_OFF_TEXT).toBe(
      "Security checks are switched off on this preview. Your document is stored safely but cannot be read yet. You can delete it at any time.",
    );
  });

  it("every other stage keeps the text from stageInfo", () => {
    expect(stageDescription({ stage: "readable", note: null })).toBe(stageInfo("readable").description);
    expect(stageDescription({ stage: "received", note: "scan_state_not_visible" })).toBe(stageInfo("received").description);
  });
});

describe("permissionRevokeExplanation", () => {
  it("store_documents says the PDFs added under it will be deleted (the backend marks them for deletion), never that they stay", () => {
    const text = permissionRevokeExplanation("store_documents").join(" ");
    expect(text).toMatch(/PDFs you added under this permission will be deleted/);
    expect(text).not.toMatch(/not removed|stay|keep/i);
    // Same promise through the scope-based copy used elsewhere.
    expect(revokeExplanation({ scope: "collect" } as never).join(" ")).toMatch(/will be deleted/);
  });

  it("the fallback kind makes no erasure claim it cannot back", () => {
    expect(permissionRevokeExplanation("other").join(" ")).not.toMatch(/erase|derived/i);
  });

  it("says that derived data is erased for every kind that derives something", () => {
    for (const kind of ["store_documents", "read_document", "answer_questions"] as const) {
      expect(permissionRevokeExplanation(kind).join(" "), kind).toMatch(/erase/i);
    }
  });
});
