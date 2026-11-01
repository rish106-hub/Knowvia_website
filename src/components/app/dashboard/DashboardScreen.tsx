"use client";

import Link from "next/link";
import { Siren } from "@phosphor-icons/react";
import type { DashboardView, Overview, PassagesView } from "@/lib/app-contract";
import { PermissionWithdrawnNotice } from "../documents/PermissionWithdrawnNotice";
import { useStagePolling } from "../documents/useStagePolling";
import { errorCopy } from "../shell/error-copy";
import { useApp } from "../shell/session-context";
import { Button, Notice } from "../ui";
import { useDashboard } from "./useDashboard";
import { refreshKey, widgetLayout, type EntryMode, type WidgetId } from "./view-model";
import { W01 } from "./widgets/W01";
import { W02 } from "./widgets/W02";
import { W03 } from "./widgets/W03";
import { W04 } from "./widgets/W04";
import { W05 } from "./widgets/W05";
import { W06 } from "./widgets/W06";
import { W07 } from "./widgets/W07";
import { W09 } from "./widgets/W09";
import { W11 } from "./widgets/W11";
import { W12 } from "./widgets/W12";
import { W13 } from "./widgets/W13";
import { W14 } from "./widgets/W14";
import { W15 } from "./widgets/W15";
import { W16 } from "./widgets/W16";
import { W17 } from "./widgets/W17";
import css from "./dashboard.module.css";

/**
 * S11: the dashboard. The BFF composes everything (GET /api/app/dashboard); this screen only lays it out. In mode E (care
 * needed now) the emergency card, W14, is the first thing on it. All wording is DRAFT, FOR LEGAL AND MEDICAL REVIEW.
 */
export function DashboardScreen({ overview, mode = "P" }: { overview: Overview; mode?: EntryMode }) {
  const { updateDocument, handleError } = useApp();
  // Documents that are being read keep moving; the dashboard asks again when one changes stage.
  useStagePolling(overview.documents, { onDocument: updateDocument, onError: handleError });
  const { view, error, loading, retry, loadPassages, handleError: onError } = useDashboard(refreshKey(overview), overview.cases[0]?.id ?? null);

  if (!view) {
    if (error) {
      const copy = errorCopy(error);
      return (
        <Notice tone="error" title="Could not load your dashboard" actions={<Button size="sm" onClick={retry}>Try again</Button>}>
          {copy.message}
        </Notice>
      );
    }
    return (
      <p className="kva-p kva-muted" role="status" data-testid="dashboard-loading">
        {loading ? "Loading your dashboard." : ""}
      </p>
    );
  }

  const layout = widgetLayout(view, mode);
  const render = (id: WidgetId) => <WidgetSlot key={id} id={id} view={view} prominent={mode === "E"} loadPassages={loadPassages} onError={onError} onRetry={retry} />;

  return (
    <div className={css.page} data-mode={mode}>
      <header className={css.head}>
        <div className={css.headText}>
          <h1 className={css.h1}>Your cover, in one place</h1>
          <p className={css.lead}>Everything here comes from your own documents, with the page it came from. Nothing here is a claim decision.</p>
        </div>
        <Link href="/app/emergency" className={css.careLink}>
          <Siren size={20} weight="regular" aria-hidden="true" />
          Need care now?
        </Link>
      </header>

      <PermissionWithdrawnNotice overview={overview} />
      {view.scanNotice ? (
        <Notice tone="warning" title="Document checks are switched off" live="off">
          {view.scanNotice}
        </Notice>
      ) : null}
      {error ? (
        <Notice tone="warning" title="This page may be out of date" live="off" actions={<Button size="sm" variant="secondary" onClick={retry}>Try again</Button>}>
          {errorCopy(error).message}
        </Notice>
      ) : null}

      {layout.first.map(render)}
      <div className={css.band}>{layout.band.map(render)}</div>
      <div className={css.columns}>
        <div className={css.col}>{layout.main.map(render)}</div>
        <div className={css.col}>{layout.side.map(render)}</div>
      </div>
      <p className={css.foot} data-copy-status={view.copyStatus}>
        Wording on this page is draft and has not been through legal or medical review.
      </p>
    </div>
  );
}

function WidgetSlot({
  id,
  view,
  prominent,
  loadPassages,
  onError,
  onRetry,
}: {
  id: WidgetId;
  view: DashboardView;
  prominent: boolean;
  loadPassages: (query: string) => Promise<PassagesView>;
  onError: (error: unknown) => boolean;
  onRetry: () => void;
}) {
  const w = view.widgets;
  switch (id) {
    case "w01":
      return <W01 {...w.w01} />;
    case "w02":
      return <W02 {...w.w02} />;
    case "w03":
      return <W03 {...w.w03} />;
    case "w04":
      return <W04 {...w.w04} />;
    case "w05":
      return <W05 {...w.w05} />;
    case "w06":
      return <W06 {...w.w06} />;
    case "w07":
      return <W07 {...w.w07} />;
    case "w09":
      return <W09 {...w.w09} />;
    case "w11":
      return <W11 {...w.w11} />;
    case "w12":
      return <W12 {...w.w12} />;
    case "w13":
      return <W13 {...w.w13} />;
    case "w14":
      return <W14 {...w.w14} prominent={prominent} />;
    case "w15":
      return <W15 {...w.w15} />;
    case "w16":
      return <W16 {...w.w16} />;
    case "w17":
      return <W17 {...w.w17} loadPassages={view.caseId ? loadPassages : undefined} onError={onError} onRetry={onRetry} />;
  }
}
