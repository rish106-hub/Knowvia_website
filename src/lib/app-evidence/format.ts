// Display formatting of a documented value. It never calculates: no sums, no cash, no reimbursement. A value whose
// shape is not recognised returns null and the card shows only the label and the citation.
import { ruleLabel } from "./labels";

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);

/** Indian digit grouping: 500000 -> "5,00,000". */
export function formatRupees(amountMinor: number): string | null {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) return null;
  const rupees = amountMinor / 100;
  const whole = Math.trunc(rupees);
  const paise = Math.round((rupees - whole) * 100);
  const digits = String(whole);
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return `₹${grouped}${paise ? `.${String(paise).padStart(2, "0")}` : ""}`;
}

const percent = (bps: unknown): string | null => (typeof bps === "number" && Number.isInteger(bps) && bps >= 0 && bps <= 100000 ? `${bps / 100}%` : null);
const money = (v: Record<string, unknown>): string | null => (v.currency === "INR" && typeof v.amountMinor === "number" ? formatRupees(v.amountMinor) : null);

function limit(v: Record<string, unknown>): string | null {
  switch (v.kind) {
    case "amount": {
      const m = money(v);
      return m ? `Up to ${m}` : null;
    }
    case "percent_of_sum_insured": {
      const p = percent(v.basisPoints);
      return p ? `Up to ${p} of the sum insured` : null;
    }
    case "actuals":
      return "Actual charges";
    case "category":
      return typeof v.label === "string" && v.label.length <= 80 ? v.label : null;
    default:
      return null;
  }
}

const isoDate = (v: unknown): string | null => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};
export const formatIsoDate = isoDate;

const safeText = (v: unknown, max = 200): string | null => (typeof v === "string" && v.trim() && v.length <= max ? v.trim() : null);

/** "Sum insured ₹5,00,000" style statement for a documented (known) value, or null when the shape is not recognised. */
export function formatValue(rule: string, value: unknown): string | null {
  if (!isRecord(value)) return null;
  switch (rule) {
    case "sum_insured": {
      const m = money(value);
      return m ? `${ruleLabel(rule)} ${m}` : null;
    }
    case "room_rent_limit":
    case "icu_limit":
    case "sublimit": {
      const l = limit(value);
      return l ? `${ruleLabel(rule)}: ${l}` : null;
    }
    case "copay": {
      const p = percent(value.basisPoints);
      return p ? `Co-payment ${p}` : null;
    }
    case "deductible": {
      const m = money(value);
      if (!m) return null;
      return `Deductible ${m} ${value.type === "annual_aggregate" ? "a year" : value.type === "per_claim" ? "per claim" : ""}`.trim();
    }
    case "waiting_period":
      return typeof value.months === "number" && Number.isInteger(value.months) && value.months >= 0 ? `Waiting period ${value.months} ${value.months === 1 ? "month" : "months"}` : null;
    case "exclusion":
      return typeof value.kind === "string" ? `Exclusion (${value.kind.replace(/_/g, " ")})` : null;
    case "add_on": {
      const name = safeText(value.name, 120);
      return name ? `Add-on: ${name}` : null;
    }
    case "policy_identity": {
      const insurer = safeText(value.insurer);
      const product = safeText(value.productName);
      return insurer && product ? `${insurer}, ${product}` : null;
    }
    case "member_enrolment":
      return value.status === "enrolled" ? "Listed as insured" : value.status === "not_enrolled" ? "Not listed as insured" : null;
    case "policy_period": {
      const start = isoDate(value.start);
      const end = isoDate(value.end);
      return start && end ? `Policy period ${start} to ${end}` : null;
    }
    case "continuous_cover": {
      const since = isoDate(value.since);
      return since ? `Cover reported as continuous since ${since}` : null;
    }
    case "renewal_portability":
      return typeof value.portable === "boolean" ? (value.portable ? "Portability is mentioned" : "Portability is not mentioned as available") : null;
    case "claim_documents": {
      const docs = Array.isArray(value.documents) ? value.documents.filter((d): d is string => typeof d === "string" && d.length <= 200).slice(0, 40) : [];
      return docs.length ? `Claim documents listed: ${docs.length}` : null;
    }
    default:
      return null;
  }
}

/** Limits and sum insured are policy limits, never cash. Used to add one honest line under money-like rules. */
export const MONEY_LIKE_RULES = new Set(["sum_insured", "room_rent_limit", "icu_limit", "sublimit", "deductible", "restoration"]);
