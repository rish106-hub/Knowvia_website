"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { errorCopy } from "../shell/error-copy";
import { RequireSession } from "../shell/RequireSession";
import { Button, Notice } from "../ui";
import css from "./blocks.module.css";
import { ConnectorCard } from "./ConnectorCard";
import { groupConnectors, onlyUpload } from "./registry";
import { useConnectors } from "./useConnectors";
import { VoiceBlockSlot } from "./VoiceBlockSlot";

/** S05. Driven by the connector list the BFF returns. A real user gets upload only, so this screen is skipped for them. */
export function ConnectScreen() {
  return <RequireSession>{() => <ConnectInner />}</RequireSession>;
}

function ConnectInner() {
  const router = useRouter();
  const connectors = useConnectors();
  const skip = connectors.status === "ready" && onlyUpload(connectors.data.connectors);

  useEffect(() => {
    if (skip) router.replace("/app/documents");
  }, [skip, router]);

  if (connectors.status === "loading" || skip) {
    return (
      <p className="kva-p kva-muted" role="status">
        {skip ? "Taking you to your documents." : "Loading the ways to add a document."}
      </p>
    );
  }
  if (connectors.status === "error") {
    const copy = errorCopy(connectors.error);
    return (
      <Notice tone="error" title={copy.title} actions={<Button size="sm" onClick={connectors.retry}>Try again</Button>}>
        {copy.message}
      </Notice>
    );
  }

  const groups = groupConnectors(connectors.data.connectors);
  const rows = groups.soon;
  return (
    <div className={css.screen}>
      <div className={css.head}>
        <h1 className="kva-h1">Bring your policies in. Pick the easiest.</h1>
        <p className="kva-lead kva-muted">Most people just upload a PDF. You can add more any time.</p>
      </div>

      {groups.now.map((connector) => (
        <ConnectorCard key={connector.id} connector={connector} variant="primary" />
      ))}

      {rows.length > 0 ? (
        <ul className={css.panel} aria-label="Other ways to add a document">
          {rows.map((connector) => (
            <li key={connector.id}>{connector.id === "voice" ? <VoiceBlockSlot connector={connector} /> : <ConnectorCard connector={connector} variant="row" />}</li>
          ))}
        </ul>
      ) : null}

      {groups.later.length > 0 ? (
        <section className={css.group} aria-labelledby="connect-later-h">
          <h2 className={css.groupTitle} id="connect-later-h">
            More ways, on the way
          </h2>
          <ul className={`${css.panel} ${css.panelLater}`}>
            {groups.later.map((connector) => (
              <li key={connector.id}>
                <ConnectorCard connector={connector} variant="row" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {connectors.data.demo ? <p className="kva-p kva-small kva-muted">Demo preview: the extra ways above are shown so you can see the plan. None of them works yet.</p> : null}
    </div>
  );
}

