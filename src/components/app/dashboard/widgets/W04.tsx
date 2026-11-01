"use client";

import { groupValues, sourceLine } from "../view-model";
import { NotReadChip, StateChip } from "../StateChip";
import { Card, type WidgetProps } from "../parts";
import css from "../dashboard.module.css";

/**
 * W04: renewal. It shows the policy period as it was read from the documents, always as "Read, not checked", "Your
 * documents disagree" or "Not found yet". It is never stored as confirmed, and there is no control to confirm it.
 */
export function W04({ state, data }: WidgetProps<"w04">) {
  const chip = data.chip;
  const groups = groupValues(data.values);
  const ends = groups.find((group) => group.field === "policy_period_end");
  const starts = groups.find((group) => group.field === "policy_period_start");
  return (
    <Card title="Renewal" widget="w04" state={state} aside={chip ? <StateChip state={chip.state} /> : <NotReadChip />}>
      {state === "empty" ? (
        <p className={css.muted}>{chip ? "We did not find the dates your policy runs from and to. Renewal is due at the end." : "Not read yet. Once a document is read, the dates it gives show here."}</p>
      ) : null}

      {state === "partial" && starts ? (
        <>
          <p className={css.muted}>The policy start date was read. The end date, when renewal is due, was not found yet.</p>
          <ValueLine label={starts.label} entries={starts.entries} />
        </>
      ) : null}

      {state === "full" && ends ? (
        <>
          <ValueLine label="Policy ends" entries={ends.entries} large />
          {starts ? <ValueLine label={starts.label} entries={starts.entries} /> : null}
          <p className={css.muted}>Renewal is due at the end of the policy period. This date was read from your documents and has not been checked.</p>
        </>
      ) : null}

      {state === "conflicting" ? (
        <>
          <p className={css.strong}>Your documents give different dates. Both are shown. Nothing is chosen for you.</p>
          {groups.map((group) => (
            <ValueLine key={group.field} label={group.label} entries={group.entries} large={group.field === "policy_period_end"} />
          ))}
        </>
      ) : null}

      <p className={css.muted} data-stored="false">
        Not saved as confirmed. This is only what your documents say, not a reminder or a renewal notice.
      </p>
    </Card>
  );
}

function ValueLine({ label, entries, large = false }: { label: string; entries: ReturnType<typeof groupValues>[number]["entries"]; large?: boolean }) {
  return (
    <div className={entries.length > 1 ? css.valueGrid : css.valueSingle}>
      {entries.map((entry, index) => (
        <div key={`${entry.documentId}-${index}`} className={css.valueBox}>
          <span className={css.muted}>{label}</span>
          <span className={large ? css.valueLarge : css.valueText}>{entry.value}</span>
          <span className={css.muted}>{sourceLine(entry)}</span>
        </div>
      ))}
    </div>
  );
}
