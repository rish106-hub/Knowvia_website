"use client";

import { FilePdf, UploadSimple, WarningCircle, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { appFetch, newIdempotencyKey } from "@/lib/app-client";
import type { ConsentView, DocumentKind, DocumentView, Overview } from "@/lib/app-contract";
import { ConsentNoticeCard } from "../consent/ConsentNoticeCard";
import { useConsentNotices } from "../consent/useConsentNotices";
import { errorCopy, type ErrorCopy } from "../shell/error-copy";
import { caseIdOf, collectGrant } from "../shell/overview-utils";
import { asApiError, useApp } from "../shell/session-context";
import { Button, Notice } from "../ui";
import { formatBytes } from "./format";
import { precheckPdf } from "./precheck";
import { KIND_CHOICES } from "./stage";

type ProductFlowReadiness = {
  productFlow: {
    ready: boolean;
    missing: string[];
  };
};

const READINESS_LABELS: Record<string, string> = {
  encryptedDocumentStorage: "Encrypted document storage",
  malwareScanning: "Malware scanning",
  ocrProvider: "PDF text reading",
  policyEvidence: "Policy evidence analysis",
  liveAi: "AI model configuration",
};

type Phase =
  | { name: "idle" }
  | { name: "working"; step: "case" | "consent" | "upload" }
  | { name: "failed"; copy: ErrorCopy }
  | { name: "added"; filename: string };

const STEP_TEXT = {
  case: "Setting up your case.",
  consent: "Saving your permission.",
  upload: "Uploading",
} as const;

export function UploadPanel({ overview, onAdded }: { overview: Overview; onAdded: (doc: DocumentView, filename: string) => void }) {
  const { updateDocument, reloadOverview, handleError } = useApp();
  const caseId = caseIdOf(overview);
  const grant = collectGrant(overview);
  const notices = useConsentNotices(!grant);

  const [kind, setKind] = useState<DocumentKind | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [kindError, setKindError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<{ name: string; message: string } | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [dragging, setDragging] = useState(false);
  const [productFlow, setProductFlow] = useState<ProductFlowReadiness | null>(null);
  const [readinessError, setReadinessError] = useState(false);
  const [readinessLoading, setReadinessLoading] = useState(true);
  const [readinessRetry, setReadinessRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setReadinessLoading(true);
    setReadinessError(false);
    appFetch<ProductFlowReadiness>("/integrations")
      .then((status) => {
        if (active) setProductFlow(status);
      })
      .catch((caught) => {
        if (!active) return;
        if (!handleError(caught)) setReadinessError(true);
      })
      .finally(() => {
        if (active) setReadinessLoading(false);
      });
    return () => {
      active = false;
    };
  }, [handleError, readinessRetry]);

  const productFlowReady = productFlow?.productFlow.ready === true;
  const missingReadiness = (productFlow?.productFlow.missing ?? []).map((key) => READINESS_LABELS[key] ?? key);
  // One Idempotency-Key per (file, kind). Retrying the same upload reuses it so the backend can replay, not duplicate.
  const keyRef = useRef<string | null>(null);
  const running = useRef(false);
  // Setup that already succeeded (case, collect grant) is kept across retries so a retry only repeats what failed.
  const setupRef = useRef<{ caseId?: string; grantId?: string; consentKey?: string }>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const kindRef = useRef<HTMLFieldSetElement>(null);

  async function choose(candidate: File | undefined | null) {
    if (!candidate) return;
    setPhase({ name: "idle" });
    const check = await precheckPdf(candidate);
    if (!check.ok) {
      setFile(null);
      keyRef.current = null;
      setFileError({ name: candidate.name, message: check.message });
      return;
    }
    setFileError(null);
    setFile(candidate);
    keyRef.current = newIdempotencyKey();
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    void choose(picked);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void choose(event.dataTransfer.files?.[0]);
  }

  function pickKind(next: DocumentKind) {
    setKind(next);
    setKindError(null);
    if (file) keyRef.current = newIdempotencyKey();
  }

  function clearFile() {
    setFile(null);
    keyRef.current = null;
    setPhase({ name: "idle" });
    inputRef.current?.focus();
  }

  async function submit() {
    if (running.current) return;
    if (!kind) {
      setKindError("Choose what kind of document this is.");
      kindRef.current?.querySelector<HTMLInputElement>("input")?.focus();
      return;
    }
    if (!file || !keyRef.current) {
      setFileError({ name: "", message: "Choose a PDF to add." });
      inputRef.current?.focus();
      return;
    }
    const key = keyRef.current;
    running.current = true;
    try {
      let activeCase = caseId ?? setupRef.current.caseId;
      if (!activeCase) {
        setPhase({ name: "working", step: "case" });
        activeCase = (await appFetch<{ caseId: string }>("/cases", { method: "POST", json: {} })).caseId;
        setupRef.current.caseId = activeCase;
      }
      let grantId = grant?.grantId ?? setupRef.current.grantId;
      if (!grantId) {
        setPhase({ name: "working", step: "consent" });
        setupRef.current.consentKey ??= newIdempotencyKey();
        const granted = await appFetch<{ consent: ConsentView }>("/consents", {
          method: "POST",
          json: { scope: "collect" },
          headers: { "Idempotency-Key": setupRef.current.consentKey },
        });
        grantId = granted.consent.grantId;
        setupRef.current.grantId = grantId;
      }
      setPhase({ name: "working", step: "upload" });
      const result = await appFetch<{ document: DocumentView; idempotentReplay: boolean }>(`/cases/${activeCase}/documents`, {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": "application/pdf",
          "Idempotency-Key": key,
          "X-Document-Kind": kind,
          "X-Consent-Grant-Id": grantId,
          "X-Filename": encodeURIComponent(file.name),
        },
      });
      updateDocument(result.document);
      onAdded(result.document, file.name);
      setPhase({ name: "added", filename: file.name });
      setFile(null);
      keyRef.current = null;
      void reloadOverview();
    } catch (caught) {
      if (handleError(caught)) return;
      const copy = errorCopy(asApiError(caught));
      if (asApiError(caught).code === "CONSENT_SCOPE_REQUIRED") setupRef.current.grantId = undefined;
      if (copy.action === "choose_again") {
        setFile(null);
        keyRef.current = null;
      }
      setPhase({ name: "failed", copy });
      if (copy.action === "reload") void reloadOverview();
    } finally {
      running.current = false;
    }
  }

  const working = phase.name === "working";
  const needsConsent = !grant;
  const waitingForWording = needsConsent && notices.state.status !== "ready";
  const addLabel = needsConsent ? "Allow and add this PDF" : "Add this PDF";

  return (
    <section className="kva-card" aria-labelledby="kva-upload-h">
      <h2 className="kva-h2" id="kva-upload-h">
        Add a PDF
      </h2>

      {readinessLoading ? (
        <p className="kva-p kva-small kva-muted" role="status">Checking whether secure document reading is available.</p>
      ) : null}
      {readinessError ? (
        <Notice
          tone="warning"
          title="We could not check document processing"
          actions={<Button size="sm" variant="secondary" onClick={() => setReadinessRetry((value) => value + 1)}>Check again</Button>}
        >
          Upload is paused until Knowvia can confirm that the document-to-reading flow is available.
        </Notice>
      ) : null}
      {!readinessLoading && !readinessError && productFlow && !productFlowReady ? (
        <Notice tone="warning" title="Policy reading is not ready yet">
          <p className="kva-p">Your PDF should not be uploaded yet. These required services are not ready:</p>
          <ul className="kva-list">
            {missingReadiness.map((item) => <li className="kva-item" key={item}>{item}</li>)}
          </ul>
          <p className="kva-p kva-small">Your existing documents are not affected. This check does not depend on the external FSS catalogue.</p>
        </Notice>
      ) : null}

      <fieldset className={`kva-choices${kindError ? " kva-choices--error" : ""}`} ref={kindRef} aria-describedby={kindError ? "kva-kind-error" : undefined}>
        <legend>What kind of document is it?</legend>
        {KIND_CHOICES.map((choice) => (
          <label className="kva-choice" key={choice.value}>
            <input type="radio" name="document-kind" value={choice.value} checked={kind === choice.value} onChange={() => pickKind(choice.value)} />
            <span>
              <span className="kva-choice__name">{choice.label}</span>
              <span className="kva-choice__hint">{choice.hint}</span>
            </span>
          </label>
        ))}
        {kindError ? (
          <p className="kva-field-error" id="kva-kind-error" role="alert">
            <WarningCircle size={20} weight="bold" aria-hidden="true" />
            <span>{kindError}</span>
          </p>
        ) : null}
      </fieldset>

      <div
        className={`kva-drop${dragging ? " kva-drop--active" : ""}${fileError ? " kva-drop--error" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <UploadSimple size={28} weight="regular" aria-hidden="true" color="var(--kv-tide)" />
        <p className="kva-drop__title">Drop a PDF here, or choose a file</p>
        <p className="kva-p kva-muted kva-small" id="kva-file-hint">
          PDF, up to 15 MB each
        </p>
        <input ref={inputRef} id="kva-file" className="kva-file-input" type="file" accept=".pdf,application/pdf" aria-describedby="kva-file-hint" onChange={onInput} />
        <label className="kva-file-label" htmlFor="kva-file">
          Choose a file
        </label>
      </div>

      {fileError ? (
        <p className="kva-field-error" role="alert">
          <WarningCircle size={20} weight="bold" aria-hidden="true" />
          <span>
            {fileError.name ? <strong>{fileError.name}: </strong> : null}
            {fileError.message}
          </span>
        </p>
      ) : null}

      {file ? (
        <div className="kva-chosen" data-testid="chosen-file">
          <FilePdf size={24} aria-hidden="true" color="var(--kv-tide)" />
          <div className="kva-chosen__text">
            <span className="kva-chosen__name">{file.name}</span>
            <span className="kva-small kva-muted">{formatBytes(file.size)}</span>
          </div>
          <Button variant="quiet" size="sm" aria-label={`Remove ${file.name}`} onClick={clearFile} disabled={working}>
            <X size={18} weight="bold" aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      {needsConsent ? (
        <div className="kva-card" style={{ background: "var(--kv-mist)" }}>
          <ConsentNoticeCard
            scope="collect"
            lead="Adding a PDF means Knowvia stores it for your case. This permission covers the PDFs you add until you withdraw it on the Home page."
            notices={notices}
          />
        </div>
      ) : (
        <p className="kva-p kva-small kva-muted">You have allowed Knowvia to store the PDFs you add. You can withdraw that on the Home page.</p>
      )}

      <div role="status" aria-live="polite">
        {phase.name === "working" ? (
          <Notice tone="info" live="off">
            {phase.step === "upload" && file ? `${STEP_TEXT.upload} ${file.name}.` : STEP_TEXT[phase.step]}
          </Notice>
        ) : null}
        {phase.name === "added" ? (
          <Notice tone="success" live="off" title="PDF added">
            {phase.filename} is in your list below.
          </Notice>
        ) : null}
      </div>

      {phase.name === "failed" ? (
        <Notice
          tone="error"
          title={phase.copy.title}
          actions={
            phase.copy.action === "retry" && file ? (
              <Button size="sm" onClick={() => void submit()}>
                Retry
              </Button>
            ) : undefined
          }
        >
          {phase.copy.message}
        </Notice>
      ) : null}

      <Button block busy={working} disabled={waitingForWording || readinessLoading || readinessError || !productFlowReady} onClick={() => void submit()}>
        {addLabel}
      </Button>
    </section>
  );
}
