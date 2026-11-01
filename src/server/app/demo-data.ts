// Synthetic dashboard scenarios (run W-B2): empty, partial, full, conflicting. Built with the REAL buildDashboardView, so a
// demo page shows exactly what a real person's page would for the same documents. No session, no backend, no network.
//
// Rules this file keeps:
//  - Synthetic data only: fictional insurer wording, no emails except the reserved domain example.test, no phone numbers,
//    no policy numbers, no run of ten digits anywhere.
//  - Values are plain words from fictional documents. Every one is still only "Read, not checked" or "Your documents
//    disagree": nothing here is "confirmed", and there is no score, streak or countdown.
//  - Only the BFF route demo.get hands these out, and only while the BFF is on, APP_DEMO_DATA is on and NODE_ENV is not
//    production (env.ts refuses APP_DEMO_DATA in production). The /app/demo page checks the same rule before it renders.
import { buildDashboardView, type DashboardInput, type ReadFactsInput } from "./dashboard-view";
import type { DashboardView, DocumentView, Overview, PermissionView, ReadFactsView } from "./contract";

export const DEMO_SCENARIOS = ["empty", "partial", "full", "conflicting"] as const;
export type DemoScenario = (typeof DEMO_SCENARIOS)[number];

export const isDemoScenario = (value: unknown): value is DemoScenario => typeof value === "string" && (DEMO_SCENARIOS as readonly string[]).includes(value);

/** The one household used by every scenario. A reserved test domain, and a fictional name. */
export const DEMO_PERSON = { displayName: "Asha Test", email: "asha@example.test" } as const;

const CASE_ID = "demo-case-1";
const FIRST_UPLOAD = "2026-10-21T09:00:00.000Z";

function document(id: string, kind: "member_card" | "policy_schedule" | "policy_wording", minute: number): DocumentView {
  return {
    id,
    caseId: CASE_ID,
    documentKind: kind,
    byteSize: 120_000,
    uploadedAt: new Date(Date.parse(FIRST_UPLOAD) + minute * 60_000).toISOString(),
    stage: "readable",
    nextAction: "none",
    label: "Read",
    backendStatus: "accepted",
    ocr: { status: "succeeded", errorCode: null, pageCount: kind === "member_card" ? 1 : kind === "policy_schedule" ? 4 : 18 },
    structuring: null,
    note: null,
  };
}

const CARD = document("demo-doc-card", "member_card", 0);
const SCHEDULE = document("demo-doc-schedule", "policy_schedule", 2);
const WORDING = document("demo-doc-wording", "policy_wording", 4);

const readingPermission = (documentIds: string[]): PermissionView => ({
  id: "demo-consent-read",
  kind: "read_document",
  label: `Read ${documentIds.length} ${documentIds.length === 1 ? "document" : "documents"} with the reading service (OCR)`,
  grantedAt: "2026-10-21T09:05:00.000Z",
  expiresAt: null,
  status: "active",
  documentIds,
  noticeStatus: "draft_needs_legal_review",
});

const storingPermission: PermissionView = {
  id: "demo-consent-keep",
  kind: "store_documents",
  label: "Keep the PDFs you add",
  grantedAt: "2026-10-21T08:59:00.000Z",
  expiresAt: null,
  status: "active",
  documentIds: [],
  noticeStatus: "draft_needs_legal_review",
};

type Field = { field: string; value: string; page: number; quote: string; state?: "extracted_unverified" | "conflicting" };
function readFacts(documents: Array<{ documentId: string; documentKind: string; fields: Field[] }>, excluded: ReadFactsView["excluded"] = []): ReadFactsInput {
  return {
    status: "ok",
    data: {
      label: "read_not_checked",
      notice: "Read from your documents by a rule, not checked.",
      excluded,
      documents: documents.map((entry) => ({
        documentId: entry.documentId,
        documentKind: entry.documentKind,
        fields: entry.fields.map((field) => ({ field: field.field, topic: null, value: field.value, state: field.state ?? "extracted_unverified", page: field.page, quote: field.quote })),
      })),
    },
  };
}

