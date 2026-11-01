"use client";

// Small shared pieces for the widgets: the card frame, the draft mark and the passage card.
import { createContext, useContext, useId, type ReactNode } from "react";
import type { DashboardView } from "@/lib/app-contract";
import css from "./dashboard.module.css";

/** `{ state, data }` of one widget, as the BFF sends it. */
export type WidgetProps<K extends keyof DashboardView["widgets"]> = DashboardView["widgets"][K];

export const REVIEW_TEXT = "DRAFT · FOR LEGAL AND MEDICAL REVIEW";

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

export { PassageCard, PASSAGE_LABEL } from "../policy/PassageCard";

/**
 * Where "Add ..." links go. Normally the Documents screen. For someone who has not yet allowed CoverSaath to keep their PDFs
 * it is the keep-my-document screen (S04), which asks once and then continues to Documents.
 */
export const AddHrefContext = createContext("/app/documents");
export const useAddHref = () => useContext(AddHrefContext);
