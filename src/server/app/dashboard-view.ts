// The dashboard view (run V5): pure functions that turn the BFF's own overview, the person's active permissions and the
// backend's read-back into the widgets of the dashboard. No I/O, no clock, no randomness.
//
// Rules this file keeps:
//  - Every value shown comes from the person's own documents and carries one of three evidence states. There is no "verified"
//    state: a state the backend sends that is not one of the three is treated as "unknown" and its value is dropped.
//  - Nothing here is a score, a percentage, a countdown or a streak. The only numbers are counts of the person's own items.
//  - All wording is DRAFT and FOR LEGAL AND MEDICAL REVIEW. Nothing is final.
//  - Read-back text from the backend is untrusted: strings are bounded, identifiers are checked, unknown keys are dropped.
import type { BackendPassages, BackendReadFacts } from "./backend-client";
import {
  DASHBOARD_KINDS,
  DASHBOARD_TOPICS,
  EVIDENCE_CHIP_LABELS,
  EVIDENCE_STATES,
  READBACK_EXCLUDED_REASONS,
  type DashboardKind,
  type DashboardTopic,
  type DashboardTopicView,
  type DashboardValue,
  type DashboardView,
  type DocumentStage,
  type DocumentView,
  type EvidenceChip,
  type EvidenceState,
  type Overview,
  type PassagesView,
  type PermissionView,
  type ReadbackExcludedReason,
  type ReadbackStatus,
  type ReadFactsView,
  type WidgetState,
} from "./contract";

// ---------- copy (DRAFT, FOR LEGAL AND MEDICAL REVIEW) ----------

/** The shared topic explainers, word for word from the plan. */
export const TOPIC_EXPLAINERS: Record<DashboardTopic, string> = {
  sum_insured: "The most the policy says it may pay in a policy year. It is not cash in your account.",
  room_rent: "A limit the policy may set on the daily hospital room charge.",
  co_payment: "A share of each claim that you pay yourself, usually a percentage.",
  pre_authorisation: "Approval from the insurer or TPA before a planned cashless admission, or soon after an emergency one.",
  waiting_period: "Time after the policy starts during which some treatments are not covered.",
  policy_period: "The dates the policy runs from and to. Renewal is due at the end.",
};

const TOPIC_TITLES: Record<DashboardTopic, string> = {
  sum_insured: "Sum insured",
  room_rent: "Room rent",
  co_payment: "Co-payment",
  waiting_period: "Waiting period",
  pre_authorisation: "Pre-authorisation",
  policy_period: "Policy period",
};

/** The search words behind "See where your documents mention this". */
const TOPIC_PASSAGE_QUERIES: Record<DashboardTopic, string> = {
  sum_insured: "sum insured",
  room_rent: "room rent",
  co_payment: "co-payment",
  waiting_period: "waiting period",
  pre_authorisation: "pre-authorisation",
  policy_period: "policy period",
};

/**
 * The backend fields this view reads, with the topic each belongs to. The backend's own `topic` is not trusted for grouping.
 * Identity fields (insurer, plan name, policy number, names, premium) are not read here at all.
 */
const FIELDS: Record<string, { topic: DashboardTopic; label: string }> = {
  policy_period_start: { topic: "policy_period", label: "Policy starts" },
  policy_period_end: { topic: "policy_period", label: "Policy ends" },
  base_sum_insured: { topic: "sum_insured", label: "Base sum insured" },
  room_rent_limit: { topic: "room_rent", label: "Room rent limit" },
  icu_limit: { topic: "room_rent", label: "ICU limit" },
  co_payment: { topic: "co_payment", label: "Co-payment" },
  initial_waiting_period: { topic: "waiting_period", label: "Initial waiting period" },
  specified_disease_waiting_period: { topic: "waiting_period", label: "Waiting period for listed illnesses" },
  ped_waiting_period: { topic: "waiting_period", label: "Waiting period for pre-existing conditions" },
};

const KIND_LABELS: Record<DashboardKind, string> = {
  member_card: "E-card",
  policy_schedule: "Policy schedule",
  policy_wording: "Policy wording",
};

const READ_NOTICE = "Read from your documents by a rule, not checked.";
const PASSAGE_NOTICE = "These are passages from your documents, not an answer or a claim decision.";
const SCAN_OFF_NOTICE = "Document checks are switched off here, so documents waiting for their checks will stay unread.";

// ---------- bounded narrowing of backend text ----------

