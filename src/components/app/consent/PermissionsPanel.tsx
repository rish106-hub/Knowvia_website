"use client";

import { LockKey } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { appFetch } from "@/lib/app-client";
import type { AppApiError } from "@/lib/app-client";
import type { PermissionList, PermissionView } from "@/lib/app-contract";
import { formatWhen } from "../documents/format";
import { permissionRevokeExplanation } from "./consent-copy";
import { RequireSession } from "../shell/RequireSession";
import { asApiError, useApp } from "../shell/session-context";
import { errorCopy } from "../shell/error-copy";
import { Button, ConfirmDialog, DraftMark, Notice } from "../ui";

type ListState =
  | { status: "loading" }
  | { status: "ready"; permissions: PermissionView[]; truncated: boolean }
  | { status: "error"; error: AppApiError };

/**
 * What the person has allowed, read from the backend list (GET /api/app/consents), with "take back" by consent id
 * (POST /api/app/consents/{id}/revoke). Labels come from the BFF; no raw scopes reach the browser. DRAFT wording.
 */
export function PermissionsPanel({ standalone = false }: { standalone?: boolean }) {
  const { reloadOverview, handleError } = useApp();
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [target, setTarget] = useState<PermissionView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    try {
      const body = await appFetch<PermissionList>("/consents");
      if (alive.current) setList({ status: "ready", permissions: body.permissions, truncated: body.truncated });
    } catch (caught) {
      if (!alive.current || handleError(caught)) return;
      setList({ status: "error", error: asApiError(caught) });
    }
  }, [handleError]);

  useEffect(() => {
    alive.current = true;
    // Deferred one tick, like the session read, so the effect itself sets no state.
    const task = window.setTimeout(() => void load(), 0);
    return () => {
      alive.current = false;
      window.clearTimeout(task);
    };
  }, [load]);

  async function revoke() {
    if (!target || busy) return;
    setBusy(true);
    setError(null);
    try {
      await appFetch(`/consents/${encodeURIComponent(target.id)}/revoke`, { method: "POST", json: {} });
      setDone(`Taken back: ${target.label}.`);
      setTarget(null);
      await Promise.all([load(), reloadOverview()]);
    } catch (caught) {
      if (handleError(caught)) return;
      const copy = errorCopy(asApiError(caught));
      setError({ title: copy.title, message: copy.message });
      // Already gone (or never ours): the list is stale, so refresh it.
      if (asApiError(caught).code === "CONSENT_NOT_FOUND") void load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="kva-section" aria-labelledby={standalone ? undefined : "kva-permissions-h"} aria-label={standalone ? "Permissions" : undefined}>
      {standalone ? null : (
        <>
          <h2 className="kva-h2" id="kva-permissions-h">
            Permissions
          </h2>
          <p className="kva-p kva-muted kva-small">Each permission covers one thing. CoverSaath asks when you take an action that needs one, and you can take any of them back here.</p>
        </>
      )}
      <p className="kva-sr" role="status">
        {done}
      </p>
      {done ? <Notice tone="success" live="off">{done}</Notice> : null}
      {list.status === "loading" ? (
        <p className="kva-p kva-muted" role="status">
          Loading what you have allowed.
        </p>
      ) : list.status === "error" ? (
        <Notice tone="error" title={errorCopy(list.error).title} actions={<Button size="sm" onClick={() => void load()}>Try again</Button>}>
          {errorCopy(list.error).message}
        </Notice>
      ) : list.permissions.length === 0 ? (
        <div className="kva-state-block" data-testid="no-permissions">
          <p className="kva-h3">No permissions given yet</p>
          <p className="kva-p kva-small kva-muted">Nothing is stored or read until you allow it.</p>
        </div>
      ) : (
        <ul className="kva-list" data-testid="permissions">
          {list.permissions.map((permission) => (
            <li className="kva-item kva-item--wrap" key={permission.id}>
              <LockKey size={22} weight="bold" aria-hidden="true" />
              <div className="kva-item__text">
                <span className="kva-item__name">{permission.label}</span>
                <span className="kva-small kva-muted">Allowed {formatWhen(permission.grantedAt)}</span>
                <span>
                  <DraftMark />
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setError(null); setTarget(permission); }}>
                Take this back
                <span className="kva-sr">: {permission.label}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
      {list.status === "ready" && list.truncated ? <p className="kva-p kva-small kva-muted">Only the newest permissions are shown.</p> : null}
      <ConfirmDialog
        open={target !== null}
        title="Take this permission back?"
        confirmLabel="Take it back"
        tone="danger"
        busy={busy}
        error={error}
        onConfirm={() => void revoke()}
        onClose={() => setTarget(null)}
      >
        {target ? (
          <div className="kva-stack">
            <p className="kva-p">
              <strong>{target.label}</strong>
            </p>
            {permissionRevokeExplanation(target.kind, target.documentIds.length).map((line) => (
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

/** S15. The same list on its own page, inside RequireSession. */
export function PermissionsScreen() {
  return (
    <RequireSession>
      {() => (
        <>
          <div className="kva-stack">
            <h1 className="kva-h1">What you have shared</h1>
            <p className="kva-lead">Everything CoverSaath is allowed to do, in one list. Take any of it back.</p>
          </div>
          <PermissionsPanel standalone />
        </>
      )}
    </RequireSession>
  );
}
