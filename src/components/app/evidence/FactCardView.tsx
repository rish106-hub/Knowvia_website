"use client";

import { useId, useState } from "react";
import type { CitationView, FactCard } from "@/lib/app-evidence";
import { PageIcon } from "./icons";
import { Button, QuoteBlock, StateBadge, css, cx } from "./primitives";

export type ConfirmState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

type Props = {
  card: FactCard;
  headingLevel?: 3 | 4;
  onOpenCitation: (citation: CitationView) => void;
  onReview?: (factId: string, decision: "accepted" | "rejected") => void;
  reviewState?: ConfirmState;
};

export function FactCardView({ card, headingLevel = 4, onOpenCitation, onReview, reviewState }: Props) {
  const [confirming, setConfirming] = useState(false);
  const panelId = useId();
  const Heading = headingLevel === 3 ? "h3" : "h4";
  const saving = reviewState?.status === "saving";
  return (
    <li className={cx(css.card, css[`c_${card.kind}`])} data-fact-state={card.kind}>
      <div className={css.row}>
        <StateBadge kind={card.kind} detail={card.stateDetail} />
        {card.stateDetail ? <span className={css.badgeDetail} aria-hidden="true">{card.stateDetail}</span> : null}
      </div>
      <Heading className={css.statement}>{card.statement}</Heading>
      {card.effect ? <p className={cx(css.p, css.muted, css.small)}>{card.effect}</p> : null}
      {card.why ? <p className={css.why}>{card.why}</p> : null}
      {card.note ? <p className={cx(css.p, css.small, css.muted)}>{card.note}</p> : null}
      {card.qualifiers.map((q) => (
        <div key={q.title}>
          <p className={css.qualTitle}>{q.title}</p>
          <ul className={css.qual}>
            {q.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
      {card.citations.map((c) => (
        <div key={c.key} className={css.cite}>
          {c.quote ? <QuoteBlock quote={c.quote} verbatim={c.verbatim} /> : null}
          <button type="button" className={css.linkBtn} onClick={() => onOpenCitation(c)} aria-haspopup="dialog">
            <PageIcon />
            <span>
              {c.documentLabel}, {c.pageLabel}
              <span className={css.srOnly}> (opens the text we read)</span>
            </span>
          </button>
        </div>
      ))}
      {card.confirm && onReview ? (
        <div>
          {!confirming ? (
            <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
              Confirm this from the document
            </Button>
          ) : (
            <div id={panelId} className={css.confirmPanel}>
              <p className={css.p}>Read the quoted text above. Does it say this?</p>
              <p className={cx(css.p, css.small, css.muted)}>Your confirmation is recorded as yours. It does not make this verified by Knowvia or your insurer.</p>
              <div className={css.row}>
                <Button size="sm" busy={saving} onClick={() => onReview(card.confirm!.factId, "accepted")}>
                  {saving ? "Saving" : "Yes, the text says this"}
                </Button>
                <Button size="sm" variant="secondary" busy={saving} onClick={() => onReview(card.confirm!.factId, "rejected")}>
                  No, this is not right
                </Button>
                <Button size="sm" variant="quiet" busy={saving} onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
              {reviewState?.status === "error" ? <p className={css.fieldError} role="alert">{reviewState.message}</p> : null}
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}