const MAX_VALUE_CHARS = 60;
const MAX_QUOTE_CHARS = 160;
const MAX_TITLE_CHARS = 120;
const MAX_SNIPPET_CHARS = 400;
const MAX_NOTICE_CHARS = 300;
const MAX_KIND_CHARS = 40;
const MAX_FIELDS_PER_DOCUMENT = 40;
const MAX_PASSAGES = 10;
const MAX_VALUES_PER_TOPIC = 12;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const FIELD_NAME = /^[a-z][a-z0-9_]{0,59}$/;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** A bounded single-line string, or null. Control characters become spaces. */
function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const clean = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : null;
}
const safeId = (value: unknown): string | null => (typeof value === "string" && SAFE_ID.test(value) ? value : null);
const pageOf = (value: unknown): number | null => (typeof value === "number" && Number.isSafeInteger(value) && value >= 1 ? value : null);
const stateOf = (value: unknown): EvidenceState => (EVIDENCE_STATES as readonly unknown[]).includes(value) ? (value as EvidenceState) : "unknown";

function excludedOf(raw: unknown[] | undefined): ReadFactsView["excluded"] {
  const out: ReadFactsView["excluded"] = [];
  for (const entry of raw ?? []) {
    if (!isRecord(entry)) continue;
    const documentId = safeId(entry.documentId);
    if (!documentId) continue;
    const reason: ReadbackExcludedReason = (READBACK_EXCLUDED_REASONS as readonly unknown[]).includes(entry.reason) ? (entry.reason as ReadbackExcludedReason) : "not_read";
    out.push({ documentId, reason });
  }
  return out;
}

/** The read-facts body reduced to its known fields. A value whose state is not one of the three evidence states is dropped. */
export function toReadFactsView(body: BackendReadFacts): ReadFactsView {
  const documents: ReadFactsView["documents"] = [];
  for (const raw of body.documents) {
    if (!isRecord(raw)) continue;
    const documentId = safeId(raw.documentId);
    const documentKind = text(raw.documentKind, MAX_KIND_CHARS);
    if (!documentId || !documentKind || !Array.isArray(raw.fields)) continue;
    const fields: ReadFactsView["documents"][number]["fields"] = [];
    for (const field of raw.fields.slice(0, MAX_FIELDS_PER_DOCUMENT)) {
      // Only the nine fields this view knows. A field the backend adds later (an identity field, say) never crosses.
      if (!isRecord(field) || typeof field.field !== "string" || !FIELD_NAME.test(field.field) || !Object.hasOwn(FIELDS, field.field)) continue;
      const topic = FIELDS[field.field].topic;
      const rawValue = typeof field.value === "string" ? field.value.trim() : "";
      const value = rawValue.length > 0 && rawValue.length <= MAX_VALUE_CHARS ? text(rawValue, MAX_VALUE_CHARS) : null;
      // Fail closed: a state that is not one of the three means "not found". A reported disagreement is kept even when no usable
      // value came with it: "Your documents disagree" is true without one, and dropping it would claim "Not found yet".
      const reported = stateOf(field.state);
      if (value === null) {
        fields.push({ field: field.field, topic, value: null, state: reported === "conflicting" ? "conflicting" : "unknown", page: null, quote: null });
        continue;
      }
      if (reported === "unknown") {
        fields.push({ field: field.field, topic, value: null, state: "unknown", page: null, quote: null });
        continue;
      }
      fields.push({ field: field.field, topic, value, state: reported, page: pageOf(field.page), quote: text(field.quote, MAX_QUOTE_CHARS) });
    }
    documents.push({ documentId, documentKind, fields });
  }
  return { label: "read_not_checked", notice: text(body.notice, MAX_NOTICE_CHARS) ?? READ_NOTICE, documents, excluded: excludedOf(body.excluded) };
}

/** The passages body reduced to its known fields. The query is not echoed back. */
export function toPassagesView(body: BackendPassages): PassagesView {
  const passages: PassagesView["passages"] = [];
  for (const raw of body.passages) {
    if (!isRecord(raw)) continue;
    const clauseId = safeId(raw.clauseId);
    const documentId = safeId(raw.documentId);
    const kind = text(raw.kind, MAX_KIND_CHARS);
    const snippet = text(raw.snippet, MAX_SNIPPET_CHARS);
    if (!clauseId || !documentId || !kind || !snippet) continue;
    passages.push({ clauseId, documentId, page: pageOf(raw.page), kind, title: text(raw.title, MAX_TITLE_CHARS), snippet });
    if (passages.length >= MAX_PASSAGES) break;
  }
  return { label: "passage_not_answer", notice: text(body.notice, MAX_NOTICE_CHARS) ?? PASSAGE_NOTICE, passages, excluded: excludedOf(body.excluded) };
}

