"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FactCardView } from "../evidence/FactCardView";
import { ArrowIcon } from "../evidence/icons";
import { Button, Notice, SourceSheet, css, cx } from "../evidence/primitives";
import type { CitationView, FactCard } from "@/lib/app-evidence";
import { SCENARIO_OPTIONS, buildPreviewView, type ScenarioType } from "@/lib/app-evidence";
import { QuestionForm } from "./QuestionPanel";
import { usePreviewFlow } from "./usePreviewFlow";

const BANNER_TONE = { summary: "info", partial: "warn", empty: "warn", conflict: "error", recover: "error" } as const;

export function PreviewScreen() {
  const flow = usePreviewFlow();
  const [sheet, setSheet] = useState<CitationView | null>(null);
  const questionsHeading = useRef<HTMLHeadingElement>(null);
  const lastFocus = useRef(0);

  const members = useMemo(() => (flow.overview?.members ?? []).map((m) => ({ id: m.id, displayName: m.displayName })), [flow.overview]);
  const view = useMemo(
    () => (flow.preview ? buildPreviewView({ preview: flow.preview, scenario: flow.scenario, documents: flow.documents, members, answer: flow.answer }) : null),
    [flow.preview, flow.scenario, flow.documents, members, flow.answer],
  );

  // After an answer is applied, move focus to the questions heading so keyboard and screen-reader users land on what changed.
  const answerCount = Object.keys(flow.scenario.answers).length;
  useEffect(() => {
    if (answerCount !== lastFocus.current && !flow.updating) {
      if (lastFocus.current !== 0 || answerCount > 0) questionsHeading.current?.focus();
      lastFocus.current = answerCount;
    }
  }, [answerCount, flow.updating, view]);

  const memberOptions = members.map((m) => ({ id: m.id, label: m.displayName }));

  return (
    <div className={css.stackLg}>
      <div className={css.stack}>
        <h1 className={css.h1}>What this means for you</h1>
        <p className={cx(css.p, css.muted)}>Based on the documents you added. This shows what they establish and what they do not. It is not a claim decision.</p>
      </div>

      {flow.phase === "loading" ? <p className={css.p} role="status">Loading.</p> : null}

      {flow.phase === "error" && flow.error ? (
        <Notice tone="error" title={flow.error.title} actions={flow.error.recovery === "sign_in" ? <Link className={cx(css.btn, css.btnSm, css.btnSecondary)} href="/app/sign-in">Sign in</Link> : <Button size="sm" variant="secondary" onClick={flow.retry}>Try again</Button>}>
          <p className={css.p}>{flow.error.message}</p>
        </Notice>
      ) : null}

      {flow.phase === "no_answer" ? (
        <section className={css.card} data-empty-state>
          <h2 className={css.h2}>Read your document first</h2>
          <p className={css.p}>This view is built from what your document says. Start by reading it.</p>
          <div className={css.row}><Link className={cx(css.btn, css.btnPrimary)} href="/app/cover">Go to your cover</Link></div>
        </section>
      ) : null}

      {flow.phase === "gone" ? (
        <Notice tone="error" title={flow.error?.title ?? "This answer is no longer stored"} actions={<Link className={cx(css.btn, css.btnSm, css.btnSecondary)} href="/app/cover">Read my document again</Link>}>
          <p className={css.p}>{flow.error?.message}</p>
        </Notice>
      ) : null}

      {flow.phase === "ready" ? (
        <>
          <div className={css.stack}>
            <label htmlFor="kve-scenario" className={css.label}>What are you checking?</label>
            <select id="kve-scenario" className={css.input} value={flow.scenario.scenarioType} onChange={(e) => flow.dispatch({ type: "set_scenario", scenarioType: e.target.value as ScenarioType })} aria-describedby="kve-scenario-hint">
              {SCENARIO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p id="kve-scenario-hint" className={cx(css.p, css.small, css.muted)}>{SCENARIO_OPTIONS.find((o) => o.value === flow.scenario.scenarioType)?.hint}</p>
          </div>

          <div aria-live="polite" className={css.stack}>
            {flow.updating ? <p className={css.p} role="status" data-updating>Updating what the documents settle.</p> : null}
          </div>

          {flow.previewError ? (
            <Notice
              tone="error"
              title={flow.previewError.title}
              actions={
                flow.previewError.recovery === "change_answer" ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={flow.undoLast}>Remove my last answer</Button>
                    <Button size="sm" variant="quiet" onClick={() => flow.dispatch({ type: "reset" })}>Start the questions again</Button>
                  </>
                ) : flow.previewError.recovery === "sign_in" ? (
                  <Link className={cx(css.btn, css.btnSm, css.btnSecondary)} href="/app/sign-in">Sign in</Link>
                ) : flow.previewError.retryable ? (
                  <Button size="sm" variant="secondary" onClick={flow.retry}>Try again</Button>
                ) : null
              }
            >
              <p className={css.p}>{flow.previewError.message}</p>
            </Notice>
          ) : null}

          {view ? (
            <>
              <Notice tone={BANNER_TONE[view.banner.tone]} title={view.banner.title} live="off">
                <p className={css.p}>{view.banner.body}</p>
              </Notice>

              {view.needsRecovery ? (
                <Notice
                  tone="error"
                  title="This needs your document read again"
                  actions={<Link className={cx(css.btn, css.btnSm, css.btnSecondary)} href="/app/cover">Read my document again</Link>}
                >
                  <p className={css.p}>A document behind this was replaced, deleted, or permission for it ended. Nothing below should be relied on until it is read again.</p>
                </Notice>
              ) : null}

              {view.nextAction ? (
                <section className={css.next} aria-labelledby="kve-next-h" data-next-action>
                  <span className={css.nextTag}><ArrowIcon /> Next</span>
                  <h2 id="kve-next-h" className={css.nextTitle}>{view.nextAction.title}</h2>
                  <p>{view.nextAction.text}</p>
                  {view.nextAction.statusLabel ? <p className={css.small}>{view.nextAction.statusLabel}</p> : null}
                  {view.nextAction.target === "documents" ? (
                    <div className={css.row}><Link className={cx(css.btn, css.btnPrimary)} href="/app/documents">Go to your documents</Link></div>
                  ) : null}
                </section>
              ) : null}
              {view.otherActions.length > 0 ? (
                <details className={css.details}>
                  <summary>Other things still open ({view.otherActions.length})</summary>
                  <ul className={css.list}>
                    {view.otherActions.map((a, i) => (
                      <li key={i} className={css.card}>
                        <p className={css.statement}>{a.title}</p>
                        <p className={css.p}>{a.text}</p>
                        {a.statusLabel ? <p className={cx(css.p, css.small, css.muted)}>{a.statusLabel}</p> : null}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}

              <section className={css.stack} aria-labelledby="kve-q-h">
                <h2 id="kve-q-h" ref={questionsHeading} tabIndex={-1} className={css.h3}>
                  {view.questions.length === 0 ? "Questions" : view.questions.length === 1 ? "One question that would help" : "Two questions that would help"}
                </h2>
                {view.questions.length > 0 ? (
                  <>
                    <p className={cx(css.p, css.small, css.muted)} data-budget>
                      {view.budget.used} of up to {view.budget.limit} questions used. You can skip any question or say you do not know. That is a fine answer.
                    </p>
                    {view.questions.map((q) => (
                      <QuestionForm
                        key={q.questionId}
                        question={q}
                        members={memberOptions}
                        busy={flow.updating}
                        onAnswer={(key, value) => flow.dispatch({ type: "answer", key, value })}
                        onSkip={(key) => flow.dispatch({ type: "skip", key })}
                        onUnknown={(key) => flow.dispatch({ type: "unknown", key })}
                      />
                    ))}
                  </>
                ) : (
                  <p className={css.p} data-no-questions>
                    {view.budget.exhausted ? "That is all we will ask. Anything still open stays marked Not confirmed." : "There is nothing more to ask right now."}
                  </p>
                )}
              </section>

              <section className={css.stack} aria-labelledby="kve-for-h">
                <h2 id="kve-for-h" className={css.h2}>{view.memberLabel === "This person" ? "No family member chosen yet" : `For ${view.memberLabel}`}</h2>
                {view.notices.map((n, i) => (
                  <p key={i} className={cx(css.p, css.muted)}>{n}</p>
                ))}
                {view.policies.map((p) => (
                  <section key={p.id} className={css.stack} aria-labelledby={`kve-p-${p.id}`}>
                    <h3 id={`kve-p-${p.id}`} className={css.h3}>{p.title}</h3>
                    {p.association ? <p className={cx(css.p, css.muted)}>{p.association}</p> : null}
                    <ul className={css.list}>
                      <FactCardView card={p.memberCard} onOpenCitation={setSheet} />
                    </ul>
                    <CardList title="What the documents establish" cards={p.facts} onOpen={setSheet} />
                    <CardList title="Not confirmed" cards={p.uncertainties} onOpen={setSheet} />
                    <CardList title="Not checked" cards={p.notChecked} onOpen={setSheet} />
                  </section>
                ))}
              </section>

              {view.externalChecks.length > 0 ? (
                <section className={css.stack} aria-labelledby="kve-ext-h">
                  <h2 id="kve-ext-h" className={css.h3}>Not checked</h2>
                  <ul className={css.list}>
                    {view.externalChecks.map((c) => (
                      <li key={c.id} className={cx(css.card, css.c_not_checked)}>
                        <p className={css.p}>{c.text}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {view.overlaps.length + view.coordinationNotes.length > 0 ? (
                <section className={css.stack} aria-labelledby="kve-ov-h">
                  <h2 id="kve-ov-h" className={css.h3}>More than one policy</h2>
                  <ul className={css.qual}>
                    {[...view.overlaps, ...view.coordinationNotes].map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <details className={css.details}>
                <summary>What this does not tell you</summary>
                <ul className={css.qual}>
                  {view.limitations.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </details>
              <div className={css.row}>
                <Link className={cx(css.btn, css.btnSm, css.btnSecondary)} href="/app/cover">Back to what we found</Link>
              </div>
            </>
          ) : flow.updating ? null : flow.previewError ? null : <p className={css.p} role="status">Loading.</p>}
        </>
      ) : null}

      <SourceSheet citation={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}

function CardList({ title, cards, onOpen }: { title: string; cards: FactCard[]; onOpen: (c: CitationView) => void }) {
  if (cards.length === 0) return null;
  return (
    <>
      <h4 className={css.h4}>{title}</h4>
      <ul className={css.list}>
        {cards.map((c) => (
          <FactCardView key={c.id} card={c} onOpenCitation={onOpen} />
        ))}
      </ul>
    </>
  );
}
