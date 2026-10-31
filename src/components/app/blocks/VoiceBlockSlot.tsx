"use client";

import { useState } from "react";
import type { ConnectorView } from "@/lib/app-contract";
import { appFetch } from "@/lib/app-client";
import { errorCopy } from "../shell/error-copy";
import { asApiError } from "../shell/session-context";
import { Notice } from "../ui";
import css from "./blocks.module.css";
import { AvailabilityChip, ConnectorIconView } from "./ConnectorCard";
import { blockFor } from "./registry";

/**
 * The voice slot. Pressing it asks the BFF, which answers 501 VOICE_INTAKE_NOT_IMPLEMENTED. The browser never asks for
 * the microphone: nothing is recorded, stored or sent anywhere.
 */
export function VoiceBlockSlot({ connector }: { connector: ConnectorView }) {
  const block = blockFor(connector);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ title: string; text: string } | null>(null);

  async function press() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await appFetch("/voice-intake", { method: "POST", json: {} });
    } catch (caught) {
      const copy = errorCopy(asApiError(caught));
      setMessage({ title: copy.title, text: copy.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={css.slot} data-testid="connector-voice">
      <button type="button" className={css.row} onClick={() => void press()} aria-disabled={busy || undefined} aria-busy={busy || undefined}>
        <ConnectorIconView icon={block.icon} size={24} />
        <span className={css.rowText}>
          <span className={css.rowTitle}>{block.title}</span>
          <span className={css.rowHint}>{block.blurb}</span>
        </span>
        <AvailabilityChip availability={connector.availability} />
      </button>
      <div role="status" aria-live="polite">
        {message ? (
          <Notice tone="info" title={message.title} live="off">
            {message.text} Nothing was recorded.
          </Notice>
        ) : null}
      </div>
    </div>
  );
}
