"use client";

import { Check, Minus } from "@phosphor-icons/react";
import { Card, type WidgetProps } from "../parts";
import css from "../dashboard.module.css";

/** W07: which kinds of document are present (e-card, schedule, wording). */
export function W07({ state, data }: WidgetProps<"w07">) {
  const present = data.kinds.filter((kind) => kind.present).length;
  return (
    <Card title="Documents we have" widget="w07" state={state} aside={<span className={css.muted}>{`${present} of ${data.kinds.length} kinds`}</span>}>
      <ul className={css.rows}>
        {data.kinds.map((kind) => (
          <li key={kind.kind} className={css.row}>
            <span className={kind.present ? undefined : css.muted}>{kind.label}</span>
            {kind.present ? (
              <span className={css.tagDone}>
                <Check size={16} weight="bold" aria-hidden="true" />
                {kind.count > 1 ? `Added (${kind.count})` : "Added"}
              </span>
            ) : (
              <span className={css.tagNone}>
                <Minus size={16} weight="bold" aria-hidden="true" />
                Not added
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