// ---------- the dashboard ----------

/** What the handler learned from the read-back route. `off`: the backend switch is off. `none`: nothing to ask about yet. */
export type ReadFactsInput = { status: "ok"; data: ReadFactsView } | { status: Exclude<ReadbackStatus, "ok"> };

export type DashboardInput = {
  overview: Overview;
  /** The person's permissions as the backend lists them. Only active ones count. */
  consents: PermissionView[];
  /** `unavailable`: the permission list could not be read. Nothing is then claimed about permissions. Defaults to `ok`. */
  permissionsStatus?: "ok" | "unavailable";
  /** The backend cut the permission list short. */
  permissionsTruncated?: boolean;
  /** documentScan.mode from the backend integrations report, or null when it could not be read. */
  scanMode: string | null;
  readFacts: ReadFactsInput;
};

const chipOf = (state: EvidenceState): EvidenceChip => ({ state, label: EVIDENCE_CHIP_LABELS[state] });

const GONE_STAGES: ReadonlySet<DocumentStage> = new Set(["rejected", "deleting", "deleted"]);

const normalise = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

type Found = { field: string; value: string; state: "extracted_unverified" | "conflicting"; page: number | null; quote: string | null; documentId: string; documentKind: string };

function collectFound(readFacts: ReadFactsView, topic: DashboardTopic): { found: Found[]; disagreeWithoutValue: boolean } {
  const found: Found[] = [];
  let disagreeWithoutValue = false;
  for (const document of readFacts.documents) {
    for (const field of document.fields) {
      const info = FIELDS[field.field];
      if (!info || info.topic !== topic) continue;
      // Only the two states a value may have. Anything else (including a state this view has never heard of) is not surfaced.
      if (field.state !== "extracted_unverified" && field.state !== "conflicting") continue;
      if (field.value === null) {
        if (field.state === "conflicting") disagreeWithoutValue = true;
        continue;
      }
      found.push({ field: field.field, value: field.value, state: field.state, page: field.page, quote: field.quote, documentId: document.documentId, documentKind: document.documentKind });
    }
  }
  return { found, disagreeWithoutValue };
}

/**
 * One topic. A field is "Your documents disagree" when the backend says so, or when two documents give it different values;
 * every distinct value is then listed. A disagreement inside one document arrives with one value only (the backend does not
 * send the second), and `conflictDetail` says so.
 */
function buildTopic(topic: DashboardTopic, readFacts: ReadFactsInput): DashboardTopicView {
  const base = { topic, title: TOPIC_TITLES[topic], explainer: TOPIC_EXPLAINERS[topic], passageQuery: TOPIC_PASSAGE_QUERIES[topic] };
  const enabled = readFacts.status === "ok" && readFacts.data.documents.length > 0;
  if (readFacts.status !== "ok" || !enabled) return { ...base, enabled: false, chip: null, values: [], conflictDetail: null };

  const { found, disagreeWithoutValue } = collectFound(readFacts.data, topic);
  const values: DashboardValue[] = [];
  let anyConflict = disagreeWithoutValue;
  let bothValues = false;
  for (const field of Object.keys(FIELDS).filter((name) => FIELDS[name].topic === topic)) {
    const entries = found.filter((entry) => entry.field === field);
    if (entries.length === 0) continue;
    const distinct = new Map<string, Found>();
    for (const entry of entries) if (!distinct.has(normalise(entry.value))) distinct.set(normalise(entry.value), entry);
    const conflicting = entries.some((entry) => entry.state === "conflicting") || distinct.size > 1;
    if (conflicting) {
      anyConflict = true;
      if (distinct.size > 1) bothValues = true;
    }
    const state = conflicting ? "conflicting" : "extracted_unverified";
    for (const entry of distinct.values()) {
      values.push({
        field,
        label: FIELDS[field].label,
        value: entry.value,
        state,
        chip: chipOf(state),
        page: entry.page,
        quote: entry.quote === null ? null : entry.quote.slice(0, MAX_QUOTE_CHARS),
        documentId: entry.documentId,
        documentKind: entry.documentKind,
      });
    }
  }
  const state: EvidenceState = anyConflict ? "conflicting" : values.length > 0 ? "extracted_unverified" : "unknown";
  return {
    ...base,
    enabled: true,
    chip: chipOf(state),
    values: values.slice(0, MAX_VALUES_PER_TOPIC),
    conflictDetail: anyConflict ? (bothValues ? "both_values" : values.length > 0 ? "one_value" : "no_value") : null,
  };
}

