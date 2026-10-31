"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appFetch } from "@/lib/app-client";
import { errorCopy } from "../shell/error-copy";
import { RequireSession } from "../shell/RequireSession";
import { asApiError, useApp } from "../shell/session-context";
import { Button, ButtonLink, DraftMark, Notice } from "../ui";
import css from "./blocks.module.css";
import { ConnectorIconView } from "./ConnectorCard";
import { blockFor, dataWords, scopeWords } from "./registry";
import { useConnectors } from "./useConnectors";

/**
 * Consent sheet for one connector. DRAFT, needs legal review. Allow asks the BFF, which answers 501
 * CONNECTOR_NOT_AVAILABLE: no connector grants anything yet, so nothing is shared and nothing is saved.
 */
export function ConnectorSheet({ connectorId }: { connectorId: string }) {
  return <RequireSession>{() => <SheetInner connectorId={connectorId} />}</RequireSession>;
}

function SheetInner({ connectorId }: { connectorId: string }) {
  const router = useRouter();
  const { handleError } = useApp();
  const connectors = useConnectors();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ title: string; text: string } | null>(null);

  const connector = connectors.status === "ready" ? connectors.data.connectors.find((candidate) => candidate.id === connectorId) : undefined;
  const upload = connector?.availability === "available";

  useEffect(() => {
    if (upload) router.replace("/app/documents");
  }, [upload, router]);

  async function allow() {
    if (busy || !connector) return;
    setBusy(true);
    setResult(null);
    try {
      await appFetch(`/connectors/${encodeURIComponent(connector.id)}/grant`, { method: "POST", json: {} });
    } catch (caught) {
      if (!handleError(caught)) {
        const copy = errorCopy(asApiError(caught));
        setResult({ title: copy.title, text: copy.message });
      }
    } finally {
      setBusy(false);
    }
  }

  if (connectors.status === "loading" || upload) {
    return (
      <p className="kva-p kva-muted" role="status">
        Loading.
      </p>
    );
  }
  if (connectors.status === "error" || !connector) {
    return (
      <Notice tone="warning" title="That page does not exist" live="off" actions={<ButtonLink href="/app/connect" size="sm" variant="secondary">Back to the ways to add a document</ButtonLink>}>
        Nothing was shared.
      </Notice>
    );
  }

  const block = blockFor(connector);
  return (
    <div className={css.screen}>
      <div className={css.head}>
        <h1 className="kva-h1">{block.title}</h1>
        <p className="kva-lead kva-muted">{block.blurb}</p>
      </div>

      <section className={css.sheet} aria-labelledby="sheet-h">
        <ConnectorIconView icon={block.icon} size={28} />
        <h2 className="kva-h2" id="sheet-h">
          What you would be allowing
        </h2>
        <ul className={css.sheetList}>
          {connector.scopesRequested.map((code) => (
            <li key={code}>{scopeWords(code)}</li>
          ))}
        </ul>
        <h3 className="kva-h3">What CoverSaath would get</h3>
        <ul className={css.sheetList}>
          {connector.dataReturned.map((code) => (
            <li key={code}>{dataWords(code)}</li>
          ))}
        </ul>
        <p className="kva-p kva-small kva-muted">You could take this back at any time on the permissions page.</p>
        <span className={css.review}>CONSENT WORDING · LEGAL REVIEW</span>
        <DraftMark />
        <div className={css.sheetActions}>
          <Button busy={busy} onClick={() => void allow()}>
            Allow
          </Button>
          <ButtonLink href="/app/connect" variant="secondary">
            Not now
          </ButtonLink>
        </div>
        <div role="status" aria-live="polite">
          {result ? (
            <Notice tone="info" title={result.title} live="off">
              {result.text} Nothing was shared and nothing was saved.
            </Notice>
          ) : null}
        </div>
      </section>
    </div>
  );
}
