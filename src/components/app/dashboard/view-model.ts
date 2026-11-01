// Pure helpers behind the dashboard widgets (run W-B1). No React, no I/O, no clock: unit tested in tests/unit/app-ui.
// All new wording here is DRAFT, FOR LEGAL AND MEDICAL REVIEW. Nothing here is a score, a percentage, a countdown or a
// streak: the only numbers are counts of the person's own items, and values read from their own documents.
import type { DashboardTopicView, DashboardValue, DashboardView, Overview, ReadbackExcludedReason, ReadbackStatus } from "@/lib/app-contract";
import { documentKindLabel } from "../documents/stage";

// ---------- entry mode ----------

/** E care needed now, P care coming up, A asked by someone. Only E changes what the dashboard shows first. */
export type EntryMode = "E" | "P" | "A";

const MODE_WORDS: Record<string, EntryMode> = { E: "E", emergency: "E", P: "P", planned: "P", A: "A", asked: "A" };

/** Reads `?mode=` from the /app URL. Anything unknown, repeated or missing is P. */
export function parseEntryMode(value: string | string[] | null | undefined): EntryMode {
  if (typeof value !== "string") return "P";
  return Object.hasOwn(MODE_WORDS, value) ? MODE_WORDS[value] : "P";
}

// ---------- layout ----------

export type WidgetId =
  | "w01" | "w02" | "w03" | "w04" | "w05" | "w06" | "w07" | "w09" | "w11" | "w12" | "w13" | "w14" | "w15" | "w16" | "w17";

export type DashboardLayout = {
  /** Full width, above everything: only W14 in mode E ("care needed now"). */
  first: WidgetId[];
  /** The two cards under it. Side by side on a laptop. */
  band: WidgetId[];
  main: WidgetId[];
  side: WidgetId[];
};

export const MODEL_BACKED: readonly WidgetId[] = ["w02", "w03", "w05", "w06", "w11"];

/** No document of any kind has been added: the dashboard then shows "Add your e-card first" and what is still needed. */
export function hasNoDocuments(view: DashboardView): boolean {
  return view.widgets.w15.data.documents.length === 0 && view.widgets.w07.state === "empty";
}

/** Mode E: W14 comes first. Every other mode keeps it in the side column. */
export function widgetLayout(view: DashboardView, mode: EntryMode): DashboardLayout {
  const emergencyFirst = mode === "E";
  const first: WidgetId[] = emergencyFirst ? ["w14"] : [];
  const w14Side: WidgetId[] = emergencyFirst ? [] : ["w14"];
  if (hasNoDocuments(view)) return { first, band: ["w01"], main: ["w16"], side: ["w13", ...w14Side, "w09"] };
  return { first, band: ["w12", "w01"], main: ["w17", "w04", "w15", ...MODEL_BACKED], side: ["w07", "w16", "w13", ...w14Side, "w09"] };
}

// ---------- refresh ----------

/** Changes when something the dashboard shows may have changed, so the screen asks the BFF again. */
export function refreshKey(overview: Overview): string {
  const docs = overview.documents.map((doc) => `${doc.id}:${doc.stage}:${doc.nextAction}:${doc.ocr?.status ?? "-"}`).sort().join("|");
  const consents = overview.consents.map((consent) => `${consent.scope}:${consent.grantId}:${consent.documentIds.length}`).sort().join("|");
  return `${overview.documentsAccess ?? "full"}#${docs}#${consents}`;
}

// ---------- W01 ring ----------

export type RingArc = { done: boolean; d: string };

const point = (center: number, radius: number, angle: number) => ({
  x: Math.round((center + radius * Math.sin(angle)) * 100) / 100,
  y: Math.round((center - radius * Math.cos(angle)) * 100) / 100,
});

/**
 * `total` arc segments round a circle, the first `done` of them filled. A gap separates the segments. There is no
 * percentage anywhere: the ring only shows which of the person's own steps are done. Angles run clockwise from the top.
 */
export function ringArcs(total: number, done: number, radius = 38, center = 54, gapDegrees = 14): RingArc[] {
  const count = Math.max(1, Math.floor(total));
  const filled = Math.max(0, Math.min(count, Math.floor(done)));
  const slice = (Math.PI * 2) / count;
  const gap = (gapDegrees * Math.PI) / 180;
  return Array.from({ length: count }, (_, index) => {
    const start = point(center, radius, index * slice + gap / 2);
    const end = point(center, radius, (index + 1) * slice - gap / 2);
    return { done: index < filled, d: `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}` };
  });
}

