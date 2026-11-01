"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { StatusBadge, ButtonLink } from "../../ui";
import { documentKindLabel, stageInfo } from "../../documents/stage";
import { formatWhen } from "../../documents/format";
import { Card, type WidgetProps } from "../parts";
import css from "../dashboard.module.css";

/** W15: a timeline per document: when it was added, where it stands now, and how many pages were read. */
export function W15({ state, data }: WidgetProps<"w15">) {
  return (
    <Card title="Your documents, one by one" widget="w15" state={state}>
      {data.documents.length === 0 ? (
        <p className={css.muted}>No documents yet. Nothing is stored until you add one.</p>
      ) : (
        <ol className={css.timeline}>
          {data.documents.map((doc) => {
            const info = stageInfo(doc.stage);
            const when = formatWhen(doc.uploadedAt);
            return (
              <li key={doc.documentId} className={css.timelineItem}>
                <div className={css.timelineHead}>
                  <span className={css.rowStrong}>{documentKindLabel(doc.documentKind)}</span>
                  <StatusBadge tone={info.tone}>{info.label}</StatusBadge>
                </div>
                <p className={css.muted}>
                  {[when ? `Added ${when}` : null, doc.pagesLabel].filter(Boolean).join(" · ") || "Added"}
                </p>
              </li>
            );
          })}
        </ol>
      )}
      <div>
        <ButtonLink href="/app/documents" size="sm" variant="secondary" icon={<ArrowRight size={18} weight="bold" aria-hidden="true" />}>
          Go to documents
        </ButtonLink>
      </div>
    </Card>
  );
}
