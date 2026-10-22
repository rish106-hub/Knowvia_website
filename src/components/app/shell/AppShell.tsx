"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignOut, Warning } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import type { AppApiError } from "@/lib/app-client";
import { Notice } from "../ui";
import { errorCopy } from "./error-copy";
import { SessionProvider, useApp } from "./session-context";

function Brand({ href }: { href: string }) {
  return (
    <Link href={href} className="kva-brand">
      <svg width="28" height="28" viewBox="0 0 800 800" aria-hidden="true">
        <rect width="800" height="800" rx="144" fill="#163F42" />
        <path d="M258 194v412M265 404l274 210" fill="none" stroke="#F3F7F6" strokeWidth="58" strokeLinecap="round" />
        <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="58" strokeLinecap="round" />
        <path d="M557 150l46 46-46 46-46-46z" fill="#E0A02B" />
      </svg>
      <span>Knowvia</span>
    </Link>
  );
}

function Chrome({ children }: { children: ReactNode }) {
  const { state, signOut } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [signOutError, setSignOutError] = useState<AppApiError | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const ready = state.status === "ready";
  const dev = ready && state.session.identity?.provider === "dev";

  async function onSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    const failure = await signOut();
    setSigningOut(false);
    setSignOutError(failure);
    if (!failure) router.push("/app/sign-in?reason=signed_out");
  }

  const link = (href: string, label: string) => (
    <Link href={href} aria-current={pathname === href ? "page" : undefined}>
      {label}
    </Link>
  );

  return (
    <div className="kva-root">
      <a className="kva-skip" href="#kva-main">
        Skip to main content
      </a>
      <header className="kva-header">
        <div className="kva-header__inner">
          <Brand href={ready ? "/app" : "/app/sign-in"} />
          {ready ? (
            <div className="kva-header__nav-wrap">
              <nav className="kva-nav" aria-label="App">
                {link("/app", "Home")}
                {link("/app/documents", "Documents")}
              </nav>
              <div className="kva-nav">
                <button type="button" onClick={() => void onSignOut()} aria-disabled={signingOut || undefined}>
                  <SignOut size={20} weight="bold" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </header>
      {dev ? (
        <div className="kva-devbar">
          <p>
            <Warning size={18} weight="bold" aria-hidden="true" />
            <span>Development preview. This sign-in is not verified. Use sample documents only.</span>
          </p>
        </div>
      ) : null}
      <main id="kva-main" className="kva-main" tabIndex={-1}>
        {signOutError ? (
          <Notice tone="error" title="Could not sign out">
            {errorCopy(signOutError).message}
          </Notice>
        ) : null}
        {children}
      </main>
      <footer className="kva-footer">
        <p className="kva-p">Knowvia app preview. Nothing here is advice on what your insurer will pay.</p>
      </footer>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Chrome>{children}</Chrome>
    </SessionProvider>
  );
}
