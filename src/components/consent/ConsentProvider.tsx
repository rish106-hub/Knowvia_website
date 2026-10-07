"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { applyConsent, markConsentUndecided, track } from "@/lib/analytics/client";
import {
  ACCEPT_ALL,
  REJECT_ALL,
  createConsentRecord,
  parseConsentCookie,
  serializeConsentCookie,
  type ConsentChoice,
  type ConsentRecord,
} from "@/lib/consent/consent";

// The consent cookie is the source of truth; this store lets React read it without an effect.
// undefined: not read yet (server render). null: no valid choice stored.
let consentSnapshot: ConsentRecord | null | undefined;
const consentListeners = new Set<() => void>();

const consentStore = {
  subscribe(listener: () => void) {
    consentListeners.add(listener);
    return () => consentListeners.delete(listener);
  },
  getSnapshot(): ConsentRecord | null {
    if (consentSnapshot === undefined) consentSnapshot = parseConsentCookie(document.cookie);
    return consentSnapshot;
  },
  getServerSnapshot(): undefined {
    return undefined;
  },
  save(choice: ConsentChoice): ConsentRecord {
    const record = createConsentRecord(choice);
    document.cookie = serializeConsentCookie(record, window.location.protocol === "https:");
    consentSnapshot = record;
    consentListeners.forEach((listener) => listener());
    return record;
  },
};

interface ConsentContextValue {
  choice: ConsentChoice;
  decided: boolean;
  openSettings: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const value = useContext(ConsentContext);
  if (!value) throw new Error("useConsent must be used inside ConsentProvider");
  return value;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore<ConsentRecord | null | undefined>(
    consentStore.subscribe,
    consentStore.getSnapshot,
    consentStore.getServerSnapshot,
  );
  const choice: ConsentChoice = stored ?? REJECT_ALL;
  // The banner is part of the static HTML (fast first paint). For returning visitors the head
  // script in lib/init-scripts.ts hides it before paint, and it unmounts once the cookie is read.
  const decided = stored !== null && stored !== undefined;
  const [draft, setDraft] = useState<ConsentChoice>(REJECT_ALL);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bannerRef = useRef<HTMLElement>(null);

  // Synchronise the analytics adapters (an external system) with the stored choice.
  useEffect(() => {
    if (stored === undefined) return;
    if (stored === null) markConsentUndecided();
    else void applyConsent(stored);
  }, [stored]);

  useEffect(() => {
    const root = document.documentElement;
    const banner = bannerRef.current;
    if (decided || !banner) {
      root.style.setProperty("--consent-offset", "0px");
      return;
    }
    const update = () => root.style.setProperty("--consent-offset", `${Math.ceil(banner.getBoundingClientRect().height)}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(banner);
    return () => {
      observer.disconnect();
      root.style.setProperty("--consent-offset", "0px");
    };
  }, [decided]);

  const save = useCallback((next: ConsentChoice) => {
    const record = consentStore.save(next);
    dialogRef.current?.close();
    void applyConsent(record).then(() => {
      track("consent_updated", { analytics: record.analytics, advertising: record.advertising });
    });
  }, []);

  const openSettings = useCallback(() => {
    setDraft(choice);
    dialogRef.current?.showModal();
  }, [choice]);

  const value = useMemo(() => ({ choice, decided, openSettings }), [choice, decided, openSettings]);

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {!decided && (
        <section ref={bannerRef} className="consent-banner" aria-labelledby="consent-title" data-testid="consent-banner">
          <div className="consent-banner-copy">
            <h2 id="consent-title">Your choice on cookies</h2>
            <p>
              Essential storage keeps this site working and secure. With your permission we also measure which pages help
              (analytics) and whether our ads reach the right people (advertising). We never record form entries or
              insurance details. <Link href="/cookies">Read the cookie notice</Link>.
            </p>
          </div>
          <div className="consent-actions">
            <button type="button" className="button" onClick={() => save(ACCEPT_ALL)}>
              Accept all
            </button>
            <button type="button" className="button" onClick={() => save(REJECT_ALL)}>
              Reject all
            </button>
            <button type="button" className="button" onClick={openSettings}>
              Manage
            </button>
          </div>
        </section>
      )}
      <dialog ref={dialogRef} className="consent-dialog" aria-labelledby="consent-dialog-title">
        <form
          method="dialog"
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            save(draft);
          }}
        >
          <h2 id="consent-dialog-title">Cookie settings</h2>
          <p className="muted">You can change this at any time from “Cookie settings” in the footer.</p>
          <fieldset className="consent-options">
            <legend className="sr-only">Cookie categories</legend>
            <label className="check">
              <input type="checkbox" checked disabled />
              <span>
                <strong>Essential</strong>
                <br />
                <span className="muted small">Remembers this choice and your theme, and protects forms. Always on.</span>
              </span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={draft.analytics}
                onChange={(event) => setDraft((current) => ({ ...current, analytics: event.target.checked }))}
              />
              <span>
                <strong>Analytics</strong>
                <br />
                <span className="muted small">
                  PostHog counts a fixed list of actions, such as opening a guide. No recordings, no form content.
                </span>
              </span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={draft.advertising}
                onChange={(event) => setDraft((current) => ({ ...current, advertising: event.target.checked }))}
              />
              <span>
                <strong>Advertising</strong>
                <br />
                <span className="muted small">
                  Google Ads measures whether an ad led to an early-access sign-up. Off unless you turn it on.
                </span>
              </span>
            </label>
          </fieldset>
          <div className="consent-actions">
            <button type="submit" className="button">
              Save choices
            </button>
            <button type="button" className="button" onClick={() => save(REJECT_ALL)}>
              Reject all
            </button>
            <button type="button" className="button" onClick={() => save(ACCEPT_ALL)}>
              Accept all
            </button>
          </div>
        </form>
      </dialog>
    </ConsentContext.Provider>
  );
}

export function CookieSettingsButton({ className = "link-button" }: { className?: string }) {
  const { openSettings } = useConsent();
  return (
    <button type="button" className={className} onClick={openSettings}>
      Cookie settings
    </button>
  );
}