// ---------- W17 topics ----------

export type ValueGroup = { field: string; label: string; state: "extracted_unverified" | "conflicting"; entries: DashboardValue[] };

/** The values of one topic, grouped by field in the order they arrive. A group with a conflicting entry is conflicting. */
export function groupValues(values: DashboardValue[]): ValueGroup[] {
  const groups: ValueGroup[] = [];
  for (const value of values) {
    const group = groups.find((entry) => entry.field === value.field);
    if (group) {
      group.entries.push(value);
      if (value.state === "conflicting") group.state = "conflicting";
    } else groups.push({ field: value.field, label: value.label, state: value.state, entries: [value] });
  }
  return groups;
}

export type TopicBody =
  | { kind: "not_read" }
  | { kind: "not_found" }
  | { kind: "read"; groups: ValueGroup[] }
  | { kind: "disagree"; groups: ValueGroup[]; detail: NonNullable<DashboardTopicView["conflictDetail"]> };

/** Which of the four branches a topic card is in. Only the BFF's own state decides: nothing is inferred here. */
export function topicBody(topic: DashboardTopicView): TopicBody {
  if (!topic.enabled || !topic.chip) return { kind: "not_read" };
  const groups = groupValues(topic.values);
  if (topic.chip.state === "conflicting") return { kind: "disagree", groups, detail: topic.conflictDetail ?? (groups.length > 0 ? "one_value" : "no_value") };
  if (topic.chip.state === "extracted_unverified" && groups.length > 0) return { kind: "read", groups };
  return { kind: "not_found" };
}

export const CONFLICT_NOTES = {
  both_values: "Two places in your documents give different answers. Both are shown. Nothing is chosen for you.",
  one_value: "Your documents disagree about this. We can show only one of the values right now.",
  no_value: "Your documents disagree about this, but we cannot show the values here.",
} as const;

/** "Policy schedule, page 2". Without a page: "Policy schedule". The kind is a known label or "Document". */
export function sourceLine(value: Pick<DashboardValue, "documentKind" | "page">): string {
  const kind = documentKindLabel(value.documentKind);
  return value.page === null ? kind : `${kind}, page ${value.page}`;
}

export const QUOTE_MAX = 160;
export function clipQuote(quote: string | null): string | null {
  if (quote === null) return null;
  const clean = quote.trim();
  if (!clean) return null;
  return clean.length <= QUOTE_MAX ? clean : `${clean.slice(0, QUOTE_MAX - 1).trimEnd()}…`;
}

/** "See where your documents mention this" is offered only once a document has been read. */
export const topicCanShowPassages = (topic: DashboardTopicView) => topic.enabled;

export const READBACK_COPY: Record<Exclude<ReadbackStatus, "ok">, { tone: "info" | "warning"; title: string; text: string } | null> = {
  none: null,
  off: {
    tone: "info",
    title: "What your documents say is not shown yet",
    text: "Showing the values in your documents is switched off here. Every topic stays on “Not read yet” until it is switched on.",
  },
  unavailable: {
    tone: "warning",
    title: "We could not look at what your documents say",
    text: "This is a problem on our side or with your reading permission, not something found in your documents. Try again in a moment.",
  },
};

const EXCLUDED_WORDS: Record<ReadbackExcludedReason, string> = {
  not_read: "not read yet",
  reading_permission_withdrawn: "left out because you took back the reading permission",
  reading_permission_expired: "left out because the reading permission ended",
  superseded: "replaced by a newer document",
};

/** One line per reason, e.g. "1 document not read yet". Counts are of the person's own documents. */
export function excludedLines(excluded: ReadonlyArray<{ reason: ReadbackExcludedReason }>): string[] {
  const counts = new Map<ReadbackExcludedReason, number>();
  for (const entry of excluded) counts.set(entry.reason, (counts.get(entry.reason) ?? 0) + 1);
  return [...counts.entries()].map(([reason, count]) => `${count} ${count === 1 ? "document" : "documents"} ${EXCLUDED_WORDS[reason]}`);
}

/** The path the passages search is called with. Empty when there is no case yet. */
export function passagesPath(caseId: string | null, query: string): string | null {
  if (!caseId) return null;
  return `/cases/${encodeURIComponent(caseId)}/passages?q=${encodeURIComponent(query)}&limit=5`;
}

// ---------- W13 ----------

export function permissionCountWords(count: number): string {
  return count === 0 ? "No documents named" : count === 1 ? "Covers 1 document" : `Covers ${count} documents`;
}
