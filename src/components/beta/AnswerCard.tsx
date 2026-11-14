"use client";

import { useState } from "react";
import { CORRECTION_PRESETS } from "@/lib/beta/mock";
import { sourceLine } from "@/lib/beta/tiles";
import type { AnswerCardData, CardAction, ConditionKind, Verdict } from "@/lib/beta/types";

/** Describes the wording of the policy. Never a claim outcome. */
export const VERDICT_LINE: Record<Verdict, string> = {
  covered: "Your policy says: covered",
  not_covered: "Your policy says: not covered",
  partly_covered: "Your policy says: partly covered",
  depends: "Your policy says: it depends",
  unknown: "Your documents don't say.",
};
export const CONDITION_LABEL: Record<ConditionKind, string> = {
  waiting_period: "Waiting period", sublimit: "Limit", copay: "Co-pay", deductible: "Deductible", exclusion: "Exclusion", room_rent: "Room rent", document_needed: "Document needed",
};
export const POLICY_CARD_LABEL = "Call the number on your policy card";

/** href for a guard-resolved contact, or null. Phone: digits only. Only the action's own `contact` is ever used. */
export function contactHref(action: CardAction): string | null {
  const c = action.contact;
  if (!c || (action.kind !== "call_insurer" && action.kind !== "grievance_path")) return null;
  if (c.kind === "phone") { const d = c.value.replace(/\D/g, ""); return d ? `tel:${d}` : null; }
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(c.value) ? `mailto:${c.value}` : null;
}

const REASONS = ["Wrong fact", "Not what I asked", "Hard to follow"];

export function verdictLine(card: AnswerCardData) {
  if (card.status === "unknown") return VERDICT_LINE.unknown;
  if (card.verdict === "unknown") return null; // wording from the policy with no rule verdict: no verdict line
  return VERDICT_LINE[card.verdict];
}

type Props = {
  card: AnswerCardData;
  onAction?: (action: CardAction) => void;
  onFollowup?: (text: string) => void;
  onFeedback?: (helpful: boolean, reason?: string) => void;
  onCorrect?: (sourceId: string, value: string) => void;
};

export function AnswerCard({ card, onAction, onFollowup, onFeedback, onCorrect }: Props) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [fixed, setFixed] = useState(false);
  const unknown = card.status === "unknown";
  const line = verdictLine(card);
  const actions = unknown && !card.actions.some(a => a.kind === "call_insurer") ? [...card.actions, { kind: "call_insurer" as const, label: POLICY_CARD_LABEL }] : card.actions;
  const ownSource = card.sources.find(s => s.tier === "own_pdf");
  const correct = (value: string) => { if (ownSource && value.trim()) { onCorrect?.(ownSource.id, value.trim()); setFixed(true); } };

  return (
    <article className="beta-answer" data-status={card.status} data-verdict={card.verdict}>
      {line && <p className="beta-verdict" data-verdict={card.verdict}>{line}</p>}
      {!unknown && <h2 className="beta-headline">{card.headline}</h2>}
      {card.explanation && <p className="beta-explain">{card.explanation}</p>}

      {card.conditions.length > 0 && (
        <ul className="beta-conditions">
          {card.conditions.map((c, i) => <li key={i}><span className="beta-kind" data-kind={c.kind}>{CONDITION_LABEL[c.kind]}</span> {c.text}</li>)}
        </ul>
      )}

      {card.sources.length > 0 && (
        <details className="beta-sources">
          <summary>Sources ({card.sources.length})</summary>
          {card.sources.map(s => (
            <div key={s.id} className="beta-source">
              {sourceLine(s) && <p className="beta-where">{sourceLine(s)}</p>}
              <blockquote>{s.quote}</blockquote>
            </div>
          ))}
        </details>
      )}

      {actions.length > 0 && <div className="beta-actions">{actions.map((a, i) => {
        const href = contactHref(a);
        return href
          ? <a key={i} className="beta-button" data-kind={a.kind} href={href}>{a.label}: {a.contact!.value}</a>
          : <button key={i} type="button" className="beta-button" data-kind={a.kind} onClick={() => onAction?.(a)}>{a.label}</button>;
      })}</div>}

      {card.followups.length > 0 && <div className="beta-chips" aria-label="Ask next">{card.followups.slice(0, 3).map(f => <button key={f} type="button" className="beta-chip" onClick={() => onFollowup?.(f)}>{f}</button>)}</div>}

      <div className="beta-feedback" aria-label="Was this useful?">
        {!fixed && (
          <>
            <button type="button" className="beta-chip" aria-pressed={vote === "up"} aria-label="Helpful" onClick={() => { setVote("up"); setReason(null); onFeedback?.(true); }}>Helpful</button>
            <button type="button" className="beta-chip" aria-pressed={vote === "down"} aria-label="Not helpful" onClick={() => setVote("down")}>Not helpful</button>
          </>
        )}
        {fixed && <p className="beta-note">Thanks. We updated it.</p>}
        {vote === "down" && !fixed && (
          <div className="beta-chips">
            {REASONS.map(r => <button key={r} type="button" className="beta-chip" aria-pressed={reason === r} onClick={() => { setReason(r); onFeedback?.(false, r); }}>{r}</button>)}
          </div>
        )}
        {vote === "down" && reason === "Wrong fact" && ownSource && !fixed && (
          <div className="beta-correct">
            <p className="beta-why">What&apos;s the right value?</p>
            <div className="beta-chips">
              {CORRECTION_PRESETS.map(p => <button key={p} type="button" className="beta-chip" onClick={() => correct(p)}>{p}</button>)}
              <button type="button" className="beta-chip" data-quiet="true" onClick={() => { setFixed(false); setReason("Not sure"); }}>Not sure</button>
            </div>
            <input value={other} onChange={e => setOther(e.target.value)} aria-label="Another value" placeholder="Another value" maxLength={60} />
            {other.trim() && <button type="button" className="beta-button" onClick={() => correct(other)}>Use this value</button>}
          </div>
        )}
      </div>
    </article>
  );
}
