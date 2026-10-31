// Intake connector descriptors. Mirrors CoverSaath src/contracts/intake-connectors.js (10 entries, same order).
// Descriptors only: nothing here contacts a provider, and no connector except `upload` does anything yet.
// The notice for every connector is DRAFT and needs legal review (the noticeKey says so).
import type { ConnectorAvailability, ConnectorId, ConnectorView } from "./contract";

const entry = (
  id: ConnectorId,
  kind: string,
  label: string,
  availability: ConnectorAvailability,
  scopesRequested: string[],
  dataReturned: string[],
): ConnectorView =>
  Object.freeze({
    id,
    kind,
    label,
    availability,
    intakeChannel: id,
    consentPurpose: id === "voice" ? "voice_intake" : "document_processing",
    scopesRequested: Object.freeze([...scopesRequested]) as string[],
    dataReturned: Object.freeze([...dataReturned]) as string[],
    noticeKey: `${id}-draft-legal-review`,
  });

export const CONNECTORS: readonly ConnectorView[] = Object.freeze([
  entry("upload", "device", "Upload a file", "available", ["document:collect"], ["document_bytes"]),
  entry("camera", "device", "Take a photo", "stub", ["document:collect"], ["document_bytes"]),
  entry("email_forward", "forward", "Forward an email", "stub", ["document:collect"], ["document_bytes"]),
  entry("gmail", "inbox", "Gmail", "later", ["inbox:search_insurance_mail"], ["document_candidates"]),
  entry("outlook", "inbox", "Outlook", "later", ["inbox:search_insurance_mail"], ["document_candidates"]),
  entry("insurer_portal", "portal", "Insurer portal", "later", ["portal:fetch_policy"], ["document_candidates"]),
  entry("hr_portal", "portal", "Employer HR portal", "later", ["portal:fetch_policy"], ["document_candidates"]),
  entry("digilocker", "registry", "DigiLocker", "later", ["registry:fetch_policy"], ["document_candidates"]),
  entry("whatsapp", "messaging", "WhatsApp", "later", ["messaging:receive_document"], ["document_bytes"]),
  entry("voice", "voice", "Speak to us", "stub", ["voice:record"], ["voice_prefill"]),
]);

/** Real users see only what works today. Demo builds see all ten, in contract order. */
export function listConnectors(demo: boolean): ConnectorView[] {
  return CONNECTORS.filter((connector) => demo || connector.availability === "available");
}

export function findConnector(id: string): ConnectorView | undefined {
  return CONNECTORS.find((connector) => connector.id === id);
}
