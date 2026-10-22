"use client";

import type { ConsentNotice, ConsentScope } from "@/lib/app-contract";
import { Button, DraftMark, Notice } from "../ui";
import { errorCopy } from "../shell/error-copy";
import type { useConsentNotices } from "./useConsentNotices";

type Notices = ReturnType<typeof useConsentNotices>;

/**
 * The notice for ONE action, straight from GET /consents/notices, with a visible draft marker.
 * `lead` says in plain words what this single permission does and nothing else.
 */
export function ConsentNoticeCard({ scope, lead, notices }: { scope: ConsentScope; lead: string; notices: Notices }) {
  const { state, noticeFor, retry } = notices;
  if (state.status === "loading") {
    return (
      <p className="kva-p kva-muted" role="status">
        Loading the permission wording.
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <Notice tone="error" title="Could not load the permission wording" actions={<Button size="sm" variant="secondary" onClick={retry}>Try again</Button>}>
        {errorCopy(state.error).message} Without the wording, Knowvia cannot ask for this permission.
      </Notice>
    );
  }
  const notice = noticeFor(scope);
  if (!notice) {
    return (
      <Notice tone="error" title="Permission wording missing">
        Knowvia does not have wording for this permission, so it cannot ask for it.
      </Notice>
    );
  }
  return <NoticeText notice={notice} lead={lead} />;
}

function NoticeText({ notice, lead }: { notice: ConsentNotice; lead: string }) {
  const paragraphs = notice.body.split(/\n{2,}/).filter(Boolean);
  return (
    <section className="kva-stack" aria-label={`Permission: ${notice.title}`} data-consent-scope={notice.scope}>
      <p className="kva-p">
        <strong>{lead}</strong>
      </p>
      <div className="kva-stack">
        <h3 className="kva-h3">{notice.title}</h3>
        {paragraphs.map((text, index) => (
          <p className="kva-p kva-small" key={index}>
            {text}
          </p>
        ))}
        <div className="kva-row">
          <DraftMark />
          <span className="kva-small kva-muted">Version {notice.version}</span>
        </div>
      </div>
    </section>
  );
}
