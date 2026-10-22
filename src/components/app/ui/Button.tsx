"use client";

import Link from "next/link";
import { CircleNotch } from "@phosphor-icons/react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger" | "danger-solid";
export type ButtonSize = "md" | "sm";

type Common = { variant?: ButtonVariant; size?: ButtonSize; icon?: ReactNode; block?: boolean };

function classes(variant: ButtonVariant, size: ButtonSize, block: boolean | undefined, extra?: string) {
  return ["kva-btn", `kva-btn--${variant}`, size === "sm" ? "kva-btn--sm" : "", block ? "kva-btn--block" : "", extra ?? ""]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean };

/** Pill button. `busy` keeps focus on the button (aria-disabled, clicks ignored) instead of dropping it with `disabled`. */
export function Button({ variant = "primary", size = "md", icon, block, busy, className, type = "button", onClick, children, ...rest }: ButtonProps) {
  const inert = Boolean(busy);
  return (
    <button
      {...rest}
      type={type}
      className={classes(variant, size, block, className)}
      aria-disabled={inert || rest["aria-disabled"] ? true : undefined}
      aria-busy={busy ? true : undefined}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (inert) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {busy ? <CircleNotch size={20} weight="bold" className="kva-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = Common & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export function ButtonLink({ variant = "primary", size = "md", icon, block, className, href, children, ...rest }: ButtonLinkProps) {
  return (
    <Link {...rest} href={href} className={classes(variant, size, block, className)}>
      {icon}
      {children}
    </Link>
  );
}
