"use client";

import { ArrowRight, Phone } from "@phosphor-icons/react";
import { ButtonLink } from "../../ui";
import { StateChip } from "../StateChip";
import { Card, ReviewMark, type WidgetProps } from "../parts";
import css from "../dashboard.module.css";

/**
 * W14: the emergency card. tel:112, the helpline printed on the person's health card, and a pointer to the saved e-card.
 * Two chip treatments only. In mode E it is the first thing on the dashboard (`prominent`). DRAFT, medical and legal review.
 */
export function W14({ state, data, prominent = false }: WidgetProps<"w14"> & { prominent?: boolean }) {
  const saved = data.eCard.saved;
  return (
    <Card title="If someone needs care now" widget="w14" state={state} tone={prominent ? "calm" : "plain"} className={prominent ? css.cardEmergency : undefined}>
      <div className={css.callBand}>
        <p className={css.callText}>{data.callLabel}</p>
        <a className={css.callButton} href={data.tel}>
          <Phone size={22} weight="bold" aria-hidden="true" />
          Call 112
        </a>
      </div>
      <p className={css.strong}>{data.helplineNote}</p>
      <div className={css.rowStack}>
        <div className={css.chipLine}>
          <span>{saved ? "Your e-card is saved in Documents." : "No e-card saved yet."}</span>
          {saved ? <StateChip state="extracted_unverified" treatment="two" /> : null}
        </div>
        {saved ? <p className={css.muted}>Look at the card itself for the helpline number and your member number.</p> : <p className={css.muted}>Add it now so it is here when you need it.</p>}
        <div>
          <ButtonLink href="/app/documents" size="sm" variant="secondary" icon={<ArrowRight size={18} weight="bold" aria-hidden="true" />}>
            {saved ? "Open Documents" : "Add your e-card"}
          </ButtonLink>
        </div>
      </div>
      <p className={css.muted}>General guidance. Not medical advice and not a claim decision. Seek emergency care first.</p>
      <ReviewMark />
    </Card>
  );
}
