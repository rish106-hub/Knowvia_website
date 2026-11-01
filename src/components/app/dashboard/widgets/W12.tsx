"use client";

import { ArrowRight, CheckCircle, Hourglass } from "@phosphor-icons/react";
import { ButtonLink } from "../../ui";
import { Card, type WidgetProps } from "../parts";
import css from "../dashboard.module.css";

/**
 * W12: one next action, from the document's own next action, else from what W16 still needs. Every action is done on the
 * Documents screen, so the button goes there. Nothing is a deadline and nothing counts down.
 */
export function W12({ state, data }: WidgetProps<"w12">) {
  if (state === "empty" || data.action === "none") {
    return (
      <Card title="Do this next" widget="w12" state={state}>
        <p className={css.okLine}>
          <CheckCircle size={22} weight="bold" aria-hidden="true" />
          {data.label || "Nothing to do right now"}
        </p>
      </Card>
    );
  }
  if (data.action === "wait") {
    return (
      <Card title="Do this next" widget="w12" state={state}>
        <p className={css.okLine}>
          <Hourglass size={22} weight="bold" aria-hidden="true" />
          {data.label}
        </p>
        <p className={css.muted}>This page updates by itself. You can leave it open.</p>
      </Card>
    );
  }
  return (
    <Card title="Do this next" widget="w12" state={state} tone="act">
      <p className={css.actTitle}>{data.label}</p>
      <div>
        <ButtonLink href="/app/documents" icon={<ArrowRight size={20} weight="bold" aria-hidden="true" />}>
          Go to documents
        </ButtonLink>
      </div>
    </Card>
  );
}
