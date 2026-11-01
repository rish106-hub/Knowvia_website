"use client";

import { ArrowRight, Question } from "@phosphor-icons/react";
import { ButtonLink } from "../../ui";
import { permissionCountWords } from "../view-model";
import { Card, ReviewMark, type WidgetProps } from "../parts";
import css from "../dashboard.module.css";

/** W13: what the person has allowed. Taking a permission back is done on the Permissions screen. DRAFT wording. */
export function W13({ state, data }: WidgetProps<"w13">) {
  const manage = (
    <div>
      <ButtonLink href="/app/permissions" size="sm" variant="secondary" icon={<ArrowRight size={18} weight="bold" aria-hidden="true" />}>
        See and take back
      </ButtonLink>
    </div>
  );
  if (data.status === "unavailable") {
    return (
      <Card title="What you have allowed" widget="w13" state="unavailable">
        <p className={css.unavailable}>
          <Question size={22} weight="bold" aria-hidden="true" />
          <span>We could not check your permissions just now. That does not mean they are off.</span>
        </p>
        {manage}
        <ReviewMark />
      </Card>
    );
  }
  return (
    <Card title="What you have allowed" widget="w13" state={state}>
      {state === "empty" ? (
        <p className={css.muted}>You have not allowed anything yet. CoverSaath reads nothing without your permission.</p>
      ) : (
        <ul className={css.rows}>
          {data.items.map((item) => (
            <li key={`${item.kind}-${item.label}`} className={css.rowStack}>
              <span className={css.rowStrong}>{item.label}</span>
              {item.kind === "read_document" ? <span className={css.muted}>{permissionCountWords(item.documentCount)}</span> : null}
            </li>
          ))}
        </ul>
      )}
      {data.truncated ? <p className={css.muted}>This list is cut short. The Permissions screen has the whole list.</p> : null}
      {manage}
      <ReviewMark />
    </Card>
  );
}
