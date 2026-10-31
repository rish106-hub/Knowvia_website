"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppApiError, appFetch } from "@/lib/app-client";
import type { IdentityProviderKind, SessionView } from "@/lib/app-contract";
import { useConnectors } from "../blocks/useConnectors";
import { Button, ButtonLink, Field, Notice } from "../ui";
import { signInOptions } from "./sign-in-options";
import { errorCopy, isSignInUnavailable } from "./error-copy";
import { asApiError, useApp } from "./session-context";

export type SignInReason = "expired" | "signed_out" | "failed" | null;
/** Entry mode carried to the Google redirect: E care needed now, P care coming up, A asked by someone. */
export type SignInMode = "E" | "P" | "A";

type Failure = { kind: "unavailable" } | { kind: "error"; error: AppApiError };

// Demo builds only. Each of these is a typed stub: the BFF answers 501 IDENTITY_NOT_IMPLEMENTED. Real users never see them.
// The address is a reserved synthetic one, sent only because the request shape needs an email; the stub ignores it.
const STUB_SIGN_INS: ReadonlyArray<{ provider: IdentityProviderKind; label: string }> = [
  { provider: "google", label: "Continue with Google" },
  { provider: "microsoft", label: "Continue with Microsoft" },
  { provider: "apple", label: "Continue with Apple" },
  { provider: "phone_otp", label: "Use my mobile number" },
];
const STUB_EMAIL = "stub@example.test";

