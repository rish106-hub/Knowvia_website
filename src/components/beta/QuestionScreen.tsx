"use client";

import { useState } from "react";
import { type CatalogueOption, type CatalogueQuestion, type InputKind, type Member, NOT_SURE } from "@/lib/beta/types";

/** Options to show for a question. "Not sure" is always present; member_pick options come from the household. */
export function questionOptions(q: CatalogueQuestion, members: Member[] = []): CatalogueOption[] {
  const base: CatalogueOption[] = q.input.kind === "member_pick" ? members.map(m => ({ id: m.id, label: { en: m.label, hi: null } })) : [...(q.input.options ?? [])];
  return base.some(o => o.id === NOT_SURE) ? base : [...base, { id: NOT_SURE, label: { en: "Not sure", hi: null } }];
}

/** Multi-select toggling. "Not sure" clears the rest; any real chip clears "Not sure". */
export function toggleSelection(kind: InputKind, current: string[], id: string): string[] {
  if (kind !== "multi_choice_chips") return [id];
  if (id === NOT_SURE) return [NOT_SURE];
  const rest = current.filter(x => x !== NOT_SURE);
  return rest.includes(id) ? rest.filter(x => x !== id) : [...rest, id];
}

type Props = { question: CatalogueQuestion; member?: Member; index: number; total: number; members?: Member[]; busy?: boolean; onAnswer: (optionIds: string[]) => void };

export function QuestionScreen({ question, member, index, total, members, busy, onAnswer }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const kind = question.input.kind;
  const multi = kind === "multi_choice_chips";
  const options = questionOptions(question, members);
  const tap = (id: string) => {
    if (busy) return;
    if (!multi || id === NOT_SURE) { onAnswer([id]); return; }
    setPicked(p => toggleSelection(kind, p, id));
  };
  return (
    <section className="beta-card" aria-labelledby="beta-q-title" data-kind={kind}>
      <p className="beta-count">{index + 1} of {total}</p>
      {question.perMember && member && <p className="beta-member"><span className="beta-chip" data-static="true">{member.label}</span></p>}
      <h1 id="beta-q-title">{question.prompt.en}</h1>
      <p className="beta-why">{question.why.en}</p>
      <div className="beta-chips" role={multi ? "group" : "radiogroup"} aria-labelledby="beta-q-title">
        {options.map(o => (
          <button key={o.id} type="button" className="beta-chip" data-id={o.id} data-quiet={o.id === NOT_SURE} role={multi ? undefined : "radio"} aria-checked={multi ? undefined : false} aria-pressed={multi ? picked.includes(o.id) : undefined} disabled={busy} onClick={() => tap(o.id)}>
            {o.label.en}
          </button>
        ))}
      </div>
      {multi && <button type="button" className="beta-button" disabled={busy || picked.length === 0} onClick={() => onAnswer(picked)}>Done</button>}
    </section>
  );
}
