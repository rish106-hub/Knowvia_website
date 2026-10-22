"use client";

import { LockKey } from "@phosphor-icons/react";
import { useState } from "react";
import { appFetch } from "@/lib/app-client";
import type { ConsentView, Overview, RevokeConsentRequest } from "@/lib/app-contract";
import { formatWhen } from "../documents/format";
import { consentTitle, revokeExplanation } from "./consent-copy";
import { asApiError, useApp } from "../shell/session-context";
import { errorCopy } from "../shell/error-copy";
import { Button, ConfirmDialog, DraftMark, Notice } from "../ui";

function revokeBody(consent: ConsentView): RevokeConsentRequest {
  if (consent.scope === "collect") return { scope: "collect" };
  if (consent.scope === "ocr_sarvam") return { scope: "ocr_sarvam", documentId: consent.documentIds[0] };
  return { scope: "question_gemini", documentIds: consent.documentIds };
}

export function PermissionsPanel({ overview }: { overview: Overview }) {
  const { reloadOverview, handleError } = useApp();
  const [target, setTarget] = useState<ConsentView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function revoke() {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      await appFetch("/consents/revoke", { method: "POST", json: revokeBody(target) });
      const title = consentTitle(target, overview.documents);
      setTarget(null);
      setDone(`Withdrawn: ${title}.`);
      await reloadOverview();
    } catch (caught) {
      if (!handleError(caught)) {
        const copy = errorCopy(asApiError(caught));
        setError({ title: copy.title, message: copy.message });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="kva-section" aria-labelledby="kva-permissions-h">
      <h2 className="kva-h2" id="kva-permissions-h">
        Permissions
      </h2>
      <p className="kva-p kva-muted kva-small">Each permission covers one thing. Knowvia asks when you take an action that needs one, and you can withdraw any of them here.</p>
      <p className="kva-sr" role="status">
        {done}
      </p>
      {done ? <Notice tone="success" live="off">{done}</Notice> : null}
      {overview.consents.length === 0 ? (
        <div className="kva-state-block">
          <p className="kva-h3">No permissions given yet</p>
          <p className="kva-p kva-small kva-muted">Nothing is stored or read until you allow it.</p>
        </div>
      ) : (
        <ul className="kva-list">
          {overview.consents.map((consent) => (
            <li className="kva-item kva-item--wrap" key={consent.grantId}>
              <LockKey size={22} weight="bold" aria-hidden="true" />
              <div className="kva-item__text">
                <span className="kva-item__name">{consentTitle(consent, overview.documents)}</span>
                <span className="kva-small kva-muted">Allowed {formatWhen(consent.grantedAt)}</span>
                <span>
                  <DraftMark />
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setError(null); setTarget(consent); }}>
                Withdraw
                <span className="kva-sr"> permission: {consentTitle(consent, overview.documents)}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={target !== null}
        title="Withdraw this permission?"
        confirmLabel="Withdraw permission"
        tone="danger"
        busy={busy}
        error={error}
        onConfirm={() => void revoke()}
        onClose={() => setTarget(null)}
      >
        {target ? (
          <div className="kva-stack">
            <p className="kva-p">
              <strong>{consentTitle(target, overview.documents)}</strong>
            </p>
            {revokeExplanation(target).map((line) => (
              <p className="kva-p" key={line}>
                {line}
              </p>
            ))}
            <div>
              <DraftMark />
            </div>
          </div>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
