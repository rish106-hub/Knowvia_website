"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CitationView } from "@/lib/app-evidence";
import { buildEvidenceView } from "@/lib/app-evidence";
import { ConsentGate } from "./ConsentGate";
import { FactCardView } from "./FactCardView";
import { ArrowIcon } from "./icons";
import { Button, Notice, SourceSheet, css, cx } from "./primitives";
import { useCoverFlow } from "./useCoverFlow";
import { Waiting } from "./Waiting";

export function EvidenceScreen() {
  const { state, actions } = useCoverFlow();
  const [sheet, setSheet] = useState<CitationView | null>(null);
  const view = useMemo(
    () => (state.phase === "ready" && state.answer && (!state.handoffLoading || state.handoff) ? buildEvidenceView({ answer: state.answer, handoff: state.handoff, documents: state.documents }) : null),
    [state.phase, state.answer, state.handoff, state.handoffLoading, state.documents],
  );

  return (
    <div className={css.stackLg}>
      <div className={css.stack}>
        <h1 className={css.h1}>Your cover</h1>
        {view ? (
          <p className={cx(css.p, css.muted)}>
            Read from {view.documentsRead.length === 1 ? "1 document" : `${view.documentsRead.length} documents`}: {view.documentsRead.map((d) => d.label).join(", ")}.
          </p>
        ) : (
          <p className={cx(css.p, css.muted)}>What your document says, with the exact text it comes from.</p>
        )}
      </div>

      {state.phase === "loading" ? <p className={css.p} role="status">Loading your documents.</p> : null}

      {state.phase === "error" && state.error ? (
        <Notice tone="error" title={state.error.title} actions={state.error.recovery === "sign_in" ? <Link className={cx(css.btn, css.btnSm, css.btnSecondary)} href="/app/sign-in">Sign in</Link> : state.error.retryable ? <Button size="sm" variant="secondary" onClick={() => void actions.reload()}>Try again</Button> : null}>
          <p className={css.p}>{state.error.message}</p>
        </Notice>
      ) : null}

      {state.phase === "no_documents" ? (
        <section className={css.card} aria-labelledby="kve-empty-h" data-empty-state>
          <h2 id="kve-empty-h" className={css.h2}>There is nothing to read yet</h2>
          {state.pendingDocuments.length > 0 ? (
            <>
              <p className={css.p}>Your document is not ready to read yet. When it is, it appears here.</p>
              <ul className={css.list}>
                {state.pendingDocuments.map((d) => (
                  <li key={d.id} className={cx(css.p, css.small)}>{d.label}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className={css.p}>Add a policy document first. Then Knowvia can show you what it says and where it says it.</p>
          )}
          <div className={css.row}>
            <Link className={cx(css.btn, css.btnPrimary)} href="/app/documents">Go to your documents</Link>
          </div>
        </section>
      ) : null}

      {state.phase === "consent" ? (
        <ConsentGate
          documentCount={state.overview?.documents.filter((d) => d.stage === "readable").length ?? 1}
          notice={state.notice}
          noticeError={state.noticeError}
          granting={state.granting}
          grantError={state.grantError}
          recovered={state.recovered}
          onGrant={() => void actions.grant()}
          onRetryNotice={actions.retryNotice}
        />
      ) : null}

      {state.phase === "reading" ? <Waiting title="Reading your document" startedAt={state.startedAt} onRetry={() => void actions.readAgain()} /> : null}

      {state.phase === "read_failed" && state.error ? (
        <Notice
          tone="error"
          title={state.error.title}
          actions={
            state.error.recovery === "consent" ? (
              <Button size="sm" onClick={() => void actions.reload()}>Continue</Button>
            ) : state.error.recovery === "documents" ? (
              <Link className={cx(css.btn, css.btnSm, css.btnSecondary)} href="/app/documents">Go to your documents</Link>
            ) : state.error.recovery === "sign_in" ? (
              <Link className={cx(css.btn, css.btnSm, css.btnSecondary)} href="/app/sign-in">Sign in</Link>
            ) : state.error.recovery === "none" ? null : (
              <Button size="sm" onClick={() => void actions.readAgain()}>{state.error.recovery === "ask_again" ? "Read my document again" : "Try again"}</Button>
            )
          }
        >
          <p className={css.p}>{state.error.message}</p>
        </Notice>
      ) : null}

      {state.phase === "ready" && !view ? <p className={css.p} role="status">Checking what has been confirmed.</p> : null}

      {state.phase === "ready" && view ? (
        <>
          <div aria-live="polite" className={css.stack}>
            {state.handoffLoading ? <p className={css.p} role="status">Checking what has been confirmed.</p> : null}
            {state.reviewMessage ? <Notice tone="info" live="polite"><p className={css.p}>{state.reviewMessage}</p></Notice> : null}
          </div>

          {state.handoffError ? (
            <Notice tone="warn" title="We could not check what has been confirmed" actions={<Button size="sm" variant="secondary" onClick={() => void actions.retryHandoff()}>Try again</Button>}>
              <p className={css.p}>{state.handoffError.message} Until then, every item is shown as not yet confirmed.</p>
            </Notice>
          ) : null}

          <section className={css.stack} aria-labelledby="kve-summary-h">
            <h2 id="kve-summary-h" className={css.h2}>What we found</h2>
            <p className={css.p} data-summary>{summaryLine(view.counts)}</p>
            {view.answerNote ? <Notice tone="warn"><p className={css.p}>{view.answerNote}</p></Notice> : null}
          </section>

          {view.groups.map((group) => (
            <section key={group.id} className={css.stack} aria-labelledby={`kve-g-${group.id}`}>
              <h2 id={`kve-g-${group.id}`} className={css.h3}>{group.title}</h2>
              {group.note ? <p className={cx(css.p, css.muted)}>{group.note}</p> : null}
              {group.facts.length > 0 ? (
                <>
                  <h3 className={css.h4}>What the document says</h3>
                  <ul className={css.list}>
                    {group.facts.map((card) => (
                      <FactCardView key={card.id} card={card} onOpenCitation={setSheet} onReview={(id, d) => void actions.review(id, d)} reviewState={card.confirm ? state.review[card.confirm.factId] : undefined} />
                    ))}
                  </ul>
                </>
              ) : (
                <p className={css.p}>We could not read any specific statement from the document.</p>
              )}
              {group.notConfirmed.length > 0 ? (
                <details className={css.details} open>
                  <summary>Not confirmed ({group.notConfirmed.length})</summary>
                  <ul className={css.list}>
                    {group.notConfirmed.map((card) => (
                      <FactCardView key={card.id} card={card} onOpenCitation={setSheet} />
                    ))}
                  </ul>
                </details>
              ) : null}
            </section>
          ))}

          {view.unknowns.length > 0 ? (
            <section className={css.stack} aria-labelledby="kve-unk-h">
              <h2 id="kve-unk-h" className={css.h3}>What we could not tell</h2>
              <ul className={css.qual}>
                {view.unknowns.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className={css.stack}>
            {view.notices.map((n, i) => (
              <p key={i} className={cx(css.p, css.small, css.muted)}>{n}</p>
            ))}
            <p className={cx(css.p, css.small, css.muted)}>This reads your document. It is not a claim decision, and it does not say what your insurer will pay.</p>
          </div>

          <section className={css.next} aria-labelledby="kve-next-h">
            <span className={css.nextTag}><ArrowIcon /> Next</span>
            <h2 id="kve-next-h" className={css.nextTitle}>Say what you are checking</h2>
            <p>Pick a situation and Knowvia shows what these documents do and do not settle for it.</p>
            <div className={css.row}>
              <Link className={cx(css.btn, css.btnPrimary)} href="/app/cover/preview">See what this means for you</Link>
            </div>
          </section>
        </>
      ) : null}

      <SourceSheet citation={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}

function summaryLine(counts: Record<string, number>): string {
  const read = counts.known + counts.confirmed_by_you + counts.from_document + counts.conflicting;
  const confirmed = counts.known + counts.confirmed_by_you;
  const parts: string[] = [];
  parts.push(read === 0 ? "We could not read a specific statement from your document." : `We read ${read} ${read === 1 ? "statement" : "statements"} from your document.`);
  if (read > 0) parts.push(confirmed === 0 ? "None is confirmed yet." : `${confirmed} ${confirmed === 1 ? "is" : "are"} confirmed.`);
  if (counts.conflicting > 0) parts.push(`${counts.conflicting} ${counts.conflicting === 1 ? "disagrees" : "disagree"} with another part of your documents.`);
  if (counts.not_confirmed > 0) parts.push(`${counts.not_confirmed} ${counts.not_confirmed === 1 ? "thing is" : "things are"} not confirmed.`);
  if (counts.not_checked > 0) parts.push(`${counts.not_checked} ${counts.not_checked === 1 ? "needs" : "need"} a check we cannot do.`);
  return parts.join(" ");
}
