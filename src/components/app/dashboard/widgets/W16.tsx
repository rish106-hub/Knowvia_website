"use client";

import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { ButtonLink } from "../../ui";
import { Card, useAddHref, type WidgetProps } from "../parts";
import css from "../dashboard.module.css";

/** W16: what we still need, in order: e-card, policy schedule, policy wording. */
export function W16({ state, data }: WidgetProps<"w16">) {
  const addHref = useAddHref();
  if (state === "full") {
    return (
      <Card title="What we still need" widget="w16" state={state}>
        <p className={css.okLine}>
          <CheckCircle size={22} weight="bold" aria-hidden="true" />
          {data.fullLabel ?? "All key documents added"}
        </p>
      </Card>
    );
  }
  return (
    <Card title="What we still need" widget="w16" state={state}>
      <p className={css.muted}>{state === "empty" ? "All three are still needed, in this order." : "Still needed, in this order."}</p>
      <ol className={css.needList}>
        {data.missing.map((item) => (
          <li key={item.kind}>{item.label}</li>
        ))}
      </ol>
      <div>
        <ButtonLink href={addHref} size="sm" variant="secondary" icon={<ArrowRight size={18} weight="bold" aria-hidden="true" />}>
          Add documents
        </ButtonLink>
      </div>
    </Card>
  );
}
