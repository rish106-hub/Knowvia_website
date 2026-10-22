"use client";

// Small primitives owned by the evidence slice: state badge, notice, quote block, source sheet, draft marker.
import { useEffect, useId, useRef, type ReactNode } from "react";
import type { CitationView, StateKind } from "@/lib/app-evidence";
import { STATE_LABELS } from "@/lib/app-evidence";
import { AlertIcon, ClockIcon, PageIcon, StateIcon } from "./icons";
import css from "./evidence.module.css";

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");
export { css };

export function StateBadge({ kind, detail }: { kind: StateKind; detail?: string | null }) {
  return (
    <span className={cx(css.badge, css[`b_${kind}`])} data-state={kind}>
      <StateIcon kind={kind} />
      {STATE_LABELS[kind]}
      {detail ? <span className={css.srOnly}>: {detail}</span> : null}
    </span>
  );
}

export function DraftMark() {
  return (
    <span className={css.draft} data-draft-mark>
      <PageIcon />
      Draft wording, pending legal review
    </span>
  );
}

export function Notice({ tone = "info", title, children, actions, live }: { tone?: "info" | "warn" | "error" | "wait"; title?: string; children?: ReactNode; actions?: ReactNode; live?: "polite" | "assertive" | "off" }) {
  const role = tone === "error" ? "alert" : live === "off" ? undefined : "status";
  return (
    <div className={cx(css.notice, css[`n_${tone}`])} role={role} aria-live={live === "off" ? undefined : live ?? (tone === "error" ? "assertive" : "polite")}>
      {tone === "error" || tone === "warn" ? <span className={css.nIcon}><AlertIcon size={20} /></span> : tone === "wait" ? <span className={css.nIcon}><ClockIcon size={20} /></span> : null}
      <div>
        {title ? <p className={css.nTitle}>{title}</p> : null}
        {children}
        {actions ? <div className={css.nActions}>{actions}</div> : null}
      </div>
    </div>
  );
}

export function Button({ children, variant = "primary", size, onClick, busy, type = "button", disabled }: { children: ReactNode; variant?: "primary" | "secondary" | "quiet"; size?: "sm"; onClick?: () => void; busy?: boolean; href?: never; type?: "button" | "submit"; disabled?: boolean }) {
  const cls = cx(css.btn, size === "sm" && css.btnSm, variant === "primary" ? css.btnPrimary : variant === "secondary" ? css.btnSecondary : css.btnQuiet);
  // aria-disabled (not disabled) while busy keeps focus where it was.
  return (
    <button type={type} className={cls} onClick={busy || disabled ? undefined : onClick} aria-disabled={busy || disabled || undefined} aria-busy={busy || undefined}>
      {children}
    </button>
  );
}

export function QuoteBlock({ quote, verbatim, clamp = true }: { quote: string; verbatim: boolean | null; clamp?: boolean }) {
  return (
    <div>
      <blockquote className={cx(css.quote, clamp && css.quoteClamp, !clamp && css.quoteFull)}>{quote}</blockquote>
      {verbatim === false ? <p className={cx(css.cap, css.p)}>Some personal details in this text are hidden for privacy.</p> : null}
    </div>
  );
}

/**
 * Citation "source sheet": a modal dialog with the quote, document and page. There is no route that serves the PDF, so
 * nothing here opens or links to the file. Native <dialog>: focus is moved in, the background is inert, Escape closes,
 * and focus is returned to the control that opened it.
 */
export function SourceSheet({ citation, onClose }: { citation: CitationView | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const open = citation !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleClose() {
    onClose();
    const el = returnTo.current;
    returnTo.current = null;
    if (el && document.contains(el)) el.focus();
  }

  return (
    <dialog
      ref={ref}
      className={css.sheet}
      aria-labelledby={titleId}
      onClose={handleClose}
      onKeyDown={(e) => {
        // Keep Tab inside the dialog (a native modal can otherwise hand focus to the browser chrome).
        if (e.key !== "Tab" || !ref.current) return;
        const focusable = [...ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close(); // a click on the backdrop
      }}
    >
      {citation ? (
        <div className={css.sheetBody}>
          <h2 id={titleId} className={css.h2}>From your document</h2>
          <p className={css.p}>
            <strong>{citation.documentLabel}</strong>, {citation.pageLabel}
          </p>
          {citation.quote ? <QuoteBlock quote={citation.quote} verbatim={citation.verbatim} clamp={false} /> : <p className={css.p}>We do not have the exact text for this reference.</p>}
          {citation.clauseId ? <p className={cx(css.p, css.cap)}>Reference: {citation.clauseId}</p> : null}
          <p className={cx(css.p, css.cap)}>This is the text we read from your document. We cannot open the original file here, so check it against your own copy.</p>
          <div className={css.row}>
            <Button variant="secondary" onClick={() => ref.current?.close()}>Close</Button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
