"use client";

// Small shared pieces for the widgets: the card frame, the draft mark and the passage card.
import { useId, type ReactNode } from "react";
import type { DashboardView } from "@/lib/app-contract";
import css from "./dashboard.module.css";

/** `{ state, data }` of one widget, as the BFF sends it. */
export type WidgetProps<K extends keyof DashboardView["widgets"]> = DashboardView["widgets"][K];

export const REVIEW_TEXT = "DRAFT · FOR LEGAL AND MEDICAL REVIEW";
export const PASSAGE_LABEL = "Passage from your document, not an answer";

export function ReviewMark() {
  return (
    <span className={css.review} data-draft-mark>
      {REVIEW_TEXT}
    </span>
  );
}

type CardProps = {
  title: string;
  /** Extra attribute for tests and for styling a state. */
  widget: string;
  state?: string;
  children: ReactNode;
  aside?: ReactNode;
  tone?: "plain" | "act" | "calm";
  className?: string;
};

/** A widget card: a labelled region with a small uppercase label, as on the boards. */
export function Card({ title, widget, state, children, aside, tone = "plain", className }: CardProps) {
  const id = useId();
  const toneClass = tone === "act" ? css.cardAct : tone === "calm" ? css.cardCalm : "";
  return (
    <section className={[css.card, toneClass, className].filter(Boolean).join(" ")} aria-labelledby={id} data-widget={widget} data-widget-state={state}>
      <div className={css.cardHead}>
        <h2 className={css.lab} id={id}>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** "Page N", a muted left rule, and the label that says this is a passage and not an answer. */
export function PassageCard({ page, heading, children }: { page: number | null; heading?: string | null; children: ReactNode }) {
  return (
    <figure className={css.passage}>
      <figcaption className={css.passageHead}>
        <span className={css.passagePage}>{page === null ? "Page not known" : `Page ${page}`}</span>
        {heading ? <span className={css.passageTitle}>{heading}</span> : null}
      </figcaption>
      <blockquote className={css.passageText}>{children}</blockquote>
      <p className={css.passageLabel}>{PASSAGE_LABEL}</p>
    </figure>
  );
}
