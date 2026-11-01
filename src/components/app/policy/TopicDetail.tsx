"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { AppApiError } from "@/lib/app-client";
import type { DashboardTopic, DashboardTopicView, Overview, PassagesView } from "@/lib/app-contract";
import { useDashboard } from "../dashboard/useDashboard";
import { NotReadChip, StateChip } from "../dashboard/StateChip";
import { ReviewMark } from "../dashboard/parts";
import { Group } from "../dashboard/widgets/W17";
import { CONFLICT_NOTES, excludedLines, READBACK_COPY, refreshKey, topicBody } from "../dashboard/view-model";
import { errorCopy } from "../shell/error-copy";
import { asApiError } from "../shell/session-context";
import { Button, Notice } from "../ui";
import { PassageCard } from "./PassageCard";
import css from "../dashboard/dashboard.module.css";

/** S12: one topic on its own page: the plain-words explainer, what the documents say (with page and quote) and the passages. */
export function TopicDetail({ overview, topic }: { overview: Overview; topic: DashboardTopic }) {
  const caseId = overview.cases[0]?.id ?? null;
  const { view, error, loading, retry, loadPassages, handleError } = useDashboard(refreshKey(overview), caseId);

  const back = (
    <Link href="/app" className={css.backLink}>
      <ArrowLeft size={20} weight="bold" aria-hidden="true" />
      Home
    </Link>
  );

  if (!view) {
    return (
      <div className={css.pageNarrow}>
        {back}
        {error ? (
          <Notice tone="error" title="Could not load this page" actions={<Button size="sm" onClick={retry}>Try again</Button>}>
            {errorCopy(error).message}
          </Notice>
        ) : (
          <p className="kva-p kva-muted" role="status">
            {loading ? "Loading." : ""}
          </p>
        )}
      </div>
    );
  }

  const topicView = view.widgets.w17.data.topics.find((entry) => entry.topic === topic);
  if (!topicView) {
    return (
      <div className={css.pageNarrow}>
        {back}
        <Notice tone="error" title="This topic is not available">
          CoverSaath did not send this topic. Go back to Home and try again.
        </Notice>
      </div>
    );
  }
  const readback = view.widgets.w17.data.readback;
  const notice = readback === "ok" ? null : READBACK_COPY[readback];
  return (
    <div className={css.pageNarrow} data-topic-page={topic}>
      {back}
      <header className="kva-stack">
        <h1 className={css.pageTitle}>{topicView.title}</h1>
        {topicView.chip ? <StateChip state={topicView.chip.state} /> : <NotReadChip />}
      </header>
      <p className={css.explainer} data-draft-explainer>
        {topicView.explainer}
      </p>
      <ReviewMark />
      {notice ? (
        <Notice tone={notice.tone} title={notice.title} live="off" actions={readback === "unavailable" ? <Button size="sm" variant="secondary" onClick={retry}>Try again</Button> : undefined}>
          {notice.text}
        </Notice>
      ) : null}
      <TopicValues topic={topicView} />
      {topicView.enabled ? <PassageList topic={topicView} loadPassages={loadPassages} onError={handleError} excluded={excludedLines(view.widgets.w17.data.excluded)} /> : null}
      <p className={css.muted}>We show what your documents say. Only your insurer can say what applies to a claim. Nothing is chosen for you.</p>
    </div>
  );
}

function TopicValues({ topic }: { topic: DashboardTopicView }) {
  const body = topicBody(topic);
  if (body.kind === "not_read") return <p className={css.muted}>Not read yet. Once a document is read, what it says shows here.</p>;
  if (body.kind === "not_found") return <p className={css.muted}>We did not find this in the documents read so far.</p>;
  return (
    <section className="kva-stack" aria-label="What your documents say">
      {body.kind === "disagree" ? <p className={css.strong}>{CONFLICT_NOTES[body.detail]}</p> : null}
      {body.groups.map((group) => (
        <Group key={group.field} group={group} />
      ))}
    </section>
  );
}

type Passages = { status: "loading" } | { status: "ready"; passages: PassagesView } | { status: "error"; error: AppApiError };

function PassageList({ topic, loadPassages, onError, excluded }: { topic: DashboardTopicView; loadPassages: (query: string) => Promise<PassagesView>; onError: (error: unknown) => boolean; excluded: string[] }) {
  const [state, setState] = useState<Passages>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const callbacks = useRef({ loadPassages, onError });
  useEffect(() => {
    callbacks.current = { loadPassages, onError };
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const passages = await callbacks.current.loadPassages(topic.passageQuery);
        if (!cancelled) setState({ status: "ready", passages });
      } catch (error) {
        if (cancelled || callbacks.current.onError(error)) return;
        setState({ status: "error", error: asApiError(error) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topic.passageQuery, attempt]);

  return (
    <section className="kva-stack" aria-labelledby="passages-h">
      <h2 className={css.sectionTitle} id="passages-h">
        See where your documents mention this
      </h2>
      {state.status === "loading" ? (
        <p className={css.muted} role="status">
          Looking through your documents.
        </p>
      ) : null}
      {state.status === "error" ? (
        <Notice tone="error" title="Could not look for passages" live="off" actions={<Button size="sm" variant="secondary" onClick={() => { setState({ status: "loading" }); setAttempt((n) => n + 1); }}>Try again</Button>}>
          {errorCopy(state.error).message}
        </Notice>
      ) : null}
      {state.status === "ready" ? (
        <div className={css.passageList}>
          <p className={css.muted}>{state.passages.notice}</p>
          {state.passages.passages.length === 0 ? <p className={css.muted}>No passages found in the documents read so far.</p> : null}
          {state.passages.passages.map((passage) => (
            <PassageCard key={passage.clauseId} page={passage.page} heading={passage.title}>
              {passage.snippet}
            </PassageCard>
          ))}
        </div>
      ) : null}
      {excluded.length > 0 ? <p className={css.muted}>{excluded.join(". ")}.</p> : null}
    </section>
  );
}