function nextActionLabel(action: "grant_ocr_consent" | "start_ocr" | "retry_ocr"): string {
  if (action === "grant_ocr_consent") return "Allow CoverSaath to read the documents you have added";
  if (action === "start_ocr") return "Start reading your document";
  return "Try reading this document again";
}

const ADD_LABELS: Record<DashboardKind, string> = {
  member_card: "Add your health card or e-card",
  policy_schedule: "Add your policy schedule",
  policy_wording: "Add your policy wording",
};

const byUploaded = (a: DocumentView, b: DocumentView) => {
  if (a.uploadedAt === b.uploadedAt) return a.id.localeCompare(b.id);
  if (a.uploadedAt === null) return 1;
  if (b.uploadedAt === null) return -1;
  return a.uploadedAt.localeCompare(b.uploadedAt);
};

export function buildDashboardView(input: DashboardInput): DashboardView {
  const { overview, readFacts } = input;
  const activePermissions = (input.permissionsStatus === "unavailable" ? [] : input.consents).filter((permission) => permission.status === "active");
  const documents = [...overview.documents].sort(byUploaded);
  const present = documents.filter((document) => !GONE_STAGES.has(document.stage));
  const countOf = (kind: DashboardKind) => present.filter((document) => document.documentKind === kind).length;

  // W07 and W16
  const kinds = DASHBOARD_KINDS.map((kind) => ({ kind, label: KIND_LABELS[kind], present: countOf(kind) > 0, count: countOf(kind) }));
  const missing = kinds.filter((entry) => !entry.present).map(({ kind, label }) => ({ kind, label }));
  const kindsState: "empty" | "partial" | "full" = missing.length === kinds.length ? "empty" : missing.length === 0 ? "full" : "partial";

  // W01
  const permissionsKnown = input.permissionsStatus !== "unavailable";
  const holdsReading = permissionsKnown && activePermissions.some((permission) => permission.kind === "read_document");
  const steps = [
    { id: "member_card" as const, label: "E-card added", done: countOf("member_card") > 0, known: true },
    { id: "policy_schedule" as const, label: "Policy schedule added", done: countOf("policy_schedule") > 0, known: true },
    { id: "policy_wording" as const, label: "Policy wording added", done: countOf("policy_wording") > 0, known: true },
    { id: "document_read" as const, label: "At least one document read", done: present.some((document) => document.stage === "readable"), known: true },
    { id: "reading_permission" as const, label: "Reading permission given", done: holdsReading, known: permissionsKnown },
  ];
  const done = steps.filter((step) => step.done).length;

  // W15
  const timeline = documents
    .filter((document) => document.stage !== "deleted")
    .map((document) => {
      const pages = document.ocr?.status === "succeeded" ? document.ocr.pageCount : null;
      return {
        documentId: document.id,
        documentKind: document.documentKind,
        uploadedAt: document.uploadedAt,
        stage: document.stage,
        label: document.label,
        pagesLabel: pages !== null && Number.isSafeInteger(pages) && pages > 0 ? `Read ${pages} ${pages === 1 ? "page" : "pages"}` : null,
      };
    });
  const timelineState: "empty" | "partial" | "full" = timeline.length === 0 ? "empty" : timeline.every((entry) => entry.stage === "readable") ? "full" : "partial";

  // W17
  const topics = DASHBOARD_TOPICS.map((topic) => buildTopic(topic, readFacts));
  const anyEnabled = topics.some((topic) => topic.enabled);
  const w17State: WidgetState = !anyEnabled
    ? "empty"
    : topics.some((topic) => topic.chip?.state === "conflicting")
      ? "conflicting"
      : topics.every((topic) => topic.chip?.state === "extracted_unverified")
        ? "full"
        : "partial";

  // W04: the policy end date, read from the documents. Never stored as confirmed.
  const periodTopic = topics.find((topic) => topic.topic === "policy_period") as DashboardTopicView;
  const endValues = periodTopic.values.filter((value) => value.field === "policy_period_end");
  const startValues = periodTopic.values.filter((value) => value.field === "policy_period_start");
  const w04State: WidgetState = !periodTopic.enabled
    ? "empty"
    : endValues.some((value) => value.state === "conflicting")
      ? "conflicting"
      : endValues.length > 0
        ? "full"
        : startValues.length > 0
          ? "partial"
          : "empty";
  const w04Chip: EvidenceChip | null = !periodTopic.enabled ? null : chipOf(w04State === "conflicting" ? "conflicting" : endValues.length > 0 ? "extracted_unverified" : "unknown");

  // W12: a document's own next action first, then the first missing key document, then waiting, then nothing.
  const actionable = present.find((document) => document.nextAction === "grant_ocr_consent" || document.nextAction === "start_ocr" || document.nextAction === "retry_ocr");
  let w12: DashboardView["widgets"]["w12"];
  if (actionable && (actionable.nextAction === "grant_ocr_consent" || actionable.nextAction === "start_ocr" || actionable.nextAction === "retry_ocr")) {
    w12 = { state: "full", data: { action: actionable.nextAction, label: nextActionLabel(actionable.nextAction), documentId: actionable.id, documentKind: actionable.documentKind } };
  } else if (missing.length > 0) {
    w12 = { state: "full", data: { action: "add_document", label: ADD_LABELS[missing[0].kind], documentId: null, documentKind: missing[0].kind } };
  } else if (present.some((document) => document.nextAction === "wait")) {
    w12 = { state: "full", data: { action: "wait", label: "Reading is in progress", documentId: null, documentKind: null } };
  } else {
    w12 = { state: "empty", data: { action: "none", label: "Nothing to do right now", documentId: null, documentKind: null } };
  }

  // W13
  const permissionItems = activePermissions
    .filter((permission) => permission.kind !== "other")
    .map((permission) => ({ kind: permission.kind, label: permission.label, documentCount: permission.documentIds.length }));

  // W14
  const eCard = present.find((document) => document.documentKind === "member_card");

  const scanNotice = input.scanMode === "disabled" && documents.some((document) => document.stage === "awaiting_checks") ? SCAN_OFF_NOTICE : null;

  return {
    caseId: overview.cases[0]?.id ?? null,
    documentsAccess: overview.documentsAccess ?? "full",
    permissions: { status: permissionsKnown ? "ok" : "unavailable", truncated: permissionsKnown && input.permissionsTruncated === true },
    scanNotice,
    copyStatus: "draft_needs_medical_and_legal_review",
    widgets: {
      w01: { state: done === 0 ? "empty" : done === steps.length ? "full" : "partial", data: { done, total: 5, emptyLabel: done === 0 ? "Add your e-card first" : null, steps } },
      w07: { state: kindsState, data: { kinds } },
      w15: { state: timelineState, data: { documents: timeline } },
      w16: { state: kindsState, data: { missing, fullLabel: missing.length === 0 ? "All key documents added" : null } },
      w17: {
        state: w17State,
        data: {
          readback: readFacts.status,
          notice: readFacts.status === "ok" ? readFacts.data.notice : null,
          excluded: readFacts.status === "ok" ? readFacts.data.excluded : [],
          topics,
        },
      },
      w04: { state: w04State, data: { chip: w04Chip, values: periodTopic.values, stored: false } },
      w12,
      w13: { state: permissionItems.length === 0 ? "empty" : "full", data: { status: permissionsKnown ? "ok" : "unavailable", truncated: permissionsKnown && input.permissionsTruncated === true, items: permissionItems } },
      w14: {
        state: "full",
        data: {
          tel: "tel:112",
          callLabel: "Call 112 (national emergency number)",
          helplineNote: "Call the helpline printed on your health card",
          eCard: { saved: Boolean(eCard), documentId: eCard?.id ?? null },
        },
      },
      w09: {
        state: "full",
        data: {
          items: [
            { id: "member_card", label: "Health card or e-card", source: eCard ? "your_files" : "general_list" },
            { id: "policy_number", label: "Policy number", source: "general_list" },
            { id: "photo_id", label: "Photo ID", source: "general_list" },
            { id: "insurer_helpline", label: "Insurer helpline number", source: "general_list" },
            { id: "reports", label: "Past reports and prescriptions", source: "general_list" },
            { id: "claim_form", label: "Claim form from the insurer", source: "general_list" },
          ],
          ticksStored: false,
          note: "Ticks are not saved anywhere. They are gone when you leave this screen. General guidance, not medical advice and not a claim decision.",
        },
      },
      w02: { state: "unknown", reason: "needs_answer" },
      w03: { state: "unknown", reason: "needs_answer" },
      w05: { state: "unknown", reason: "needs_answer" },
      w06: { state: "unknown", reason: "needs_answer" },
      w11: { state: "unknown", reason: "needs_answer" },
    },
  };
}