function overviewOf(documents: DocumentView[]): Overview {
  return {
    session: { expiresAt: "2026-10-22T09:00:00.000Z" },
    household: { id: "demo-household-1", viewerRole: "owner" },
    owner: { adultId: "demo-adult-1", memberId: "demo-member-1" },
    members: [{ id: "demo-member-1", displayName: DEMO_PERSON.displayName, memberKind: "adult", relationshipLabel: null, policiesFound: documents.length > 0 ? 1 : 0 }],
    cases: documents.length > 0 ? [{ id: CASE_ID }] : [],
    documents,
    documentsAccess: "full",
    consents: [],
  };
}

function inputFor(scenario: DemoScenario): DashboardInput {
  switch (scenario) {
    case "empty":
      return { overview: overviewOf([]), consents: [], scanMode: "clamd", readFacts: { status: "none" } };
    case "partial":
      return {
        overview: overviewOf([SCHEDULE]),
        consents: [storingPermission, readingPermission([SCHEDULE.id])],
        scanMode: "clamd",
        readFacts: readFacts([
          {
            documentId: SCHEDULE.id,
            documentKind: "policy_schedule",
            fields: [
              { field: "base_sum_insured", value: "Rs 5,00,000", page: 1, quote: "Sum insured: Rs 5,00,000 per policy year." },
              { field: "policy_period_start", value: "14 Mar 2026", page: 1, quote: "Policy period from 14 Mar 2026." },
            ],
          },
        ]),
      };
    case "full":
      return {
        overview: overviewOf([CARD, SCHEDULE, WORDING]),
        consents: [storingPermission, readingPermission([CARD.id, SCHEDULE.id, WORDING.id])],
        scanMode: "clamd",
        readFacts: readFacts([
          {
            documentId: SCHEDULE.id,
            documentKind: "policy_schedule",
            fields: [
              { field: "base_sum_insured", value: "Rs 5,00,000", page: 1, quote: "Sum insured: Rs 5,00,000 per policy year." },
              { field: "policy_period_start", value: "14 Mar 2026", page: 1, quote: "Policy period from 14 Mar 2026." },
              { field: "policy_period_end", value: "13 Mar 2027", page: 1, quote: "Policy period to 13 Mar 2027." },
              { field: "co_payment", value: "10%", page: 2, quote: "Co-payment: 10% of each admissible claim." },
            ],
          },
          {
            documentId: WORDING.id,
            documentKind: "policy_wording",
            fields: [
              { field: "initial_waiting_period", value: "30 days", page: 6, quote: "An initial waiting period of 30 days applies." },
              { field: "ped_waiting_period", value: "24 months", page: 7, quote: "Pre-existing conditions are covered after 24 months." },
            ],
          },
        ]),
      };
    case "conflicting":
      return {
        overview: overviewOf([SCHEDULE, WORDING]),
        consents: [storingPermission, readingPermission([SCHEDULE.id, WORDING.id])],
        scanMode: "clamd",
        readFacts: readFacts([
          {
            documentId: SCHEDULE.id,
            documentKind: "policy_schedule",
            fields: [
              { field: "room_rent_limit", value: "1% of sum insured", page: 2, quote: "Room rent: 1% of the sum insured per day." },
              { field: "policy_period_end", value: "13 Mar 2027", page: 1, quote: "Policy period to 13 Mar 2027." },
              { field: "base_sum_insured", value: "Rs 5,00,000", page: 1, quote: "Sum insured: Rs 5,00,000 per policy year." },
            ],
          },
          {
            documentId: WORDING.id,
            documentKind: "policy_wording",
            fields: [
              { field: "room_rent_limit", value: "No limit stated", page: 7, quote: "Room rent is covered as per the room category chosen." },
              { field: "policy_period_end", value: "14 Mar 2027", page: 3, quote: "The policy ends on 14 Mar 2027." },
            ],
          },
        ]),
      };
  }
}

/** The dashboard for one scenario, composed by the same function the real route uses. Pure and deterministic. */
export function buildDemoDashboard(scenario: DemoScenario): DashboardView {
  return buildDashboardView(inputFor(scenario));
}
