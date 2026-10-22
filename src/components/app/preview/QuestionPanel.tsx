"use client";

import { useId, useState, type FormEvent } from "react";
import type { PreviewQuestion } from "@/lib/app-evidence";
import { ANSWER_KEYS, validateAnswerValue } from "@/lib/app-evidence";
import { Button, css, cx } from "../evidence/primitives";

export type MemberOption = { id: string; label: string };

type Props = {
  question: PreviewQuestion;
  members: MemberOption[];
  busy: boolean;
  onAnswer: (key: string, value: string) => void;
  onSkip: (key: string) => void;
  onUnknown: (key: string) => void;
};

/** One adaptive question. Skip and "I do not know" are always available; the answer is validated before it is sent. */
export function QuestionForm({ question, members, busy, onAnswer, onSkip, onUnknown }: Props) {
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const spec = Object.hasOwn(ANSWER_KEYS, question.questionKey) ? ANSWER_KEYS[question.questionKey] : null;
  const type = spec?.type ?? "text";
  const errId = `${id}-err`;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const check = validateAnswerValue(question.questionKey, value);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    setError(null);
    onAnswer(question.questionKey, check.value);
  }

  return (
    <form onSubmit={submit} className={cx(css.card)} noValidate data-question={question.questionId}>
      {type === "yes_no" ? (
        <fieldset style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }} aria-describedby={error ? errId : undefined}>
          <legend className={css.h4}>{question.text}</legend>
          <div className={css.row} style={{ marginTop: 8 }}>
            {["YES", "NO"].map((opt) => (
              <label key={opt} className={css.row} style={{ minHeight: 44, gap: 8 }}>
                <input type="radio" name={`${id}-yn`} value={opt} checked={value === opt} onChange={() => setValue(opt)} style={{ width: 22, height: 22 }} />
                <span>{opt === "YES" ? "Yes" : "No"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <>
          <label htmlFor={`${id}-in`} className={cx(css.h4)}>{question.text}</label>
          {type === "member_id" ? (
            <select id={`${id}-in`} className={css.input} value={value} onChange={(e) => setValue(e.target.value)} aria-describedby={error ? errId : undefined} aria-invalid={error ? true : undefined}>
              <option value="">Choose a person</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          ) : (
            <input
              id={`${id}-in`}
              className={css.input}
              type={type === "date" ? "date" : "text"}
              maxLength={type === "text" ? 160 : undefined}
              min={type === "date" ? "2000-01-01" : undefined}
              max={type === "date" ? "2100-12-31" : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
              aria-describedby={error ? errId : undefined}
              aria-invalid={error ? true : undefined}
            />
          )}
        </>
      )}
      {error ? <p id={errId} className={css.fieldError} role="alert">{error}</p> : null}
      <div className={css.row}>
        <Button type="submit" size="sm" busy={busy}>Save answer</Button>
        <Button variant="secondary" size="sm" busy={busy} onClick={() => onSkip(question.questionKey)}>Skip</Button>
        <Button variant="secondary" size="sm" busy={busy} onClick={() => onUnknown(question.questionKey)}>I do not know</Button>
      </div>
    </form>
  );
}
