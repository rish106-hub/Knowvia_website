"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { track } from "@/lib/analytics/client";
import { useConsent } from "@/components/consent/ConsentProvider";

// A deterministic navigation helper. Fixed destinations only: no free text, no model, no data collection.
const guideActions = [
  { href: "/for-families", label: "For families", hint: "See a household example", audience: "family" },
  { href: "/for-employers", label: "For HR", hint: "See a team example", audience: "team" },
  { href: "/how-it-works", label: "How it works", hint: "From documents to a next action" },
  { href: "/blog", label: "Latest guides", hint: "Plain answers with sources" },
] as const;

export function KnowviaGuide() {
  const { decided } = useConsent();
  const pathname = usePathname();
  // The panel belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstActionRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenOn(null);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The consent banner owns the bottom of the screen until a choice is made.
  if (!decided || pathname === "/confirm" || pathname === "/unsubscribe") return null;

  return (
    <div className="guide" data-open={open}>
      {open && (
        <nav id={panelId} className="guide-panel" aria-label="Knowvia guide">
          <div className="guide-panel-head">
            <p className="guide-title">Where would you like to go?</p>
            <button
              type="button"
              className="icon-button guide-close"
              aria-label="Close guide"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
          <ul>
            {guideActions.map((action, index) => (
              <li key={action.href}>
                <Link
                  ref={index === 0 ? firstActionRef : undefined}
                  href={action.href}
                  onClick={() => {
                    if ("audience" in action) track("audience_selected", { audience: action.audience, surface: "guide" });
                  }}
                >
                  <span className="guide-action-label">{action.label}</span>
                  <span className="guide-action-hint">{action.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="guide-footnote">
            The guide only links to pages on this site. It does not read your policy or answer coverage questions.
          </p>
        </nav>
      )}
      <button
        ref={triggerRef}
        type="button"
        className="guide-trigger"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => {
          if (!open) track("guide_opened", {});
          setOpen(!open);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/knowvia-mark.svg" alt="" width={28} height={28} />
        <span className="guide-trigger-label">{open ? "Close guide" : "Guide"}</span>
      </button>
    </div>
  );
}