export function SignInScreen({ reason, mode = "P" }: { reason: SignInReason; mode?: SignInMode }) {
  const { state, signedIn } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const justSignedIn = useRef(false);
  const connectors = useConnectors();
  const demo = connectors.status === "ready" && connectors.data.demo;
  // Real Google sign-in is offered only when the server says it is configured. The development form stays for local use.
  const options = signInOptions(connectors);
  const googleReady = options.status === "ready" && options.google;
  // The development form shows only once the list has loaded and says it is on. Not while loading, not after a failure.
  const devForm = options.status === "ready" && options.dev;
  const [stubNotice, setStubNotice] = useState<string | null>(null);

  // A signed-in visitor has no business here (unless we just signed them in and are already navigating on).
  useEffect(() => {
    if (state.status === "ready" && !justSignedIn.current) router.replace("/app");
  }, [state.status, router]);

  const expired = reason === "expired" || (state.status === "signed_out" && state.reason === "expired");
  const failed = reason === "failed";
  const signedOut = !expired && (reason === "signed_out" || (state.status === "signed_out" && state.reason === "signed_out"));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter an email address, like name@example.com.");
      return;
    }
    setEmailError(null);
    setFailure(null);
    setBusy(true);
    try {
      const session = await appFetch<SessionView>("/session", {
        method: "POST",
        json: { provider: "dev", email: trimmed, ...(displayName.trim() ? { displayName: displayName.trim() } : {}) },
      });
      justSignedIn.current = true;
      signedIn(session);
      // More than one way to add a document (demo builds): show them. Otherwise go straight to the upload panel.
      router.push(demo ? "/app/connect" : "/app/documents");
    } catch (caught) {
      const error = asApiError(caught);
      if (isSignInUnavailable(error)) setFailure({ kind: "unavailable" });
      else if (error.code === "INVALID_REQUEST") setEmailError("That email address was not accepted. Check it and try again.");
      else setFailure({ kind: "error", error });
    } finally {
      setBusy(false);
    }
  }

  async function onStub(provider: IdentityProviderKind) {
    if (busy) return;
    setBusy(true);
    setStubNotice(null);
    try {
      await appFetch<SessionView>("/session", { method: "POST", json: { provider, email: STUB_EMAIL } });
    } catch (caught) {
      const error = asApiError(caught);
      setStubNotice(isSignInUnavailable(error) ? "That sign-in is not available yet. This demo preview only shows where it will go." : errorCopy(error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="kva-stack">
        <h1 className="kva-h1">{expired ? "Your session ended" : signedOut ? "You have signed out" : "Sign in to CoverSaath"}</h1>
        {expired ? (
          <Notice tone="warning" title="Getting back into the same household is not available yet" live="polite">
            A new development sign-in starts a new, empty household, so documents from your earlier session will not be there.
          </Notice>
        ) : null}
        {signedOut ? <p className="kva-lead">Your session is closed on this device.</p> : null}
        {failed ? (
          <Notice tone="error" title="We could not sign you in" live="polite">
            Nothing was saved. Try again, or start from the beginning.
          </Notice>
        ) : null}
      </div>

      {state.status === "loading" ? (
        <p className="kva-p kva-muted" role="status">
          Checking whether you are signed in.
        </p>
      ) : state.status === "error" ? (
        <Notice tone="error" title={errorCopy(state.error).title}>
          {errorCopy(state.error).message}
        </Notice>
      ) : failure?.kind === "unavailable" ? (
        <div className="kva-card" data-testid="sign-in-unavailable">
          <Notice tone="info" title="Sign-in is not available yet" live="polite">
            CoverSaath accounts are not open yet. No code was sent, and nothing was saved.
          </Notice>
          <div>
            <ButtonLink href="/" variant="secondary" size="sm">
              Back to the CoverSaath site
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="kva-card">
          {googleReady ? (
            <div className="kva-stack" data-testid="google-sign-in">
              <ButtonLink native block href={`/api/app/auth/google/start?mode=${mode}`}>
                Continue with Google
              </ButtonLink>
              <p className="kva-p kva-small kva-muted">
                CoverSaath receives the name and verified email address on your Google account. It does not read your Google mail or files. This
                wording is DRAFT for legal review.
              </p>
            </div>
          ) : null}
          {options.status === "loading" ? (
            <p className="kva-p kva-muted" role="status">
              Loading sign-in options.
            </p>
          ) : null}
          {options.status === "error" ? (
            <Notice
              tone="error"
              title="Sign-in options could not be loaded"
              actions={
                <Button size="sm" variant="secondary" onClick={connectors.retry}>
                  Try again
                </Button>
              }
            >
              Nothing was changed. Try again in a moment.
            </Notice>
          ) : null}
          {options.status === "ready" && !googleReady && !devForm ? (
            <Notice tone="info" title="Sign-in is not available yet" live="polite">
              CoverSaath accounts are not open yet. Nothing was saved.
            </Notice>
          ) : null}
          {devForm ? (
          <form className="kva-stack" onSubmit={(event) => void onSubmit(event)} noValidate>
            <Notice tone="warning" title="Development sign-in" live="off">
              This sign-in does not check your email and does not send a code. Each sign-in creates a new household. Use sample documents only.
            </Notice>
            <Field label="Email" hint="Not verified. Nothing is sent to it." error={emailError}>
              {(control) => <input {...control} className="kva-input" type="email" name="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} />}
            </Field>
            <Field label="Your name (optional)">
              {(control) => <input {...control} className="kva-input" type="text" name="displayName" autoComplete="name" maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />}
            </Field>
            {failure?.kind === "error" ? (
              <Notice tone="error" title={errorCopy(failure.error).title}>
                {errorCopy(failure.error).message}
              </Notice>
            ) : null}
            <Button type="submit" block busy={busy}>
              Continue with development sign-in
            </Button>
            {demo ? (
              <div className="kva-stack" data-testid="stub-sign-ins">
                <p className="kva-p kva-small kva-muted">Demo preview only. None of these works yet.</p>
                {STUB_SIGN_INS.filter((stub) => !(googleReady && stub.provider === "google")).map((stub) => (
                  <Button key={stub.provider} variant="secondary" block busy={busy} onClick={() => void onStub(stub.provider)}>
                    {stub.label}
                  </Button>
                ))}
                <div role="status" aria-live="polite">
                  {stubNotice ? <Notice tone="info" live="off">{stubNotice}</Notice> : null}
                </div>
              </div>
            ) : null}
          </form>
          ) : null}

        </div>
      )}
    </>
  );
}
