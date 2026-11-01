"use client";

import { Check, Clock, Question, WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { chipModel, NOT_READ_YET, type ChipIcon, type ChipState, type ChipTreatment } from "./chip-model";
import css from "./dashboard.module.css";

const ICONS: Record<ChipIcon, (size: number) => ReactNode> = {
  check: (size) => <Check size={size} weight="bold" aria-hidden="true" />,
  question: (size) => <Question size={size} weight="bold" aria-hidden="true" />,
  alert: (size) => <WarningCircle size={size} weight="bold" aria-hidden="true" />,
  clock: (size) => <Clock size={size} weight="bold" aria-hidden="true" />,
};

const BORDER_CLASS = { solid: css.chipSolid, dashed: css.chipDashed, thick: css.chipThick, dotted: css.chipDotted } as const;

/**
 * One evidence chip: colour, border style, icon and words, always all four. `treatment="two"` is for S01, S14 and W14, where
 * only "Confirmed in your documents" and "Check this" exist.
 */
export function StateChip({ state, treatment = "four" }: { state: ChipState; treatment?: ChipTreatment }) {
  const model = chipModel(state, treatment);
  return (
    <span className={`${css.chip} ${BORDER_CLASS[model.border]}`} data-chip-state={model.state} data-chip-border={model.border}>
      {ICONS[model.icon](16)}
      <span>{model.label}</span>
    </span>
  );
}

/** "Not read yet": a dotted chip with a clock for a topic that nothing has been looked for in. Not an evidence state. */
export function NotReadChip() {
  return (
    <span className={`${css.chip} ${css.chipDotted}`} data-chip-state="not_read" data-chip-border="dotted">
      {ICONS.clock(16)}
      <span>{NOT_READ_YET}</span>
    </span>
  );
}
