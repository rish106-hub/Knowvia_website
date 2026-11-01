"use client";

import type { ReactNode } from "react";
import css from "../dashboard/dashboard.module.css";

export const PASSAGE_LABEL = "Passage from your document, not an answer";

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
