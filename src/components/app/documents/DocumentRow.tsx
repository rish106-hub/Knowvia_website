"use client";

import { ArrowClockwise, CircleNotch, FilePdf, Trash } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { AppApiError, appFetch } from "@/lib/app-client";
import type { DocumentView } from "@/lib/app-contract";
import { ConsentNoticeCard } from "../consent/ConsentNoticeCard";
import { useConsentNotices } from "../consent/useConsentNotices";
import { errorCopy, type ErrorCopy } from "../shell/error-copy";
import { asApiError, useApp } from "../shell/session-context";
import { Button, ConfirmDialog, Notice, StatusBadge } from "../ui";
import { formatBytes, formatWhen } from "./format";
import { documentActions, documentKindLabel, primaryActionLabel, stageInfo } from "./stage";
import type { StalledReason } from "./useStagePolling";

type RowError = { copy: ErrorCopy; retry?: () => void };

type Props = {
  doc: DocumentView;
  /** The file name, known only for files added in this browser session. */
  localName?: string;
  stalled?: StalledReason;
  onRestartPolling: (id: string) => void;
};

export function DocumentRow({ doc, localName, stalled, onRestartPolling }: Props) {
  const { updateDocument, reloadOverview, handleError } = useApp();
  const info = stageInfo(doc.stage);
  const actions = documentActions(doc);
  const kind = documentKindLabel(doc.documentKind);
  const when = formatWhen(doc.uploadedAt);
  const rowLabel = `${kind.toLowerCase()}${when ? ` added ${when}` : ""}`;

  const [busy, setBusy] = useState<null | "ocr" | "delete" | "recheck">(null);
  const [error, setError] = useState<RowError | null>(null);
  const [dialog, setDialog] = useState<null | "ocr_consent" | "delete">(null);
  const [dialogError, setDialogError] = useState<{ title: string; message: string } | null>(null);
  const notices = useConsentNotices(dialog === "ocr_consent");
  const rowRef = useRef<HTMLLIElement>(null);

  function fail(caught: unknown, retry?: () => void): ErrorCopy | null {
    if (handleError(caught)) return null;
    const copy = errorCopy(asApiError(caught));
    setError({ copy, retry });
    return copy;
  }

  async function startOcr() {
    setBusy("ocr");
    setError(null);
    try {
      const body = await appFetch<{ document: DocumentView }>(`/documents/${doc.id}/ocr`, { method: "POST" });
      updateDocument(body.document);
    } catch (caught) {
      fail(caught, () => void startOcr());
      if (caught instanceof AppApiError && (caught.code === "CONSENT_REQUIRED" || caught.code === "DOCUMENT_NOT_FOUND")) await reloadOverview();
    } finally {
      setBusy(null);
    }
  }

  async function allowAndRead() {
    setBusy("ocr");
    setDialogError(null);
    try {
      await appFetch("/consents", { method: "POST", json: { scope: "ocr_sarvam", documentId: doc.id } });
    } catch (caught) {
      setBusy(null);
      if (!handleError(caught)) {
        const copy = errorCopy(asApiError(caught));
        setDialogError({ title: copy.title, message: copy.message });
      }
      return;
    }
    setDialog(null);
    try {
      const body = await appFetch<{ document: DocumentView }>(`/documents/${doc.id}/ocr`, { method: "POST" });
      updateDocument(body.document);
    } catch (caught) {
      fail(caught, () => void startOcr());
      await reloadOverview();
    } finally {
      setBusy(null);
    }
  }

  async function deleteDocument() {
    setBusy("delete");
    setDialogError(null);
    try {
      const body = await appFetch<{ document: DocumentView }>(`/documents/${doc.id}`, { method: "DELETE" });
      updateDocument(body.document);
      setDialog(null);
      // The Delete button is about to disappear, so hand focus to the row instead of dropping it on the page.
      window.requestAnimationFrame(() => rowRef.current?.focus());
    } catch (caught) {
      if (!handleError(caught)) {
        const copy = errorCopy(asApiError(caught));
        setDialogError({ title: copy.title, message: copy.message });
      }
    } finally {
      setBusy(null);
    }
  }

  async function recheck() {
    setBusy("recheck");
    await reloadOverview();
    setBusy(null);
  }

  function onPrimary() {
    if (actions.primary === "grant_ocr_consent") {
      setDialogError(null);
      setDialog("ocr_consent");
    } else if (actions.primary) {
      void startOcr();
    }
  }

  const meta = [formatBytes(doc.byteSize), when ? `Added ${when}` : "", localName ?? ""].filter(Boolean).join(" · ");

  return (
    <li ref={rowRef} tabIndex={-1} className={`kva-doc${doc.stage === "deleted" ? " kva-doc--deleted" : ""}`} data-stage={doc.stage} data-doc-id={doc.id}>
      <div className="kva-doc__head">
        <FilePdf size={28} weight="regular" aria-hidden="true" />
        <div className="kva-doc__title">
          <span className="kva-doc__name">{kind}</span>
          <span className="kva-small kva-muted">{meta}</span>
        </div>
        <StatusBadge tone={info.tone}>{info.label}</StatusBadge>
      </div>

      <p className="kva-p kva-small" role="status">
        {info.indeterminate ? <CircleNotch size={18} weight="bold" className="kva-spin" aria-hidden="true" style={{ verticalAlign: "-3px", marginRight: 6 }} /> : null}
        {info.description}
      </p>

      {stalled && doc.stage === "processing" ? (
        <Notice
          tone="warning"
          title={stalled === "cap" ? "This is taking longer than usual" : "Could not check on this PDF"}
          actions={
            <Button size="sm" variant="secondary" icon={<ArrowClockwise size={18} weight="bold" aria-hidden="true" />} onClick={() => onRestartPolling(doc.id)}>
              Check again
            </Button>
          }
        >
          {stalled === "cap" ? "Knowvia stopped checking automatically. It may still finish." : "Knowvia could not get an update. Your PDF is not lost."}
        </Notice>
      ) : null}

      {error ? (
        <Notice
          tone="error"
          title={error.copy.title}
          actions={
            error.copy.action === "retry" && error.retry ? (
              <Button size="sm" onClick={error.retry} busy={busy === "ocr"}>
                Retry
              </Button>
            ) : error.copy.action === "reload" ? (
              <Button size="sm" variant="secondary" onClick={() => { setError(null); void reloadOverview(); }}>
                Reload
              </Button>
            ) : undefined
          }
        >
          {error.copy.message}
        </Notice>
      ) : null}

      {actions.primary || actions.canRecheck || actions.canDelete ? (
        <div className="kva-doc__actions">
          {actions.primary ? (
            <Button size="sm" busy={busy === "ocr"} onClick={onPrimary}>
              {primaryActionLabel(actions.primary)}
              <span className="kva-sr"> for {rowLabel}</span>
            </Button>
          ) : null}
          {actions.canRecheck ? (
            <Button size="sm" variant="secondary" busy={busy === "recheck"} icon={<ArrowClockwise size={18} weight="bold" aria-hidden="true" />} onClick={() => void recheck()}>
              Check again
              <span className="kva-sr"> for {rowLabel}</span>
            </Button>
          ) : null}
          {actions.canDelete ? (
            <Button size="sm" variant="danger" icon={<Trash size={18} weight="bold" aria-hidden="true" />} onClick={() => { setDialogError(null); setDialog("delete"); }}>
              Delete
              <span className="kva-sr"> {rowLabel}</span>
            </Button>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={dialog === "ocr_consent"}
        title="Let Knowvia read this PDF?"
        confirmLabel="Allow and read this PDF"
        cancelLabel="Not now"
        busy={busy === "ocr"}
        confirmDisabled={notices.state.status !== "ready"}
        error={dialogError}
        onConfirm={() => void allowAndRead()}
        onClose={() => setDialog(null)}
      >
        <ConsentNoticeCard scope="ocr_sarvam" lead={`This sends your ${rowLabel} to an outside reading service (OCR) so its text can be read. This permission covers this one PDF.`} notices={notices} />
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === "delete"}
        title="Delete this PDF?"
        confirmLabel="Delete PDF"
        tone="danger"
        busy={busy === "delete"}
        error={dialogError}
        onConfirm={() => void deleteDocument()}
        onClose={() => setDialog(null)}
      >
        <div className="kva-stack">
          <p className="kva-p">
            <strong>{rowLabel}</strong>
          </p>
          <p className="kva-p">This deletes the PDF and the text and answers Knowvia built from it. It cannot be undone.</p>
          <p className="kva-p kva-small kva-muted">Your permissions stay as they are. You can withdraw them on the Home page.</p>
        </div>
      </ConfirmDialog>
    </li>
  );
}
