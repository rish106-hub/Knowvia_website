"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Notice } from "./Notice";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  /** Greys the confirm button, e.g. while the wording to confirm has not loaded. */
  confirmDisabled?: boolean;
  /** Recoverable error from the last attempt. Shown inside the dialog so the choice stays in view. */
  error?: { title: string; message: string } | null;
  onConfirm: () => void;
  onClose: () => void;
};

/** One question, one action. Cancel takes the initial focus so a stray Enter never confirms. */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = "Cancel", tone = "primary", busy, confirmDisabled, error, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      locked={busy}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy} data-autofocus="">
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger-solid" : "primary"} size="sm" busy={busy} disabled={confirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {error ? (
        <Notice tone="error" title={error.title}>
          {error.message}
        </Notice>
      ) : null}
    </Dialog>
  );
}
