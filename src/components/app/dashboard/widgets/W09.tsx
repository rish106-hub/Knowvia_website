"use client";

import { useId, useState } from "react";
import { Card, ReviewMark, type WidgetProps } from "../parts";
import css from "../dashboard.module.css";

/**
 * W09: a checklist for a hospital visit. The ticks live in this screen's memory only. They are not saved anywhere and the
 * screen says so. Includes "Claim form from the insurer". General guidance, DRAFT, medical and legal review.
 */
export function W09({ state, data }: WidgetProps<"w09">) {
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  const base = useId();
  const toggle = (id: string) =>
    setTicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <Card title="Before a hospital visit" widget="w09" state={state}>
      <ul className={css.checks}>
        {data.items.map((item) => (
          <li key={item.id}>
            <label className={css.check} htmlFor={`${base}-${item.id}`}>
              <input id={`${base}-${item.id}`} type="checkbox" checked={ticked.has(item.id)} onChange={() => toggle(item.id)} />
              <span className={css.checkText}>
                <span>{item.label}</span>
                {item.source === "your_files" ? <span className={css.muted}>Saved in your Documents</span> : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className={css.muted}>{data.note}</p>
      <ReviewMark />
    </Card>
  );
}
