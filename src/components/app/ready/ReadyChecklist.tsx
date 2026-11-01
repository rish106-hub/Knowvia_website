"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import type { Overview } from "@/lib/app-contract";
import { useDashboard } from "../dashboard/useDashboard";
import { ReviewMark } from "../dashboard/parts";
import { ChecklistItems, useTicks } from "../dashboard/widgets/W09";
import { refreshKey, tickedWords } from "../dashboard/view-model";
import { errorCopy } from "../shell/error-copy";
import { RequireSession } from "../shell/RequireSession";
import { Button, Notice } from "../ui";
import css from "../dashboard/dashboard.module.css";

/** S14: get ready for a hospital visit, for a signed-in session only. */
export function ReadyScreen() {
  return <RequireSession>{(overview) => <ReadyChecklist overview={overview} />}</RequireSession>;
}

/**
 * S14: the W09 checklist as a page. The ticks live in this screen's memory only. They are not saved anywhere, and the screen
 * says so. "From your files" means the item was found among the documents the person added. DRAFT, medical and legal review.
 */
export function ReadyChecklist({ overview }: { overview: Overview }) {
  const { view, error, loading, retry } = useDashboard(refreshKey(overview), overview.cases[0]?.id ?? null);
  const { ticked, toggle } = useTicks();
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
          <Notice tone="error" title="Could not load the checklist" actions={<Button size="sm" onClick={retry}>Try again</Button>}>
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
  const { items, note } = view.widgets.w09.data;
  const count = items.filter((item) => ticked.has(item.id)).length;
  return (
    <div className={css.pageNarrow} data-widget="w09-page">
      {back}
      <header className="kva-stack">
        <h1 className={css.pageTitle}>Get ready for a hospital visit</h1>
        <p className={css.muted}>Tick what you have. These ticks are not saved anywhere. They are gone when you leave this screen.</p>
      </header>
      <p className={css.tickLine} aria-live="polite" data-testid="tick-count">
        {tickedWords(count, items.length)}
      </p>
      <ChecklistItems items={items} ticked={ticked} onToggle={toggle} />
      <p className={css.muted}>&ldquo;Saved in your Documents&rdquo; means the item is among the documents you added. Everything else is a general list.</p>
      <p className={css.muted}>{note}</p>
      <ReviewMark />
    </div>
  );
}
