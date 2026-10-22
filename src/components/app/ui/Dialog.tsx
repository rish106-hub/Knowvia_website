"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons row. Put the safe choice first in the DOM or mark it with data-autofocus. */
  actions?: ReactNode;
  /** Escape and a click on the backdrop close the dialog unless this is true (an action is in flight). */
  locked?: boolean;
};

/**
 * Modal built on the native <dialog>: the browser traps focus, makes the page behind inert and closes on Escape.
 * Focus moves to the element marked data-autofocus (else the first control) and returns to the opener on close.
 */
export function Dialog({ open, title, onClose, children, actions, locked }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const lockedRef = useRef(Boolean(locked));
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    lockedRef.current = Boolean(locked);
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      if (!lockedRef.current) onCloseRef.current();
    };
    const handleClick = (event: MouseEvent) => {
      if (event.target === dialog && !lockedRef.current) onCloseRef.current();
    };
    // The native dialog makes the page inert but lets Tab leave through the browser UI. Wrap it so it never does.
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleClick);
    dialog.addEventListener("keydown", handleKey);
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleClick);
      dialog.removeEventListener("keydown", handleKey);
      if (dialog.open) dialog.close();
      if (opener && opener.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog ref={ref} className="kva-dialog" aria-labelledby={titleId}>
      <div className="kva-dialog__inner">
        <h2 className="kva-h2" id={titleId}>
          {title}
        </h2>
        {children}
        {actions ? <div className="kva-dialog__actions">{actions}</div> : null}
      </div>
    </dialog>
  );
}
