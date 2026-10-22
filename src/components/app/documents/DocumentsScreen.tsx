"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";
import type { Overview } from "@/lib/app-contract";
import { sortDocuments } from "../shell/overview-utils";
import { RequireSession } from "../shell/RequireSession";
import { useApp } from "../shell/session-context";
import { ButtonLink, Notice } from "../ui";
import { DocumentRow } from "./DocumentRow";
import { PermissionWithdrawnNotice } from "./PermissionWithdrawnNotice";
import { UploadPanel } from "./UploadPanel";
import { useStagePolling } from "./useStagePolling";

export function DocumentsScreen() {
  return <RequireSession>{(overview) => <DocumentsInner overview={overview} />}</RequireSession>;
}

function DocumentsInner({ overview }: { overview: Overview }) {
  const { updateDocument, handleError } = useApp();
  // Backend documents carry no file name. Names are remembered only for files added in this browser session.
  const [names, setNames] = useState<Record<string, string>>({});
  const { stalled, restart } = useStagePolling(overview.documents, { onDocument: updateDocument, onError: handleError });
  const documents = sortDocuments(overview.documents);
  const anyReadable = documents.some((doc) => doc.stage === "readable");

  return (
    <>
      <div className="kva-stack">
        <h1 className="kva-h1">Documents</h1>
        <p className="kva-lead">Add the policy PDFs you have. Only add documents you are allowed to share.</p>
      </div>

      <PermissionWithdrawnNotice overview={overview} />

      <UploadPanel overview={overview} onAdded={(doc, filename) => setNames((current) => ({ ...current, [doc.id]: filename }))} />

      <section className="kva-section" aria-labelledby="kva-list-h">
        <h2 className="kva-h2" id="kva-list-h">
          Your documents
        </h2>
        {documents.length === 0 ? (
          <div className="kva-state-block" data-testid="empty-documents">
            <p className="kva-h3">No documents yet</p>
            <p className="kva-p kva-small kva-muted">Choose a PDF above to start. Nothing is stored until you add one.</p>
          </div>
        ) : (
          <ul className="kva-docs">
            {documents.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} localName={names[doc.id]} stalled={stalled[doc.id]} onRestartPolling={restart} />
            ))}
          </ul>
        )}
      </section>

      {anyReadable ? (
        <Notice tone="info" title="Some documents are readable" live="off" actions={<ButtonLink href="/app/cover" size="sm" variant="secondary" icon={<ArrowRight size={18} weight="bold" aria-hidden="true" />}>Continue to your cover</ButtonLink>}>
          Reading only means Knowvia has the text. It has not checked or confirmed anything from it yet.
        </Notice>
      ) : null}
    </>
  );
}
