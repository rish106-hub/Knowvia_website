"use client";

import { ArrowRight, Check, Circle, Question } from "@phosphor-icons/react";
import { ButtonLink } from "../../ui";
import { ringArcs } from "../view-model";
import { Card, useAddHref, type WidgetProps } from "../parts";
import css from "../dashboard.module.css";

/** W01: setup progress, n of 5, from the person's own items. Empty says "Add your e-card first". Never a percentage. */
export function W01({ state, data }: WidgetProps<"w01">) {
  const arcs = ringArcs(data.total, data.done);
  const addHref = useAddHref();
  if (state === "empty") {
    return (
      <Card title="Setup" widget="w01" state={state} tone="act">
        <div className={css.emptyHero}>
          <h3 className={css.heroTitle}>{data.emptyLabel ?? "Add your e-card first"}</h3>
          <p className={css.muted}>Your health card or e-card is the quickest way to start. Then add your policy schedule and wording.</p>
          <div>
            <ButtonLink href={addHref} icon={<ArrowRight size={20} weight="bold" aria-hidden="true" />}>
              Add your e-card
            </ButtonLink>
          </div>
        </div>
      </Card>
    );
  }
  const left = data.total - data.done;
  return (
    <Card title="Setup" widget="w01" state={state}>
      <div className={css.ringRow}>
        <svg className={css.ring} width="104" height="104" viewBox="0 0 108 108" role="img" aria-label={`Setup: ${data.done} of ${data.total} steps done`}>
          {arcs.map((arc, index) => (
            <path key={index} d={arc.d} className={arc.done ? css.arcDone : css.arcOpen} style={{ animationDelay: `${index * 60}ms` }} fill="none" strokeWidth="10" strokeLinecap="round" />
          ))}
          <text x="54" y="61" textAnchor="middle" className={css.ringText}>
            {data.done}/{data.total}
          </text>
        </svg>
        <p className={css.ringCaption}>{state === "full" ? "All 5 steps are done." : `${left} ${left === 1 ? "step" : "steps"} to go.`}</p>
      </div>
      <ul className={css.steps}>
        {data.steps.map((step) => (
          <li key={step.id} className={css.stepItem} data-done={step.done || undefined}>
            {!step.known ? <Question size={20} weight="bold" aria-hidden="true" /> : step.done ? <Check size={20} weight="bold" aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
            <span>{step.label}</span>
            <span className={css.stepWord}>{!step.known ? "Could not check" : step.done ? "Done" : "Not yet"}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
