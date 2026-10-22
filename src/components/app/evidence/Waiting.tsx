"use client";

import { useEffect, useState } from "react";
import { Button, css, cx } from "./primitives";

/** Honest waiting state: no percentage, no fake progress. After a while it says so and offers a retry. */
export function Waiting({ title, startedAt, onRetry }: { title: string; startedAt: number; onRetry?: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);
  const slow = elapsed >= 20;
  const veryLong = elapsed >= 75;
  return (
    <div className={cx(css.notice, css.n_wait)} role="status" aria-live="polite" data-waiting>
      <span className={css.spinner} aria-hidden="true" />
      <div>
        <p className={css.nTitle}>{title}</p>
        <p className={css.p}>This can take up to a minute. You can leave this page open.</p>
        {slow ? <p className={css.p}>Still reading. Longer documents take longer.</p> : null}
        {veryLong && onRetry ? (
          <div className={css.nActions}>
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Check again
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
