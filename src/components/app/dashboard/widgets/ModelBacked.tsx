"use client";

import { StateChip } from "../StateChip";
import { Card } from "../parts";
import css from "../dashboard.module.css";

/**
 * Shared by W02, W03, W05, W06 and W11. These need an answer from the optional question feature, which is not available
 * yet, so each one shows "Ask to see this" with the state "Not found yet" and nothing else. No value is ever invented.
 * DRAFT titles: the plan names the widgets but not their titles. FOR LEGAL AND MEDICAL REVIEW.
 */
export function ModelBacked({ id, title, note, state }: { id: string; title: string; note?: string; state: "unknown" }) {
  return (
    <Card title={title} widget={id} state={state} aside={<StateChip state="unknown" />}>
      <p className={css.askLine}>Ask to see this</p>
      <p className={css.muted}>{note ?? "Answers come only when you ask a question. Asking is not available yet."}</p>
    </Card>
  );
}
