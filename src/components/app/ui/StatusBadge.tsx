"use client";

import { CheckCircle, Clock, Prohibit, Question, WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";

/**
 * A status is never colour alone. Each tone has its own border shape, its own icon and a word:
 * done = solid + check, pending = dotted + clock, attention = dashed + question mark, problem = thick + alert,
 * neutral = plain + dash.
 */
export type BadgeTone = "done" | "pending" | "attention" | "problem" | "neutral";

const ICONS: Record<BadgeTone, (props: { size: number }) => ReactNode> = {
  done: ({ size }) => <CheckCircle size={size} weight="bold" aria-hidden="true" />,
  pending: ({ size }) => <Clock size={size} weight="bold" aria-hidden="true" />,
  attention: ({ size }) => <Question size={size} weight="bold" aria-hidden="true" />,
  problem: ({ size }) => <WarningCircle size={size} weight="bold" aria-hidden="true" />,
  neutral: ({ size }) => <Prohibit size={size} weight="bold" aria-hidden="true" />,
};

export function StatusBadge({ tone, children, icon }: { tone: BadgeTone; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={`kva-badge kva-badge--${tone}`} data-tone={tone}>
      {icon ?? ICONS[tone]({ size: 18 })}
      <span>{children}</span>
    </span>
  );
}
