import { ArrowRight, Check, Question } from "@phosphor-icons/react/dist/ssr";

export type StatusKind = "known" | "unknown" | "next";

export function StatusPill({ kind }: { kind: StatusKind }) {
  const label = kind === "known" ? "Known" : kind === "unknown" ? "Not confirmed" : "Next";
  const Icon = kind === "known" ? Check : kind === "unknown" ? Question : ArrowRight;
  return <span className={`status-pill status-${kind}`}><Icon aria-hidden="true" size={15} weight="bold" />{label}</span>;
}
