"use client";

import type { ConsentNotice } from "@/lib/app-contract";
import type { ErrorView } from "@/lib/app-evidence";
import { Button, DraftMark, Notice, css, cx } from "./primitives";

type Props = {
  documentCount: number;
  notice: ConsentNotice | null;
  noticeError: ErrorView | null;
  granting: boolean;
  grantError: ErrorView | null;
  recovered: boolean;
  onGrant: () => void;
  onRetryNotice: () => void;
};

/** Question-time consent (scope question_gemini). All wording here and in the server notice is DRAFT: legal review. */
export function ConsentGate({ documentCount, notice, noticeError, granting, grantError, recovered, onGrant, onRetryNotice }: Props) {
  return (
    <section className={css.stack} aria-labelledby="kve-consent-h">
      {recovered ? (
        <Notice tone="warn" title="Your earlier answer is gone">
          <p className={css.p}>Permission for this document ended or was withdrawn, so the answer made from it is no longer kept. Nothing from it is shown.</p>
        </Notice>
      ) : null}
      <div className={cx(css.card)}>
        <DraftMark />
        <h2 id="kve-consent-h" className={css.h2}>Before we read {documentCount === 1 ? "your document" : "your documents"}</h2>
        <p className={css.p}>
          To answer from your document, Knowvia sends <strong>text from it to Gemini</strong>, a Google service, which reads it and quotes the parts it relies on. This happens only if you agree.
        </p>
        <p className={css.p}>You can withdraw this later from your home page. If you do, the answer made from your document is erased.</p>
        {notice ? (
          <div className={css.stack}>
            <h3 className={css.h4}>{notice.title}</h3>
            <p className={cx(css.p, css.small)}>{notice.body}</p>
          </div>
        ) : noticeError ? (
          <Notice tone="error" title="We could not load the permission notice" actions={<Button size="sm" variant="secondary" onClick={onRetryNotice}>Try again</Button>}>
            <p className={css.p}>{noticeError.message}</p>
          </Notice>
        ) : (
          <p className={cx(css.p, css.muted)} role="status">Loading the notice.</p>
        )}
        {grantError ? (
          <Notice tone="error" title={grantError.title}>
            <p className={css.p}>{grantError.message}</p>
          </Notice>
        ) : null}
        <div className={css.row}>
          <Button busy={granting} disabled={!notice} onClick={onGrant}>
            {granting ? "Saving your permission" : "I agree, read my document"}
          </Button>
        </div>
      </div>
    </section>
  );
}
