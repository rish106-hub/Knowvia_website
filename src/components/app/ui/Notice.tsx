"use client";

import { CheckCircle, Info, Warning, WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export type NoticeTone = "info" | "success" | "warning" | "error";

const ICON = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  error: WarningCircle,
} as const;

type NoticeProps = {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
  /** error notices announce assertively by default; the rest are polite. "off" renders a plain block. */
  live?: "polite" | "assertive" | "off";
  id?: string;
};

export function Notice({ tone = "info", title, children, actions, live, id }: NoticeProps) {
  const Icon = ICON[tone];
  const mode = live ?? (tone === "error" ? "assertive" : "polite");
  const role = mode === "off" ? undefined : mode === "assertive" ? "alert" : "status";
  return (
    <div className={`kva-notice kva-notice--${tone}`} role={role} id={id} data-tone={tone}>
      <Icon size={22} weight="bold" aria-hidden="true" />
      <div className="kva-notice__body">
        {title ? <p className="kva-notice__title">{title}</p> : null}
        {children ? <div className="kva-notice__text">{children}</div> : null}
        {actions ? <div className="kva-notice__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
