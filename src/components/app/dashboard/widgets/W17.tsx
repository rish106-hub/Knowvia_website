"use client";

import Link from "next/link";
import { ArrowRight, CaretDown, CaretUp, MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import type { AppApiError } from "@/lib/app-client";
import type { DashboardTopicView, PassagesView } from "@/lib/app-contract";
import { errorCopy } from "../../shell/error-copy";
import { asApiError } from "../../shell/session-context";
import { Button, Notice } from "../../ui";
import { NotReadChip, StateChip } from "../StateChip";
import { PassageCard, ReviewMark, type WidgetProps } from "../parts";
import { CONFLICT_NOTES, clipQuote, excludedLines, READBACK_COPY, sourceLine, topicBody, topicCanShowPassages, type ValueGroup } from "../view-model";
import css from "../dashboard.module.css";

type Props = WidgetProps<"w17"> & {
  /** Asks for the passages behind a topic (GET /api/app/cases/{caseId}/passages). Absent: the button is not offered. */
  loadPassages?: (query: string) => Promise<PassagesView>;
  /** Returns true when the error was a session error (the app signs out and redirects). */
  onError?: (error: unknown) => boolean;
  onRetry?: () => void;
  /** Where a topic's own page is (S12). Absent: no link (the demo has no such page). */
  detailHref?: (topic: DashboardTopicView["topic"]) => string;
};

/**
 * W17: one card per topic. Each has the plain-words explainer, what the documents say (value, chip, page, quote of 160
 * characters or fewer) and "See where your documents mention this". All of it is read by a rule and not checked.
 * Branches: empty ("Not read yet" chips), partial/full (values), conflicting (both values and "Your documents disagree").
 */
export function W17({ state, data, loadPassages, onError, onRetry, detailHref }: Props) {
  const notice = data.readback === "ok" ? null : READBACK_COPY[data.readback];
  const excluded = data.readback === "ok" ? excludedLines(data.excluded) : [];
  return (
    <section className={css.topicsSection} aria-labelledby="w17-h" data-widget="w17" data-widget-state={state} data-readback={data.readback}>
      <div className={css.cardHead}>
        <h2 className={css.sectionTitle} id="w17-h">
          What your documents say
        </h2>
        <ReviewMark />
      </div>
      {data.readback === "ok" && data.notice ? <p className={css.muted}>{data.notice}</p> : null}
      {notice ? (
        <Notice tone={notice.tone} title={notice.title} live="off" actions={data.readback === "unavailable" && onRetry ? <Button size="sm" variant="secondary" onClick={onRetry}>Try again</Button> : undefined}>
          {notice.text}
        </Notice>
      ) : null}
      {data.readback === "none" ? <p className={css.muted}>Nothing has been read yet. Once a document is read, what it says shows here, with the page it came from.</p> : null}
      {excluded.length > 0 ? (
        <p className={css.muted} data-testid="w17-excluded">
          {excluded.join(". ")}.
        </p>
      ) : null}
      <ul className={css.topics}>
        {data.topics.map((topic) => (
          <li key={topic.topic}>
            <TopicCard topic={topic} loadPassages={loadPassages} onError={onError} detailHref={detailHref} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TopicCard({ topic, loadPassages, onError, detailHref }: { topic: DashboardTopicView; loadPassages: Props["loadPassages"]; onError: Props["onError"]; detailHref: Props["detailHref"] }) {
  const body = topicBody(topic);
  const headId = useId();
  return (
    <article className={`${css.topic} ${body.kind === "disagree" ? css.topicDisagree : ""}`} aria-labelledby={headId} data-topic={topic.topic} data-topic-state={topic.chip?.state ?? "not_read"}>
      <div className={css.topicHead}>
        <h3 className={css.topicTitle} id={headId}>
          {topic.title}
        </h3>
        {topic.chip ? <StateChip state={topic.chip.state} /> : <NotReadChip />}
      </div>
      <p className={css.explainer} data-draft-explainer>
        {topic.explainer}
      </p>

      {body.kind === "not_read" ? <p className={css.muted}>Not read yet.</p> : null}
      {body.kind === "not_found" ? <p className={css.muted}>We did not find this in the documents read so far.</p> : null}
      {body.kind === "read" ? body.groups.map((group) => <Group key={group.field} group={group} />) : null}
      {body.kind === "disagree" ? (
        <>
          <p className={css.strong}>{CONFLICT_NOTES[body.detail]}</p>
          {body.groups.map((group) => (
            <Group key={group.field} group={group} />
          ))}
        </>
      ) : null}

      {loadPassages && topicCanShowPassages(topic) ? <Passages topic={topic} loadPassages={loadPassages} onError={onError} /> : null}
      {detailHref && topic.enabled ? (
        <Link href={detailHref(topic.topic)} className={css.detailLink}>
          Open {topic.title.toLowerCase()} on its own page
          <ArrowRight size={18} weight="bold" aria-hidden="true" />
        </Link>
      ) : null}
    </article>
  );
}

export function Group({ group }: { group: ValueGroup }) {
  return (
    <div className={css.group}>
      <span className={css.lab}>{group.label}</span>
      <div className={group.entries.length > 1 ? css.valueGrid : css.valueSingle}>
        {group.entries.map((entry, index) => {
          const quote = clipQuote(entry.quote);
          return (
            <div key={`${entry.documentId}-${index}`} className={css.valueBox}>
              <span className={css.valueLarge}>{entry.value}</span>
              <span className={css.muted}>{sourceLine(entry)}</span>
              {quote ? <PassageCard page={entry.page}>{`“${quote}”`}</PassageCard> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type PassageState = { status: "closed" } | { status: "loading" } | { status: "ready"; passages: PassagesView } | { status: "error"; error: AppApiError };

function Passages({ topic, loadPassages, onError }: { topic: DashboardTopicView; loadPassages: NonNullable<Props["loadPassages"]>; onError: Props["onError"] }) {
  const [state, setState] = useState<PassageState>({ status: "closed" });
  const alive = useRef(true);
  const regionId = useId();
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function open() {
    setState({ status: "loading" });
    try {
      const passages = await loadPassages(topic.passageQuery);
      if (alive.current) setState({ status: "ready", passages });
    } catch (error) {
      if (!alive.current || onError?.(error)) return;
      setState({ status: "error", error: asApiError(error) });
    }
  }
  const isOpen = state.status !== "closed";
  return (
    <div className={css.passages}>
      <button type="button" className={css.disclosure} aria-expanded={isOpen} aria-controls={regionId} onClick={() => (isOpen ? setState({ status: "closed" }) : void open())}>
        <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
        <span>See where your documents mention this</span>
        {isOpen ? <CaretUp size={18} weight="bold" aria-hidden="true" /> : <CaretDown size={18} weight="bold" aria-hidden="true" />}
      </button>
      <div id={regionId} className={css.passagesBody} hidden={!isOpen}>
        {state.status === "loading" ? (
          <p className={css.muted} role="status">
            Looking through your documents.
          </p>
        ) : null}
        {state.status === "error" ? (
          <Notice tone="error" title="Could not look for passages" live="off" actions={<Button size="sm" variant="secondary" onClick={() => void open()}>Try again</Button>}>
            {errorCopy(state.error).message}
          </Notice>
        ) : null}
        {state.status === "ready" ? (
          <>
            <p className={css.muted}>{state.passages.notice}</p>
            {state.passages.passages.length === 0 ? <p className={css.muted}>No passages found in the documents read so far.</p> : null}
            {state.passages.passages.map((passage) => (
              <PassageCard key={passage.clauseId} page={passage.page} heading={passage.title}>
                {passage.snippet}
              </PassageCard>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
