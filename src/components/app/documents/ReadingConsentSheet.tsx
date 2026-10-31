"use client";

import { FilePdf } from "@phosphor-icons/react";
import { forwardRef, useRef, useState } from "react";
import { appFetch, newIdempotencyKey } from "@/lib/app-client";
import type { ConsentView, DocumentView } from "@/lib/app-contract";
import { ConsentNoticeCard } from "../consent/ConsentNoticeCard";
import { useConsentNotices } from "../consent/useConsentNotices";
import { errorCopy } from "../shell/error-copy";
import { asApiError, useApp } from "../shell/session-context";
import { Button, DraftMark, Notice } from "../ui";
import { formatWhen } from "./format";
import { documentKindLabel, readingSheetLead } from "./stage";

/**
 * The one reading permission for a batch of documents (up to 10). Shown as soon as documents exist and wait for it.
 * It names exactly these documents: the BFF turns it into one exact permission per document, so it never reaches a
 * document added later. DRAFT wording, needs legal review. Nothing is sent until the person presses the button.
 */
export const ReadingConsentSheet = forwardRef<HTMLElement, { documents: DocumentView[] }>(function ReadingConsentSheet({ documents }, ref) {
  const { reloadOverview, handleError } = useApp();
  const notices = useConsentNotices(documents.length > 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  // One key per exact set of documents, kept until the grant succeeds, so a retry replays rather than duplicates.
  const keyRef = useRef<{ set: string; key: string } | null>(null);

  if (documents.length === 0) return null;
  const count = documents.length;
  const ids = documents.map((doc) => doc.id).sort();
  const set = ids.join("|");

  async function allow() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (keyRef.current?.set !== set) keyRef.current = { set, key: newIdempotencyKey() };
      await appFetch<{ consent: ConsentView }>("/consents", {
        method: "POST",
        json: { scope: "ocr_sarvam", documentIds: ids },
        headers: { "Idempotency-Key": keyRef.current.key },
      });
      keyRef.current = null;
      // The overview now holds the permission, so accepted documents move to "start reading" and are started one by one.
      await reloadOverview();
    } catch (caught) {
      if (handleError(caught)) return;
      const copy = errorCopy(asApiError(caught));
      setError({ title: copy.title, message: copy.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="kva-card" aria-labelledby="kva-reading-sheet-h" ref={ref} tabIndex={-1} data-testid="reading-consent-sheet">
      <h2 className="kva-h2" id="kva-reading-sheet-h">
        {count === 1 ? "Read this document?" : `Read these ${count} documents?`}
      </h2>
      <ConsentNoticeCard scope="ocr_sarvam" lead={readingSheetLead(count)} notices={notices} />
      <ul className="kva-list" aria-label="Documents this permission covers">
        {documents.map((doc) => {
          const when = formatWhen(doc.uploadedAt);
          return (
            <li className="kva-item" key={doc.id}>
              <FilePdf size={22} weight="regular" aria-hidden="true" />
              <div className="kva-item__text">
                <span className="kva-item__name">{documentKindLabel(doc.documentKind)}</span>
                {when ? <span className="kva-small kva-muted">Added {when}</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="kva-p kva-small kva-muted">
        This covers the documents listed here. If you add more later, CoverSaath asks again for those. You can withdraw this on the Permissions page, and CoverSaath then erases what was read from them.
      </p>
      <div>
        <DraftMark />
      </div>
      {error ? (
        <Notice tone="error" title={error.title}>
          {error.message}
        </Notice>
      ) : null}
      <Button block busy={busy} disabled={notices.state.status !== "ready"} onClick={() => void allow()}>
        {count === 1 ? "Allow and read this document" : `Allow and read these ${count} documents`}
      </Button>
    </section>
  );
});
