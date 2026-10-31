// Presentation registry for the intake connectors (S05). Pure data and pure functions: unit tested, no React.
// The list of connectors itself comes from GET /api/app/connectors (the BFF decides what a real user may see);
// this file only says how each one looks and reads. All consent wording here is DRAFT and needs legal review.
import type { ConnectorId, ConnectorView } from "@/lib/app-contract";

export type ConnectorIcon = "upload" | "camera" | "mail" | "inbox" | "building" | "briefcase" | "identification" | "chat" | "microphone";

type Block = { icon: ConnectorIcon; title: string; blurb: string };

export const CONNECTOR_BLOCKS: Record<ConnectorId, Block> = {
  upload: { icon: "upload", title: "Upload a PDF", blurb: "Policy schedule, wording or health card" },
  camera: { icon: "camera", title: "Take a photo", blurb: "Photograph a page of your policy." },
  email_forward: { icon: "mail", title: "Forward an email to us", blurb: "Forward any email with a policy attached." },
  gmail: { icon: "inbox", title: "Connect my Gmail inbox", blurb: "Find insurance emails for you to choose from." },
  outlook: { icon: "inbox", title: "Connect my Outlook inbox", blurb: "Find insurance emails for you to choose from." },
  insurer_portal: { icon: "building", title: "Insurer portal", blurb: "Fetch your policy from your insurer." },
  hr_portal: { icon: "briefcase", title: "Employer benefits portal", blurb: "Fetch your policy from your employer's portal." },
  digilocker: { icon: "identification", title: "DigiLocker", blurb: "Fetch your policy from DigiLocker." },
  whatsapp: { icon: "chat", title: "Send on WhatsApp", blurb: "Send a document in a chat." },
  voice: { icon: "microphone", title: "Tell us by voice", blurb: "Say a few details instead of typing them." },
};

export const isConnectorId = (value: string): value is ConnectorId => Object.hasOwn(CONNECTOR_BLOCKS, value);

export const blockFor = (connector: Pick<ConnectorView, "id">): Block => CONNECTOR_BLOCKS[connector.id];

/** Where a connector card leads. Upload goes straight to the upload panel; everything else to its consent sheet. */
export const connectHref = (connector: Pick<ConnectorView, "id" | "availability">): string =>
  connector.availability === "available" ? "/app/documents" : `/app/connect/${connector.id}`;

export type ConnectorGroups = { now: ConnectorView[]; soon: ConnectorView[]; later: ConnectorView[] };

export function groupConnectors(connectors: readonly ConnectorView[]): ConnectorGroups {
  return {
    now: connectors.filter((connector) => connector.availability === "available"),
    soon: connectors.filter((connector) => connector.availability === "stub"),
    later: connectors.filter((connector) => connector.availability === "later"),
  };
}

/** True when upload is the only real option: S05 is then skipped and the person goes straight to the upload panel. */
export const onlyUpload = (connectors: readonly ConnectorView[]): boolean =>
  connectors.length > 0 && connectors.every((connector) => connector.availability === "available");

// Plain words for the descriptor codes, for the consent sheet. DRAFT, needs legal review.
const SCOPE_WORDS: Record<string, string> = {
  "document:collect": "Receive the document you send",
  "inbox:search_insurance_mail": "Look through your mailbox for insurance emails",
  "portal:fetch_policy": "Fetch your policy from the portal",
  "registry:fetch_policy": "Fetch your policy from the registry",
  "messaging:receive_document": "Receive the document you send in a chat",
  "voice:record": "Record what you say",
};
const DATA_WORDS: Record<string, string> = {
  document_bytes: "The document file you send",
  document_candidates: "A list of documents it finds, for you to choose from",
  voice_prefill: "Details drawn from what you say, for you to check",
};

export const scopeWords = (code: string): string => SCOPE_WORDS[code] ?? "Act on your behalf in a way not yet described";
export const dataWords = (code: string): string => DATA_WORDS[code] ?? "Information not yet described";

export const CONNECTOR_CHIPS = {
  available: "Works now",
  stub: "Soon",
  later: "Later",
} as const;
