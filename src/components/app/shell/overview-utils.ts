// Pure helpers over the Overview shape. Unit tested in tests/unit/app-ui.
import type { ConsentView, DocumentView, Overview } from "@/lib/app-contract";

/** Replace a document by id, or append it when new. Never mutates. */
export function replaceDocument(overview: Overview, doc: DocumentView): Overview {
  const exists = overview.documents.some((d) => d.id === doc.id);
  return { ...overview, documents: exists ? overview.documents.map((d) => (d.id === doc.id ? doc : d)) : [...overview.documents, doc] };
}

export function caseIdOf(overview: Overview): string | null {
  return overview.cases[0]?.id ?? null;
}

export function collectGrant(overview: Overview): ConsentView | null {
  return overview.consents.find((c) => c.scope === "collect") ?? null;
}

/** Newest first, deleted last. */
export function sortDocuments(documents: DocumentView[]): DocumentView[] {
  const rank = (d: DocumentView) => (d.stage === "deleted" ? 1 : 0);
  return [...documents].sort((a, b) => rank(a) - rank(b) || (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? ""));
}
